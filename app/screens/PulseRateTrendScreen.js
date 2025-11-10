// // all the iprovements in utils

// // PulseRateTrendScreen_FullyIntegrated.js
// // Fully integrated version using pulseRateTrendUtils for advanced features

// import React, {useState, useEffect, useMemo, useCallback} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Dimensions,
//   ActivityIndicator,
//   Platform,
//   ScrollView,
//   TouchableOpacity,
//   RefreshControl,
//   Alert,
//   Share,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {LineChart} from 'react-native-chart-kit';
// import colors from '../config/colors';

// // Import all utility functions
// import {
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
// } from '../utils/pulseRateTrendUtils';

// const STORAGE_KEYS = {
//   SCAN_RESULTS: 'scanResults',
//   TREND_CACHE: 'pulseRateTrendCache',
// };

// const {width: screenWidth} = Dimensions.get('window');

// // Time range options
// const TIME_RANGES = [
//   {label: '1W', value: 7, key: 'week'},
//   {label: '1M', value: 30, key: 'month'},
//   {label: '3M', value: 90, key: 'quarter'},
//   {label: '6M', value: 180, key: 'halfYear'},
//   {label: '1Y', value: 365, key: 'year'},
//   //   {label: 'All', value: null, key: 'all'},
// ];

// // Aggregation modes
// const AGGREGATION_MODES = {
//   DAILY: 'day', // Daily aggregation
//   WEEKLY: 'week', // Weekly aggregation
//   MONTHLY: 'month', // Monthly aggregation
// };

// // Data processing modes
// const PROCESSING_MODES = {
//   RAW: 'raw', // Raw data
//   SMOOTHED: 'smoothed', // Moving average applied
//   OUTLIERS_REMOVED: 'cleaned', // Outliers removed
// };

// const PulseRateTrendScreen = () => {
//   // State management
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [rawDataPoints, setRawDataPoints] = useState([]);
//   const [selectedRange, setSelectedRange] = useState('month');
//   const [aggregationMode, setAggregationMode] = useState(
//     AGGREGATION_MODES.DAILY,
//   );
//   const [processingMode, setProcessingMode] = useState(PROCESSING_MODES.RAW);
//   const [showInsights, setShowInsights] = useState(true);
//   const [showSignificantEvents, setShowSignificantEvents] = useState(false);
//   const [error, setError] = useState(null);

//   // Load data from storage
//   const loadData = useCallback(async (isRefreshing = false) => {
//     try {
//       if (isRefreshing) setRefreshing(true);
//       else setLoading(true);

//       setError(null);

//       const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_RESULTS);
//       if (stored) {
//         const parsed = JSON.parse(stored);
//         const prPoints = parsed
//           .filter(
//             scan =>
//               scan.PULSE_RATE != null &&
//               !isNaN(scan.PULSE_RATE) &&
//               scan.PULSE_RATE > 30 &&
//               scan.PULSE_RATE < 200,
//           )
//           .map(scan => ({
//             date: new Date(scan.timeStamp),
//             value: parseFloat(scan.PULSE_RATE),
//             id: scan.id || scan.timeStamp,
//           }))
//           .sort((a, b) => a.date - b.date);

//         setRawDataPoints(prPoints);
//       }
//     } catch (err) {
//       console.error('Error loading pulse rate data:', err);
//       setError('Failed to load pulse rate history.');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   // Process data using utility functions
//   const processedDataPoints = useMemo(() => {
//     if (!rawDataPoints.length) return [];

//     let processed = [...rawDataPoints];

//     // Step 1: Aggregate by period (day/week/month)
//     processed = aggregateByPeriod(processed, aggregationMode);

//     // Step 2: Apply processing mode (smoothing or outlier removal)
//     switch (processingMode) {
//       case PROCESSING_MODES.SMOOTHED:
//         // Apply moving average for smoothing
//         const windowSize =
//           aggregationMode === 'day' ? 7 : aggregationMode === 'week' ? 4 : 3;
//         processed = calculateMovingAverage(processed, windowSize);
//         break;

//       case PROCESSING_MODES.OUTLIERS_REMOVED:
//         // Remove outliers using IQR method
//         const {cleaned} = detectOutliers(processed);
//         processed = cleaned;
//         break;

//       case PROCESSING_MODES.RAW:
//       default:
//         // No additional processing
//         break;
//     }

//     return processed;
//   }, [rawDataPoints, aggregationMode, processingMode]);

//   // Filter data based on selected time range
//   const filteredDataPoints = useMemo(() => {
//     if (!processedDataPoints.length) return [];

//     const range = TIME_RANGES.find(r => r.key === selectedRange);
//     if (!range.value) return processedDataPoints;

//     const cutoffDate = new Date();
//     cutoffDate.setDate(cutoffDate.getDate() - range.value);

//     return processedDataPoints.filter(dp => dp.date >= cutoffDate);
//   }, [processedDataPoints, selectedRange]);

//   // Calculate linear regression using utility
//   const regression = useMemo(() => {
//     if (filteredDataPoints.length < 2) return null;
//     return calculateLinearRegression(filteredDataPoints);
//   }, [filteredDataPoints]);

//   // Calculate variability metrics using utility
//   const variabilityMetrics = useMemo(() => {
//     if (filteredDataPoints.length < 2) return null;
//     return calculateVariability(filteredDataPoints);
//   }, [filteredDataPoints]);

//   // Identify significant changes using utility
//   const significantChanges = useMemo(() => {
//     if (filteredDataPoints.length < 2) return [];
//     return identifySignificantChanges(filteredDataPoints);
//   }, [filteredDataPoints]);

//   // Detect outliers in current view
//   const outlierAnalysis = useMemo(() => {
//     if (filteredDataPoints.length < 4) return null;
//     return detectOutliers(filteredDataPoints);
//   }, [filteredDataPoints]);

//   // Generate health insights using utility
//   const healthInsights = useMemo(() => {
//     if (!regression || !variabilityMetrics) return [];

//     const statistics = {
//       avg: variabilityMetrics.mean.toFixed(1),
//       trend: regression.trendDescription,
//       trendValue: regression.slope,
//       zone:
//         variabilityMetrics.mean < 60
//           ? 'athletic'
//           : variabilityMetrics.mean > 100
//           ? 'elevated'
//           : 'normal',
//     };

//     return generateHealthInsights(statistics, filteredDataPoints);
//   }, [regression, variabilityMetrics, filteredDataPoints]);

//   // Prepare chart data
//   const chartData = useMemo(() => {
//     if (filteredDataPoints.length < 2) return null;

//     // Limit points for readability
//     const maxPoints = 30;
//     const step = Math.max(1, Math.floor(filteredDataPoints.length / maxPoints));

//     const sampled = [];
//     for (let i = 0; i < filteredDataPoints.length; i += step) {
//       sampled.push(filteredDataPoints[i]);
//     }

//     // Always include the last point
//     if (
//       sampled[sampled.length - 1] !==
//       filteredDataPoints[filteredDataPoints.length - 1]
//     ) {
//       sampled.push(filteredDataPoints[filteredDataPoints.length - 1]);
//     }

//     // Use utility function for date formatting
//     const range = TIME_RANGES.find(r => r.key === selectedRange);
//     const labels = sampled.map(dp =>
//       formatDateForRange(dp.date, range?.value || 365),
//     );

//     const values = sampled.map(dp => dp.value);

//     // Add regression line if available
//     let regressionLine = null;
//     if (regression && regression.r2 > 0.3) {
//       // Only show if decent fit
//       regressionLine = sampled.map(dp => regression.predict(dp.date));
//     }

//     return {labels, values, regressionLine};
//   }, [filteredDataPoints, selectedRange, regression]);

//   //   // Export functionality using utility
//   //   const handleExport = useCallback(async () => {
//   //     try {
//   //       const format = await new Promise(resolve => {
//   //         Alert.alert('Export Format', 'Choose export format:', [
//   //           {text: 'CSV', onPress: () => resolve('csv')},
//   //           {text: 'JSON', onPress: () => resolve('json')},
//   //           {text: 'Cancel', onPress: () => resolve(null), style: 'cancel'},
//   //         ]);
//   //       });

//   //       if (!format) return;

//   //       const exportedData = exportData(filteredDataPoints, format);

//   //       await Share.share({
//   //         message: exportedData,
//   //         title: `Pulse Rate Data (${format.toUpperCase()})`,
//   //       });
//   //     } catch (error) {
//   //       Alert.alert('Export Failed', 'Could not export data. Please try again.');
//   //     }
//   //   }, [filteredDataPoints]);

//   // Render controls
//   const renderControls = () => (
//     <View style={styles.controlsContainer}>
//       {/* Time Range Selector */}
//       <View style={styles.rangeSelector}>
//         {TIME_RANGES.map(range => (
//           <TouchableOpacity
//             key={range.key}
//             onPress={() => setSelectedRange(range.key)}
//             style={[
//               styles.rangeButton,
//               selectedRange === range.key && styles.rangeButtonActive,
//             ]}>
//             <Text
//               style={[
//                 styles.rangeButtonText,
//                 selectedRange === range.key && styles.rangeButtonTextActive,
//               ]}>
//               {range.label}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Aggregation Mode */}
//       <View style={styles.modeContainer}>
//         <Text style={styles.modeTitle}>Aggregation:</Text>
//         <View style={styles.modeButtons}>
//           {Object.entries(AGGREGATION_MODES).map(([key, value]) => (
//             <TouchableOpacity
//               key={key}
//               onPress={() => setAggregationMode(value)}
//               style={[
//                 styles.modeButton,
//                 aggregationMode === value && styles.modeButtonActive,
//               ]}>
//               <Text
//                 style={[
//                   styles.modeButtonText,
//                   aggregationMode === value && styles.modeButtonTextActive,
//                 ]}>
//                 {key.charAt(0) + key.slice(1).toLowerCase()}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </View>

//       {/* Processing Mode */}
//       <View style={styles.modeContainer}>
//         <Text style={styles.modeTitle}>Processing:</Text>
//         <View style={styles.modeButtons}>
//           <TouchableOpacity
//             onPress={() => setProcessingMode(PROCESSING_MODES.RAW)}
//             style={[
//               styles.modeButton,
//               processingMode === PROCESSING_MODES.RAW &&
//                 styles.modeButtonActive,
//             ]}>
//             <Text
//               style={[
//                 styles.modeButtonText,
//                 processingMode === PROCESSING_MODES.RAW &&
//                   styles.modeButtonTextActive,
//               ]}>
//               Raw
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             onPress={() => setProcessingMode(PROCESSING_MODES.SMOOTHED)}
//             style={[
//               styles.modeButton,
//               processingMode === PROCESSING_MODES.SMOOTHED &&
//                 styles.modeButtonActive,
//             ]}>
//             <Text
//               style={[
//                 styles.modeButtonText,
//                 processingMode === PROCESSING_MODES.SMOOTHED &&
//                   styles.modeButtonTextActive,
//               ]}>
//               Smoothed
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             onPress={() => setProcessingMode(PROCESSING_MODES.OUTLIERS_REMOVED)}
//             style={[
//               styles.modeButton,
//               processingMode === PROCESSING_MODES.OUTLIERS_REMOVED &&
//                 styles.modeButtonActive,
//             ]}>
//             <Text
//               style={[
//                 styles.modeButtonText,
//                 processingMode === PROCESSING_MODES.OUTLIERS_REMOVED &&
//                   styles.modeButtonTextActive,
//               ]}>
//               Cleaned
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Export Button */}
//       {/* <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
//         <Text style={styles.exportButtonText}>📤 Export Data</Text>
//       </TouchableOpacity> */}
//     </View>
//   );

//   // Render advanced statistics
//   const renderAdvancedStats = () => {
//     if (!regression || !variabilityMetrics) return null;

//     return (
//       <View style={styles.statsContainer}>
//         <Text style={styles.statsTitle}>Advanced Analytics</Text>

//         {/* Regression Analysis */}
//         <View style={styles.statSection}>
//           <Text style={styles.statSectionTitle}>📈 Trend Analysis</Text>
//           <View style={styles.statRow}>
//             <Text style={styles.statLabel}>Trend:</Text>
//             <Text style={styles.statValue}>{regression.trendDescription}</Text>
//           </View>
//           <View style={styles.statRow}>
//             <Text style={styles.statLabel}>Daily Change:</Text>
//             <Text style={styles.statValue}>
//               {regression.slope.toFixed(2)} bpm/day
//             </Text>
//           </View>
//           <View style={styles.statRow}>
//             <Text style={styles.statLabel}>R² (Fit Quality):</Text>
//             <Text style={styles.statValue}>
//               {(regression.r2 * 100).toFixed(1)}%
//             </Text>
//           </View>
//           {regression.r2 > 0.5 && (
//             <View style={styles.statRow}>
//               <Text style={styles.statLabel}>7-Day Forecast:</Text>
//               <Text style={styles.statValue}>
//                 {regression
//                   .predict(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
//                   .toFixed(1)}{' '}
//                 bpm
//               </Text>
//             </View>
//           )}
//         </View>

//         {/* Variability Analysis */}
//         <View style={styles.statSection}>
//           <Text style={styles.statSectionTitle}>📊 Variability Analysis</Text>
//           <View style={styles.statRow}>
//             <Text style={styles.statLabel}>Average:</Text>
//             <Text style={styles.statValue}>
//               {variabilityMetrics.mean.toFixed(1)} bpm
//             </Text>
//           </View>
//           <View style={styles.statRow}>
//             <Text style={styles.statLabel}>Std Deviation:</Text>
//             <Text style={styles.statValue}>
//               ±{variabilityMetrics.stdDev.toFixed(1)} bpm
//             </Text>
//           </View>
//           <View style={styles.statRow}>
//             <Text style={styles.statLabel}>Variability:</Text>
//             <Text style={styles.statValue}>
//               {variabilityMetrics.variabilityLevel}
//             </Text>
//           </View>
//           <View style={styles.statRow}>
//             <Text style={styles.statLabel}>CV:</Text>
//             <Text style={styles.statValue}>
//               {variabilityMetrics.coefficientOfVariation.toFixed(1)}%
//             </Text>
//           </View>
//         </View>

//         {/* Outlier Analysis */}
//         {outlierAnalysis && outlierAnalysis.outliers.length > 0 && (
//           <View style={styles.statSection}>
//             <Text style={styles.statSectionTitle}>⚠️ Outlier Detection</Text>
//             <Text style={styles.outlierText}>
//               Found {outlierAnalysis.outliers.length} outlier(s)
//             </Text>
//             <Text style={styles.outlierDetails}>
//               Normal range: {outlierAnalysis.bounds.lower.toFixed(0)} -{' '}
//               {outlierAnalysis.bounds.upper.toFixed(0)} bpm
//             </Text>
//             {outlierAnalysis.outliers.slice(0, 3).map((outlier, idx) => (
//               <Text key={idx} style={styles.outlierItem}>
//                 • {outlier.date.toLocaleDateString()}:{' '}
//                 {outlier.value.toFixed(0)} bpm
//               </Text>
//             ))}
//           </View>
//         )}
//       </View>
//     );
//   };

//   // Render significant events
//   const renderSignificantEvents = () => {
//     if (!showSignificantEvents || significantChanges.length === 0) return null;

//     return (
//       <View style={styles.eventsContainer}>
//         <View style={styles.eventsHeader}>
//           <Text style={styles.eventsTitle}>🎯 Significant Changes</Text>
//           <TouchableOpacity onPress={() => setShowSignificantEvents(false)}>
//             <Text style={styles.closeButton}>✕</Text>
//           </TouchableOpacity>
//         </View>
//         {significantChanges.slice(0, 5).map((event, idx) => (
//           <View key={idx} style={styles.eventItem}>
//             <Text style={styles.eventDate}>
//               {event.date.toLocaleDateString()}
//             </Text>
//             <Text
//               style={[
//                 styles.eventType,
//                 {color: event.type === 'spike' ? '#FF6B6B' : '#4ECDC4'},
//               ]}>
//               {event.type === 'spike' ? '📈 Spike' : '📉 Drop'}
//             </Text>
//             <Text style={styles.eventValue}>
//               {event.previousValue.toFixed(0)} → {event.value.toFixed(0)} bpm
//             </Text>
//             <Text style={styles.eventChange}>
//               ({event.percentChange > 0 ? '+' : ''}
//               {event.percentChange.toFixed(1)}%)
//             </Text>
//           </View>
//         ))}
//       </View>
//     );
//   };

//   // Render health insights
//   const renderHealthInsights = () => {
//     if (!showInsights || healthInsights.length === 0) return null;

//     return (
//       <View style={styles.insightsContainer}>
//         <Text style={styles.insightsTitle}>💡 Health Insights</Text>
//         {healthInsights.map((insight, idx) => (
//           <View
//             key={idx}
//             style={[
//               styles.insightItem,
//               insight.type === 'positive' && styles.insightPositive,
//               insight.type === 'warning' && styles.insightWarning,
//               insight.type === 'info' && styles.insightInfo,
//             ]}>
//             <Text style={styles.insightText}>{insight.text}</Text>
//           </View>
//         ))}
//       </View>
//     );
//   };

//   // Handle refresh
//   const onRefresh = useCallback(() => {
//     loadData(true);
//   }, [loadData]);

//   // Loading state
//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color={colors.primaryColor} />
//         <Text style={styles.loadingText}>Loading pulse rate history...</Text>
//       </View>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <View style={styles.centered}>
//         <Text style={styles.errorText}>{error}</Text>
//         <TouchableOpacity onPress={() => loadData()} style={styles.retryButton}>
//           <Text style={styles.retryButtonText}>Retry</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   // Empty state
//   if (!chartData || chartData.values.length < 2) {
//     return (
//       <ScrollView
//         contentContainerStyle={styles.centered}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }>
//         <Text style={styles.emptyStateIcon}>❤️</Text>
//         <Text style={styles.emptyStateTitle}>Not Enough Data</Text>
//         <Text style={styles.emptyStateMessage}>
//           Need at least 2 data points to show trends
//         </Text>
//       </ScrollView>
//     );
//   }

//   // Main render
//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={styles.scrollContent}
//       refreshControl={
//         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//       }>
//       <View style={styles.header}>
//         <Text style={styles.title}>Pulse Rate Analytics</Text>
//         <Text style={styles.subtitle}>
//           Powered by advanced statistical analysis
//         </Text>
//       </View>

//       {renderControls()}
//       {renderAdvancedStats()}

//       <View style={styles.chartContainer}>
//         <LineChart
//           data={{
//             labels: chartData.labels,
//             datasets: [
//               {
//                 data: chartData.values,
//                 strokeWidth: 2,
//                 color: (opacity = 1) => `rgba(70, 130, 180, ${opacity})`,
//               },
//               ...(chartData.regressionLine
//                 ? [
//                     {
//                       data: chartData.regressionLine,
//                       strokeWidth: 1,
//                       color: (opacity = 0.5) => `rgba(255, 0, 0, ${opacity})`,
//                       withDots: false,
//                     },
//                   ]
//                 : []),
//             ],
//             legend: chartData.regressionLine
//               ? ['Actual', 'Trend']
//               : ['Pulse Rate'],
//           }}
//           width={screenWidth - 32}
//           height={280}
//           yAxisSuffix=" bpm"
//           yAxisInterval={1}
//           chartConfig={{
//             backgroundColor: '#ffffff',
//             backgroundGradientFrom: '#ffffff',
//             backgroundGradientTo: '#f8f9fa',
//             decimalPlaces: 0,
//             color: (opacity = 1) => `rgba(70, 130, 180, ${opacity})`,
//             labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
//             style: {
//               borderRadius: 16,
//             },
//             propsForDots: {
//               r: '3',
//               strokeWidth: '1',
//               stroke: '#4682B4',
//             },
//             propsForBackgroundLines: {
//               strokeDasharray: '5, 5',
//               stroke: '#e3e3e3',
//               strokeWidth: 1,
//             },
//           }}
//           bezier={processingMode === PROCESSING_MODES.SMOOTHED}
//           style={styles.chart}
//           withInnerLines={true}
//           withOuterLines={false}
//           segments={5}
//         />
//       </View>

//       <View style={styles.toggleContainer}>
//         <TouchableOpacity
//           onPress={() => setShowSignificantEvents(!showSignificantEvents)}
//           style={styles.toggleButton}>
//           <Text style={styles.toggleButtonText}>
//             {showSignificantEvents ? 'Hide' : 'Show'} Significant Events
//             {significantChanges.length > 0 && ` (${significantChanges.length})`}
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {renderSignificantEvents()}
//       {renderHealthInsights()}

//       <View style={styles.footer}>
//         <Text style={styles.footerText}>
//           {processedDataPoints.length} data points •
//           {processingMode === PROCESSING_MODES.SMOOTHED && ' Smoothed • '}
//           {processingMode === PROCESSING_MODES.OUTLIERS_REMOVED &&
//             ' Outliers Removed • '}
//           {aggregationMode === 'day' && ' Daily Avg • '}
//           {aggregationMode === 'week' && ' Weekly Avg • '}
//           {aggregationMode === 'month' && ' Monthly Avg'}
//         </Text>
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   scrollContent: {
//     paddingBottom: 32,
//   },
//   header: {
//     padding: 20,
//     paddingTop: Platform.OS === 'ios' ? 60 : 40,
//     backgroundColor: '#f8f9fa',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e9ecef',
//   },
//   title: {
//     fontSize: Platform.select({ios: 28, android: 26}),
//     fontWeight: 'bold',
//     color: '#1a1a1a',
//     marginBottom: 4,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#6c757d',
//   },
//   controlsContainer: {
//     backgroundColor: '#f8f9fa',
//     paddingBottom: 12,
//   },
//   rangeSelector: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   rangeButton: {
//     flex: 1,
//     paddingVertical: 8,
//     paddingHorizontal: 4,
//     marginHorizontal: 2,
//     borderRadius: 8,
//     backgroundColor: '#ffffff',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#dee2e6',
//   },
//   rangeButtonActive: {
//     backgroundColor: colors.primaryColor || '#4682B4',
//     borderColor: colors.primaryColor || '#4682B4',
//   },
//   rangeButtonText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#495057',
//   },
//   rangeButtonTextActive: {
//     color: '#ffffff',
//   },
//   modeContainer: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//   },
//   modeTitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#495057',
//     marginBottom: 8,
//   },
//   modeButtons: {
//     flexDirection: 'row',
//   },
//   modeButton: {
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     marginRight: 8,
//     borderRadius: 16,
//     backgroundColor: '#ffffff',
//     borderWidth: 1,
//     borderColor: '#dee2e6',
//   },
//   modeButtonActive: {
//     backgroundColor: '#e7f3ff',
//     borderColor: '#4682B4',
//   },
//   modeButtonText: {
//     fontSize: 13,
//     color: '#495057',
//   },
//   modeButtonTextActive: {
//     color: '#4682B4',
//     fontWeight: '600',
//   },
//   exportButton: {
//     marginHorizontal: 16,
//     marginTop: 8,
//     paddingVertical: 10,
//     backgroundColor: '#28a745',
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   exportButtonText: {
//     color: '#ffffff',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   statsContainer: {
//     padding: 16,
//   },
//   statsTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#1a1a1a',
//     marginBottom: 16,
//   },
//   statSection: {
//     backgroundColor: '#f8f9fa',
//     padding: 12,
//     borderRadius: 12,
//     marginBottom: 12,
//   },
//   statSectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#495057',
//     marginBottom: 12,
//   },
//   statRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   statLabel: {
//     fontSize: 14,
//     color: '#6c757d',
//   },
//   statValue: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#1a1a1a',
//   },
//   outlierText: {
//     fontSize: 14,
//     color: '#dc3545',
//     marginBottom: 4,
//   },
//   outlierDetails: {
//     fontSize: 13,
//     color: '#6c757d',
//     marginBottom: 8,
//   },
//   outlierItem: {
//     fontSize: 13,
//     color: '#495057',
//     marginLeft: 12,
//     marginBottom: 4,
//   },
//   chartContainer: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//   },
//   chart: {
//     marginVertical: 8,
//     borderRadius: 16,
//   },
//   toggleContainer: {
//     paddingHorizontal: 16,
//     marginVertical: 8,
//   },
//   toggleButton: {
//     paddingVertical: 10,
//     backgroundColor: '#6c757d',
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   toggleButtonText: {
//     color: '#ffffff',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   eventsContainer: {
//     margin: 16,
//     padding: 16,
//     backgroundColor: '#fff5f5',
//     borderRadius: 12,
//     borderLeftWidth: 4,
//     borderLeftColor: '#dc3545',
//   },
//   eventsHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   eventsTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#1a1a1a',
//   },
//   closeButton: {
//     fontSize: 20,
//     color: '#6c757d',
//     padding: 4,
//   },
//   eventItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#fee',
//   },
//   eventDate: {
//     fontSize: 13,
//     color: '#6c757d',
//     flex: 1,
//   },
//   eventType: {
//     fontSize: 13,
//     fontWeight: '600',
//     marginHorizontal: 8,
//   },
//   eventValue: {
//     fontSize: 13,
//     color: '#495057',
//     marginRight: 8,
//   },
//   eventChange: {
//     fontSize: 12,
//     color: '#dc3545',
//     fontWeight: '600',
//   },
//   insightsContainer: {
//     margin: 16,
//     padding: 16,
//     backgroundColor: '#f0f8ff',
//     borderRadius: 12,
//     borderLeftWidth: 4,
//     borderLeftColor: '#0066cc',
//   },
//   insightsTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#1a1a1a',
//     marginBottom: 12,
//   },
//   insightItem: {
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 8,
//     backgroundColor: '#ffffff',
//   },
//   insightPositive: {
//     backgroundColor: '#d4edda',
//     borderLeftWidth: 3,
//     borderLeftColor: '#28a745',
//   },
//   insightWarning: {
//     backgroundColor: '#fff3cd',
//     borderLeftWidth: 3,
//     borderLeftColor: '#ffc107',
//   },
//   insightInfo: {
//     backgroundColor: '#e7f3ff',
//     borderLeftWidth: 3,
//     borderLeftColor: '#0066cc',
//   },
//   insightText: {
//     fontSize: 14,
//     color: '#495057',
//     lineHeight: 20,
//   },
//   footer: {
//     padding: 16,
//     alignItems: 'center',
//     borderTopWidth: 1,
//     borderTopColor: '#e9ecef',
//   },
//   footerText: {
//     fontSize: 12,
//     color: '#6c757d',
//     textAlign: 'center',
//   },
//   centered: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: '#6c757d',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#dc3545',
//     textAlign: 'center',
//     marginBottom: 16,
//   },
//   retryButton: {
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     backgroundColor: colors.primaryColor || '#4682B4',
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   emptyStateIcon: {
//     fontSize: 64,
//     marginBottom: 16,
//   },
//   emptyStateTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#1a1a1a',
//     marginBottom: 8,
//   },
//   emptyStateMessage: {
//     fontSize: 16,
//     color: '#6c757d',
//     textAlign: 'center',
//     lineHeight: 22,
//     paddingHorizontal: 32,
//   },
// });

// export default PulseRateTrendScreen;
