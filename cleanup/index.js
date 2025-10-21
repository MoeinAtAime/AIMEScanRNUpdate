// index.js
// Orphan cleanup job: delete DynamoDB items whose email isn't present in Cognito User Pool

import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  DynamoDBClient,
  BatchWriteItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';

const {
  USER_POOL_ID = 'us-east-1_sXDGO9bMs', // <-- override via env in prod
  TABLE_NAME = 'UserData', // <-- override via env
  EMAIL_ATTR = 'email',
  PRIMARY_KEY = 'id',
  TOTAL_SEGMENTS = '1', // number of parallel scan workers
  DRY_RUN = 'true', // "true" to log would_delete only
  AWS_REGION = process.env.AWS_REGION || 'us-east-1',
} = process.env;

const region = AWS_REGION;
const dryRun = DRY_RUN.toLowerCase() === 'true';
const totalSegments = Math.max(1, parseInt(TOTAL_SEGMENTS, 10) || 1);

const cognito = new CognitoIdentityProviderClient({region});
const ddb = new DynamoDBClient({region});

const sleep = ms => new Promise(r => setTimeout(r, ms));
const normEmail = v => (v || '').trim().toLowerCase();

/**
 * Simple retry wrapper with exponential backoff + jitter
 */
async function withRetry(fn, {maxAttempts = 6, baseMs = 200} = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e) {
      attempt++;
      // Common transient errors for Cognito/DDB
      const retriable =
        e?.name === 'ThrottlingException' ||
        e?.name === 'TooManyRequestsException' ||
        e?.name === 'LimitExceededException' ||
        e?.name === 'ProvisionedThroughputExceededException' ||
        e?.name === 'ServiceUnavailableException' ||
        e?.$metadata?.httpStatusCode === 429 ||
        e?.$metadata?.httpStatusCode >= 500;

      if (!retriable || attempt >= maxAttempts) throw e;

      const delay =
        Math.min(5000, baseMs * Math.pow(2, attempt - 1)) +
        Math.floor(Math.random() * 100);
      await sleep(delay);
    }
  }
}

/**
 * Fetch all user emails from Cognito (paginated)
 */
async function fetchAllCognitoEmails() {
  const emails = new Set();
  let PaginationToken;

  do {
    const cmd = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      PaginationToken,
      Limit: 60, // Cognito ListUsers max page size
    });

    const out = await withRetry(() => cognito.send(cmd));
    for (const u of out.Users || []) {
      const attr = (u.Attributes || []).find(a => a.Name === EMAIL_ATTR);
      if (attr?.Value) emails.add(normEmail(attr.Value));
    }
    PaginationToken = out.PaginationToken;
  } while (PaginationToken);

  return emails;
}

/**
 * Scan a single DynamoDB segment (low-level API)
 * Emits raw low-level items (AttributeValue objects)
 */
async function* scanTableSegment(segment, totalSegments) {
  let ExclusiveStartKey = undefined;
  while (true) {
    const out = await withRetry(() =>
      ddb.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          ProjectionExpression: '#pk, #em',
          ExpressionAttributeNames: {
            '#pk': PRIMARY_KEY,
            '#em': EMAIL_ATTR,
          },
          Segment: segment,
          TotalSegments: totalSegments,
          ExclusiveStartKey,
        }),
      ),
    );

    for (const item of out.Items || []) yield item;

    if (!out.LastEvaluatedKey) break;
    ExclusiveStartKey = out.LastEvaluatedKey;
  }
}

/**
 * Delete up to N keys with BatchWriteItem, retrying UnprocessedItems
 * Expects low-level DynamoDB Key shape (AttributeValues)
 */
async function deleteBatch(keys) {
  if (!keys.length) return {deleted: 0};

  let unprocessed = {
    [TABLE_NAME]: keys.map(k => ({DeleteRequest: {Key: k}})),
  };
  let deleted = 0;
  let attempts = 0;

  while (true) {
    attempts++;
    const out = await ddb.send(
      new BatchWriteItemCommand({RequestItems: unprocessed}),
    );

    const unp =
      (out.UnprocessedItems && out.UnprocessedItems[TABLE_NAME]) || [];
    const processed = unprocessed[TABLE_NAME].length - unp.length;
    deleted += processed;

    if (!unp.length) break;

    // Retry only the unprocessed
    await sleep(Math.min(2000, 100 * Math.pow(2, attempts)));
    unprocessed = {[TABLE_NAME]: unp};
  }

  return {deleted};
}

async function run() {
  if (!USER_POOL_ID || !TABLE_NAME) {
    console.error('Missing USER_POOL_ID or TABLE_NAME');
    process.exit(2);
  }

  console.log(
    JSON.stringify({
      msg: 'starting orphan cleanup',
      pool: USER_POOL_ID,
      table: TABLE_NAME,
      emailAttr: EMAIL_ATTR,
      pk: PRIMARY_KEY,
      totalSegments,
      dryRun,
      region,
    }),
  );

  // 1) Build Cognito email set
  console.time('cognitoFetch');
  const emailSet = await fetchAllCognitoEmails();
  console.timeEnd('cognitoFetch');
  console.log(`Cognito emails loaded: ${emailSet.size}`);

  // 2) Scan table (optionally parallel by segments)
  let scanned = 0,
    orphans = 0,
    deleted = 0;

  const workers = Array.from({length: totalSegments}, (_, i) =>
    (async () => {
      let toDeleteBatch = [];
      for await (const item of scanTableSegment(i, totalSegments)) {
        scanned++;

        // Low-level AttributeValue -> string
        const avEmail = item[EMAIL_ATTR];
        const email = normEmail(avEmail && avEmail.S ? avEmail.S : '');

        // If your definition of "orphan" requires the record to *have* an email,
        // uncomment the next line to skip email-less rows:
        // if (!email) continue;

        // Build low-level Key from the scanned item (we projected the PK)
        const keyAttr = item[PRIMARY_KEY];
        const key = {[PRIMARY_KEY]: keyAttr};

        if (!email || !emailSet.has(email)) {
          orphans++;
          if (dryRun) {
            console.log(JSON.stringify({action: 'would_delete', key, email}));
          } else {
            toDeleteBatch.push(key);
            if (toDeleteBatch.length === 25) {
              const res = await deleteBatch(toDeleteBatch);
              deleted += res.deleted;
              toDeleteBatch = [];
            }
          }
        }
      }

      if (!dryRun && toDeleteBatch.length) {
        const res = await deleteBatch(toDeleteBatch);
        deleted += res.deleted;
      }
    })(),
  );

  await Promise.all(workers);

  console.log(JSON.stringify({scanned, orphans, deleted, dryRun}));
}

run().catch(e => {
  console.error('fatal', e);
  process.exit(1);
});
