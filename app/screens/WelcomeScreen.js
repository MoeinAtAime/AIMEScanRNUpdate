//Font Increase Limit Fix

// WelcomeScreen.js
import React, {useCallback, useState} from 'react';
import {Image, StyleSheet, Text, View, Platform, StatusBar} from 'react-native';
import PropTypes from 'prop-types';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import AppButton from '../components/AppButton';
import colors from '../config/colors';

// Pre-load the image for better performance
const logoImage = require('../assets/Aime_Blue_Transparent_72ppi.png');

function WelcomeScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const [imageError, setImageError] = useState(false);

  const handleLogin = useCallback(() => {
    navigation.navigate('Log in');
  }, [navigation]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const dynamicStyles = {
    container: {
      ...styles.container,
      paddingBottom:
        Platform.OS === 'ios' ? Math.max(insets.bottom + 10, 20) : 20,
    },
    buttonContainer: {
      ...styles.buttonContainer,
      paddingBottom:
        Platform.OS === 'ios' ? Math.max(insets.bottom - 10, 10) : 30,
      marginBottom: Platform.OS === 'ios' ? -20 : -10,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        {!imageError ? (
          <Image
            style={styles.logo}
            source={logoImage}
            resizeMode="contain"
            accessibilityLabel="Company Logo"
            onError={handleImageError}
          />
        ) : (
          <View style={styles.errorContainer}>
            <Text
              style={styles.errorText}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.2}>
              Unable to load logo
            </Text>
          </View>
        )}
        <Text
          style={styles.tagline}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.2}>
          Start Scanning For Your Health
        </Text>
      </View>

      {/* Button Section */}
      <View style={dynamicStyles.buttonContainer}>
        <AppButton
          title="Log in"
          color="primaryColor"
          onPress={handleLogin}
          accessibilityLabel="Login to your account"
          accessibilityHint="Navigate to login screen"
          size="large"
          customStyle={{
            // ensure consistent height even with big fonts
            minHeight: 56,
            paddingVertical: 18,
          }}
          customTextStyle={{
            fontSize: 18,
          }}
        />
        {/* Optionally another button */}
        {/* <AppButton
            title="Activate"
            color="secondaryColor"
            onPress={handleRegister}
            size="large"
          /> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.light,
    padding: 10,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  logo: {
    width: '80%',
    maxWidth: 300,
    aspectRatio: 300 / 190,
    borderRadius: 25,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 20,
    color: colors.black,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  errorContainer: {
    width: '80%',
    aspectRatio: 300 / 190,
    backgroundColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.medium,
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '500',
  },
});

WelcomeScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default WelcomeScreen;
