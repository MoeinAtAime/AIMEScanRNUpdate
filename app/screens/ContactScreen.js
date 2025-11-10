///////////////////Font Increase Limit Fix

// ContactScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Linking,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import colors from '../config/colors';

function ContactScreen() {
  const handleEmailPress = () => {
    const deviceInfo = `
      Device Information:
      OS: ${Platform.OS}
      OS Version: ${Platform.Version}
    `;
    const email = `Support@Aimescan.com`;
    const subject = `Contact Support`;
    const body = `
      Hello,

      Please write your message below:

      ${deviceInfo}
    `;
    const emailUrl = `mailto:${email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    Linking.openURL(emailUrl).catch(err =>
      console.error('Failed to open email:', err),
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          style={styles.image}
          source={require('../assets/Aime_Blue_Transparent_72ppi.png')}
          resizeMode="contain"
        />

        <Text
          style={styles.title}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.3}>
          Contact Us
        </Text>

        <Text
          style={styles.subtitle}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.2}>
          We’d love to hear from you. Click to email, and our team will respond
          as soon as possible. (For other helpful information, please check our
          FAQ page.)
        </Text>

        <TouchableOpacity
          style={styles.emailContainer}
          onPress={handleEmailPress}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="link"
          accessibilityLabel="Send email to support">
          <Text
            style={styles.email}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.2}>
            Support@aimescan.com
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 15 : 20,
    paddingHorizontal: Platform.OS === 'android' ? 15 : 20,
    backgroundColor: colors.white,
  },
  image: {
    width: Math.min(200, Platform.select({ios: 200, android: 180})),
    height: Platform.select({ios: 130, android: 115}),
    borderRadius: 25,
    marginBottom: 20,
    marginTop: Platform.OS === 'ios' ? 20 : 15,
    maxWidth: '80%',
  },
  title: {
    fontSize: Platform.select({ios: 24, android: 22}),
    fontWeight: 'bold',
    color: colors.primaryColor,
    marginBottom: Platform.OS === 'ios' ? 20 : 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
    maxWidth: '90%',
  },
  subtitle: {
    fontSize: Platform.select({ios: 16, android: 15}),
    textAlign: 'center',
    color: colors.mediumColor,
    marginBottom: Platform.OS === 'ios' ? 20 : 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: Platform.select({ios: 24, android: 22}),
    maxWidth: '95%',
    paddingHorizontal: 10,
  },
  emailContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  email: {
    fontSize: Platform.select({ios: 18, android: 17}),
    color: colors.primaryColor,
    textDecorationLine: 'underline',
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
});

export default ContactScreen;
