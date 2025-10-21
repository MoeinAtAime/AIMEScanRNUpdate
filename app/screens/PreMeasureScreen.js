// PreMeasureScreen.js
import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Platform, // Add this import
  Dimensions, // Add this import
} from 'react-native';
import {fetchUserAttributes} from 'aws-amplify/auth';
import AuthContext from '../auth/context';
// import fetchSDKLicenseKey from '../api/fetchSDKLicenseKey';
import fetchSDKLicenseKey, {getCacheStatus} from '../api/fetchSDKLicenseKey'; // If you want to keep both
import colors from '../config/colors';
import {UserApiService} from '../api/userApi'; // Adjust path to match your file structure

const {width, height} = Dimensions.get('window');
const isSmallScreen = width < 350;
const isShortScreen = height < 700;

function PreMeasureScreen({navigation}) {
  const [isLicenseFetched, setIsLicenseFetched] = useState(false);
  const [isUserAttributesFetched, setIsUserAttributesFetched] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [userGender, setUserGender] = useState(null);
  const [userAge, setUserAge] = useState(null);
  const [userWeight, setUserWeight] = useState(null);
  const [userHeight, setUserHeight] = useState(null);
  const [userSmokingStatus, setUserSmokingStatus] = useState(null);
  const [userAttributesEmail, setUserAttributesEmail] = useState('');
  const [error, setError] = useState(null);
  const {user} = useContext(AuthContext);
  const [timeoutId, setTimeoutId] = useState(null);

  // Load all necessary data when component mounts
  useEffect(() => {
    fetchLicenseKey();
    fetchAndSetUserAttributes();
  }, []);

  // Navigate to MeasureScreen when all data is fetched
  useEffect(() => {
    if (isLicenseFetched && isUserAttributesFetched) {
      navigateToMeasureScreen();
    }
  }, [isLicenseFetched, isUserAttributesFetched]);

  const calculateAge = birthdate => {
    const birthDate = new Date(birthdate);
    const ageDiff = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };
  //   console.log(
  //     `Height conversion: ${height} -> ${adjustedFeet}'${adjustedInches}" -> ${cm}cm`,
  //   );
  //   return cm;
  // };

  const convertHeightDecimalToCm = height => {
    const heightFloat = parseFloat(height);
    if (isNaN(heightFloat)) {
      console.error('Invalid height format:', height);
      return null;
    }

    const feet = Math.floor(heightFloat);
    const decimalPart = heightFloat - feet;

    // Convert decimal part to inches
    // Handle both .09 and .9 as 9 inches, .11 as 11 inches
    const decimalStr = decimalPart.toFixed(2).substring(2); // "09", "90", "11"
    let inches = parseInt(decimalStr, 10); // 9, 90, 11

    // If we got a large number (like 90 from 5.9), assume it's a single digit
    if (inches > 11 && inches % 10 === 0) {
      inches = Math.floor(inches / 10); // 90 becomes 9
    }

    // Handle cases where inches >= 12 (e.g., 5.13 = 5 feet 13 inches = 6 feet 1 inch)
    const adjustedFeet = feet + Math.floor(inches / 12);
    const adjustedInches = inches % 12;

    const totalInches = adjustedFeet * 12 + adjustedInches;
    const cm = Math.round(totalInches * 2.54);

    console.log(
      `Height conversion: ${height} -> ${adjustedFeet}'${adjustedInches}" -> ${cm}cm`,
    );
    return cm;
  };

  const fetchLicenseKey = async () => {
    try {
      // const sdkLicenseKey = await fetchSDKLicenseKey();
      const sdkLicenseKey = await fetchSDKLicenseKey(); // This should work if you exported it as default

      setLicenseKey(sdkLicenseKey || '');
      setIsLicenseFetched(true);
    } catch (error) {
      console.error('Error fetching license key:', error);
      setError(
        'Failed to get license key. Please try again or contact support.',
      );
      setIsLicenseFetched(false);
    }
  };

  const fetchAndSetUserAttributes = async () => {
    try {
      // Pull the latest attributes from your backend
      const userAttributes = await UserApiService.fetchAttributes();

      // Email (not required for measurement, but still useful to store locally)
      const email = userAttributes.email ?? '';
      setUserAttributesEmail(email);

      // Weight: lbs -> kg (rounded)
      const weightInLbs = parseInt(userAttributes['custom:Weight'] ?? '', 10);
      const weightInKg = Number.isFinite(weightInLbs)
        ? Math.round(weightInLbs * 0.453592)
        : null;
      setUserWeight(weightInKg);

      // Age (derived from birthdate, rounded)
      const birthdate = userAttributes.birthdate; // expects YYYY-MM-DD
      const age = birthdate ? calculateAge(birthdate) : null;
      setUserAge(age ? Math.round(age) : null);

      // Gender mapping for SDK: Male=1, Female=2, Unknown=0
      const gender = userAttributes.gender;
      setUserGender(gender === 'Male' ? 1 : gender === 'Female' ? 2 : 0);

      // Height: stored as "F.II" (feet.inches) -> centimeters
      const heightString = userAttributes['custom:Height'] ?? '';
      const heightInCm = heightString
        ? convertHeightDecimalToCm(heightString)
        : null;
      setUserHeight(heightInCm);

      // Smoking status mapping for SDK: Yes=1, No=2, Unknown=0
      const smoke = userAttributes['custom:userSmokingStatus'] ?? '';
      setUserSmokingStatus(smoke === 'Yes' ? 1 : smoke === 'No' ? 2 : 0);

      // Only the fields below are REQUIRED for measurement
      const missingAttributes = {
        weight: !weightInKg,
        age: !age, // proxy for birthdate presence
        height: !heightInCm,
        gender: !(gender === 'Male' || gender === 'Female'),
        smokingStatus: !(smoke === 'Yes' || smoke === 'No'),
      };

      const hasMissingAttributes =
        Object.values(missingAttributes).some(Boolean);

      if (hasMissingAttributes) {
        // Build prefill payload (RAW values as your profile screen expects)
        let prefill = {};
        try {
          // Parse "F.II" to feet & inches strings
          if (heightString && heightString.includes('.')) {
            const [ft, inStr] = heightString.split('.');
            prefill.heightFeet = (ft ?? '').toString();
            prefill.heightInches = ((inStr ?? '') + '').padStart(2, '0');
          }
          prefill.weight = userAttributes['custom:Weight'] || '';
          prefill.gender = gender || '';
          prefill.userSmokingStatus = smoke || '';
          prefill.birthdate = birthdate || '';
        } catch (e) {
          console.warn('Prefill parse error:', e);
        }

        // Detour to profile completion (no email/password)
        navigation.replace('CompleteProfile', {
          prefill,
          from: 'PreMeasure',
        });
        return; // IMPORTANT: stop here so we don't continue to Measure
      }

      // All good – allow the normal flow to Measure
      console.log('Final user attributes for session:', {
        weightInKg,
        age: age ? Math.round(age) : null,
        gender:
          gender === 'Male'
            ? 'Male (1)'
            : gender === 'Female'
            ? 'Female (2)'
            : 'Unknown (0)',
        heightInCm,
        smokingStatus:
          smoke === 'Yes'
            ? 'Smoker (1)'
            : smoke === 'No'
            ? 'Non-smoker (2)'
            : 'Unspecified (0)',
      });

      setIsUserAttributesFetched(true);
    } catch (error) {
      console.error('Error fetching user attributes:', error);
      setError('Failed to fetch user profile. Please try again.');
      setIsUserAttributesFetched(false);
    }
  };

  const navigateToMeasureScreen = () => {
    //Log all attributes before navigation
    console.log('Navigating to MeasureScreen with user attributes:', {
      licenseKey: licenseKey ? 'Valid license key' : 'Missing',
      userGender,
      userAge,
      userWeight,
      userHeight,
      userSmokingStatus,
      // userEmail: userAttributesEmail,
    });

    // If there's an error, add a delay to give users time to read the message
    if (error) {
      const timeoutId = setTimeout(() => {
        navigation.replace('MeasureScreen', {
          licenseKey,
          userGender,
          userAge,
          userWeight,
          userHeight,
          userSmokingStatus,
          userAttributesEmail,
        });
      }, 3000); // 3 seconds delay

      // Store the timeout ID for cleanup
      setTimeoutId(timeoutId);
    } else {
      // No error, navigate immediately
      navigation.replace('MeasureScreen', {
        licenseKey,
        userGender,
        userAge,
        userWeight,
        userHeight,
        userSmokingStatus,
        userAttributesEmail,
      });
    }
  };

  const retryLoading = () => {
    setError(null);
    // Retry failed operations
    if (!isLicenseFetched) {
      fetchLicenseKey();
    }
    if (!isUserAttributesFetched) {
      fetchAndSetUserAttributes();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    };
  }, [timeoutId]);

  // Show loading screen with progress indicators
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/Aime_Blue_Transparent_72ppi.png')} // Update with your actual logo path
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Preparing Measurement</Text>

      {error ? (
        // Error state
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={retryLoading}
            android_ripple={{color: 'rgba(255,255,255,0.3)'}} // Add this
            activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Loading state
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryColor} />
          <Text style={styles.loadingText}>Loading your profile data...</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>License:</Text>
              {isLicenseFetched ? (
                <Text style={styles.progressComplete}>✓</Text>
              ) : (
                <ActivityIndicator size="small" color={colors.primaryColor} />
              )}
            </View>

            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Profile:</Text>
              {isUserAttributesFetched ? (
                <Text style={styles.progressComplete}>✓</Text>
              ) : (
                <ActivityIndicator size="small" color={colors.primaryColor} />
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: Platform.OS === 'android' ? 15 : 20, // Less padding on Android
    paddingVertical: Platform.OS === 'android' ? 20 : 20,
  },
  logo: {
    width: Platform.select({
      ios: isSmallScreen ? 100 : 120,
      android: isSmallScreen ? 90 : 110,
    }),
    height: Platform.select({
      ios: isSmallScreen ? 100 : 120,
      android: isSmallScreen ? 90 : 110,
    }),
    marginBottom: isShortScreen ? 20 : Platform.OS === 'ios' ? 30 : 25,
    maxWidth: '40%',
    maxHeight: '20%',
  },
  title: {
    fontSize: Platform.select({
      ios: isSmallScreen ? 20 : 22,
      android: isSmallScreen ? 18 : 20,
    }),
    fontWeight: 'bold',
    color: colors.primaryColor,
    marginBottom: isShortScreen ? 15 : Platform.OS === 'ios' ? 20 : 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
    maxWidth: '90%',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'android' ? 10 : 20, // Less padding on Android
    maxWidth: '95%', // Add responsive width
  },
  loadingText: {
    marginTop: 15,
    fontSize: Platform.select({
      ios: isSmallScreen ? 14 : 16,
      android: isSmallScreen ? 13 : 15,
    }),
    color: '#555',
    textAlign: 'center',
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
    lineHeight: Platform.select({ios: 22, android: 20}), // Adjust line height
    maxWidth: '95%', // Add responsive width
  },
  progressContainer: {
    marginTop: Platform.OS === 'ios' ? 30 : 25,
    width: '80%',
    maxWidth: 300, // Add maximum width
    minWidth: 250, // Add minimum width
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 15 : 12,
    paddingHorizontal: Platform.OS === 'android' ? 8 : 10,
    paddingVertical: Platform.OS === 'android' ? 10 : 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    shadowColor: '#000', // Add shadow for better visual depth
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 44, // Add minimum height for touch targets
  },
  progressLabel: {
    fontSize: Platform.select({
      ios: isSmallScreen ? 14 : 16,
      android: isSmallScreen ? 13 : 15,
    }),
    color: '#333',
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
  progressComplete: {
    fontSize: Platform.select({
      ios: isSmallScreen ? 16 : 18,
      android: isSmallScreen ? 15 : 17,
    }),
    color: 'green',
    fontWeight: 'bold',
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
  errorContainer: {
    alignItems: 'center',
    padding: Platform.OS === 'android' ? 15 : 20,
    backgroundColor: '#ffeeee',
    borderRadius: 10,
    marginVertical: Platform.OS === 'ios' ? 20 : 18,
    shadowColor: '#000', // Add shadow
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: '95%', // Add responsive width
    minWidth: '80%', // Add minimum width
  },
  errorText: {
    fontSize: Platform.select({
      ios: isSmallScreen ? 14 : 16,
      android: isSmallScreen ? 13 : 15,
    }),
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
    lineHeight: Platform.select({ios: 22, android: 20}), // Adjust line height
  },
  retryButton: {
    backgroundColor: colors.primaryColor,
    paddingVertical: Platform.OS === 'android' ? 8 : 10,
    paddingHorizontal: Platform.OS === 'android' ? 16 : 20,
    borderRadius: 8,
    shadowColor: '#000', // Add shadow
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 44, // Add minimum touch target
    minWidth: 80, // Add minimum width
    justifyContent: 'center', // Add for better alignment
    alignItems: 'center', // Add for better alignment
  },
  retryButtonText: {
    color: '#fff',
    fontSize: Platform.select({
      ios: isSmallScreen ? 14 : 16,
      android: isSmallScreen ? 13 : 15,
    }),
    fontWeight: '600',
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
});

export default PreMeasureScreen;
