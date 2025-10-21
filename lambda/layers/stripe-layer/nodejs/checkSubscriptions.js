const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminUpdateUserAttributesCommand,
  paginateListUsers,
} = require('@aws-sdk/client-cognito-identity-provider');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Configuration
const config = {
  aws: {
    region: process.env.AWS_REGION_LAMBDA || 'us-east-1',
    userPoolId: process.env.USER_POOL_ID || 'us-east-1_sXDGO9bMs',
    batchSize: 50,
  },
};

const cognitoClient = new CognitoIdentityProviderClient({
  region: config.aws.region,
  maxAttempts: 3,
});

// Validate environment
function validateEnvironment() {
  const required = ['STRIPE_SECRET_KEY', 'AWS_REGION_LAMBDA', 'USER_POOL_ID'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

// Modified Stripe customer cache to use case-insensitive lookup
const getStripeCustomer = (() => {
  const cache = new Map();
  const TTL = 5 * 60 * 1000; // 5 minutes
  // This cache stores all Stripe customers for the duration of the Lambda execution
  let allCustomers = null;
  let lastFetchTime = 0;

  return async email => {
    // Normalize email to lowercase for consistent comparison
    const normalizedEmail = email.toLowerCase();
    const cached = cache.get(normalizedEmail);

    if (cached && Date.now() - cached.timestamp < TTL) {
      return cached.customer;
    }

    // Fetch all customers if we haven't done so recently
    if (!allCustomers || Date.now() - lastFetchTime > TTL) {
      console.log('Fetching all Stripe customers...');
      // Get all customers from Stripe
      const fetchedCustomers = await stripe.customers.list({limit: 100});
      allCustomers = fetchedCustomers.data;
      lastFetchTime = Date.now();
      console.log(`Fetched ${allCustomers.length} Stripe customers`);
    }

    // Find a customer with matching email (case-insensitive)
    const customer =
      allCustomers.find(
        cust => cust.email && cust.email.toLowerCase() === normalizedEmail,
      ) || null;

    if (customer) {
      console.log(`Found Stripe customer for ${normalizedEmail}`);
      if (customer.email !== normalizedEmail) {
        console.log(
          `Note: Case difference detected between ${normalizedEmail} and ${customer.email}`,
        );
      }
    } else {
      console.log(`No Stripe customer found for ${normalizedEmail}`);
    }

    // Store in cache
    cache.set(normalizedEmail, {
      customer,
      timestamp: Date.now(),
    });

    return customer;
  };
})();

// Check subscription status
async function checkSubscriptionStatus(customerId) {
  if (!customerId) return false;

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  return subscriptions.data.length > 0;
}

// Update user status in Cognito
async function updateUserStatus(username, status) {
  const command = new AdminUpdateUserAttributesCommand({
    UserPoolId: config.aws.userPoolId,
    Username: username,
    UserAttributes: [{Name: 'custom:userStatus', Value: status}],
  });

  await cognitoClient.send(command);
  console.log(`Updated status for user ${username} to ${status}`);
}

// Process single user
async function processUser(user) {
  const startTime = Date.now();
  const context = {username: user.Username};

  try {
    const emailAttr = user.Attributes.find(attr => attr.Name === 'email');
    if (!emailAttr) {
      console.log(`Skipping user ${user.Username}: No email found`);
      return null;
    }

    // Normalize email to lowercase
    const email = emailAttr.Value.toLowerCase();
    context.email = email;

    // Log original email if it differs from normalized version
    if (email !== emailAttr.Value) {
      console.log(
        `Email case normalized for ${user.Username}: "${emailAttr.Value}" → "${email}"`,
      );
    }

    const customer = await getStripeCustomer(email);
    const hasActiveSubscription = customer
      ? await checkSubscriptionStatus(customer.id)
      : false;

    const status = hasActiveSubscription ? 'Active' : 'InActive';
    await updateUserStatus(user.Username, status);

    console.log('User processed successfully:', {
      username: user.Username,
      email,
      status,
      processingTime: Date.now() - startTime,
      hasStripeCustomer: !!customer,
    });

    return {
      username: user.Username,
      email,
      status,
      hasStripeCustomer: !!customer,
    };
  } catch (error) {
    console.error('User processing failed:', {
      context,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
    throw error;
  }
}

// Main handler
exports.handler = async event => {
  const startTime = Date.now();
  const metrics = {
    successful: 0,
    failed: 0,
    details: [],
    timing: {
      start: new Date().toISOString(),
    },
  };

  try {
    validateEnvironment();

    const paginator = paginateListUsers(
      {client: cognitoClient},
      {UserPoolId: config.aws.userPoolId, Limit: config.aws.batchSize},
    );

    for await (const page of paginator) {
      const processingPromises = page.Users.map(async user => {
        try {
          const result = await processUser(user);
          if (result) {
            metrics.successful++;
            metrics.details.push(result);
          }
        } catch (error) {
          metrics.failed++;
          metrics.details.push({
            username: user.Username,
            error: error.message,
          });
        }
      });

      await Promise.all(processingPromises);
    }

    metrics.timing.end = new Date().toISOString();
    metrics.timing.duration = Date.now() - startTime;

    console.log('Subscription checks completed', metrics);

    return {
      statusCode: 200,
      body: JSON.stringify(metrics),
    };
  } catch (error) {
    metrics.timing.end = new Date().toISOString();
    metrics.timing.duration = Date.now() - startTime;

    console.error('Fatal error in subscription check:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        metrics,
      }),
    };
  }
};

// If running outside Lambda, call the handler manually
if (require.main === module) {
  exports
    .handler({})
    .then(res => {
      console.log('✅ Script completed with response:', res);
    })
    .catch(err => {
      console.error('❌ Script failed:', err);
    });
}
