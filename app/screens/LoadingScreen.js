import * as React from 'react';
import {useEffect, useRef} from 'react';
import {
  Image,
  StyleSheet,
  View,
  Text,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

const {width, height} = Dimensions.get('window');
const isSmallScreen = width < 350;
const isShortScreen = height < 700;
const isTablet = width > 768;

const LoadingScreen = () => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // You can add this function to get the appropriate image source
  const getLogoSource = () => {
    if (isTablet) {
      return require('../assets/Aime_Gradient_Transparent300.png'); // High res for tablets
    } else if (isSmallScreen) {
      return require('../assets/Aime_Gradient_Transparent300.png'); // Regular res for small screens
    }
    return require('../assets/Aime_Gradient_Transparent300.png'); // Default
  };

  useEffect(() => {
    // Create a smooth entrance animation that takes longer
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: Platform.OS === 'ios' ? 1000 : 1200, // Slightly longer on Android
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: Platform.OS === 'ios' ? 1200 : 1400, // Slightly longer on Android
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <SafeAreaView style={styles.loadingScreen}>
      <View style={styles.view}>
        <View style={[styles.pageContainer, styles.footerBg]}>
          <View style={[styles.body, styles.bodyFlexBox]}>
            <View style={styles.animatedContainer}>
              <Animated.View
                style={[
                  styles.containerLogo,
                  styles.navBottomFlexBox,
                  {
                    opacity: opacityAnim,
                    transform: [{scale: scaleAnim}],
                  },
                ]}>
                <Image
                  style={styles.logoIcon}
                  resizeMode="contain"
                  source={getLogoSource()}
                />
              </Animated.View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#3b82f6', // Add fallback background color
  },
  footerBg: {
    // Subtle gradient-like background using multiple colors
    backgroundColor: '#3b82f6',
    alignSelf: 'stretch',
    minHeight: '100%', // Ensure full coverage
  },
  bodyFlexBox: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    flex: 1, // Add flex for better layout
  },
  navBottomFlexBox: {
    paddingHorizontal: Platform.OS === 'android' ? 20 : 24,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1, // Add flex for better centering
  },
  logoIcon: {
    width: '100%',
    height: undefined,
    aspectRatio: 297 / 198,
    maxWidth: Platform.select({
      ios: isTablet ? 400 : isSmallScreen ? 280 : 350,
      android: isTablet ? 380 : isSmallScreen ? 260 : 330,
    }),
    maxHeight: Platform.select({
      ios: isTablet ? 280 : isSmallScreen ? 200 : 250,
      android: isTablet ? 260 : isSmallScreen ? 180 : 230,
    }),
    minWidth: Platform.select({
      ios: isSmallScreen ? 200 : 250,
      android: isSmallScreen ? 180 : 230,
    }),
  },
  containerLogo: {
    width: Platform.select({
      ios: isTablet ? '70%' : '90%',
      android: isTablet ? '75%' : '85%',
    }),
    maxWidth: Platform.select({
      ios: isTablet ? 500 : 400,
      android: isTablet ? 480 : 380,
    }),
    paddingVertical: 0,
    paddingHorizontal: Platform.OS === 'android' ? 20 : 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Platform.select({
      ios: isShortScreen ? 30 : 40,
      android: isShortScreen ? 25 : 35,
    }),
    paddingHorizontal: Platform.OS === 'android' ? 15 : 20,
  },
  pageContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#3b82f6', // Ensure consistent background
  },
  view: {
    width: '100%',
    flex: 1,
    backgroundColor: '#3b82f6', // Ensure consistent background
  },
});

export default LoadingScreen;
