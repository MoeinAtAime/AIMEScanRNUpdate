// utils/helpers.js

/**
 * Calculate age from birthdate
 * @param {string} birthdate - Birthday in ISO format (YYYY-MM-DD)
 * @returns {number} - Age in years
 */
export const calculateAge = birthdate => {
  const birthDate = new Date(birthdate);
  const ageDiff = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDiff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

/**
 * Convert height from decimal feet to centimeters
 * @param {string} height - Height in decimal feet format (e.g. "5.9")
 * @returns {number|null} - Height in centimeters or null if invalid
 */
export const convertHeightDecimalToCm = height => {
  const heightInFeet = parseFloat(height);
  if (isNaN(heightInFeet)) {
    console.error('Invalid height format:', height);
    return null;
  }

  const heightInInches = heightInFeet * 12; // Convert feet to inches
  const cm = Math.round(heightInInches * 2.54); // Convert inches to cm
  return cm;
};

/**
 * Filter an array of data objects to only include entries within the specified number of days
 * @param {Array} data - Array of objects with timeStamp property
 * @param {number} days - Number of days to include
 * @returns {Array} - Filtered array
 */
export const filterDataByDays = (data, days) => {
  const now = new Date();
  return data.filter(item => {
    try {
      const itemDate = new Date(item.timeStamp);
      if (isNaN(itemDate.getTime())) {
        console.warn('Invalid date found in data:', item.timeStamp);
        return false;
      }

      const daysDifference = (now - itemDate) / (1000 * 60 * 60 * 24);
      return daysDifference <= days;
    } catch (error) {
      console.error('Error processing date:', error);
      return false;
    }
  });
};

/**
 * Format date to locale string with options
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, options = {}) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    return dateObj.toLocaleDateString(undefined, {
      ...defaultOptions,
      ...options,
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Format Error';
  }
};

/**
 * Format a number with fixed decimal points
 * @param {number|string} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted number
 */
export const formatNumber = (value, decimals = 1) => {
  if (typeof value === 'string' && value === 'N/A') {
    return value;
  }

  const num = parseFloat(value);
  return isNaN(num) ? 'N/A' : num.toFixed(decimals);
};

/**
 * Debounce function to prevent excessive function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Safe error handling utility
 * @param {Function} fn - Async function to execute
 * @param {Function} onError - Error handler
 * @returns {Promise} - Result of fn or error handler
 */
export const safeExecute = async (fn, onError) => {
  try {
    return await fn();
  } catch (error) {
    console.error('Error in safe execute:', error);
    return onError ? onError(error) : {error: error.message};
  }
};

/**
 * Get confidence level text from numeric value
 * @param {string|number} level - Confidence level (1-3)
 * @returns {string} - Confidence level text
 */
export const getConfidenceLevelText = level => {
  switch (String(level)) {
    case '1':
      return 'Low';
    case '2':
      return 'Normal';
    case '3':
      return 'High';
    default:
      return 'N/A';
  }
};
