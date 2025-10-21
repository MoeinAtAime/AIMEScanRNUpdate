// api/fetchAllResultsLastYear.js
import {generateClient} from 'aws-amplify/api';
import * as queries from '../../src/graphql/queries';
import {fetchUserAttributes} from 'aws-amplify/auth';

const formatLocalISOString = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
};

const getUserEmail = async () => {
  const attrs = await fetchUserAttributes();
  // adjust depending on how fetchUserAttributes returns attributes
  return attrs.email;
};

/**
 * Fetch scan results for the last 365 days (from now backwards).
 * Replaces existing data (caller should overwrite storage).
 */
const fetchAllResultsLastYear = async () => {
  try {
    const client = generateClient();
    const email = await getUserEmail();

    const now = new Date();
    const pastYear = new Date(now);
    pastYear.setDate(now.getDate() - 365);

    const filter = {
      email: {eq: email},
      timeStamp: {
        between: [formatLocalISOString(pastYear), formatLocalISOString(now)],
      },
    };

    const result = await client.graphql({
      query: queries.listUserData,
      variables: {
        filter,
        limit: 5000, // adjust as needed
      },
      authMode: 'userPool',
    });

    const items = result.data?.listUserData?.items || [];
    console.log('Fetched (365d) count =', items.length);
    return items;
  } catch (error) {
    console.error('Error fetching last 365 days:', error);
    throw error;
  }
};

export default fetchAllResultsLastYear;
