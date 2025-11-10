///////////////////Font Increase Limit Fix

// PreMeasureScreen.js
import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import {fetchUserAttributes} from 'aws-amplify/auth';
import AuthContext from '../auth/context';
import fetchSDKLicenseKey, {getCacheStatus} from '../api/fetchSDKLicenseKey';
import colors from '../config/colors';
import {UserApiService} from '../api/userApi';

const {width, height} = Dimensions.get('window');
const isSmallScreen = width < 350;
const isShortScreen = height < 700;

// Unified, reusable scale caps
const titleScaleProps = {allowFontScaling: true, maxFontSizeMultiplier: 1.25};
const labelScaleProps = {allowFontScaling: true, maxFontSizeMultiplier: 1.2};
const bodyScaleProps = {allowFontScaling: true, maxFontSizeMultiplier: 1.15};

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

  const convertHeightDecimalToCm = heightVal => {
    const heightFloat = parseFloat(heightVal);
    if (isNaN(heightFloat)) {
      console.error('Invalid height format:', heightVal);
      return null;
    }
    const feet = Math.floor(heightFloat);
    const decimalPart = heightFloat - feet;
    const decimalStr = decimalPart.toFixed(2).substring(2); // "09", "90", "11"
    let inches = parseInt(decimalStr, 10);
    if (inches > 11 && inches % 10 === 0) inches = Math.floor(inches / 10); // 90 -> 9
    const adjustedFeet = feet + Math.floor(inches / 12);
    const adjustedInches = inches % 12;
    const totalInches = adjustedFeet * 12 + adjustedInches;
    const cm = Math.round(totalInches * 2.54);
    console.log(
      `Height conversion: ${heightVal} -> ${adjustedFeet}'${adjustedInches}" -> ${cm}cm`,
    );
    return cm;
  };

  const fetchLicenseKey = async () => {
    try {
      const sdkLicenseKey = await fetchSDKLicenseKey();
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
      const userAttributes = await UserApiService.fetchAttributes();

      const email = userAttributes.email ?? '';
      setUserAttributesEmail(email);

      // Weight lbs -> kg
      const weightInLbs = parseInt(userAttributes['custom:Weight'] ?? '', 10);
      const weightInKg = Number.isFinite(weightInLbs)
        ? Math.round(weightInLbs * 0.453592)
        : null;
      setUserWeight(weightInKg);

      // Age from birthdate
      const birthdate = userAttributes.birthdate;
      const age = birthdate ? calculateAge(birthdate) : null;
      setUserAge(age ? Math.round(age) : null);

      // Gender mapping
      const gender = userAttributes.gender;
      setUserGender(gender === 'Male' ? 1 : gender === 'Female' ? 2 : 0);

      // Height "F.II" -> cm
      const heightString = userAttributes['custom:Height'] ?? '';
      const heightInCm = heightString
        ? convertHeightDecimalToCm(heightString)
        : null;
      setUserHeight(heightInCm);

      // Smoking status mapping
      const smoke = userAttributes['custom:userSmokingStatus'] ?? '';
      setUserSmokingStatus(smoke === 'Yes' ? 1 : smoke === 'No' ? 2 : 0);

      // Validate required fields
      const missingAttributes = {
        weight: !weightInKg,
        age: !age,
        height: !heightInCm,
        gender: !(gender === 'Male' || gender === 'Female'),
        smokingStatus: !(smoke === 'Yes' || smoke === 'No'),
      };
      const hasMissingAttributes =
        Object.values(missingAttributes).some(Boolean);

      if (hasMissingAttributes) {
        // Prefill payload for CompleteProfile
        let prefill = {};
        try {
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

        navigation.replace('CompleteProfile', {prefill, from: 'PreMeasure'});
        return;
      }

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
    console.log('Navigating to MeasureScreen with user attributes:', {
      licenseKey: licenseKey ? 'Valid license key' : 'Missing',
      userGender,
      userAge,
      userWeight,
      userHeight,
      userSmokingStatus,
    });

    if (error) {
      const id = setTimeout(() => {
        navigation.replace('MeasureScreen', {
          licenseKey,
          userGender,
          userAge,
          userWeight,
          userHeight,
          userSmokingStatus,
          userAttributesEmail,
        });
      }, 3000);
      setTimeoutId(id);
    } else {
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
    if (!isLicenseFetched) fetchLicenseKey();
    if (!isUserAttributesFetched) fetchAndSetUserAttributes();
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

  // UI
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/Aime_Blue_Transparent_72ppi.png')}
        style={styles.logo}
        resizeMode="contain"
        accessible
        accessibilityLabel="AIME logo"
      />

      <Text
        {...titleScaleProps}
        style={styles.title}
        accessibilityRole="header">
        Preparing Measurement
      </Text>

      {error ? (
        <View
          style={styles.errorContainer}
          accessible
          accessibilityRole="alert">
          <Text {...bodyScaleProps} style={styles.errorText}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={retryLoading}
            android_ripple={{color: 'rgba(255,255,255,0.3)'}}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Retry loading data">
            <Text {...labelScaleProps} style={styles.retryButtonText}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryColor} />
          <Text {...bodyScaleProps} style={styles.loadingText}>
            Loading your profile data...
          </Text>

          <View
            style={styles.progressContainer}
            accessible
            accessibilityLabel="Loading progress">
            <View style={styles.progressItem}>
              <Text {...labelScaleProps} style={styles.progressLabel}>
                License:
              </Text>
              {isLicenseFetched ? (
                <Text {...labelScaleProps} style={styles.progressComplete}>
                  ✓
                </Text>
              ) : (
                <ActivityIndicator size="small" color={colors.primaryColor} />
              )}
            </View>

            <View style={styles.progressItem}>
              <Text {...labelScaleProps} style={styles.progressLabel}>
                Profile:
              </Text>
              {isUserAttributesFetched ? (
                <Text {...labelScaleProps} style={styles.progressComplete}>
                  ✓
                </Text>
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
  // Layout
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: Platform.OS === 'android' ? 15 : 20,
    paddingVertical: 20,
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

  // Typography
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
    paddingHorizontal: Platform.OS === 'android' ? 10 : 20,
    maxWidth: '95%',
  },
  loadingText: {
    marginTop: 15,
    fontSize: Platform.select({
      ios: isSmallScreen ? 14 : 16,
      android: isSmallScreen ? 13 : 15,
    }),
    color: '#555',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: Platform.select({ios: 22, android: 20}),
    maxWidth: '95%',
  },

  // Progress rows
  progressContainer: {
    marginTop: Platform.OS === 'ios' ? 30 : 25,
    width: '80%',
    maxWidth: 300,
    minWidth: 250,
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 44,
  },
  progressLabel: {
    fontSize: Platform.select({
      ios: isSmallScreen ? 14 : 16,
      android: isSmallScreen ? 13 : 15,
    }),
    color: '#333',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  progressComplete: {
    fontSize: Platform.select({
      ios: isSmallScreen ? 16 : 18,
      android: isSmallScreen ? 15 : 17,
    }),
    color: 'green',
    fontWeight: 'bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    padding: Platform.OS === 'android' ? 15 : 20,
    backgroundColor: '#ffeeee',
    borderRadius: 10,
    marginVertical: Platform.OS === 'ios' ? 20 : 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: '95%',
    minWidth: '80%',
  },
  errorText: {
    fontSize: Platform.select({
      ios: isSmallScreen ? 14 : 16,
      android: isSmallScreen ? 13 : 15,
    }),
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: Platform.select({ios: 22, android: 20}),
  },

  // Button
  retryButton: {
    backgroundColor: colors.primaryColor,
    paddingVertical: Platform.OS === 'android' ? 8 : 10,
    paddingHorizontal: Platform.OS === 'android' ? 16 : 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 44,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: Platform.select({
      ios: isSmallScreen ? 14 : 16,
      android: isSmallScreen ? 13 : 15,
    }),
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default PreMeasureScreen;
