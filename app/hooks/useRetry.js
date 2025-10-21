// hooks/useRetry.js
import {useCallback} from 'react';

export const useRetry = (maxAttempts = 3, delay = 1000) => {
  const retryOperation = useCallback(
    async (operation, currentAttempt = 1) => {
      try {
        return await operation();
      } catch (error) {
        if (currentAttempt < maxAttempts) {
          console.log(`Attempt ${currentAttempt} failed, retrying...`);
          // Wait for the specified delay
          await new Promise(resolve => setTimeout(resolve, delay));
          // Retry the operation
          return retryOperation(operation, currentAttempt + 1);
        }
        // If we've reached max attempts, throw the error
        throw error;
      }
    },
    [maxAttempts, delay],
  );

  return {retryOperation};
};

// Example usage:
/*
const { retryOperation } = useRetry(3, 1000);

try {
  await retryOperation(async () => {
    // Your async operation here
    const result = await someAsyncFunction();
    return result;
  });
} catch (error) {
  // Handle final error after all retries
  console.error('All retry attempts failed:', error);
}
*/
