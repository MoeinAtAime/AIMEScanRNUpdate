// MeasureScreen.js

import React, {
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Alert,
  AppState,
  Platform,
  StyleSheet,
  Text,
  View,
  Modal,
  Button,
  Animated,
  ScrollView,
  TouchableOpacity,
  AppStateStatus,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {
  Session,
  SessionState,
  SessionBuilder,
  VitalSignTypes,
  useSessionState,
  useSessionWarnings,
  useSessionErrors,
  useFinalResults,
  useEnabledVitalSigns,
  useLicenseInfo,
  useVitalSigns,
  StressLevel,
  ConfidenceLevel,
  Sex,
  WellnessLevel,
  HealthMonitorException,
} from 'biosensesignal-react-native-sdk';
import SmokingStatus from 'biosensesignal-react-native-sdk';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {DataStore} from '@aws-amplify/datastore';
import {UserData} from '../../src/models';
import fetchSDKLicenseKey from '../api/fetchSDKLicenseKey'; // Import the new function for fetching license key
import AuthContext from '../auth/context';
import {CameraPreview} from '../components/CameraPreview';
import {ImageValidityView} from '../components/ImageValidityView';
import {PulseRate} from '../components/PulseRate';
import {VitalsContainer} from '../components/VitalsContainer';
import {StartStopButton} from '../components/StartStopButton';
import {fetchUserAttributes} from 'aws-amplify/auth';
import colors from '../config/colors';
import KeepAwake from 'react-native-keep-awake';

import {generateClient} from 'aws-amplify/api';
import {createUserData} from '../../src/graphql/mutations';
import MotivationalMessage from '../components/MotivationalMessage';

import Orientation from 'react-native-orientation-locker';

const ScreenActiveState = {
  ACTIVE: 0,
  INACTIVE: 1,
};

const MEASUREMENT_DURATION = 60;

const checkCameraPermissions = async (): Promise<boolean> => {
  try {
    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;
    return (
      (await check(permission)) === RESULTS.GRANTED ||
      (await request(permission)) === RESULTS.GRANTED
    );
  } catch (e) {
    return false;
  }
};

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallScreen = screenHeight < 700;

const minFontSize = 12;
const maxFontSize = 24;

const getResponsiveFontSize = percentage => {
  const size = screenWidth * percentage;
  return Math.min(Math.max(size, minFontSize), maxFontSize);
};

function MeasureScreen() {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log('🔄 MeasureScreen render #', renderCount.current);
  const route = useRoute();
  const {user, setUser} = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const dynamicStyles = getDynamicStyles(
    screenWidth,
    screenHeight,
    isTablet,
    isSmallScreen,
  );

  const session = useRef<Session | null>(null);
  const duringPermissionsCheck = useRef(false);
  const warningTimeout = useRef(null);
  const navigation = useNavigation();
  const sessionState = useSessionState();
  const warning = useSessionWarnings();
  const error = useSessionErrors();
  const finalResults = useFinalResults();
  const enabledVitalSigns = useEnabledVitalSigns();
  const licenseInfo = useLicenseInfo();
  const [screenActiveState, setScreenActiveState] = useState(
    ScreenActiveState.ACTIVE,
  );
  const [licenseKey, setLicenseKey] = useState(route.params?.licenseKey || '');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // const [modalVisible, setModalVisible] = useState(false);
  const [activationID, setActivationID] = useState('');
  const [pr, setPr] = useState('');
  const [PulRateConfLevel, setPulRateConfLevel] = useState('');
  const [meanRRI, setMeanRRI] = useState('');
  const [MRriConfLevel, setMRriConfLevel] = useState('');
  const [BP, setBP] = useState('');
  const [Hemo, setHemo] = useState('');
  const [HemoA1C, setHemoA1C] = useState('');
  const [LfHf, setLfHf] = useState('');
  const [OS, setOS] = useState('');
  const [SL, setSL] = useState('');
  const [WI, setWI] = useState('');
  const [Sdnn, setSdnn] = useState('');
  const [SdnnConfLevel, setSdnnConfLevel] = useState('');
  const [Rri, setRri] = useState('');
  const [RriConfLevel, setRriConfLevel] = useState('');
  const [RespRate, setRespRate] = useState('');
  const [RespRateConfLevel, setRespRateConfLevel] = useState('');
  const [Prq, setPrq] = useState('');
  const [PrqConfLevel, setPrqConfLevel] = useState('');

  // Added with update version 0.5.7
  const [PNSIndex, setPNSIndex] = useState('');
  const [PNSZone, setPNSZone] = useState('');
  const [rMSSD, setRMSSD] = useState('');
  const [sD1, setSD1] = useState('');
  const [sD2, setSD2] = useState('');
  const [SNSIndex, setSNSIndex] = useState('');
  const [SNSZone, setSNSZone] = useState('');
  const [stressIndex, setStressIndex] = useState('');
  const [WellnessLevel, setWellnessLevel] = useState('');

  // Added with update version 0.5.8
  const [ASCVDRisk, setASCVDRisk] = useState('');
  const [heartAge, setHeartAge] = useState('');
  const [highBloodPressureRisk, setHighBloodPressureRisk] = useState('');
  const [highFastingGlucoseRisk, setHighFastingGlucoseRisk] = useState('');
  const [highHemoglobinA1cRisk, setHighHemoglobinA1cRisk] = useState('');
  const [highTotalCholesterolRisk, setHighTotalCholesterolRisk] = useState('');
  const [lowHemoglobinRisk, setLowHemoglobinRisk] = useState('');
  const [normalizedStressIndex, setnormalizedStressIndex] = useState('');

  const [warningMessage, setWarningMessage] = useState('');
  const [imageValidityMessage, setImageValidityMessage] = useState('');
  const [isReadyToStart, setIsReadyToStart] = useState(false);

  const [userGender, setUserGender] = useState(route.params?.userGender || 0);
  const [userAge, setUserAge] = useState(route.params?.userAge || null);
  const [userWeight, setUserWeight] = useState(
    route.params?.userWeight || null,
  );
  const [userHeight, setUserHeight] = useState(
    route.params?.userHeight || null,
  );
  const [userSmokingStatus, setUserSmokingStatus] = useState(
    route.params?.userSmokingStatus || 0,
  );
  const [userAttributesEmail, setUserAttributesEmail] = useState(
    route.params?.userAttributesEmail || '',
  );

  const [isLoading, setIsLoading] = useState(false);
  const hasNavigated = useRef(false);

  const client = generateClient();

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  // 2. Add this function to show the confidence level info modal
  const showConfidenceLevelInfo = () => {
    // setInfoModalVisible(true);
  };
  // Add this function definition here
  const getConfidenceLevel = useCallback(level => {
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

  // const resetParameters = () => {
  const resetParameters = useCallback(() => {
    setPr('');
    setPulRateConfLevel('');
    setMeanRRI('');
    setMRriConfLevel('');
    setBP('');
    setHemo('');
    setHemoA1C('');
    setLfHf('');
    setOS('');
    setSL('');
    setWI('');
    setSdnn('');
    setSdnnConfLevel('');
    setRri('');
    setRriConfLevel('');
    setRespRate('');
    setRespRateConfLevel('');
    setPrq('');
    setPrqConfLevel('');

    // Added with update version 0.5.7
    setPNSIndex('');
    setPNSZone('');
    setRMSSD('');
    setSD1('');
    setSD2('');
    setSNSIndex('');
    setSNSZone('');
    setStressIndex('');
    setWellnessLevel('');

    // Added with update version 0.5.8
    setASCVDRisk('');
    setHeartAge('');
    setHighBloodPressureRisk('');
    setHighFastingGlucoseRisk('');
    setHighHemoglobinA1cRisk('');
    setHighTotalCholesterolRisk('');
    setLowHemoglobinRisk('');
    setnormalizedStressIndex('');

    setWarningMessage('');
    session.current = null; // Reset the session reference
    setIsReadyToStart(false); // Add this line
  }, []);

  const calculateAge = (birthdate: string) => {
    const birthDate = new Date(birthdate);
    const ageDiff = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const getDisplayMessage = () => {
    if (
      sessionState === SessionState.STARTING ||
      sessionState === SessionState.PROCESSING
    ) {
      return (
        imageValidityMessage ||
        warningMessage ||
        'Scan In Progress, Please Remain Still!'
      );
    }
    return '';
  };
  ///////////////////////

  // Helper function to convert height from decimal feet to centimeters
  const convertHeightDecimalToCm = height => {
    const heightInFeet = parseFloat(height); // Parse the height as a float
    if (isNaN(heightInFeet)) {
      console.error('Invalid height format:', height);
      return null;
    }

    const heightInInches = heightInFeet * 12; // Convert feet to inches
    const cm = Math.round(heightInInches * 2.54); // Convert inches to cm
    return cm;
  };

  /////////////// added
  // const validateUserAttributes = () => {
  const validateUserAttributes = useCallback(() => {
    // Check for gender
    if (userGender === null || userGender === undefined) {
      showError(
        'User gender information is missing. Please update your profile.',
      );
      return false;
    }

    // Check for age
    if (!userAge || userAge <= 0 || userAge > 120) {
      showError(
        'Valid user age information is missing. Please update your profile.',
      );
      return false;
    }

    // Check for weight
    if (!userWeight || userWeight <= 0) {
      showError(
        'Valid user weight information is missing. Please update your profile.',
      );
      return false;
    }

    // Check for height
    if (!userHeight || userHeight <= 0) {
      showError(
        'Valid user height information is missing. Please update your profile.',
      );
      return false;
    }

    // Check for smoking status
    if (userSmokingStatus === null || userSmokingStatus === undefined) {
      showError(
        'User smoking status information is missing. Please update your profile.',
      );
      return false;
    }

    return true;
  }, [userGender, userAge, userWeight, userHeight, userSmokingStatus]);

  const progress = useRef(new Animated.Value(0)).current;

  ///////////////added
  // useFocusEffect(
  //   useCallback(() => {
  //     const setupScreen = async () => {
  //       // Reset everything first
  //       setScreenActiveState(ScreenActiveState.ACTIVE);
  //       // setModalVisible(false);
  //       resetParameters();

  //       // Ensure any existing session is terminated
  //       await terminateSession();

  //       // Check if we have all required user attributes
  //       if (!validateUserAttributes()) {
  //         // If attributes are missing, navigate back to PreMeasureScreen to re-fetch them
  //         navigation.replace('PreMeasure');
  //         return;
  //       }
  //     };

  //     // Run setup
  //     setupScreen();

  //     // Cleanup function
  //     return () => {
  //       terminateSession();
  //       setScreenActiveState(ScreenActiveState.INACTIVE);
  //       // setModalVisible(false);
  //     };
  //   }, []), // Empty dependency array since we want this to run only on focus/unfocus
  // );

  // useFocusEffect(
  //   useCallback(() => {
  //     const setupScreen = async () => {
  //       resetParameters();
  //       await terminateSession();
  //       hasNavigated.current = false; // ADD THIS LINE HERE

  //       if (!validateUserAttributes()) {
  //         navigation.replace('PreMeasure');
  //         return;
  //       }
  //     };

  //     setupScreen();
  //     // Set this AFTER cleanup is done
  //     // setScreenActiveState(ScreenActiveState.ACTIVE);

  //     return () => {
  //       terminateSession();
  //       // setScreenActiveState(ScreenActiveState.INACTIVE);
  //     };
  //   }, [validateUserAttributes, terminateSession]),
  // );

  useFocusEffect(
    useCallback(() => {
      console.log('🎯 useFocusEffect triggered - FOCUS');

      // Lock to portrait when screen is focused
      Orientation.lockToPortrait();

      const setupScreen = async () => {
        console.log('🧹 setupScreen: Starting cleanup');
        resetParameters();
        await terminateSession();
        hasNavigated.current = false;
        console.log('🧹 setupScreen: Cleanup complete');

        if (!validateUserAttributes()) {
          console.log(
            '❌ setupScreen: Validation failed, navigating to PreMeasure',
          );
          navigation.replace('PreMeasure');
          return;
        }
        console.log('✅ setupScreen: Validation passed');
      };

      setupScreen();

      return () => {
        console.log('🎯 useFocusEffect cleanup triggered - BLUR');
        terminateSession();
        // Unlock orientation when leaving the screen
        Orientation.unlockAllOrientations();
      };
    }, [validateUserAttributes, terminateSession]),
  );

  // Modify your createNewSession function to check for existing sessions
  // const createNewSession = async () => {
  const createNewSession = useCallback(async () => {
    console.log('🔧 createNewSession called:', {
      isCreatingSession,
      sessionExists: !!session.current,
      timestamp: new Date().toISOString(),
    });
    // Don't create a new session if one is already being created
    if (isCreatingSession) {
      console.log('Session creation already in progress, skipping');
      return;
    }

    // Don't create a new session if one already exists
    if (session.current) {
      console.log('Session already exists, skipping creation');
      return;
    }

    setIsCreatingSession(true);
    setIsLoading(true);

    try {
      duringPermissionsCheck.current = true;
      const permissionsGranted = await checkCameraPermissions();
      duringPermissionsCheck.current = false;

      if (!permissionsGranted) {
        setIsLoading(false);
        setIsCreatingSession(false);
        showError('Please approve permissions in the device settings');
        return;
      }

      // Validate user attributes before session creation
      if (!validateUserAttributes()) {
        setIsLoading(false);
        setIsCreatingSession(false);
        return;
      }

      // First log to see what attributes will be used
      // console.log('Creating session with validated user attributes:', {
      //   gender: userGender,
      //   age: userAge,
      //   weight: userWeight,
      //   height: userHeight,
      //   smokingStatus: userSmokingStatus,
      // });

      // let sexValue = userGender === 0 ? Sex.MALE : Sex.FEMALE;

      let sexValue;
      if (userGender === 1) {
        sexValue = Sex.MALE;
      } else if (userGender === 2) {
        sexValue = Sex.FEMALE;
      } else {
        // Handle unspecified (0) or any other value
        sexValue = Sex.MALE; // Default to male if unspecified
        console.log('Using default male value for unspecified gender');
      }

      // console.log('Sex value conversion:', {
      //   userGender,
      //   convertedValue: sexValue,
      // });

      // Second log right before session creation with final values
      // console.log('Creating session with final user attributes:', {
      //   sex: sexValue.toString(),
      //   age: userAge,
      //   weight: userWeight,
      //   height: userHeight,
      //   smokingStatus: userSmokingStatus,
      // });

      // Create the session
      session.current = await SessionBuilder.faceSession(
        {licenseKey},
        {
          userInformation: {
            sex: sexValue,
            age: userAge,
            weight: userWeight,
            height: userHeight,
            smokingStatus: userSmokingStatus,
          },
        },
        {sdkAnalytics: true},
      );

      // Log success
      if (session.current) {
        console.log('Session created successfully!');
      }
    } catch (e) {
      console.error('Error creating session:', e);
      console.error('Error details:', JSON.stringify(e));
      const exception = e as HealthMonitorException;
      showError(
        `Error creating session: ${exception?.code || 'Unknown error'}`,
      );
    } finally {
      setIsLoading(false);
      setIsCreatingSession(false);
    }
  }, [
    licenseKey,
    userGender,
    userAge,
    userWeight,
    userHeight,
    userSmokingStatus,
    validateUserAttributes,
  ]);

  // Improve the terminateSession function
  // const terminateSession = async () => {
  const terminateSession = useCallback(async () => {
    console.log('🔧 terminateSession called:', {
      sessionExists: !!session.current,
      timestamp: new Date().toISOString(),
    });
    if (session.current) {
      try {
        await session.current.terminate();
      } catch (error) {
        console.error('Error terminating session:', error);
      } finally {
        session.current = null;
        // setModalVisible(false);
        resetProgressBar();
      }
    } else {
      resetProgressBar();
      // setModalVisible(false);
    }
  }, []);

  const startProgressBar = () => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: MEASUREMENT_DURATION * 1000,
      // useNativeDriver: false,
      useNativeDriver: true,
    }).start();
  };

  const resetProgressBar = () => {
    progress.stopAnimation();
    progress.setValue(0);
  };

  const handleStartStop = useCallback(async () => {
    try {
      if (sessionState === SessionState.READY && session.current) {
        setIsReadyToStart(false); // Hide ready message
        startProgressBar();
        await session.current.start(MEASUREMENT_DURATION);
      } else if (session.current) {
        await session.current.stop();
        resetProgressBar();
        setIsReadyToStart(true); // Show ready message again after stop
      }
    } catch (e) {
      showError(
        `Error in start/stop session. Please attempt the following: make sure the battery is over 20%, the battery saver is off, and finally, switch your network connection and try again.: ${e}`,
      );
    }
  }, [sessionState]);

  // Lifecycle handling. Create a session when the screen is visible and terminate the session when the screen is invisible
  // Either when navigating to/from the screen or when the application foreground state changes

  // Keep this ONE useEffect that manages session creation
  // React.useEffect(() => {
  //   const handleScreenStateChange = async () => {
  //     if (screenActiveState === ScreenActiveState.ACTIVE && licenseKey) {
  //       console.log('Screen active, creating session');
  //       await createNewSession();
  //     } else if (screenActiveState === ScreenActiveState.INACTIVE) {
  //       console.log('Screen inactive, terminating session');
  //       await terminateSession();
  //     }
  //   };

  //   handleScreenStateChange();
  // }, [screenActiveState, licenseKey]);

  // React.useEffect(() => {
  //   const handleScreenStateChange = async () => {
  //     if (screenActiveState === ScreenActiveState.ACTIVE && licenseKey) {
  //       console.log('Screen active, creating session');
  //       await createNewSession();
  //       // Add this line after session creation
  //       setIsReadyToStart(true);
  //     } else if (screenActiveState === ScreenActiveState.INACTIVE) {
  //       console.log('Screen inactive, terminating session');
  //       await terminateSession();
  //       setIsReadyToStart(false);
  //     }
  //   };

  //   handleScreenStateChange();
  // }, [screenActiveState, licenseKey, createNewSession, terminateSession]);

  React.useEffect(() => {
    console.log('🔄 Main session effect triggered:', {
      screenActiveState,
      licenseKey: licenseKey ? 'present' : 'missing',
      sessionExists: !!session.current,
      timestamp: new Date().toISOString(),
    });

    const handleScreenStateChange = async () => {
      if (screenActiveState === ScreenActiveState.ACTIVE && licenseKey) {
        console.log('✅ Screen active, creating session');
        await createNewSession();
        console.log('📝 Setting isReadyToStart to true after session creation');
        setIsReadyToStart(true);
      } else if (screenActiveState === ScreenActiveState.INACTIVE) {
        console.log('❌ Screen inactive, terminating session');
        await terminateSession();
        console.log('📝 Setting isReadyToStart to false after termination');
        setIsReadyToStart(false);
      }
    };

    handleScreenStateChange();
  }, [screenActiveState, licenseKey, createNewSession, terminateSession]);

  // Handle application foreground/background events
  // React.useEffect(() => {
  //   const subscription = AppState.addEventListener(
  //     'change',
  //     (appState: AppStateStatus) => {
  //       if (appState === 'active' && !session.current) {
  //         setScreenActiveState(ScreenActiveState.ACTIVE);
  //       } else if (
  //         appState === 'background' &&
  //         !duringPermissionsCheck.current
  //       ) {
  //         setScreenActiveState(ScreenActiveState.INACTIVE);
  //       }
  //     },
  //   );

  //   return subscription.remove;
  // }, []);

  React.useEffect(() => {
    console.log('📱 AppState effect initialized');

    const subscription = AppState.addEventListener(
      'change',
      (appState: AppStateStatus) => {
        console.log('📱 AppState changed to:', appState, {
          sessionExists: !!session.current,
          duringPermissionsCheck: duringPermissionsCheck.current,
        });

        if (appState === 'active' && !session.current) {
          console.log(
            '📱 Setting screenActiveState to ACTIVE (app became active)',
          );
          setScreenActiveState(ScreenActiveState.ACTIVE);
        } else if (
          appState === 'background' &&
          !duringPermissionsCheck.current
        ) {
          console.log(
            '📱 Setting screenActiveState to INACTIVE (app went background)',
          );
          setScreenActiveState(ScreenActiveState.INACTIVE);
        }
      },
    );

    return subscription.remove;
  }, []);

  const showError = (errorMessage: string) => {
    Alert.alert('', errorMessage, [{text: 'OK'}], {cancelable: false});
  };

  useEffect(() => {
    // if (finalResults) {
    console.log('🎯 finalResults effect triggered:', {
      finalResults: !!finalResults,
      hasNavigated: hasNavigated.current,
      timestamp: new Date().toISOString(),
    });
    if (finalResults && !hasNavigated.current) {
      console.log('🎯 Processing final results and navigating');
      hasNavigated.current = true;
      // Extract all the values directly from finalResults
      const pulseRateResult = finalResults.getResult(VitalSignTypes.PULSE_RATE);
      const prValue = pulseRateResult?.value || 'N/A';
      const prConfLevel =
        pulseRateResult?.confidence?.level.toString() || 'N/A';

      const meanRRiResult = finalResults.getResult(VitalSignTypes.MEAN_RRI);
      const meanRRIValue = meanRRiResult?.value || 'N/A';
      const meanRRIConfLevel =
        meanRRiResult?.confidence?.level.toString() || 'N/A';

      const bpResult = finalResults.getResult(
        VitalSignTypes.BLOOD_PRESSURE,
      )?.value;
      const BPValue =
        bpResult && typeof bpResult === 'object'
          ? `${bpResult.systolic}/${bpResult.diastolic}`
          : 'N/A';

      const hemoglobinResult = finalResults.getResult(
        VitalSignTypes.HEMOGLOBIN,
      );
      const hemoValue = hemoglobinResult?.value || 'N/A';

      const hemoglobinA1cResult = finalResults.getResult(
        VitalSignTypes.HEMOGLOBIN_A1C,
      );
      const hemoA1CValue = hemoglobinA1cResult?.value || 'N/A';

      const lfhfResult = finalResults.getResult(VitalSignTypes.LFHF);
      const lfHfValue = lfhfResult?.value || 'N/A';

      const oxygenSaturationResult = finalResults.getResult(
        VitalSignTypes.OXYGEN_SATURATION,
      );
      const osValue = oxygenSaturationResult?.value || 'N/A';

      const stressLevelResult = finalResults.getResult(
        VitalSignTypes.STRESS_LEVEL,
      );
      const slValue = stressLevelResult?.value || 'N/A';

      const wellnessIndexResult = finalResults.getResult(
        VitalSignTypes.WELLNESS_INDEX,
      );
      const wiValue = wellnessIndexResult?.value || 'N/A';

      const sdnnResult = finalResults.getResult(VitalSignTypes.SDNN);
      const sdnnValue = sdnnResult?.value || 'N/A';
      const sdnnConfLevel = sdnnResult?.confidence?.level.toString() || 'N/A';

      const respirationRateResult = finalResults.getResult(
        VitalSignTypes.RESPIRATION_RATE,
      );
      const respRateValue = respirationRateResult?.value || 'N/A';
      const respRateConfLevel =
        respirationRateResult?.confidence?.level.toString() || 'N/A';

      const prqResult = finalResults.getResult(VitalSignTypes.PRQ);
      const prqValue = prqResult?.value || 'N/A';
      const prqConfLevel = prqResult?.confidence?.level.toString() || 'N/A';

      const rriResult = finalResults.getResult(VitalSignTypes.RRI);
      const rriValue = rriResult?.value || 'N/A';
      const rriConfLevel = rriResult?.confidence?.level.toString() || 'N/A';

      // Continue with all other results...
      const pnsIndexResult = finalResults.getResult(VitalSignTypes.PNS_INDEX);
      const pnsIndexValue = pnsIndexResult?.value || 'N/A';

      const pnsZoneResult = finalResults.getResult(VitalSignTypes.PNS_ZONE);
      const pnsZoneValue = pnsZoneResult?.value || 'N/A';

      const rmssdResult = finalResults.getResult(VitalSignTypes.RMSSD);
      const rmssdValue = rmssdResult?.value || 'N/A';

      const sd1Result = finalResults.getResult(VitalSignTypes.SD1);
      const sd1Value = sd1Result?.value || 'N/A';

      const sd2Result = finalResults.getResult(VitalSignTypes.SD2);
      const sd2Value = sd2Result?.value || 'N/A';

      const snsIndexResult = finalResults.getResult(VitalSignTypes.SNS_INDEX);
      const snsIndexValue = snsIndexResult?.value || 'N/A';

      const snsZoneResult = finalResults.getResult(VitalSignTypes.SNS_ZONE);
      const snsZoneValue = snsZoneResult?.value || 'N/A';

      const stressIndexResult = finalResults.getResult(
        VitalSignTypes.STRESS_INDEX,
      );
      const stressIndexValue = stressIndexResult?.value || 'N/A';

      const wellnessLevelResult = finalResults.getResult(
        VitalSignTypes.WELLNESS_LEVEL,
      );
      const wellnessLevelValue = wellnessLevelResult?.value || 'N/A';

      // Version 0.5.8 results
      const ascvdRiskResult = finalResults.getResult(VitalSignTypes.ASCVD_RISK);
      const ascvdRiskValue = ascvdRiskResult?.value || 'N/A';

      const heartAgeResult = finalResults.getResult(VitalSignTypes.HEART_AGE);
      const heartAgeValue = heartAgeResult?.value || 'N/A';

      const highBloodPressureRiskResult = finalResults.getResult(
        VitalSignTypes.HIGH_BLOOD_PRESSURE_RISK,
      );
      const highBloodPressureRiskValue =
        highBloodPressureRiskResult?.value || 'N/A';

      const highFastingGlucoseRiskResult = finalResults.getResult(
        VitalSignTypes.HIGH_FASTING_GLUCOSE_RISK,
      );
      const highFastingGlucoseRiskValue =
        highFastingGlucoseRiskResult?.value || 'N/A';

      const highHemoglobinA1cRiskResult = finalResults.getResult(
        VitalSignTypes.HIGH_HEMOGLOBIN_A1C_RISK,
      );
      const highHemoglobinA1cRiskValue =
        highHemoglobinA1cRiskResult?.value || 'N/A';

      const highTotalCholesterolRiskResult = finalResults.getResult(
        VitalSignTypes.HIGH_TOTAL_CHOLESTEROL_RISK,
      );
      const highTotalCholesterolRiskValue =
        highTotalCholesterolRiskResult?.value || 'N/A';

      const lowHemoglobinRiskResult = finalResults.getResult(
        VitalSignTypes.LOW_HEMOGLOBIN_RISK,
      );
      const lowHemoglobinRiskValue = lowHemoglobinRiskResult?.value || 'N/A';

      const normalizedStressIndexResult = finalResults.getResult(
        VitalSignTypes.NORMALIZED_STRESS_INDEX,
      );
      const normalizedStressIndexValue =
        normalizedStressIndexResult?.value || 'N/A';

      // Still update the state variables for any other uses
      setPr(prValue);
      setPulRateConfLevel(prConfLevel);
      setMeanRRI(meanRRIValue);
      setMRriConfLevel(meanRRIConfLevel);
      setBP(BPValue);
      setHemo(hemoValue);
      setHemoA1C(hemoA1CValue);
      setLfHf(lfHfValue);
      setOS(osValue);
      setSL(slValue);
      setWI(wiValue);
      setSdnn(sdnnValue);
      setSdnnConfLevel(sdnnConfLevel);
      setRri(rriValue);
      setRriConfLevel(rriConfLevel);
      setRespRate(respRateValue);
      setRespRateConfLevel(respRateConfLevel);
      setPrq(prqValue);
      setPrqConfLevel(prqConfLevel);
      setPNSIndex(pnsIndexValue);
      setPNSZone(pnsZoneValue);
      setRMSSD(rmssdValue);
      setSD1(sd1Value);
      setSD2(sd2Value);
      setSNSIndex(snsIndexValue);
      setSNSZone(snsZoneValue);
      setStressIndex(stressIndexValue);
      setWellnessLevel(wellnessLevelValue);
      setASCVDRisk(ascvdRiskValue);
      setHeartAge(heartAgeValue);
      setHighBloodPressureRisk(highBloodPressureRiskValue);
      setHighFastingGlucoseRisk(highFastingGlucoseRiskValue);
      setHighHemoglobinA1cRisk(highHemoglobinA1cRiskValue);
      setHighTotalCholesterolRisk(highTotalCholesterolRiskValue);
      setLowHemoglobinRisk(lowHemoglobinRiskValue);
      setnormalizedStressIndex(normalizedStressIndexValue);

      // NOW navigate with the actual values, not the state variables
      (navigation as any).navigate('ScanMeasurementResults', {
        results: {
          pr: prValue,
          PulRateConfLevel: prConfLevel,
          meanRRI: meanRRIValue,
          MRriConfLevel: meanRRIConfLevel,
          BP: BPValue,
          Hemo: hemoValue,
          HemoA1C: hemoA1CValue,
          LfHf: lfHfValue,
          OS: osValue,
          SL: slValue,
          WI: wiValue,
          Sdnn: sdnnValue,
          SdnnConfLevel: sdnnConfLevel,
          Rri: rriValue,
          RriConfLevel: rriConfLevel,
          RespRate: respRateValue,
          RespRateConfLevel: respRateConfLevel,
          Prq: prqValue,
          PrqConfLevel: prqConfLevel,
          PNSIndex: pnsIndexValue,
          PNSZone: pnsZoneValue,
          rMSSD: rmssdValue,
          sD1: sd1Value,
          sD2: sd2Value,
          SNSIndex: snsIndexValue,
          SNSZone: snsZoneValue,
          stressIndex: stressIndexValue,
          WellnessLevel: wellnessLevelValue,
          ASCVDRisk: ascvdRiskValue,
          heartAge: heartAgeValue,
          highBloodPressureRisk: highBloodPressureRiskValue,
          highFastingGlucoseRisk: highFastingGlucoseRiskValue,
          highHemoglobinA1cRisk: highHemoglobinA1cRiskValue,
          highTotalCholesterolRisk: highTotalCholesterolRiskValue,
          lowHemoglobinRisk: lowHemoglobinRiskValue,
          normalizedStressIndex: normalizedStressIndexValue,
        },
        userInfo: {
          userAttributesEmail,
          userGender,
          userAge,
          userWeight,
          userHeight,
          userSmokingStatus,
          activationID,
        },
      });
    }
  }, [finalResults]);

  const saveResultsToBackend = async () => {
    // setModalVisible(false); // Close modal first
    const email = String(userAttributesEmail);
    const actID = String(activationID);
    const pulseRate = String(pr);
    const mRRI = String(meanRRI);

    // Generate timeStamp in ISO 8601 format compatible with JavaScript Date parsing
    const currentDate = new Date();
    const offset = currentDate.getTimezoneOffset() * 60000; // Offset in milliseconds
    const localISOTime = new Date(currentDate.getTime() - offset)
      .toISOString()
      .slice(0, -1); // Removes 'Z'

    // console.log('Local timestamp in ISO format:', localISOTime);

    const BloodPressure = String(BP);
    const Hemoglobin = String(Hemo);
    const HemoglobinA1C = String(HemoA1C);
    const LFandHF = String(LfHf);
    const OxygenSaturation = String(OS);
    const StressLevel = String(SL);
    const WellnessIndex = String(WI);
    const SDNN = String(Sdnn);
    const SDNNCONFLEVEL = String(SdnnConfLevel);
    const RESPIRATIONRATE = String(RespRate);
    const RESPIRATIONRATECONFLEVEL = String(RespRateConfLevel);
    const RRIs = String(Rri);
    const RRICONFLEVEL = String(RriConfLevel);
    const PRQ = String(Prq);
    const PRQCONFLEVEL = String(PrqConfLevel);
    const PULSERATECONFLEVEL = String(PulRateConfLevel);
    const MEANRRICONFLEVEL = String(MRriConfLevel);

    //Added with update version 0.5.7
    const PNSINDEX = String(PNSIndex);
    const PNSZONE = String(PNSZone);
    const RMSSDs = String(rMSSD);
    const SD1s = String(sD1);
    const SD2s = String(sD2);
    const SNSINDEX = String(SNSIndex);
    const SNSZONE = String(SNSZone);
    const STRESSINDEX = String(stressIndex);
    const WELLNESSLEVEL = String(WellnessLevel);

    //Added with update version 0.5.8
    const ASCVDRISK = String(ASCVDRisk);
    const HEARTAGE = String(heartAge);
    const HIGHBLOODPRESSURERISK = String(highBloodPressureRisk);
    const HIGHFASTINGGLUCOSERISK = String(highFastingGlucoseRisk);
    const HIGHHEMOGLOBINEA1CRISK = String(highHemoglobinA1cRisk);
    const HIGHTOTALCHOLESTEROLRISK = String(highTotalCholesterolRisk);
    const LOWHEMOGLOBINRISK = String(lowHemoglobinRisk);
    const NORMALIZEDSTRESSINDEX = String(normalizedStressIndex);

    const filterWithPreservedData = data => {
      const now = new Date();

      // Create a map to track which dates were manually loaded by the user
      const manuallyLoadedDates = {};

      // First pass - identify manually loaded dates from older results
      data.forEach(item => {
        const itemDate = new Date(item.timeStamp);
        const daysDifference = (now - itemDate) / (1000 * 60 * 60 * 24);

        // If the measurement is older than 90 days, mark its date as manually loaded
        if (daysDifference > 365) {
          const dateKey = new Date(itemDate).toLocaleDateString('en-US');
          manuallyLoadedDates[dateKey] = true;
        }
      });

      // Second pass - filter data, keeping recent 90 days AND any dates that were manually loaded
      return data.filter(item => {
        const itemDate = new Date(item.timeStamp);
        const daysDifference = (now - itemDate) / (1000 * 60 * 60 * 24);
        const dateKey = new Date(itemDate).toLocaleDateString('en-US');

        // Keep if within 90 days OR if the date was manually loaded by user
        return (
          !isNaN(itemDate.getTime()) &&
          (daysDifference <= 365 || manuallyLoadedDates[dateKey])
        );
      });
    };

    try {
      // Step 1: Fetch existing data from local storage
      const existingData = await AsyncStorage.getItem('scanResults');
      // console.log('Existing data from AsyncStorage:', existingData);
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

        // Added with update Version 0.5.7
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
      // console.log(newScanResult);

      // Step 3: Merge the new scan result with existing data
      const updatedData = [...parsedData, newScanResult];

      // Step 4: Filter data to keep only the last 90 days if there is existing data

      const filteredData =
        updatedData.length > 0
          ? filterWithPreservedData(updatedData)
          : [newScanResult];

      // console.log('Data to save in AsyncStorage (last 30 days):', filteredData);
      console.log('Data to save in AsyncStorage (last 90 days):');

      // Step 5: Save the filtered data (last 7 days) to AsyncStorage
      await AsyncStorage.setItem('scanResults', JSON.stringify(filteredData));

      // Step 6: Save the new scan result to the backend (ONLY CHANGE here)
      const client = generateClient();
      await client.graphql({
        query: createUserData,
        variables: {input: newScanResult},
        authMode: 'userPool', // Cognito authentication
      });

      terminateSession();
      resetParameters(); // Reset all relevant states

      console.log('Results saved to backend and local storage');
      // setModalVisible(false); // Ensure modal is closed
      // navigation.replace('History');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  useEffect(() => {
    if (
      sessionState === SessionState.STARTING ||
      sessionState === SessionState.PROCESSING
    ) {
      KeepAwake?.activate();
    } else {
      KeepAwake?.deactivate();
    }
  }, [sessionState]);

  useEffect(() => {
    if (warning && !warningMessage) {
      setWarningMessage(`Warning: ${warning.code}`);
      if (warningTimeout.current) clearTimeout(warningTimeout.current);
      warningTimeout.current = setTimeout(() => {
        // Only clear if not scanning
        if (
          sessionState !== SessionState.STARTING &&
          sessionState !== SessionState.PROCESSING
        ) {
          setWarningMessage('');
        }
      }, 5000);
    }
  }, [warning, sessionState]); // Add sessionState dependency

  useEffect(() => {
    if (
      sessionState !== SessionState.STARTING &&
      sessionState !== SessionState.PROCESSING
    ) {
      setWarningMessage('');
    }
  }, [sessionState]);

  useEffect(() => {
    if (error) {
      showError(`Error: ${error.code}`);
    }
  }, [error]);

  // React.useEffect(() => {
  //   if (licenseInfo) {
  //     console.log(
  //       // `License Activation ID: ${licenseInfo.activationInfo.activationId}`,
  //       `License Activation ID:`,
  //     );
  //     const actID = licenseInfo.activationInfo.activationId;
  //     setActivationID(actID);
  //     if (licenseInfo.offlineMeasurements) {
  //       // console.log(`License Offline Measurements:
  //       //             ${licenseInfo.offlineMeasurements.totalMeasurements}/
  //       //             ${licenseInfo.offlineMeasurements.remainingMeasurements}`);
  //       console.log(`License Offline Measurements:`);
  //     }
  //   }
  // }, [licenseInfo]);

  React.useEffect(() => {
    if (licenseInfo && licenseInfo.activationInfo) {
      // console.log(
      //  'License Activation ID:',
      //  licenseInfo.activationInfo.activationId,
      //);

      const actID = licenseInfo.activationInfo.activationId;

      // Only update if the ID actually changed
      if (actID && actID !== activationID) {
        setActivationID(actID);
      }

      if (licenseInfo.offlineMeasurements) {
        console.log('License Offline Measurements:');
      }
    }
  }, [licenseInfo, activationID]);

  useEffect(() => {
    console.log('🚀 Initial state effect: Setting screenActiveState to ACTIVE');
    setScreenActiveState(ScreenActiveState.ACTIVE);
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      // Force re-render on orientation change
      // setScreenActiveState(prev => prev);
    });
    return subscription?.remove;
  }, []);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      'change',
      appState => {
        if (appState === 'active' && !session.current) {
          setScreenActiveState(ScreenActiveState.ACTIVE);
        } else if (
          appState === 'background' &&
          !duringPermissionsCheck.current
        ) {
          terminateSession();
          // setModalVisible(false);
          setScreenActiveState(ScreenActiveState.INACTIVE);
        }
      },
    );
    return () => appStateSubscription.remove();
  }, []);
  // console.log('SafeAreaInsets:', insets); // Log insets for debugging

  // Add this at the start of your return statement
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryColor} />
        <Text style={styles.loadingText}>Creating session, please wait...</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom + 10, 20),
          // paddingTop: Math.max(insets.top, 20),
          paddingTop: 0, // Remove top padding
        },
      ]}>
      <CameraPreview />
      <View style={styles.bottomContainer}>
        {/* Handle ready state separately */}
        {isReadyToStart && <MotivationalMessage />}

        {/* Handle scanning state separately */}
        {(sessionState === SessionState.STARTING ||
          sessionState === SessionState.PROCESSING) && (
          <Text style={styles.progressMessage}>
            {imageValidityMessage ||
              warningMessage ||
              'Scan In Progress, Please Remain Still!'}
          </Text>
        )}

        {(sessionState === SessionState.STARTING ||
          sessionState === SessionState.PROCESSING) && (
          <>
            <View style={styles.thinProgressBarContainer}>
              <Animated.View
                style={[
                  styles.thinProgressBar,
                  {
                    transform: [
                      {
                        scaleX: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </>
        )}

        <ImageValidityView
          onValidityChange={setImageValidityMessage}
          hideVisual={
            sessionState === SessionState.STARTING ||
            sessionState === SessionState.PROCESSING
          }
        />
        <VitalsContainer />
        {/* Only show button when ready or when scan can be stopped */}
        {/* {(isReadyToStart || sessionState === SessionState.PROCESSING) && ( */}
        {isReadyToStart && (
          <StartStopButton
            isEnabled={
              sessionState === SessionState.READY ||
              sessionState === SessionState.PROCESSING
            }
            isStop={
              sessionState === SessionState.STARTING ||
              sessionState === SessionState.PROCESSING
            }
            onClick={handleStartStop}
          />
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  // container: {backgroundColor: 'white', flex: 1},

  // Update/add these styles for the results layout:
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Changed from 'center' to 'flex-start' for vertical alignment
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultLabel: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  resultValueContainer: {
    alignItems: 'flex-end',
  },
  resultValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  unitText: {
    fontSize: 13,
    color: '#666',
    fontWeight: 'normal',
  },
  confidenceText: {
    fontSize: 12, // Fixed value instead of screenWidth * 0.03
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 10, // Changed from 20 to 10 for multiple text blocks
  },
  resultGroupTitle: {
    fontSize: 16, // Fixed value instead of screenWidth * 0.04
    fontWeight: 'bold',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    color: colors.primaryColor,
  },
  bottomContainer: {
    height: isSmallScreen ? '40%' : isTablet ? '30%' : '35%',
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  warningMessage: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Made semi-transparent
    textAlign: 'center',
    width: '100%',
    color: 'white',
    padding: 16,
    marginBottom: 10,
    borderRadius: 8, // Add some rounded corners
  },

  progressContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.primaryColor,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: colors.secondaryColor,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Optional: light overlay background
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: isTablet ? '70%' : '90%',
    maxHeight: isSmallScreen ? '90%' : '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },

  modalHeader: {
    backgroundColor: colors.primaryColor,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22, // Fixed value instead of screenWidth * 0.055
    fontWeight: 'bold',
    color: 'white',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  resultGroup: {
    marginBottom: 20,
    marginTop: 5,
    paddingHorizontal: 16,
  },
  resultLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  valueUnitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  interpretationText: {
    fontSize: 11,
    marginTop: 2,
  },
  resultsScrollView: {
    maxHeight: '80%',
  },
  // Add these new styles
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerMessage: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIconText: {
    color: 'white',
    fontSize: 14, // Fixed value instead of screenWidth * 0.035
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

  infoBold: {
    fontWeight: 'bold',
  },
  infoCloseButton: {
    backgroundColor: colors.primaryColor,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  infoCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  thinProgressBarContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    width: '100%',
    marginBottom: 15, // Add spacing below progress bar
  },
  thinProgressBar: {
    height: '100%',
    backgroundColor: '#015F97',
    transformOrigin: 'left', // Add this for proper scaling
  },
  progressMessage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000',
    width: '100%',
    marginBottom: 8, // Add spacing below message
  },
  readyMessage: {
    fontSize: 18, // Fixed value instead of screenWidth * 0.045
    fontWeight: '600',
    textAlign: 'center',
    color: '#00AA00',
    width: '100%',
    marginBottom: 15,
  },
});

// ADD THIS FUNCTION RIGHT HERE, AFTER StyleSheet.create:
const getDynamicStyles = (
  screenWidth,
  screenHeight,
  isTablet,
  isSmallScreen,
) => ({
  responsiveText: {
    fontSize: getResponsiveFontSize(0.04),
  },
  responsiveContainer: {
    height: isSmallScreen ? '40%' : isTablet ? '30%' : '35%',
    paddingHorizontal: screenWidth * 0.05,
  },
});

export default MeasureScreen;

// // MeasureScreen.js - Truly Clean Version with Complete State Reset

// import React, {
//   useState,
//   useContext,
//   useEffect,
//   useRef,
//   useCallback,
// } from 'react';
// import {
//   Alert,
//   AppState,
//   Platform,
//   StyleSheet,
//   Text,
//   View,
//   Animated,
//   AppStateStatus,
//   Dimensions,
// } from 'react-native';
// import {useSafeAreaInsets} from 'react-native-safe-area-context';
// import {
//   useFocusEffect,
//   useNavigation,
//   useRoute,
// } from '@react-navigation/native';
// import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
// import {
//   Session,
//   SessionState,
//   SessionBuilder,
//   VitalSignTypes,
//   useSessionState,
//   useSessionWarnings,
//   useSessionErrors,
//   useFinalResults,
//   useEnabledVitalSigns,
//   useLicenseInfo,
//   Sex,
//   HealthMonitorException,
// } from 'biosensesignal-react-native-sdk';

// import AsyncStorage from '@react-native-async-storage/async-storage';
// import AuthContext from '../auth/context';
// import {CameraPreview} from '../components/CameraPreview';
// import {ImageValidityView} from '../components/ImageValidityView';
// import {VitalsContainer} from '../components/VitalsContainer';
// import {StartStopButton} from '../components/StartStopButton';
// import colors from '../config/colors';
// import KeepAwake from 'react-native-keep-awake';

// import {generateClient} from 'aws-amplify/api';
// import {createUserData} from '../../src/graphql/mutations';
// import MotivationalMessage from '../components/MotivationalMessage';

// const ScreenActiveState = {
//   ACTIVE: 0,
//   INACTIVE: 1,
// };

// const MEASUREMENT_DURATION = 60;

// const checkCameraPermissions = async (): Promise<boolean> => {
//   try {
//     const permission =
//       Platform.OS === 'ios'
//         ? PERMISSIONS.IOS.CAMERA
//         : PERMISSIONS.ANDROID.CAMERA;
//     return (
//       (await check(permission)) === RESULTS.GRANTED ||
//       (await request(permission)) === RESULTS.GRANTED
//     );
//   } catch (e) {
//     return false;
//   }
// };

// const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
// const isTablet = screenWidth >= 768;
// const isSmallScreen = screenHeight < 700;

// function MeasureScreen() {
//   const route = useRoute();
//   const {user} = useContext(AuthContext);
//   const insets = useSafeAreaInsets();
//   const navigation = useNavigation();

//   // SDK hooks
//   const sessionState = useSessionState();
//   const warning = useSessionWarnings();
//   const error = useSessionErrors();
//   const finalResults = useFinalResults();
//   const enabledVitalSigns = useEnabledVitalSigns();
//   const licenseInfo = useLicenseInfo();

//   // Refs that need complete cleanup
//   const session = useRef<Session | null>(null);
//   const duringPermissionsCheck = useRef(false);
//   const warningTimeout = useRef<NodeJS.Timeout | null>(null);
//   const progress = useRef(new Animated.Value(0)).current;
//   const appStateSubscription = useRef<any>(null);
//   const isComponentMounted = useRef(true);
//   const hasNavigatedToResults = useRef(false);

//   // Minimal state
//   const [screenActiveState, setScreenActiveState] = useState(
//     ScreenActiveState.ACTIVE,
//   );
//   const [warningMessage, setWarningMessage] = useState('');
//   const [imageValidityMessage, setImageValidityMessage] = useState('');
//   const [isReadyToStart, setIsReadyToStart] = useState(false);

//   // User data from route params
//   const licenseKey = route.params?.licenseKey || '';
//   const userGender = route.params?.userGender || 0;
//   const userAge = route.params?.userAge || null;
//   const userWeight = route.params?.userWeight || null;
//   const userHeight = route.params?.userHeight || null;
//   const userSmokingStatus = route.params?.userSmokingStatus || 0;
//   const userAttributesEmail = route.params?.userAttributesEmail || '';

//   const client = generateClient();

//   // COMPLETE CLEANUP FUNCTION - This is the key!
//   const completeCleanup = useCallback(async () => {
//     console.log('🧹 Starting complete cleanup...');

//     // 1. Clear all timeouts
//     if (warningTimeout.current) {
//       clearTimeout(warningTimeout.current);
//       warningTimeout.current = null;
//     }

//     // 2. Stop all animations
//     progress.stopAnimation();
//     progress.setValue(0);

//     // 3. Deactivate keep awake
//     KeepAwake?.deactivate();

//     // 4. Terminate session completely
//     if (session.current) {
//       try {
//         await session.current.terminate();
//       } catch (error) {
//         console.error('Error terminating session:', error);
//       } finally {
//         session.current = null;
//       }
//     }

//     // 5. Clear all state
//     setWarningMessage('');
//     setImageValidityMessage('');
//     setIsReadyToStart(false);

//     // 6. Reset refs
//     duringPermissionsCheck.current = false;
//     hasNavigatedToResults.current = false;

//     // 7. Remove app state subscription if it exists
//     if (appStateSubscription.current) {
//       appStateSubscription.current.remove();
//       appStateSubscription.current = null;
//     }

//     console.log('✅ Complete cleanup finished');
//   }, [progress]);

//   // Session creation with better error handling
//   const createNewSession = useCallback(async () => {
//     if (!isComponentMounted.current) {
//       console.log('Component not mounted, skipping session creation');
//       return;
//     }

//     console.log('🚀 Creating new session...');

//     duringPermissionsCheck.current = true;
//     const permissionsGranted = await checkCameraPermissions();
//     duringPermissionsCheck.current = false;

//     if (!permissionsGranted) {
//       showError('Please approve permissions in the device settings');
//       return;
//     }

//     // Always clean up completely before creating new session
//     await completeCleanup();

//     if (!isComponentMounted.current) {
//       console.log(
//         'Component unmounted during cleanup, aborting session creation',
//       );
//       return;
//     }

//     try {
//       let sexValue;
//       if (userGender === 1) {
//         sexValue = Sex.MALE;
//       } else if (userGender === 2) {
//         sexValue = Sex.FEMALE;
//       } else {
//         sexValue = Sex.MALE;
//       }

//       session.current = await SessionBuilder.faceSession(
//         {licenseKey},
//         {
//           userInformation: {
//             sex: sexValue,
//             age: userAge,
//             weight: userWeight,
//             height: userHeight,
//             smokingStatus: userSmokingStatus,
//           },
//         },
//         {sdkAnalytics: true},
//       );

//       if (session.current && isComponentMounted.current) {
//         console.log('✅ Session created successfully!');
//         setIsReadyToStart(true);
//       }
//     } catch (e) {
//       console.error('❌ Error creating session:', e);
//       const exception = e as HealthMonitorException;
//       if (isComponentMounted.current) {
//         showError(
//           `Error creating session: ${exception?.code || 'Unknown error'}`,
//         );
//       }
//     }
//   }, [
//     licenseKey,
//     userAge,
//     userWeight,
//     userHeight,
//     userGender,
//     userSmokingStatus,
//     completeCleanup,
//   ]);

//   const startProgressBar = useCallback(() => {
//     progress.setValue(0);
//     Animated.timing(progress, {
//       toValue: 1,
//       duration: MEASUREMENT_DURATION * 1000,
//       useNativeDriver: true,
//     }).start();
//   }, [progress]);

//   const handleStartStop = useCallback(async () => {
//     if (!isComponentMounted.current) return;

//     try {
//       if (sessionState === SessionState.READY && session.current) {
//         setIsReadyToStart(false);
//         startProgressBar();
//         await session.current.start(MEASUREMENT_DURATION);
//       } else if (session.current) {
//         await session.current.stop();
//         progress.stopAnimation();
//         progress.setValue(0);
//         setIsReadyToStart(true);
//       }
//     } catch (e) {
//       if (isComponentMounted.current) {
//         showError(`Error in start/stop session: ${e}`);
//       }
//     }
//   }, [sessionState, startProgressBar, progress]);

//   const showError = useCallback((errorMessage: string) => {
//     if (isComponentMounted.current) {
//       Alert.alert('', errorMessage, [{text: 'OK'}], {cancelable: false});
//     }
//   }, []);

//   const getCurrentActivationID = useCallback(() => {
//     return licenseInfo?.activationInfo?.activationId || '';
//   }, [licenseInfo]);

//   const saveResultsToBackend = useCallback(
//     async (results, activationID) => {
//       const currentDate = new Date();
//       const offset = currentDate.getTimezoneOffset() * 60000;
//       const localISOTime = new Date(currentDate.getTime() - offset)
//         .toISOString()
//         .slice(0, -1);

//       const newScanResult = {
//         email: String(userAttributesEmail),
//         activationID: String(activationID),
//         timeStamp: localISOTime,
//         PULSE_RATE: String(results.pr),
//         MEAN_RRI: String(results.meanRRI),
//         BLOOD_PRESSURE: String(results.BP),
//         HEMOGLOBIN: String(results.Hemo),
//         HEMOGLOBIN_A1C: String(results.HemoA1C),
//         LF_HF: String(results.LfHf),
//         OXYGEN_SATURATION: String(results.OS),
//         STRESS_LEVEL: String(results.SL),
//         WELLNESS_INDEX: String(results.WI),
//         SDNN: String(results.Sdnn),
//         SDNN_CONF_LEVEL: String(results.SdnnConfLevel),
//         RESPIRATION_RATE: String(results.RespRate),
//         RESPIRATION_RATE_CONF_LEVEL: String(results.RespRateConfLevel),
//         RRI: String(results.Rri),
//         RRI_CONF_LEVEL: String(results.RriConfLevel),
//         PRQ: String(results.Prq),
//         PRQ_CONF_LEVEL: String(results.PrqConfLevel),
//         PULSE_RATE_CONF_LEVEL: String(results.PulRateConfLevel),
//         MEAN_RRI_CONF_LEVEL: String(results.MRriConfLevel),
//         PNS_INDEX: String(results.PNSIndex),
//         PNS_ZONE: String(results.PNSZone),
//         RMSSD: String(results.rMSSD),
//         SD1: String(results.sD1),
//         SD2: String(results.sD2),
//         SNS_INDEX: String(results.SNSIndex),
//         SNS_ZONE: String(results.SNSZone),
//         STRESS_INDEX: String(results.stressIndex),
//         WELLNESS_LEVEL: String(results.WellnessLevel),
//         ASCVD_RISK: String(results.ASCVDRisk),
//         HEART_AGE: String(results.heartAge),
//         HIGH_BLOOD_PRESSURE_RISK: String(results.highBloodPressureRisk),
//         HIGH_FASTING_GLUCOSE_RISK: String(results.highFastingGlucoseRisk),
//         HIGH_HEMOGLOBIN_A1C_RISK: String(results.highHemoglobinA1cRisk),
//         HIGH_TOTAL_CHOLESTEROL_RISK: String(results.highTotalCholesterolRisk),
//         LOW_HEMOGLOBIN_RISK: String(results.lowHemoglobinRisk),
//         NORMALIZED_STRESS_INDEX: String(results.normalizedStressIndex),
//         userDeviceInfoVersion: String(Platform.Version),
//         userDeviceInfo: Platform.OS,
//       };

//       try {
//         const existingData = await AsyncStorage.getItem('scanResults');
//         const parsedData = existingData ? JSON.parse(existingData) : [];
//         const updatedData = [...parsedData, newScanResult];
//         await AsyncStorage.setItem('scanResults', JSON.stringify(updatedData));

//         await client.graphql({
//           query: createUserData,
//           variables: {input: newScanResult},
//           authMode: 'userPool',
//         });

//         console.log('💾 Results saved to backend and local storage');
//       } catch (error) {
//         console.error('❌ Error saving data:', error);
//       }
//     },
//     [userAttributesEmail, client],
//   );

//   // LIFECYCLE MANAGEMENT with proper cleanup

//   // Main lifecycle effect
//   useEffect(() => {
//     if (screenActiveState === ScreenActiveState.ACTIVE && licenseKey) {
//       createNewSession();
//     } else {
//       completeCleanup();
//     }
//   }, [screenActiveState, licenseKey, createNewSession, completeCleanup]);

//   // Handle application foreground/background events with proper cleanup
//   useEffect(() => {
//     // Remove any existing subscription first
//     if (appStateSubscription.current) {
//       appStateSubscription.current.remove();
//       appStateSubscription.current = null;
//     }

//     appStateSubscription.current = AppState.addEventListener(
//       'change',
//       (appState: AppStateStatus) => {
//         if (!isComponentMounted.current) return;

//         if (appState === 'active' && !session.current) {
//           setScreenActiveState(ScreenActiveState.ACTIVE);
//         } else if (
//           appState === 'background' &&
//           !duringPermissionsCheck.current
//         ) {
//           setScreenActiveState(ScreenActiveState.INACTIVE);
//         }
//       },
//     );

//     return () => {
//       if (appStateSubscription.current) {
//         appStateSubscription.current.remove();
//         appStateSubscription.current = null;
//       }
//     };
//   }, []);

//   // Handle screen navigation events with COMPLETE cleanup
//   useFocusEffect(
//     useCallback(() => {
//       isComponentMounted.current = true;
//       hasNavigatedToResults.current = false;
//       setScreenActiveState(ScreenActiveState.ACTIVE);

//       return () => {
//         isComponentMounted.current = false;
//         completeCleanup();
//         setScreenActiveState(ScreenActiveState.INACTIVE);
//       };
//     }, [completeCleanup]),
//   );

//   // Component unmount cleanup
//   useEffect(() => {
//     return () => {
//       isComponentMounted.current = false;
//       completeCleanup();
//     };
//   }, [completeCleanup]);

//   // Keep screen awake during measurement
//   useEffect(() => {
//     if (!isComponentMounted.current) return;

//     if (
//       sessionState === SessionState.STARTING ||
//       sessionState === SessionState.PROCESSING
//     ) {
//       KeepAwake?.activate();
//     } else {
//       KeepAwake?.deactivate();
//     }
//   }, [sessionState]);

//   // Handle warnings with proper cleanup
//   useEffect(() => {
//     if (!isComponentMounted.current) return;

//     if (!warning || warningMessage) {
//       return;
//     }

//     setWarningMessage(`Warning: ${warning.code}`);

//     if (warningTimeout.current) {
//       clearTimeout(warningTimeout.current);
//       warningTimeout.current = null;
//     }

//     warningTimeout.current = setTimeout(() => {
//       if (isComponentMounted.current) {
//         setWarningMessage('');
//         warningTimeout.current = null;
//       }
//     }, 3000);
//   }, [warning, warningMessage]);

//   // Handle errors
//   useEffect(() => {
//     if (error && isComponentMounted.current) {
//       showError(`Error: ${error.code}`);
//     }
//   }, [error, showError]);

//   // Log license info (NO STATE UPDATES)
//   useEffect(() => {
//     if (licenseInfo) {
//       console.log(
//         `📄 License Activation ID: ${licenseInfo.activationInfo.activationId}`,
//       );
//       if (licenseInfo.offlineMeasurements) {
//         console.log(
//           `📊 License Offline Measurements: ${licenseInfo.offlineMeasurements.totalMeasurements}/${licenseInfo.offlineMeasurements.remainingMeasurements}`,
//         );
//       }
//     }
//   }, [licenseInfo]);

//   // Handle final results with navigation guard
//   useEffect(() => {
//     if (
//       !finalResults ||
//       !isComponentMounted.current ||
//       hasNavigatedToResults.current
//     ) {
//       return;
//     }

//     hasNavigatedToResults.current = true;
//     console.log('🎯 Processing final results...');

//     // Extract all values immediately
//     const pulseRateResult = finalResults.getResult(VitalSignTypes.PULSE_RATE);
//     const prValue = pulseRateResult?.value || 'N/A';
//     const prConfLevel = pulseRateResult?.confidence?.level.toString() || 'N/A';

//     const meanRRiResult = finalResults.getResult(VitalSignTypes.MEAN_RRI);
//     const meanRRIValue = meanRRiResult?.value || 'N/A';
//     const meanRRIConfLevel =
//       meanRRiResult?.confidence?.level.toString() || 'N/A';

//     const bpResult = finalResults.getResult(
//       VitalSignTypes.BLOOD_PRESSURE,
//     )?.value;
//     const BPValue =
//       bpResult && typeof bpResult === 'object'
//         ? `${bpResult.systolic}/${bpResult.diastolic}`
//         : 'N/A';

//     const hemoglobinResult = finalResults.getResult(VitalSignTypes.HEMOGLOBIN);
//     const hemoValue = hemoglobinResult?.value || 'N/A';

//     const hemoglobinA1cResult = finalResults.getResult(
//       VitalSignTypes.HEMOGLOBIN_A1C,
//     );
//     const hemoA1CValue = hemoglobinA1cResult?.value || 'N/A';

//     const lfhfResult = finalResults.getResult(VitalSignTypes.LFHF);
//     const lfHfValue = lfhfResult?.value || 'N/A';

//     const oxygenSaturationResult = finalResults.getResult(
//       VitalSignTypes.OXYGEN_SATURATION,
//     );
//     const osValue = oxygenSaturationResult?.value || 'N/A';

//     const stressLevelResult = finalResults.getResult(
//       VitalSignTypes.STRESS_LEVEL,
//     );
//     const slValue = stressLevelResult?.value || 'N/A';

//     const wellnessIndexResult = finalResults.getResult(
//       VitalSignTypes.WELLNESS_INDEX,
//     );
//     const wiValue = wellnessIndexResult?.value || 'N/A';

//     const sdnnResult = finalResults.getResult(VitalSignTypes.SDNN);
//     const sdnnValue = sdnnResult?.value || 'N/A';
//     const sdnnConfLevel = sdnnResult?.confidence?.level.toString() || 'N/A';

//     const respirationRateResult = finalResults.getResult(
//       VitalSignTypes.RESPIRATION_RATE,
//     );
//     const respRateValue = respirationRateResult?.value || 'N/A';
//     const respRateConfLevel =
//       respirationRateResult?.confidence?.level.toString() || 'N/A';

//     const prqResult = finalResults.getResult(VitalSignTypes.PRQ);
//     const prqValue = prqResult?.value || 'N/A';
//     const prqConfLevel = prqResult?.confidence?.level.toString() || 'N/A';

//     const rriResult = finalResults.getResult(VitalSignTypes.RRI);
//     const rriValue = rriResult?.value || 'N/A';
//     const rriConfLevel = rriResult?.confidence?.level.toString() || 'N/A';

//     // Continue with all other results...
//     const pnsIndexResult = finalResults.getResult(VitalSignTypes.PNS_INDEX);
//     const pnsIndexValue = pnsIndexResult?.value || 'N/A';

//     const pnsZoneResult = finalResults.getResult(VitalSignTypes.PNS_ZONE);
//     const pnsZoneValue = pnsZoneResult?.value || 'N/A';

//     const rmssdResult = finalResults.getResult(VitalSignTypes.RMSSD);
//     const rmssdValue = rmssdResult?.value || 'N/A';

//     const sd1Result = finalResults.getResult(VitalSignTypes.SD1);
//     const sd1Value = sd1Result?.value || 'N/A';

//     const sd2Result = finalResults.getResult(VitalSignTypes.SD2);
//     const sd2Value = sd2Result?.value || 'N/A';

//     const snsIndexResult = finalResults.getResult(VitalSignTypes.SNS_INDEX);
//     const snsIndexValue = snsIndexResult?.value || 'N/A';

//     const snsZoneResult = finalResults.getResult(VitalSignTypes.SNS_ZONE);
//     const snsZoneValue = snsZoneResult?.value || 'N/A';

//     const stressIndexResult = finalResults.getResult(
//       VitalSignTypes.STRESS_INDEX,
//     );
//     const stressIndexValue = stressIndexResult?.value || 'N/A';

//     const wellnessLevelResult = finalResults.getResult(
//       VitalSignTypes.WELLNESS_LEVEL,
//     );
//     const wellnessLevelValue = wellnessLevelResult?.value || 'N/A';

//     // Version 0.5.8 results
//     const ascvdRiskResult = finalResults.getResult(VitalSignTypes.ASCVD_RISK);
//     const ascvdRiskValue = ascvdRiskResult?.value || 'N/A';

//     const heartAgeResult = finalResults.getResult(VitalSignTypes.HEART_AGE);
//     const heartAgeValue = heartAgeResult?.value || 'N/A';

//     const highBloodPressureRiskResult = finalResults.getResult(
//       VitalSignTypes.HIGH_BLOOD_PRESSURE_RISK,
//     );
//     const highBloodPressureRiskValue =
//       highBloodPressureRiskResult?.value || 'N/A';

//     const highFastingGlucoseRiskResult = finalResults.getResult(
//       VitalSignTypes.HIGH_FASTING_GLUCOSE_RISK,
//     );
//     const highFastingGlucoseRiskValue =
//       highFastingGlucoseRiskResult?.value || 'N/A';

//     const highHemoglobinA1cRiskResult = finalResults.getResult(
//       VitalSignTypes.HIGH_HEMOGLOBIN_A1C_RISK,
//     );
//     const highHemoglobinA1cRiskValue =
//       highHemoglobinA1cRiskResult?.value || 'N/A';

//     const highTotalCholesterolRiskResult = finalResults.getResult(
//       VitalSignTypes.HIGH_TOTAL_CHOLESTEROL_RISK,
//     );
//     const highTotalCholesterolRiskValue =
//       highTotalCholesterolRiskResult?.value || 'N/A';

//     const lowHemoglobinRiskResult = finalResults.getResult(
//       VitalSignTypes.LOW_HEMOGLOBIN_RISK,
//     );
//     const lowHemoglobinRiskValue = lowHemoglobinRiskResult?.value || 'N/A';

//     const normalizedStressIndexResult = finalResults.getResult(
//       VitalSignTypes.NORMALIZED_STRESS_INDEX,
//     );
//     const normalizedStressIndexValue =
//       normalizedStressIndexResult?.value || 'N/A';

//     // Get activation ID at save time
//     const currentActivationID = getCurrentActivationID();

//     // Prepare results object
//     const extractedResults = {
//       pr: prValue,
//       PulRateConfLevel: prConfLevel,
//       meanRRI: meanRRIValue,
//       MRriConfLevel: meanRRIConfLevel,
//       BP: BPValue,
//       Hemo: hemoValue,
//       HemoA1C: hemoA1CValue,
//       LfHf: lfHfValue,
//       OS: osValue,
//       SL: slValue,
//       WI: wiValue,
//       Sdnn: sdnnValue,
//       SdnnConfLevel: sdnnConfLevel,
//       Rri: rriValue,
//       RriConfLevel: rriConfLevel,
//       RespRate: respRateValue,
//       RespRateConfLevel: respRateConfLevel,
//       Prq: prqValue,
//       PrqConfLevel: prqConfLevel,
//       PNSIndex: pnsIndexValue,
//       PNSZone: pnsZoneValue,
//       rMSSD: rmssdValue,
//       sD1: sd1Value,
//       sD2: sd2Value,
//       SNSIndex: snsIndexValue,
//       SNSZone: snsZoneValue,
//       stressIndex: stressIndexValue,
//       WellnessLevel: wellnessLevelValue,
//       ASCVDRisk: ascvdRiskValue,
//       heartAge: heartAgeValue,
//       highBloodPressureRisk: highBloodPressureRiskValue,
//       highFastingGlucoseRisk: highFastingGlucoseRiskValue,
//       highHemoglobinA1cRisk: highHemoglobinA1cRiskValue,
//       highTotalCholesterolRisk: highTotalCholesterolRiskValue,
//       lowHemoglobinRisk: lowHemoglobinRiskValue,
//       normalizedStressIndex: normalizedStressIndexValue,
//     };

//     // Save results (fire and forget)
//     saveResultsToBackend(extractedResults, currentActivationID);

//     // Navigate immediately
//     if (isComponentMounted.current) {
//       (navigation as any).navigate('ScanMeasurementResults', {
//         results: extractedResults,
//         userInfo: {
//           userAttributesEmail,
//           userGender,
//           userAge,
//           userWeight,
//           userHeight,
//           userSmokingStatus,
//           activationID: currentActivationID,
//         },
//       });
//     }
//   }, [
//     finalResults,
//     getCurrentActivationID,
//     saveResultsToBackend,
//     navigation,
//     userAttributesEmail,
//     userGender,
//     userAge,
//     userWeight,
//     userHeight,
//     userSmokingStatus,
//   ]);

//   return (
//     <View
//       style={[
//         styles.container,
//         {
//           paddingBottom: Math.max(insets.bottom + 10, 20),
//           paddingTop: 0,
//         },
//       ]}>
//       <CameraPreview />
//       <View style={styles.bottomContainer}>
//         {isReadyToStart && <MotivationalMessage />}

//         {(sessionState === SessionState.STARTING ||
//           sessionState === SessionState.PROCESSING) && (
//           <Text style={styles.progressMessage}>
//             {imageValidityMessage ||
//               warningMessage ||
//               'Scan In Progress, Please Remain Still!'}
//           </Text>
//         )}

//         {(sessionState === SessionState.STARTING ||
//           sessionState === SessionState.PROCESSING) && (
//           <View style={styles.thinProgressBarContainer}>
//             <Animated.View
//               style={[
//                 styles.thinProgressBar,
//                 {
//                   transform: [
//                     {
//                       scaleX: progress.interpolate({
//                         inputRange: [0, 1],
//                         outputRange: [0, 1],
//                       }),
//                     },
//                   ],
//                 },
//               ]}
//             />
//           </View>
//         )}

//         <ImageValidityView
//           onValidityChange={setImageValidityMessage}
//           hideVisual={
//             sessionState === SessionState.STARTING ||
//             sessionState === SessionState.PROCESSING
//           }
//         />
//         <VitalsContainer />

//         {isReadyToStart && (
//           <StartStopButton
//             isEnabled={
//               sessionState === SessionState.READY ||
//               sessionState === SessionState.PROCESSING
//             }
//             isStop={
//               sessionState === SessionState.STARTING ||
//               sessionState === SessionState.PROCESSING
//             }
//             onClick={handleStartStop}
//           />
//         )}

//         {warningMessage && (
//           <Text style={styles.warningMessage}>{warningMessage}</Text>
//         )}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     flexDirection: 'column',
//   },
//   bottomContainer: {
//     height: isSmallScreen ? '40%' : isTablet ? '30%' : '35%',
//     width: '100%',
//     justifyContent: 'flex-start',
//     alignItems: 'center',
//     paddingTop: 10,
//     marginTop: 20,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//   },
//   thinProgressBarContainer: {
//     height: 4,
//     backgroundColor: '#E0E0E0',
//     width: '100%',
//     marginBottom: 15,
//   },
//   thinProgressBar: {
//     height: '100%',
//     backgroundColor: '#015F97',
//     transformOrigin: 'left',
//   },
//   progressMessage: {
//     fontSize: 16,
//     fontWeight: '600',
//     textAlign: 'center',
//     color: '#000',
//     width: '100%',
//     marginBottom: 8,
//   },
//   warningMessage: {
//     position: 'absolute',
//     bottom: 0,
//     backgroundColor: '#000000',
//     textAlign: 'center',
//     width: '100%',
//     color: 'white',
//     padding: 16,
//   },
// });

// export default MeasureScreen;
