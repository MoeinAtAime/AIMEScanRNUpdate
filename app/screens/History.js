///////////////new

import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  BackHandler,
  Platform,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

import {ErrorBoundary} from '../components/ErrorBoundary';
import ResultsModal from '../components/ResultsModal';
import CustomCalendar from '../components/CustomCalendar';

import fetchAllResultsLastYear from '../api/fetchAllResultsLastYear';
import colors from '../config/colors';

const {width, height} = Dimensions.get('window');
const isSmallScreen = width < 350;
const isShortScreen = height < 700;

const STORAGE_KEYS = {
  SCAN_RESULTS: 'scanResults',
  SCANNED_DATES: 'scannedDates',
};

const ScanCard = React.memo(({scan, onPress}) => {
  const formatTime = timestamp => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const wellnessIndex = scan.WELLNESS_INDEX;
  const wellnessLevel = parseInt(scan.WELLNESS_LEVEL, 10);

  const getInterpretationText = level => {
    if (
      wellnessIndex === undefined ||
      wellnessIndex === null ||
      isNaN(wellnessIndex)
    ) {
      return 'No Score Available';
    }
    if (!isNaN(level)) {
      switch (level) {
        case 1:
          return 'Needs Attention';
        case 2:
          return 'Average';
        case 3:
          return 'Excellent';
        default:
          break;
      }
    }
    const normalized = wellnessIndex / 10;
    if (normalized <= 0.2) return 'Needs Attention';
    if (normalized <= 0.4) return 'Below Average';
    if (normalized <= 0.6) return 'Normal';
    if (normalized <= 0.8) return 'Above Average';
    return 'Excellent';
  };

  const getInterpretationColor = level => {
    if (
      wellnessIndex === undefined ||
      wellnessIndex === null ||
      isNaN(wellnessIndex)
    ) {
      return '#999999';
    }
    if (!isNaN(level)) {
      switch (level) {
        case 1:
          return '#E67C73';
        case 2:
          return '#4285F4';
        case 3:
          return '#57BB8A';
        default:
          break;
      }
    }
    const normalized = wellnessIndex / 10;
    if (normalized <= 0.2) return '#ff6b6b';
    if (normalized <= 0.4) return '#ffa94d';
    if (normalized <= 0.6) return '#74c0fc';
    if (normalized <= 0.8) return '#69db7c';
    return '#38d9a9';
  };

  const interpretation = getInterpretationText(wellnessLevel);
  const color = getInterpretationColor(wellnessLevel);

  return (
    <TouchableOpacity style={styles.scanCard} onPress={onPress}>
      <View style={styles.scanCardContent}>
        <View style={styles.scoreContainer}>
          <Text style={styles.wellnessScore}>{wellnessIndex}/10</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.statusContainer}>
          <Text style={[styles.wellnessStatus, {color}]}>{interpretation}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(scan.timeStamp)}</Text>
        </View>

        <View style={styles.arrowContainer}>
          <Text style={styles.arrowIcon}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const EmptyState = ({hasAnyData, loading, onFetch}) => {
  return (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>
        <Text style={styles.emptyStateIcon}>{hasAnyData ? '📅' : '☁️'}</Text>
      </View>

      <Text style={styles.emptyStateTitle}>
        {hasAnyData ? 'No scans on this date' : 'Welcome to Your History'}
      </Text>

      <Text style={styles.emptyStateDescription}>
        {hasAnyData
          ? 'Try selecting a different date or sync your data'
          : 'Load your scan history to view all your past results'}
      </Text>

      <TouchableOpacity
        style={styles.primaryFetchButton}
        onPress={onFetch}
        disabled={loading}
        activeOpacity={0.8}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.primaryFetchButtonIcon}>☁️</Text>
            <Text style={styles.primaryFetchButtonText}>
              Load Last Year's Data
            </Text>
          </>
        )}
      </TouchableOpacity>

      {!hasAnyData && (
        <Text style={styles.emptyStateHint}>
          This will download up to 365 days of scan history
        </Text>
      )}
    </View>
  );
};

const HistoryContent = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [state, setState] = useState({
    savedData: [],
    filteredData: [],
    loading: false,
    selectedDate: new Date(),
    showCalendar: false,
    modalVisible: false,
    selectedScanData: null,
    refreshing: false,
    scannedDates: {},
  });

  const updateState = updates => {
    setState(prev => ({...prev, ...updates}));
  };

  // Back button behavior (for Android)
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('MainTabs', {screen: 'Home'});
        return true;
      };
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => sub.remove();
    }, [navigation]),
  );

  // Load saved data from AsyncStorage on mount
  const loadSavedData = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_RESULTS);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Update scannedDates map
        const map = {};
        parsed.forEach(scan => {
          const d = new Date(scan.timeStamp).toLocaleDateString('en-US');
          map[d] = true;
        });

        // Also load stored scanned dates
        const storedDates = await AsyncStorage.getItem(
          STORAGE_KEYS.SCANNED_DATES,
        );
        if (storedDates) {
          const storedMap = JSON.parse(storedDates);
          Object.assign(map, storedMap);
        }

        updateState({scannedDates: map});

        const filtered = filterDataByDate(state.selectedDate, parsed);
        updateState({
          savedData: parsed,
          filteredData: filtered,
        });
      }
    } catch (err) {
      console.error('Error loading saved data:', err);
    }
  }, [state.selectedDate]);

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  // Utility: given date and all data, filter
  const filterDataByDate = useCallback((date, allData) => {
    const target = date.toLocaleDateString('en-US');
    return allData.filter(scan => {
      const sd = new Date(scan.timeStamp).toLocaleDateString('en-US');
      return sd === target;
    });
  }, []);

  const handleDateChange = date => {
    const filtered = filterDataByDate(date, state.savedData);
    updateState({
      selectedDate: date,
      showCalendar: false,
      filteredData: filtered,
    });
  };

  const handleFetchLastYear = useCallback(async () => {
    if (state.loading) return;
    updateState({loading: true});

    try {
      const results = await fetchAllResultsLastYear();

      if (results.length === 0) {
        Alert.alert(
          'No Data Found',
          'No scan results were found for the last year.',
        );
        updateState({loading: false});
        return;
      }

      // Replace stored data entirely
      await AsyncStorage.setItem(
        STORAGE_KEYS.SCAN_RESULTS,
        JSON.stringify(results),
      );

      // Recompute scannedDates map
      const map = {};
      results.forEach(scan => {
        const d = new Date(scan.timeStamp).toLocaleDateString('en-US');
        map[d] = true;
      });
      await AsyncStorage.setItem(
        STORAGE_KEYS.SCANNED_DATES,
        JSON.stringify(map),
      );
      updateState({scannedDates: map});

      const filtered = filterDataByDate(state.selectedDate, results);
      updateState({
        savedData: results,
        filteredData: filtered,
      });

      Alert.alert(
        'Success',
        `Successfully loaded ${results.length} scan${
          results.length !== 1 ? 's' : ''
        }.`,
      );
    } catch (err) {
      console.error('Error fetching last year data:', err);
      Alert.alert('Error', 'Failed to fetch results. Please try again later.');
    } finally {
      updateState({loading: false});
    }
  }, [state.selectedDate, state.loading, filterDataByDate]);

  const onRefresh = useCallback(async () => {
    updateState({refreshing: true});
    await loadSavedData();
    updateState({refreshing: false});
  }, [loadSavedData]);

  const openModal = (scan, idx) => {
    const scanWithNum = {...scan, scanNumber: idx + 1};
    updateState({
      modalVisible: true,
      selectedScanData: [scanWithNum],
    });
  };

  const formattedDate = useMemo(() => {
    return state.selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [state.selectedDate]);

  return (
    <View style={[styles.outerContainer, {paddingTop: insets.top}]}>
      <View style={styles.container}>
        <View style={styles.innerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select a Date:</Text>

            {/* Date picker button */}
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => updateState({showCalendar: true})}
              activeOpacity={0.7}>
              <Text style={styles.dateText}>{formattedDate}</Text>
              <View style={styles.calendarIcon}>
                <Text style={styles.calendarIconText}>📅</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Calendar overlay */}
          <CustomCalendar
            visible={state.showCalendar}
            onClose={() => updateState({showCalendar: false})}
            onSelectDate={handleDateChange}
            selectedDate={state.selectedDate}
            scannedDates={state.scannedDates}
          />

          {/* Main content */}
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={state.refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primaryColor}
              />
            }>
            {state.filteredData && state.filteredData.length > 0 ? (
              state.filteredData.map((scan, idx) => (
                <ScanCard
                  key={`${scan.timeStamp}-${idx}`}
                  scan={scan}
                  onPress={() => openModal(scan, idx)}
                />
              ))
            ) : (
              <EmptyState
                hasAnyData={state.savedData.length > 0}
                loading={state.loading}
                onFetch={handleFetchLastYear}
              />
            )}
          </ScrollView>

          {/* Results Modal */}
          <ResultsModal
            isVisible={state.modalVisible}
            onClose={() => updateState({modalVisible: false})}
            scanData={state.selectedScanData}
          />
        </View>
      </View>

      {/* Full-screen loading overlay */}
      {state.loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>
              Loading your older results...
            </Text>
            <Text style={styles.loadingSubText}>This may take a moment</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const History = () => (
  <ErrorBoundary>
    <HistoryContent />
  </ErrorBoundary>
);

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#4ca9ee',
  },
  container: {
    flex: 1,
    backgroundColor: '#B7DDF8',
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#4ca9ee',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: Platform.select({
      ios: isSmallScreen ? 24 : 28,
      android: isSmallScreen ? 22 : 26,
    }),
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  datePickerButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    alignSelf: 'center',
    width: '85%',
    minHeight: 50,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  calendarIcon: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIconText: {
    fontSize: 18,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 20,
  },

  // Scan Card Styles
  scanCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 60,
  },
  scanCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 44,
  },
  scoreContainer: {
    flex: 2,
    alignItems: 'center',
  },
  wellnessScore: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  statusContainer: {
    flex: 3,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  wellnessStatus: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeContainer: {
    flex: 1.5,
    alignItems: 'center',
    minWidth: 50,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  arrowContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  arrowIcon: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primaryColor,
  },

  // Empty State Styles
  emptyStateContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateIcon: {
    fontSize: 40,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  primaryFetchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryColor,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 200,
    minHeight: 50,
    justifyContent: 'center',
  },
  primaryFetchButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  primaryFetchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Loading Overlay Styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingBox: {
    padding: 30,
    backgroundColor: '#000000cc',
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingSubText: {
    color: '#ccc',
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default History;
