//responsive design
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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {fetchUserAttributes} from 'aws-amplify/auth';
import {useFocusEffect} from '@react-navigation/native';
import MembershipModal from '../components/MembershipModal';
import DeviceInfo from 'react-native-device-info';
import {UserApiService} from '../api/userApi'; // Adjust path to match your file structure

const LandingScreen = ({navigation}) => {
  // State for user status and membership modal
  const [userState, setUserState] = useState({
    isMeasureDisabled: true, // Default to disabled
    isLoading: true,
    error: null,
  });

  const [membershipModalVisible, setMembershipModalVisible] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [appVersion, setAppVersion] = useState('');

  // Fix: Use useRef instead of React.useRef for consistency
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Dynamic responsive styles based on current dimensions
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
    },
    containerText: {
      height: dimensions.height > 700 ? 215 : 180,
      paddingHorizontal: dimensions.width < 375 ? 24 : 48,
    },
  };

  const handleFetchUserAttributes = useCallback(async () => {
    try {
      // const userAttributes = await fetchUserAttributes();
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
    // Only listen to dimension changes on iOS
    if (Platform.OS === 'ios') {
      const subscription = Dimensions.addEventListener('change', ({window}) => {
        setDimensions(window);
      });

      return () => {
        subscription?.remove();
      };
    }
  }, []);

  const handleLetsGoPress = useCallback(() => {
    if (userState.isMeasureDisabled) {
      // Show the membership modal instead of proceeding
      setMembershipModalVisible(true);
    } else {
      // Navigate to PreMeasure screen
      navigation.navigate('PreMeasure');
    }
  }, [userState.isMeasureDisabled, navigation]);

  useEffect(() => {
    const getVersion = async () => {
      const version = DeviceInfo.getVersion();
      setAppVersion(version);
    };
    getVersion();
  }, []);

  return (
    <SafeAreaView
      style={styles.loadingScreen}
      edges={Platform.OS === 'ios' ? ['top', 'bottom'] : ['top']}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.joyfulFamilyStrollSimpleCo} />

        <View style={styles.spacer} />

        <View style={styles.contentContainer}>
          {/* Logo Section */}
          <View
            style={[
              styles.containerLogo,
              styles.containerSpaceBlock,
              responsiveStyles.containerSpaceBlock,
            ]}>
            <Image
              style={[styles.logoIcon, responsiveStyles.logoIcon]}
              resizeMode="cover"
              source={require('../assets/logo-blue.png')}
            />
          </View>

          {/* Text Section */}
          <View
            style={[
              styles.containerText,
              styles.containerSpaceBlock,
              responsiveStyles.containerText,
              responsiveStyles.containerSpaceBlock,
            ]}>
            <Text
              style={[
                styles.yourWellnessIn,
                styles.yourWellnessInFlexBox,
                responsiveStyles.yourWellnessIn,
              ]}>
              A clear view of your health and wellness.
            </Text>
            <Text
              style={[styles.breatheEasyScan, styles.yourWellnessInFlexBox]}>
              Scan in seconds and gain meaningful insights to stay ahead. AIME
              is ready when you are.
            </Text>
          </View>

          {/* Progress Line */}
          <View style={styles.progressLineContainer}>
            <View style={styles.progressLine}>
              <View style={styles.progressLineChild} />
            </View>
          </View>

          {/* Simple Button - Just like History screen */}
          <TouchableOpacity
            style={[
              styles.letsGoButton,
              (userState.isMeasureDisabled || userState.isLoading) &&
                styles.inactiveButton,
            ]}
            onPress={userState.isLoading ? null : handleLetsGoPress}
            disabled={userState.isLoading}
            accessible={true}
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
              allowFontScaling={false}
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
      </ScrollView>

      {/* Add the MembershipModal */}
      <MembershipModal
        visible={membershipModalVisible}
        onClose={() => setMembershipModalVisible(false)}
      />

      <Text
        style={styles.version}
        accessibilityLabel={`Application version ${appVersion}`}>
        Version: {appVersion}
      </Text>
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
    minHeight: '100%',
    justifyContent: 'flex-end',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 22,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 60,
  },
  containerSpaceBlock: {
    paddingVertical: 0,
    paddingHorizontal: 48, // Default padding - overridden by responsive styles
    alignSelf: 'stretch',
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
  logoIcon: {
    width: 121, // Default size - overridden by responsive styles
    height: 80,
  },
  containerLogo: {
    zIndex: 2,
    justifyContent: 'center',
  },
  yourWellnessIn: {
    width: '100%',
    lineHeight: 43,
    fontWeight: '600',
    fontFamily: 'NunitoSans12pt-SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
    fontSize: Platform.OS === 'ios' ? 33 : 37, // Default size - overridden by responsive styles
  },
  breatheEasyScan: {
    fontSize: Platform.OS === 'ios' ? 17 : 18,
    fontFamily: 'NunitoSans12pt-Regular',
    alignSelf: 'stretch',
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  containerText: {
    height: 215, // Default height - overridden by responsive styles
    marginBottom: Platform.OS === 'ios' ? 30 : 20,
    gap: 10,
    zIndex: 3,
    paddingHorizontal: 48, // Default padding - overridden by responsive styles
  },
  progressLineContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
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
  // SIMPLE BUTTON STYLE - Just like History screen
  letsGoButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    width: 172,
    marginBottom: 40,
    zIndex: 5,
    // No responsive styles applied here
  },
  inactiveButton: {
    opacity: 0.5,
  },
  inactiveButtonText: {
    color: 'rgba(1, 96, 151, 0.5)',
  },
  startScan: {
    fontSize: Platform.OS === 'ios' ? 18 : 22, // Reduced from 22 to 20 on iOS
    lineHeight: 33,
    fontWeight: '800',
    fontFamily: 'NunitoSans12pt-ExtraBold',
    textAlign: 'center',
    color: '#016097',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  version: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)', // White with opacity to match your blue theme
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
