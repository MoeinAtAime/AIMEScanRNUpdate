// // pulseRateTrendUtils.js

// /**
//  * Utility functions for pulse rate trend analysis
//  */

// /**
//  * Calculate moving average for smoothing data
//  * @param {Array} data - Array of {date, value} objects
//  * @param {number} windowSize - Number of points to average
//  * @returns {Array} Smoothed data points
//  */
// export const calculateMovingAverage = (data, windowSize = 7) => {
//   if (data.length < windowSize) return data;

//   const result = [];
//   for (let i = 0; i < data.length; i++) {
//     const start = Math.max(0, i - Math.floor(windowSize / 2));
//     const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
//     const window = data.slice(start, end);
//     const avg =
//       window.reduce((sum, point) => sum + point.value, 0) / window.length;

//     result.push({
//       ...data[i],
//       value: avg,
//       originalValue: data[i].value,
//     });
//   }

//   return result;
// };

// /**
//  * Calculate standard deviation
//  * @param {Array<number>} values - Array of numeric values
//  * @returns {number} Standard deviation
//  */
// export const calculateStandardDeviation = values => {
//   const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
//   const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
//   const avgSquaredDiff =
//     squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
//   return Math.sqrt(avgSquaredDiff);
// };

// /**
//  * Detect outliers using IQR method
//  * @param {Array} data - Array of {date, value} objects
//  * @returns {Object} Object containing outliers and cleaned data
//  */
// export const detectOutliers = data => {
//   const values = data.map(d => d.value).sort((a, b) => a - b);
//   const q1Index = Math.floor(values.length * 0.25);
//   const q3Index = Math.floor(values.length * 0.75);

//   const q1 = values[q1Index];
//   const q3 = values[q3Index];
//   const iqr = q3 - q1;

//   const lowerBound = q1 - 1.5 * iqr;
//   const upperBound = q3 + 1.5 * iqr;

//   const outliers = data.filter(
//     d => d.value < lowerBound || d.value > upperBound,
//   );
//   const cleaned = data.filter(
//     d => d.value >= lowerBound && d.value <= upperBound,
//   );

//   return {outliers, cleaned, bounds: {lower: lowerBound, upper: upperBound}};
// };

// /**
//  * Calculate linear regression for trend analysis
//  * @param {Array} data - Array of {date, value} objects
//  * @returns {Object} Regression parameters (slope, intercept, r2, prediction function)
//  */
// export const calculateLinearRegression = data => {
//   const n = data.length;
//   if (n < 2) return null;

//   // Convert dates to numeric values (days from first measurement)
//   const firstDate = data[0].date.getTime();
//   const points = data.map(d => ({
//     x: (d.date.getTime() - firstDate) / (1000 * 60 * 60 * 24), // Days
//     y: d.value,
//   }));

//   const sumX = points.reduce((sum, p) => sum + p.x, 0);
//   const sumY = points.reduce((sum, p) => sum + p.y, 0);
//   const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
//   const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);
//   const sumY2 = points.reduce((sum, p) => sum + p.y * p.y, 0);

//   const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
//   const intercept = (sumY - slope * sumX) / n;

//   // Calculate R-squared
//   const meanY = sumY / n;
//   const totalSS = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
//   const residualSS = points.reduce((sum, p) => {
//     const predicted = slope * p.x + intercept;
//     return sum + Math.pow(p.y - predicted, 2);
//   }, 0);
//   const r2 = 1 - residualSS / totalSS;

//   return {
//     slope,
//     intercept,
//     r2,
//     predict: date => {
//       const daysFromFirst =
//         (date.getTime() - firstDate) / (1000 * 60 * 60 * 24);
//       return slope * daysFromFirst + intercept;
//     },
//     trendDescription: getTrendDescription(slope),
//   };
// };

// /**
//  * Get human-readable trend description
//  * @param {number} slope - Slope of the trend line
//  * @returns {string} Trend description
//  */
// const getTrendDescription = slope => {
//   const dailyChange = Math.abs(slope);

//   if (dailyChange < 0.1) return 'stable';
//   if (dailyChange < 0.3)
//     return slope > 0 ? 'slightly increasing' : 'slightly decreasing';
//   if (dailyChange < 0.6)
//     return slope > 0 ? 'moderately increasing' : 'moderately decreasing';
//   return slope > 0 ? 'strongly increasing' : 'strongly decreasing';
// };

// /**
//  * Calculate heart rate variability metrics
//  * @param {Array} data - Array of {date, value} objects
//  * @returns {Object} HRV-related metrics
//  */
// export const calculateVariability = data => {
//   if (data.length < 2) return null;

//   const values = data.map(d => d.value);
//   const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
//   const stdDev = calculateStandardDeviation(values);
//   const cv = (stdDev / mean) * 100; // Coefficient of variation

//   // Calculate successive differences
//   const differences = [];
//   for (let i = 1; i < values.length; i++) {
//     differences.push(Math.abs(values[i] - values[i - 1]));
//   }

//   const avgDifference =
//     differences.reduce((sum, val) => sum + val, 0) / differences.length;

//   return {
//     mean,
//     stdDev,
//     coefficientOfVariation: cv,
//     avgSuccessiveDifference: avgDifference,
//     variabilityLevel: getVariabilityLevel(cv),
//   };
// };

// /**
//  * Get variability level description
//  * @param {number} cv - Coefficient of variation
//  * @returns {string} Variability level
//  */
// const getVariabilityLevel = cv => {
//   if (cv < 5) return 'very low';
//   if (cv < 10) return 'low';
//   if (cv < 15) return 'moderate';
//   if (cv < 20) return 'high';
//   return 'very high';
// };

// /**
//  * Group data by time periods for aggregation
//  * @param {Array} data - Array of {date, value} objects
//  * @param {string} period - 'day', 'week', 'month'
//  * @returns {Array} Aggregated data
//  */
// export const aggregateByPeriod = (data, period = 'day') => {
//   const grouped = {};

//   data.forEach(point => {
//     let key;
//     const date = point.date;

//     switch (period) {
//       case 'day':
//         key = date.toISOString().split('T')[0];
//         break;
//       case 'week':
//         const weekStart = new Date(date);
//         weekStart.setDate(date.getDate() - date.getDay());
//         key = weekStart.toISOString().split('T')[0];
//         break;
//       case 'month':
//         key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
//           2,
//           '0',
//         )}`;
//         break;
//       default:
//         key = date.toISOString().split('T')[0];
//     }

//     if (!grouped[key]) {
//       grouped[key] = [];
//     }
//     grouped[key].push(point);
//   });

//   // Calculate averages for each period
//   return Object.entries(grouped)
//     .map(([key, points]) => {
//       const avgValue =
//         points.reduce((sum, p) => sum + p.value, 0) / points.length;
//       const minValue = Math.min(...points.map(p => p.value));
//       const maxValue = Math.max(...points.map(p => p.value));

//       return {
//         date: new Date(points[0].date), // Use first date in period
//         value: avgValue,
//         min: minValue,
//         max: maxValue,
//         count: points.length,
//         period: key,
//       };
//     })
//     .sort((a, b) => a.date - b.date);
// };

// /**
//  * Identify significant changes or anomalies
//  * @param {Array} data - Array of {date, value} objects
//  * @returns {Array} Array of significant events
//  */
// export const identifySignificantChanges = data => {
//   const events = [];
//   const variability = calculateVariability(data);

//   if (!variability) return events;

//   const threshold = variability.stdDev * 2; // 2 standard deviations

//   for (let i = 1; i < data.length; i++) {
//     const change = data[i].value - data[i - 1].value;
//     const percentChange = (change / data[i - 1].value) * 100;

//     if (Math.abs(change) > threshold) {
//       events.push({
//         date: data[i].date,
//         type: change > 0 ? 'spike' : 'drop',
//         value: data[i].value,
//         previousValue: data[i - 1].value,
//         change,
//         percentChange,
//         severity: Math.abs(change) > threshold * 2 ? 'high' : 'moderate',
//       });
//     }
//   }

//   return events;
// };

// /**
//  * Generate health insights based on pulse rate data
//  * @param {Object} statistics - Statistics object from main component
//  * @param {Array} data - Raw data points
//  * @returns {Array} Array of insight strings
//  */
// export const generateHealthInsights = (statistics, data) => {
//   const insights = [];

//   if (!statistics || !data || data.length === 0) return insights;

//   // Trend-based insights
//   if (statistics.trend === 'decreasing' && statistics.trendValue < -0.5) {
//     insights.push({
//       type: 'positive',
//       text: 'Your pulse rate has been steadily decreasing, which may indicate improving cardiovascular fitness.',
//       priority: 1,
//     });
//   } else if (statistics.trend === 'increasing' && statistics.trendValue > 0.5) {
//     insights.push({
//       type: 'warning',
//       text: 'Your pulse rate has been trending upward. Consider factors like stress, sleep, or overtraining.',
//       priority: 1,
//     });
//   }

//   // Zone-based insights
//   if (statistics.zone === 'athletic') {
//     insights.push({
//       type: 'positive',
//       text: 'Your average pulse rate is in the athletic range, indicating excellent cardiovascular fitness.',
//       priority: 2,
//     });
//   } else if (statistics.zone === 'elevated') {
//     insights.push({
//       type: 'warning',
//       text: 'Your pulse rate is consistently elevated. Consider discussing this with a healthcare provider.',
//       priority: 1,
//     });
//   }

//   // Variability insights
//   const variability = calculateVariability(data);
//   if (variability && variability.variabilityLevel === 'very high') {
//     insights.push({
//       type: 'info',
//       text: 'Your pulse rate shows high variability, which could indicate varying stress levels or irregular measurement conditions.',
//       priority: 2,
//     });
//   }

//   // Recent changes
//   const recentData = data.slice(-7); // Last 7 readings
//   if (recentData.length >= 3) {
//     const recentAvg =
//       recentData.reduce((sum, d) => sum + d.value, 0) / recentData.length;
//     const overallAvg = parseFloat(statistics.avg);
//     const difference = ((recentAvg - overallAvg) / overallAvg) * 100;

//     if (Math.abs(difference) > 10) {
//       insights.push({
//         type: difference > 0 ? 'warning' : 'positive',
//         text: `Your recent readings are ${Math.abs(difference).toFixed(0)}% ${
//           difference > 0 ? 'higher' : 'lower'
//         } than your average.`,
//         priority: 2,
//       });
//     }
//   }

//   return insights.sort((a, b) => a.priority - b.priority);
// };

// /**
//  * Format date for display based on range
//  * @param {Date} date - Date to format
//  * @param {number} rangeDays - Range in days
//  * @returns {string} Formatted date string
//  */
// export const formatDateForRange = (date, rangeDays) => {
//   if (rangeDays <= 7) {
//     return date.toLocaleDateString('en-US', {
//       weekday: 'short',
//       hour: '2-digit',
//     });
//   } else if (rangeDays <= 30) {
//     return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
//   } else if (rangeDays <= 180) {
//     return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
//   } else {
//     return date.toLocaleDateString('en-US', {month: 'short', year: '2-digit'});
//   }
// };

// /**
//  * Export data for sharing or backup
//  * @param {Array} data - Array of data points
//  * @param {string} format - 'csv' or 'json'
//  * @returns {string} Formatted data string
//  */
// // export const exportData = (data, format = 'csv') => {
// //   if (format === 'csv') {
// //     let csv = 'Date,Time,Pulse Rate (bpm)\n';
// //     data.forEach(point => {
// //       const date = point.date.toLocaleDateString();
// //       const time = point.date.toLocaleTimeString();
// //       csv += `${date},${time},${point.value}\n`;
// //     });
// //     return csv;
// //   } else {
// //     return JSON.stringify(
// //       data.map(point => ({
// //         timestamp: point.date.toISOString(),
// //         pulseRate: point.value,
// //       })),
// //       null,
// //       2,
// //     );
// //   }
// // };

// export default {
//   calculateMovingAverage,
//   calculateStandardDeviation,
//   detectOutliers,
//   calculateLinearRegression,
//   calculateVariability,
//   aggregateByPeriod,
//   identifySignificantChanges,
//   generateHealthInsights,
//   formatDateForRange,
//   exportData,
// };
