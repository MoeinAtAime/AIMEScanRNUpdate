///////Font Increase Limit Fix

// LandingScreen.js
import * as React from 'react';
import {useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import MembershipModal from '../components/MembershipModal';
import DeviceInfo from 'react-native-device-info';
import {UserApiService} from '../api/userApi';

const LandingScreen = ({navigation}) => {
  const [userState, setUserState] = useState({
    isMeasureDisabled: true,
    isLoading: true,
    error: null,
  });
  const [membershipModalVisible, setMembershipModalVisible] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [appVersion, setAppVersion] = useState('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleFetchUserAttributes = useCallback(async () => {
    try {
      const userAttributes = await UserApiService.fetchAttributes();
      const status = userAttributes['custom:userStatus'];
      if (isMountedRef.current) {
        setUserState(prev => ({
          ...prev,
          isMeasureDisabled: status !== 'Active',
          error: null,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error fetching user attributes:', error);
      if (isMountedRef.current) {
        setUserState(prev => ({
          ...prev,
          isMeasureDisabled: true,
          error: 'Failed to fetch user status. Please try again.',
          isLoading: false,
        }));
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      handleFetchUserAttributes();
    }, [handleFetchUserAttributes]),
  );

  useEffect(() => {
    const getVersion = async () => {
      const version = DeviceInfo.getVersion();
      setAppVersion(version);
    };
    getVersion();
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setDimensions(window);
    });
    return () => {
      subscription?.remove?.();
    };
  }, []);

  const responsiveStyles = {
    containerSpaceBlock: {
      paddingHorizontal: dimensions.width < 375 ? 24 : 48,
    },
    logoIcon: {
      width: dimensions.width < 375 ? 100 : 121,
      height: dimensions.width < 375 ? 66 : 80,
    },
    yourWellnessIn: {
      fontSize:
        Platform.OS === 'ios'
          ? dimensions.width < 375
            ? 28
            : 33
          : dimensions.width < 375
          ? 32
          : 37,
      maxFontSizeMultiplier: 1.2,
    },
    containerText: {
      paddingHorizontal: dimensions.width < 375 ? 24 : 48,
    },
  };

  const handleLetsGoPress = useCallback(() => {
    if (userState.isMeasureDisabled) {
      setMembershipModalVisible(true);
    } else {
      navigation.navigate('PreMeasure');
    }
  }, [userState.isMeasureDisabled, navigation]);

  return (
    <SafeAreaView
      style={styles.loadingScreen}
      edges={Platform.OS === 'ios' ? ['top', 'bottom'] : ['top']}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.joyfulFamilyStrollSimpleCo} />

          <View style={styles.spacer} />

          <View style={styles.contentContainer}>
            <View
              style={[
                styles.containerLogo,
                responsiveStyles.containerSpaceBlock,
              ]}>
              <Image
                style={[styles.logoIcon, responsiveStyles.logoIcon]}
                resizeMode="contain"
                source={require('../assets/logo-blue.png')}
              />
            </View>

            <View
              style={[
                styles.containerText,
                responsiveStyles.containerText,
                responsiveStyles.containerSpaceBlock,
              ]}>
              <Text
                allowFontScaling={true}
                maxFontSizeMultiplier={1.2}
                style={[
                  styles.yourWellnessIn,
                  styles.yourWellnessInFlexBox,
                  responsiveStyles.yourWellnessIn,
                ]}>
                A clear view of your health and wellness.
              </Text>
              <Text
                allowFontScaling={true}
                maxFontSizeMultiplier={1.15}
                style={[styles.breatheEasyScan, styles.yourWellnessInFlexBox]}>
                Scan in seconds and gain meaningful insights to stay ahead. AIME
                is ready when you are.
              </Text>
            </View>

            <View style={styles.progressLineContainer}>
              <View style={styles.progressLine}>
                <View style={styles.progressLineChild} />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.letsGoButton,
                  (userState.isMeasureDisabled || userState.isLoading) &&
                    styles.inactiveButton,
                ]}
                onPress={userState.isLoading ? null : handleLetsGoPress}
                disabled={userState.isLoading}
                accessible
                accessibilityLabel={`Let's Go${
                  userState.isLoading
                    ? ' - Loading...'
                    : userState.isMeasureDisabled
                    ? ' - Subscription required'
                    : ''
                }`}
                accessibilityRole="button"
                activeOpacity={0.8}>
                <Text
                  allowFontScaling={true}
                  maxFontSizeMultiplier={1.2}
                  numberOfLines={1}
                  style={[
                    styles.startScan,
                    (userState.isMeasureDisabled || userState.isLoading) &&
                      styles.inactiveButtonText,
                  ]}>
                  {userState.isLoading ? 'LOADING...' : 'Scan!'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <MembershipModal
          visible={membershipModalVisible}
          onClose={() => setMembershipModalVisible(false)}
        />

        <Text
          allowFontScaling={true}
          maxFontSizeMultiplier={1.1}
          style={styles.version}
          accessibilityLabel={`Application version ${appVersion}`}>
          Version: {appVersion}
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#016097',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 40,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  yourWellnessInFlexBox: {
    textAlign: 'left',
    color: '#fff',
  },
  joyfulFamilyStrollSimpleCo: {
    width: 1123,
    position: 'absolute',
    top: -868,
    left: -376,
    height: 1684,
    zIndex: 0,
  },
  containerLogo: {
    zIndex: 2,
    alignItems: 'flex-start',
    marginLeft: 0,
    marginTop: 0,
  },
  logoIcon: {
    width: 121,
    height: 80,
  },
  yourWellnessIn: {
    width: '100%',
    lineHeight: 43,
    fontWeight: '600',
    fontFamily: 'NunitoSans12pt-SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
    fontSize: Platform.OS === 'ios' ? 33 : 37,
  },
  breatheEasyScan: {
    fontSize: Platform.OS === 'ios' ? 17 : 18,
    fontFamily: 'NunitoSans12pt-Regular',
    alignSelf: 'stretch',
    includeFontPadding: false,
    textAlignVertical: 'top',
    color: '#fff',
    marginVertical: 12,
  },
  containerText: {
    flexShrink: 1,
    gap: 10,
    zIndex: 3,
    paddingHorizontal: 48,
  },
  progressLineContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 30,
    zIndex: 4,
  },
  progressLineChild: {
    borderStyle: 'solid',
    borderColor: '#fff',
    borderTopWidth: 4,
    height: 4,
    alignSelf: 'stretch',
  },
  progressLine: {
    paddingRight: 394,
    height: 4,
    width: 393,
    alignItems: 'center',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  letsGoButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    borderRadius: 4,
    justifyContent: 'center',
    minHeight: 56,
    width: 172,
    // ensure button text stays in one line and button doesn't grow too much
  },
  inactiveButton: {
    opacity: 0.5,
  },
  inactiveButtonText: {
    color: 'rgba(1, 96, 151, 0.5)',
  },
  startScan: {
    fontSize: Platform.OS === 'ios' ? 18 : 22,
    lineHeight: Platform.OS === 'ios' ? 26 : 28,
    fontWeight: '800',
    fontFamily: 'NunitoSans12pt-ExtraBold',
    textAlign: 'center',
    color: '#016097',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  version: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'right',
    padding: 16,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  spacer: {
    flex: 1,
    zIndex: 1,
  },
});

export default LandingScreen;
