// Import necessary libraries and modules
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Linking,
  Platform,
  TouchableOpacity, // Add this import
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import colors from '../config/colors'; // Centralized color configuration

/**
 * ContactScreen: A screen that provides users with a way to contact support via email.
 */
function ContactScreen() {
  /**
   * handleEmailPress: Opens the user's email app with pre-filled details
   * including support email, subject, and device information.
   */

  const handleEmailPress = () => {
    // Collect basic device information for support purposes
    const deviceInfo = `
      Device Information:
      OS: ${Platform.OS}
      OS Version: ${Platform.Version}
    `;

    const email = `Support@Aimescan.com`; // Support email address
    const subject = `Contact Support`; // Pre-filled email subject
    const body = `
      Hello,
  
      Please write your message below:
  
      
      ${deviceInfo}
    `; // Pre-filled email body with device information

    // Construct the email URL and **encode only the parameters**, not the entire string
    const emailUrl = `mailto:${email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    // Attempt to open the user's email client
    Linking.openURL(emailUrl).catch(err =>
      console.error('Failed to open email:', err),
    );
  };

  return (
    // Main container for the screen layout
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Display the app logo at the top */}
        <Image
          style={styles.image}
          source={require('../assets/Aime_Blue_Transparent_72ppi.png')}
        />

        {/* Title for the screen */}
        <Text style={styles.title}>Contact Us</Text>

        {/* Subtitle with instructions */}
        <Text style={styles.subtitle}>
          We'd love to hear from you. Click to email, and our team will respond
          as soon as possible. (For other helpful information, please check our
          FAQ page.)
        </Text>

        {/* Email link that triggers the email client */}
        <TouchableOpacity
          style={styles.emailContainer}
          onPress={handleEmailPress}
          activeOpacity={0.7}>
          <Text style={styles.email}>Support@aimescan.com</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Define the styles for the ContactScreen components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: Platform.OS === 'android' ? 15 : 20, // Less padding on Android
    backgroundColor: colors.white,
    paddingHorizontal: Platform.OS === 'android' ? 15 : 20, // Ensure horizontal padding
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
    marginBottom: Platform.OS === 'ios' ? 20 : 18, // Less margin on Android
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
    maxWidth: '90%',
  },
  subtitle: {
    fontSize: Platform.select({ios: 16, android: 15}),
    textAlign: 'center',
    color: colors.mediumColor,
    marginBottom: Platform.OS === 'ios' ? 20 : 18, // Less margin on Android
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: Platform.select({ios: 24, android: 22}),
    maxWidth: '95%',
    paddingHorizontal: 10,
  },
  email: {
    fontSize: Platform.select({ios: 18, android: 17}),
    color: colors.primaryColor,
    textDecorationLine: 'underline',
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  emailContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
    minHeight: 44, // Ensure minimum touch target
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

// Export the component for use in other parts of the app
export default ContactScreen;
