// using createdAt timestamp with UTC and retry backoff

// api/fetchAllResultsLastYear.js
import {generateClient} from 'aws-amplify/api';
import * as queries from '../../src/graphql/queries';
import {fetchUserAttributes} from 'aws-amplify/auth';

const formatUTCISOString = date => date.toISOString();

const getUserEmail = async () => {
  const attrs = await fetchUserAttributes();
  return attrs.email;
};

/**
 * Utility: retry a function with exponential backoff + jitter.
 * @param {() => Promise<any>} fn the async function to retry
 * @param {number} maxAttempts maximum number of attempts
 * @param {number} initialDelayMs initial delay in ms
 */
const retryWithBackoff = async (fn, maxAttempts = 5, initialDelayMs = 500) => {
  let attempt = 0;
  while (true) {
    try {
      attempt++;
      return await fn();
    } catch (err) {
      if (attempt >= maxAttempts) {
        throw err; // give up
      }
      // compute backoff delay: exponential * jitter
      const expDelay = initialDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * initialDelayMs;
      const delayMs = Math.min(expDelay + jitter, 30000); // cap at 30s
      console.warn(
        `Attempt ${attempt} failed: ${err}. Retrying in ${Math.round(
          delayMs,
        )}ms`,
      );
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
};

const fetchAllResultsLastYear = async () => {
  try {
    const client = generateClient();
    const email = await getUserEmail();

    const nowUtc = new Date();
    const pastYearUtc = new Date(nowUtc);
    pastYearUtc.setUTCDate(nowUtc.getUTCDate() - 365);

    const filter = {
      email: {eq: email},
      createdAt: {
        between: [formatUTCISOString(pastYearUtc), formatUTCISOString(nowUtc)],
      },
    };

    const limit = 5000;
    let allItems = [];
    let nextToken = null;

    do {
      const variables = {
        filter,
        limit,
        ...(nextToken ? {nextToken} : {}),
      };

      const result = await retryWithBackoff(() =>
        client.graphql({
          query: queries.listUserData,
          variables,
          authMode: 'userPool',
        }),
      );

      const resp = result.data?.listUserData;
      const items = resp?.items || [];
      nextToken = resp?.nextToken;

      console.log(
        `Fetched page count = ${items.length}, nextToken = ${nextToken}`,
      );
      allItems = allItems.concat(items);
    } while (nextToken);

    console.log('Total fetched (365d) count =', allItems.length);
    return allItems;
  } catch (error) {
    console.error('Error fetching last 365 days (after retries):', error);
    throw error;
  }
};

export default fetchAllResultsLastYear;
