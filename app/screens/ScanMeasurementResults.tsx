import React, {useState, useCallback, useEffect} from 'react';
import {
  Text,
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
  BackHandler,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {generateClient} from 'aws-amplify/api';
import {createUserData} from '../../src/graphql/mutations';
// import colors from '../config/colors';

interface RouteParams {
  results: any;
  userInfo: any;
}

const ScanMeasurementResults = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // const {results, userInfo} = route.params;
  const {results, userInfo} = route.params as RouteParams;
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  const client = generateClient();

  // Handle back button to go to landing screen
  useFocusEffect(
    useCallback(() => {
      // const onBackPress = () => {
      //   navigation.navigate('MainTabs', {screen: 'Scan'});
      //   return true; // Prevent default back behavior
      // };
      const onBackPress = () => {
        navigation.reset({
          index: 0,
          routes: [{name: 'MainTabs' as never, params: {screen: 'Home'}}],
        });
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => subscription?.remove();
    }, [navigation]),
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Add this function to show the confidence level info modal
  const showConfidenceLevelInfo = () => {
    setInfoModalVisible(true);
  };

  // Responsive styles based on current dimensions
  const responsiveStyles = {
    headerPadding: {
      paddingHorizontal: dimensions.width < 375 ? 16 : 24,
      paddingTop: dimensions.height < 700 ? 20 : 30, // REDUCED from 50:74 to 20:30
      paddingBottom: 14, // ADD THIS LINE
    },
    contentPadding: {
      paddingHorizontal: dimensions.width < 375 ? 16 : 24,
      // backgroundColor: 'red', // TEMPORARY - remove after testing
    },
    fontSize: {
      title: dimensions.width < 375 ? 16 : 18,
      subtitle: dimensions.width < 375 ? 12 : 13,
      sectionHeader: dimensions.width < 375 ? 16 : 18,
      label: dimensions.width < 375 ? 13 : 14,
      result: dimensions.width < 375 ? 15 : 16,
      confidence: dimensions.width < 375 ? 11 : 12,
      button: dimensions.width < 375 ? 16 : 18,
    },
    buttonPadding: {
      paddingHorizontal: dimensions.width < 375 ? 12 : 16,
      paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    },
    modalPadding: {
      padding: dimensions.width < 375 ? 16 : 20,
      // width: dimensions.width < 375 ? '90%' : '85%',
    },
    modalWidth: {
      width:
        dimensions.width < 375
          ? dimensions.width * 0.9
          : dimensions.width * 0.85,
    },
    itemHeight: {
      minHeight: dimensions.height < 700 ? 32 : 37,
    },
    heartAgeItemHeight: {
      minHeight: dimensions.height < 700 ? 45 : 50, // More height for heart age
    },
  };

  // Add this function definition here
  // const getConfidenceLevel = useCallback(level => {
  const getConfidenceLevel = useCallback((level: string) => {
    switch (level) {
      case '1':
        return 'Low';
      case '2':
        return 'Normal';
      case '3':
        return 'High';
      default:
        return 'N/A';
    }
  }, []);

  const saveResultsToBackend = async () => {
    setIsSaving(true); // ADD THIS LINE at the very beginning

    const email = String(userInfo.userAttributesEmail);
    const actID = String(userInfo.activationID);
    const pulseRate = String(results.pr);
    const mRRI = String(results.meanRRI);

    // Generate timeStamp in ISO 8601 format compatible with JavaScript Date parsing
    const currentDate = new Date();
    const offset = currentDate.getTimezoneOffset() * 60000; // Offset in milliseconds
    const localISOTime = new Date(currentDate.getTime() - offset)
      .toISOString()
      .slice(0, -1); // Removes 'Z'

    const BloodPressure = String(results.BP);
    const Hemoglobin = String(results.Hemo);
    const HemoglobinA1C = String(results.HemoA1C);
    const LFandHF = String(results.LfHf);
    const OxygenSaturation = String(results.OS);
    const StressLevel = String(results.SL);
    const WellnessIndex = String(results.WI);
    const SDNN = String(results.Sdnn);
    const SDNNCONFLEVEL = String(results.SdnnConfLevel);
    const RESPIRATIONRATE = String(results.RespRate);
    const RESPIRATIONRATECONFLEVEL = String(results.RespRateConfLevel);
    const RRIs = String(results.Rri);
    const RRICONFLEVEL = String(results.RriConfLevel);
    const PRQ = String(results.Prq);
    const PRQCONFLEVEL = String(results.PrqConfLevel);
    const PULSERATECONFLEVEL = String(results.PulRateConfLevel);
    const MEANRRICONFLEVEL = String(results.MRriConfLevel);

    //Added with update version 0.5.7
    const PNSINDEX = String(results.PNSIndex);
    const PNSZONE = String(results.PNSZone);
    const RMSSDs = String(results.rMSSD);
    const SD1s = String(results.sD1);
    const SD2s = String(results.sD2);
    const SNSINDEX = String(results.SNSIndex);
    const SNSZONE = String(results.SNSZone);
    const STRESSINDEX = String(results.stressIndex);
    const WELLNESSLEVEL = String(results.WellnessLevel);

    //Added with update version 0.5.8
    const ASCVDRISK = String(results.ASCVDRisk);
    const HEARTAGE = String(results.heartAge);
    const HIGHBLOODPRESSURERISK = String(results.highBloodPressureRisk);
    const HIGHFASTINGGLUCOSERISK = String(results.highFastingGlucoseRisk);
    const HIGHHEMOGLOBINEA1CRISK = String(results.highHemoglobinA1cRisk);
    const HIGHTOTALCHOLESTEROLRISK = String(results.highTotalCholesterolRisk);
    const LOWHEMOGLOBINRISK = String(results.lowHemoglobinRisk);
    const NORMALIZEDSTRESSINDEX = String(results.normalizedStressIndex);

    // const filterWithPreservedData = data => {
    const filterWithPreservedData = (data: any[]) => {
      const now = new Date();

      // Create a map to track which dates were manually loaded by the user
      const manuallyLoadedDates = {};

      // First pass - identify manually loaded dates from older results
      // data.forEach(item => {
      data.forEach((item: any) => {
        const itemDate = new Date(item.timeStamp);
        // const daysDifference = (now - itemDate) / (1000 * 60 * 60 * 24);
        const daysDifference =
          (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);

        // If the measurement is older than 90 days, mark its date as manually loaded
        if (daysDifference > 365) {
          const dateKey = new Date(itemDate).toLocaleDateString('en-US');
          // manuallyLoadedDates[dateKey] = true;
          (manuallyLoadedDates as any)[dateKey] = true;
        }
      });

      // Second pass - filter data, keeping recent 90 days AND any dates that were manually loaded
      // return data.filter(item => {
      return data.filter((item: any) => {
        const itemDate = new Date(item.timeStamp);
        // const daysDifference = (now - itemDate) / (1000 * 60 * 60 * 24);
        const daysDifference =
          (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
        const dateKey = new Date(itemDate).toLocaleDateString('en-US');

        // Keep if within 90 days OR if the date was manually loaded by user
        return (
          !isNaN(itemDate.getTime()) &&
          // (daysDifference <= 90 || manuallyLoadedDates[dateKey])
          (daysDifference <= 365 || (manuallyLoadedDates as any)[dateKey])
        );
      });
    };

    try {
      // Step 1: Fetch existing data from local storage
      const existingData = await AsyncStorage.getItem('scanResults');
      const parsedData = existingData ? JSON.parse(existingData) : [];

      // Step 2: Prepare the new scan result
      const newScanResult = {
        email,
        activationID: actID,
        timeStamp: localISOTime, // Store as standard ISO format
        PULSE_RATE: pulseRate,
        MEAN_RRI: mRRI,
        BLOOD_PRESSURE: BloodPressure,
        HEMOGLOBIN: Hemoglobin,
        HEMOGLOBIN_A1C: HemoglobinA1C,
        LF_HF: LFandHF,
        OXYGEN_SATURATION: OxygenSaturation,
        STRESS_LEVEL: StressLevel,
        WELLNESS_INDEX: WellnessIndex,
        SDNN: SDNN,
        SDNN_CONF_LEVEL: SDNNCONFLEVEL,
        RESPIRATION_RATE: RESPIRATIONRATE,
        RESPIRATION_RATE_CONF_LEVEL: RESPIRATIONRATECONFLEVEL,
        RRI: RRIs,
        RRI_CONF_LEVEL: RRICONFLEVEL,
        PRQ: PRQ,
        PRQ_CONF_LEVEL: PRQCONFLEVEL,
        PULSE_RATE_CONF_LEVEL: PULSERATECONFLEVEL,
        MEAN_RRI_CONF_LEVEL: MEANRRICONFLEVEL,

        // Added with update Version 0.5.7
        PNS_INDEX: PNSINDEX,
        PNS_ZONE: PNSZONE,
        RMSSD: RMSSDs,
        SD1: SD1s,
        SD2: SD2s,
        SNS_INDEX: SNSINDEX,
        SNS_ZONE: SNSZONE,
        STRESS_INDEX: STRESSINDEX,
        WELLNESS_LEVEL: WELLNESSLEVEL,

        // Added with update Version 0.5.8
        ASCVD_RISK: ASCVDRISK,
        HEART_AGE: HEARTAGE,
        HIGH_BLOOD_PRESSURE_RISK: HIGHBLOODPRESSURERISK,
        HIGH_FASTING_GLUCOSE_RISK: HIGHFASTINGGLUCOSERISK,
        HIGH_HEMOGLOBIN_A1C_RISK: HIGHHEMOGLOBINEA1CRISK,
        HIGH_TOTAL_CHOLESTEROL_RISK: HIGHTOTALCHOLESTEROLRISK,
        LOW_HEMOGLOBIN_RISK: LOWHEMOGLOBINRISK,
        NORMALIZED_STRESS_INDEX: NORMALIZEDSTRESSINDEX,

        userDeviceInfoVersion: String(Platform.Version),
        userDeviceInfo: Platform.OS,
      };

      // Step 3: Merge the new scan result with existing data
      const updatedData = [...parsedData, newScanResult];

      // Step 4: Filter data to keep only the last 90 days if there is existing data
      const filteredData =
        updatedData.length > 0
          ? filterWithPreservedData(updatedData)
          : [newScanResult];

      console.log('Data to save in AsyncStorage (last 90 days):');

      // Step 5: Save the filtered data (last 90 days) to AsyncStorage
      await AsyncStorage.setItem('scanResults', JSON.stringify(filteredData));

      // Step 6: Save the new scan result to the backend
      await client.graphql({
        query: createUserData,
        variables: {input: newScanResult},
        authMode: 'userPool', // Cognito authentication
      });

      console.log('Results saved to backend and local storage');

      // Navigate to History after successful save
      // navigation.replace('History');
      // navigation.navigate('MainTabs', {screen: 'History'});
      navigation.reset({
        index: 0,
        routes: [{name: 'MainTabs' as never, params: {screen: 'History'}}],
      });
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'Failed to save results. Please try again.');
    } finally {
      setIsSaving(false); // ADD THIS LINE in the finally block
    }
  };

  const handleClose = () => {
    // Navigate back to the initial route (Scan tab in MainTabs)
    navigation.reset({
      index: 0,
      routes: [{name: 'MainTabs' as never, params: {screen: 'Home'}}],
    });
  };

  return (
    <SafeAreaView
      style={[styles.scanMeasurementResults, {backgroundColor: '#016097'}]}
      edges={['bottom']}>
      <View style={styles.view}>
        <View style={styles.scan}>
          <View style={styles.frameParent}>
            <View
              style={[
                styles.measurementResultsParent,
                styles.frameContainerFlexBox,
                responsiveStyles.headerPadding,
              ]}>
              <View style={styles.explanationRow}>
                {/* <Text
                  style={[
                    styles.forMoreDetailed,
                    styles.forMoreDetailedTypo,
                    {fontSize: responsiveStyles.fontSize.subtitle, flex: 1},
                  ]}>
                  To see more detailed measurement,tap Save Results and go to History.
                </Text> */}
                <Text
                  style={[
                    styles.forMoreDetailed,
                    styles.forMoreDetailedTypo,
                    {fontSize: responsiveStyles.fontSize.subtitle, flex: 1},
                  ]}>
                  To see more detailed measurement, tap{' '}
                  <Text style={{fontWeight: 'bold'}}>Save Results</Text> and go
                  to <Text style={{fontWeight: 'bold'}}>History</Text>.
                </Text>
                <TouchableOpacity
                  onPress={showConfidenceLevelInfo}
                  style={styles.infoIconLarge}>
                  <Text style={styles.infoIconTextLarge}>i</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.frameGroup}
              contentContainerStyle={[
                styles.frameContainer1Content,
                responsiveStyles.contentPadding,
              ]}>
              {/* Wellness Indicators */}
              <View style={styles.frameContainerFlexBox}>
                <View style={styles.wellnessIndicatorsWrapper}>
                  <Text
                    style={[
                      styles.wellnessIndicators,
                      styles.resultsTypo,
                      {fontSize: responsiveStyles.fontSize.sectionHeader},
                    ]}>
                    Wellness Indicators
                  </Text>
                </View>
                <View style={styles.measurementListItemParent}>
                  <View
                    style={[
                      styles.measurementItemFlexBox,
                      responsiveStyles.itemHeight,
                    ]}>
                    <Text
                      style={[
                        styles.label,
                        {fontSize: responsiveStyles.fontSize.label},
                      ]}>
                      Wellness Index
                    </Text>
                    <Text
                      style={[
                        styles.results,
                        styles.resultsTypo,
                        {fontSize: responsiveStyles.fontSize.result},
                      ]}>
                      {results.WI}
                      <Text style={styles.unitText}> (score)</Text>
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.measurementListItem1,
                      styles.measurementItemFlexBox,
                      responsiveStyles.itemHeight,
                    ]}>
                    <Text
                      style={[
                        styles.label,
                        {fontSize: responsiveStyles.fontSize.label},
                      ]}>
                      Stress Index
                    </Text>
                    <Text
                      style={[
                        styles.results,
                        styles.resultsTypo,
                        {fontSize: responsiveStyles.fontSize.result},
                      ]}>
                      {results.stressIndex}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Vitals */}
              <View style={styles.frameContainerFlexBox}>
                <View style={styles.wellnessIndicatorsWrapper}>
                  <Text
                    style={[
                      styles.wellnessIndicators,
                      styles.resultsTypo,
                      {fontSize: responsiveStyles.fontSize.result},
                    ]}>
                    Vitals
                  </Text>
                </View>
                <View style={styles.measurementListItemParent}>
                  <View
                    style={[
                      styles.measurementItemFlexBox,
                      responsiveStyles.itemHeight,
                      // ADD CONFIDENCE STYLING:
                      results.PulRateConfLevel === '1' && styles.lowConfidence,
                      results.PulRateConfLevel === '3' && styles.highConfidence,
                      (!results.PulRateConfLevel ||
                        results.PulRateConfLevel === '2') &&
                        styles.normalConfidence,
                    ]}>
                    <Text
                      style={[
                        styles.label,
                        {fontSize: responsiveStyles.fontSize.label},
                      ]}>
                      Heart Rate
                    </Text>
                    <View style={styles.resultValueContainer}>
                      <Text
                        style={[
                          styles.results,
                          styles.resultsTypo,
                          {fontSize: responsiveStyles.fontSize.result},
                        ]}>
                        {results.pr}
                        <Text style={styles.unitText}> bpm</Text>
                      </Text>
                      {results.PulRateConfLevel && (
                        <Text
                          style={[
                            styles.confidenceText,
                            {fontSize: responsiveStyles.fontSize.confidence},
                            // ADD CONFIDENCE TEXT STYLING:
                            results.PulRateConfLevel === '1' &&
                              styles.lowConfidenceText,
                            results.PulRateConfLevel === '3' &&
                              styles.highConfidenceText,
                            (!results.PulRateConfLevel ||
                              results.PulRateConfLevel === '2') &&
                              styles.normalConfidenceText,
                          ]}>
                          Confidence:{' '}
                          {getConfidenceLevel(results.PulRateConfLevel)}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.measurementListItem1,
                      styles.measurementItemFlexBox,
                      responsiveStyles.itemHeight,
                      // ADD CONFIDENCE STYLING:
                      results.RespRateConfLevel === '1' && styles.lowConfidence,
                      results.RespRateConfLevel === '3' &&
                        styles.highConfidence,
                      (!results.RespRateConfLevel ||
                        results.RespRateConfLevel === '2') &&
                        styles.normalConfidence,
                    ]}>
                    <Text
                      style={[
                        styles.label,
                        {fontSize: responsiveStyles.fontSize.label},
                      ]}>
                      Respiration Rate
                    </Text>
                    <View style={styles.resultValueContainer}>
                      <Text
                        style={[
                          styles.results,
                          styles.resultsTypo,
                          {fontSize: responsiveStyles.fontSize.result},
                        ]}>
                        {results.RespRate}
                        <Text style={styles.unitText}> breaths/min</Text>
                      </Text>
                      {results.RespRateConfLevel && (
                        <Text
                          style={[
                            styles.confidenceText,
                            {fontSize: responsiveStyles.fontSize.confidence},
                            // ADD CONFIDENCE TEXT STYLING:
                            results.RespRateConfLevel === '1' &&
                              styles.lowConfidenceText,
                            results.RespRateConfLevel === '3' &&
                              styles.highConfidenceText,
                            (!results.RespRateConfLevel ||
                              results.RespRateConfLevel === '2') &&
                              styles.normalConfidenceText,
                          ]}>
                          Confidence:{' '}
                          {getConfidenceLevel(results.RespRateConfLevel)}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.measurementListItem1,
                      styles.measurementItemFlexBox,
                      responsiveStyles.itemHeight,
                    ]}>
                    <Text
                      style={[
                        styles.label,
                        {fontSize: responsiveStyles.fontSize.label},
                      ]}>
                      Blood Pressure
                    </Text>
                    <Text
                      style={[
                        styles.results,
                        styles.resultsTypo,
                        {fontSize: responsiveStyles.fontSize.result},
                      ]}>
                      {results.BP}
                      <Text style={styles.unitText}> mmHg</Text>
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.measurementListItem1,
                      styles.measurementItemFlexBox,
                      responsiveStyles.itemHeight,
                    ]}>
                    <Text
                      style={[
                        styles.label,
                        {fontSize: responsiveStyles.fontSize.label},
                      ]}>
                      Oxygen Saturation
                    </Text>
                    <Text
                      style={[
                        styles.results,
                        styles.resultsTypo,
                        {fontSize: responsiveStyles.fontSize.result},
                      ]}>
                      {results.OS}
                      <Text style={styles.unitText}> %</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* Heart Data */}
              {/* <View style={styles.frameContainerFlexBox}>
                <View style={styles.wellnessIndicatorsWrapper}>
                  <Text
                    style={[
                      styles.wellnessIndicators,
                      styles.resultsTypo,
                      {fontSize: responsiveStyles.fontSize.sectionHeader},
                    ]}>
                    Heart Data
                  </Text>
                </View>
                <View style={styles.measurementListItemParent}>
                  {results.heartAge && results.heartAge !== 'N/A' && (
                    <View
                      style={[
                        styles.measurementListItem6,
                        styles.measurementItemPosition,
                        responsiveStyles.heartAgeItemHeight,
                      ]}>
                      <Text
                        style={[
                          styles.label,
                          {fontSize: responsiveStyles.fontSize.label},
                        ]}>
                        Heart Age
                      </Text>
                      <Text
                        style={[
                          styles.results,
                          styles.resultsTypo,
                          {fontSize: responsiveStyles.fontSize.result},
                        ]}>
                        {results.heartAge}
                        <Text style={styles.unitText}> years</Text>
                      </Text>
                    </View>
                  )}
                </View>
              </View> */}

              {/* Blood Data */}
              <View style={styles.frameContainerFlexBox}>
                <View style={styles.wellnessIndicatorsWrapper}>
                  <Text
                    style={[
                      styles.wellnessIndicators,
                      styles.resultsTypo,
                      {fontSize: responsiveStyles.fontSize.sectionHeader},
                    ]}>
                    Blood Data
                  </Text>
                </View>
                <View
                  style={[
                    styles.measurementListItem6,
                    styles.measurementItemPosition,
                  ]}>
                  <Text
                    style={[
                      styles.label,
                      {fontSize: responsiveStyles.fontSize.label},
                    ]}>
                    Hemoglobin A1C
                  </Text>
                  <Text
                    style={[
                      styles.results,
                      styles.resultsTypo,
                      {fontSize: responsiveStyles.fontSize.result},
                    ]}>
                    {results.HemoA1C}
                    <Text style={styles.unitText}> %</Text>
                  </Text>
                </View>
              </View>

              {/* Autonomic Nervous System */}
              <View style={styles.frameContainerFlexBox}>
                <View style={styles.wellnessIndicatorsWrapper}>
                  <Text
                    style={[
                      styles.wellnessIndicators,
                      styles.resultsTypo,
                      {fontSize: responsiveStyles.fontSize.sectionHeader},
                    ]}>
                    Autonomic Nervous System
                  </Text>
                </View>
                <View
                  style={[
                    styles.measurementListItem8,
                    styles.measurementItemPosition,
                  ]}>
                  <Text
                    style={[
                      styles.label,
                      {fontSize: responsiveStyles.fontSize.label},
                    ]}>
                    PNS Index
                  </Text>
                  <Text
                    style={[
                      styles.results,
                      styles.resultsTypo,
                      {fontSize: responsiveStyles.fontSize.result},
                    ]}>
                    {results.PNSIndex}
                    <Text style={styles.unitText}> SD</Text>
                  </Text>
                </View>
              </View>
            </ScrollView>

            <Pressable style={styles.cancelButtonParent}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  styles.buttonFlexBox,
                  responsiveStyles.buttonPadding,
                ]}
                onPress={handleClose}>
                <Text
                  style={[
                    styles.cancel,
                    styles.cancelLayout,
                    {fontSize: responsiveStyles.fontSize.button},
                  ]}>
                  Close
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  styles.buttonFlexBox,
                  responsiveStyles.buttonPadding,
                  isSaving && {opacity: 0.6},
                ]}
                onPress={saveResultsToBackend}
                disabled={isSaving}>
                <Text
                  style={[
                    styles.saveResults,
                    styles.resultsTypo1,
                    {fontSize: responsiveStyles.fontSize.button},
                  ]}>
                  {isSaving ? 'Saving...' : 'Save Results'}
                </Text>
              </TouchableOpacity>
            </Pressable>
          </View>
        </View>
      </View>
      {/* Confidence Info Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={infoModalVisible}
        onRequestClose={() => setInfoModalVisible(false)}>
        <View style={styles.infoModalContainer}>
          <View
            style={[
              styles.infoModalContent,
              responsiveStyles.modalPadding,
              responsiveStyles.modalWidth,
            ]}>
            <Text style={styles.infoTitle}>Confidence Level</Text>
            <Text style={styles.infoText}>
              Confidence levels indicate the reliability of each measurement.
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Low (1):</Text> Measurement may have
              a reduced accuracy.
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Normal (2):</Text> Measurement has a
              standard level of accuracy.
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>High (3):</Text> Measurement has a
              high level of accuracy.
            </Text>
            <Text style={styles.infoText}>
              Factors like movement, lighting conditions, face position, and
              skin tone can affect confidence levels. For optimal results, stay
              still in a well-lit environment during the scan.
            </Text>
            <TouchableOpacity
              style={styles.infoCloseButton}
              onPress={() => setInfoModalVisible(false)}>
              <Text style={styles.infoCloseButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* ADD THIS LOADING MODAL */}
      <Modal
        animationType="fade"
        transparent
        visible={isSaving}
        onRequestClose={() => {}}>
        <View style={styles.loadingModalContainer}>
          <View style={styles.loadingModalContent}>
            <ActivityIndicator size="large" color="#00619b" />
            <Text style={styles.loadingText}>Saving results...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  frameContainer1Content: {
    flexDirection: 'column',
    paddingVertical: 16,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  scanMeasurementResults: {
    flex: 1,
    backgroundColor: '#016097', // ADD THIS LINE
  },
  cancelTypo: {
    fontWeight: '500',
    textAlign: 'center',
  },
  frameContainerFlexBox: {
    gap: 8,
    alignSelf: 'stretch',
  },
  resultsTypo1: {
    color: '#fff',
    lineHeight: 27,
    textAlign: 'center',
    fontSize: 18,
  },
  forMoreDetailedTypo: {
    fontFamily: 'NunitoSans12pt-SemiBold',
    fontWeight: '600',
    width: 328,
  },
  resultsTypo: {
    fontFamily: 'NunitoSans12pt-Bold',
    fontWeight: '700',
  },
  measurementItemFlexBox: {
    gap: 0,
    justifyContent: 'space-between',
    borderColor: '#f0f0f0',
    minHeight: 37,
    paddingVertical: 8,
    paddingHorizontal: 0,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderStyle: 'solid',
    alignSelf: 'stretch',
    alignItems: 'flex-start',
  },
  measurementItemPosition: {
    paddingBottom: 8,
    paddingTop: 8,
    gap: 0,
    justifyContent: 'space-between',
    borderColor: '#f0f0f0',
    paddingLeft: 8,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderStyle: 'solid',
    alignSelf: 'stretch',
  },
  buttonFlexBox: {
    paddingVertical: 4,
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cancelLayout: {
    lineHeight: 27,
    fontSize: 18,
  },
  textMessages: {
    fontFamily: 'Inter-Medium',
    color: '#444454',
    display: 'none',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
  },
  measurementResults: {
    height: Platform.OS === 'ios' ? 28 : 32,
    fontFamily: 'NunitoSans12pt-SemiBold',
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
  },
  forMoreDetailed: {
    fontSize: 13,
    lineHeight: Platform.OS === 'ios' ? 20 : 22,
    color: '#c6e0eb',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
    // paddingTop: 20,
  },
  measurementResultsParent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 74,
    paddingBottom: 14,
    alignItems: 'center',
    backgroundColor: '#00619b',
    gap: 8,
    overflow: 'hidden',
    justifyContent: 'center', // ADD THIS LINE
  },
  wellnessIndicators: {
    color: '#00619b',
    textAlign: 'left',
    lineHeight: 27,
    fontSize: 18,
    flex: 1,
  },
  wellnessIndicatorsWrapper: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'solid',
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 14,
    lineHeight: Platform.OS === 'ios' ? 21 : 23,
    fontFamily: 'NunitoSans12pt-Regular',
    color: '#333',
    textAlign: 'left',
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
  },
  results: {
    fontSize: 16,
    lineHeight: Platform.OS === 'ios' ? 24 : 26,
    textAlign: 'right',
    color: '#333',
    fontFamily: 'NunitoSans12pt-Bold',
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
  },
  measurementListItem1: {
    marginTop: -4,
  },
  measurementListItemParent: {
    paddingLeft: 8,
    alignSelf: 'stretch',
  },
  measurementListItem6: {
    minHeight: 37, // Correct camelCase
    paddingBottom: 8,
    paddingTop: 8,
  },
  measurementListItem8: {
    minHeight: 37,
  },
  frameGroup: {
    backgroundColor: '#f1f1f1',
    maxWidth: '100%',
    alignSelf: 'stretch',
    flex: 1,
  },
  cancel: {
    fontFamily: 'NunitoSans12pt-Medium',
    color: '#ff0000',
    textAlign: 'center',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    borderRadius: 8,
  },
  saveResults: {
    fontWeight: '800',
    fontFamily: 'NunitoSans12pt-ExtraBold',
  },
  saveButton: {
    borderColor: '#00619b',
    borderWidth: 1,
    justifyContent: 'center',
    borderRadius: 8,
    borderStyle: 'solid',
    backgroundColor: '#00619b',
  },
  cancelButtonParent: {
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowRadius: 21,
    elevation: 21,
    shadowOpacity: 1,
    borderTopWidth: 1,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    gap: 0,
    justifyContent: 'space-between',
    flexDirection: 'row',
    borderColor: '#e0e0e0',
    borderStyle: 'solid',
    alignItems: 'center',
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  frameParent: {
    alignSelf: 'stretch',
    flex: 1,
  },
  scan: {
    backgroundColor: '#016097', // Make sure this matches
    overflow: 'hidden',
    alignSelf: 'stretch',
    flex: 1,
  },
  view: {
    width: '100%',
    flex: 1,
    backgroundColor: '#016097', // ADD THIS LINE
  },
  resultValueContainer: {
    alignItems: 'flex-end',
  },
  unitText: {
    fontSize: 13,
    color: '#666',
    fontWeight: 'normal',
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: Platform.OS === 'ios' ? 4 : 2,
    includeFontPadding: false,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'center', // CHANGE from 'space-between' to 'center'
    alignItems: 'center',
    width: '100%',
    position: 'relative', // ADD THIS LINE
  },
  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute', // ADD THIS LINE
    right: 0, // ADD THIS LINE
  },
  infoIconText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoModalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 10,
  },
  infoBold: {
    fontWeight: 'bold',
  },
  infoCloseButton: {
    backgroundColor: '#00619b',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  infoCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }, // ADD THESE NEW STYLES:
  loadingModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    // shadowColor: '#000',
    // shadowOffset: {width: 0, height: 2},
    // shadowOpacity: 0.25,
    // shadowRadius: 4,
    // elevation: 5,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  explanationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  infoIconLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIconTextLarge: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lowConfidence: {
    // borderLeftColor: '#ff6b6b',
    // borderLeftWidth: 4,
  },
  highConfidence: {
    // borderLeftColor: '#51cf66',
    // borderLeftWidth: 4,
  },
  normalConfidence: {
    // borderLeftColor: '#f0f0f0',
    // borderLeftWidth: 1,
  },
  lowConfidenceText: {
    color: '#ff6b6b',
  },
  highConfidenceText: {
    color: '#51cf66',
  },
  normalConfidenceText: {
    color: '#666',
  },
});

export default ScanMeasurementResults;
