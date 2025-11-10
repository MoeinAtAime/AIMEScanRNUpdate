// Fetch older results for users API

import {generateClient} from 'aws-amplify/api';
import * as queries from '../../src/graphql/queries';
import {fetchUserAttributes} from 'aws-amplify/auth';

/**
 * Helper to format Date to 'YYYY-MM-DDTHH:MM:SS.sss' without 'Z'
 */
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

/**
 * Function to retrieve the current user's email address.
 */
const getUserEmail = async () => {
  try {
    const userAttributes = await fetchUserAttributes();
    return userAttributes.email;
  } catch (error) {
    console.error('Error fetching user attributes:', error);
    throw error;
  }
};

/**
 * Fetch scan results for the current user filtered by selected date.
 * Uses Cognito authentication via userPool.
 * @param {Date|string} selectedDate - Date object or date string
 */
const fetchOlderResults = async selectedDate => {
  try {
    const client = generateClient(); // Generate a client instance for GraphQL
    const userEmail = await getUserEmail();
    console.log('User Email:', userEmail);

    // Date correction if it's a string
    let correctedDate;
    if (typeof selectedDate === 'string') {
      console.warn('⚠️ selectedDate was a string, correcting to local Date...');
      const [year, month, day] = selectedDate.split('-').map(Number);
      correctedDate = new Date(year, month - 1, day);
    } else {
      correctedDate = selectedDate;
    }
    console.log('Corrected Selected Date:', correctedDate);

    // Start and end of the day
    const startOfDay = new Date(
      correctedDate.getFullYear(),
      correctedDate.getMonth(),
      correctedDate.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      correctedDate.getFullYear(),
      correctedDate.getMonth(),
      correctedDate.getDate(),
      23,
      59,
      59,
      999,
    );

    // Format the dates
    const startOfDayString = formatLocalISOString(startOfDay);
    const endOfDayString = formatLocalISOString(endOfDay);

    console.log('Start of Day String:', startOfDayString);
    console.log('End of Day String:', endOfDayString);

    // GraphQL filter for email and timestamp range
    const filter = {
      email: {eq: userEmail},
      timeStamp: {
        between: [startOfDayString, endOfDayString],
      },
    };

    // Execute the query with Cognito userPool auth
    const result = await client.graphql({
      query: queries.listUserData,
      variables: {
        filter,
        limit: 1000,
      },
      authMode: 'userPool', //  Cognito Authentication
    });

    // Extract results
    const fetchedResults = result.data?.listUserData?.items || [];
    console.log('Fetched Results:', fetchedResults.length);

    return fetchedResults;
  } catch (error) {
    console.error('Error fetching older results:', error);
    throw error;
  }
};

export default fetchOlderResults;
