////////////////////Font Increase Limit Fix

// DisclaimerScreen - Provides important legal information and disclaimers
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import colors from '../config/colors';

const {width} = Dimensions.get('window');
const isSmallScreen = width < 350;

// Reusable text props to cap system font scaling
const titleScaleProps = {allowFontScaling: true, maxFontSizeMultiplier: 1.25};
const subtitleScaleProps = {allowFontScaling: true, maxFontSizeMultiplier: 1.2};
const contentScaleProps = {allowFontScaling: true, maxFontSizeMultiplier: 1.15};

function DisclaimerScreen() {
  const handleAIMePress = () => {
    Alert.alert(
      'AIME Says',
      'A gift from Alex, Chuck, Moein, and Charles.',
      [{text: 'OK'}],
      {cancelable: true},
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}>
      {/* App Logo at the Top */}
      <Image
        style={styles.logo}
        source={require('../assets/Aime_Blue_Transparent_72ppi.png')}
        accessible
        accessibilityLabel="AIME logo"
      />

      <Text
        {...titleScaleProps}
        style={styles.title}
        accessibilityRole="header">
        Disclosure
      </Text>

      <Text
        {...subtitleScaleProps}
        style={styles.subtitle}
        accessibilityRole="header">
        1. Medical Use Case
      </Text>
      <Text {...contentScaleProps} style={styles.content}>
        This app is intended to support general wellness and is not a substitute
        for professional medical advice, diagnosis, or treatment. Always consult
        with a qualified healthcare provider (Doctor) before making any medical
        decisions or starting any health-related program based on information
        provided by this app.
      </Text>

      <Text
        {...subtitleScaleProps}
        style={styles.subtitle}
        accessibilityRole="header">
        2. General Information
      </Text>
      <Text {...contentScaleProps} style={styles.content}>
        AIME is an advanced artificial intelligence application that utilizes
        rPPG face-scanning technology to estimate vital signs based on an
        extensive data set. Vital signs are objective measurements of the
        essential physiological functions of a living organism. These
        measurements are "vital" because their assessment is the critical first
        step in any clinical evaluation.
      </Text>

      <Text
        {...subtitleScaleProps}
        style={styles.subtitle}
        accessibilityRole="header">
        3. Accuracy and Limitations
      </Text>
      <Text {...contentScaleProps} style={styles.content}>
        While AIME employs state-of-the-art AI models and a vast dataset to
        estimate vital signs, it is essential to acknowledge that these readings
        are estimates and should not be used as a substitute for professional
        medical evaluation. Every effort is made to ensure the accuracy,
        relevance, and up-to-date nature of the information contained in the
        application's results. However, the results provided by AIME are subject
        to variability due to factors such as user movement, lighting
        conditions, device camera quality, and individual physiological
        differences. AIME should not be relied upon as a diagnostic tool or a
        replacement for medical advice, treatment, or professional healthcare
        assessment.
      </Text>

      <Text
        {...subtitleScaleProps}
        style={styles.subtitle}
        accessibilityRole="header">
        4. No Medical Advice
      </Text>
      <Text {...contentScaleProps} style={styles.content}>
        The information provided by AIME is for informational and general
        wellness purposes only. The application does not offer medical
        diagnoses, treatments, or recommendations. Users should not interpret
        the results as definitive medical findings or use them as a basis for
        making critical health decisions. Your health concerns should be
        addressed by consulting a qualified healthcare professional.
      </Text>

      <Text
        {...subtitleScaleProps}
        style={styles.subtitle}
        accessibilityRole="header">
        5. User Responsibility
      </Text>
      <Text {...contentScaleProps} style={styles.content}>
        By using AIME, the user acknowledges and agrees that: 1. The application
        is intended solely for informational and wellness purposes and is not a
        medical device. 2. The results provided by AIME are estimations and
        should not replace clinical evaluations conducted by licensed medical
        professionals. 3. The user assumes full responsibility for any actions
        taken based on the information provided by AIME. 4. AIME and its
        developers, affiliates, partners, and service providers are not liable
        for any inaccuracies, misinterpretations, or adverse outcomes resulting
        from the application's use.
      </Text>

      <Text
        {...subtitleScaleProps}
        style={styles.subtitle}
        accessibilityRole="header">
        6. Data Privacy and Security
      </Text>
      <Text {...contentScaleProps} style={styles.content}>
        AIME prioritizes user data privacy and security. Any biometric data
        collected through its face-scanning technology is processed in
        accordance with applicable data protection regulations. No personally
        identifiable health information is shared with third parties without
        user consent. Users are encouraged to review AIME's Privacy Policy for
        further details on data collection, storage, and protection measures.
      </Text>

      <Text
        {...subtitleScaleProps}
        style={styles.subtitle}
        accessibilityRole="header">
        7. Updates and Modifications
      </Text>
      <Text {...contentScaleProps} style={styles.content}>
        The developers of AIME continuously work to enhance the application's
        accuracy and functionality. As AI technology and medical understanding
        evolve, AIME may undergo updates, modifications, or enhancements. Users
        are encouraged to update the application to benefit from the latest
        improvements. The developers reserve the right to modify or discontinue
        the application without prior notice.
      </Text>

      <Text
        {...subtitleScaleProps}
        style={styles.subtitle}
        accessibilityRole="header">
        8. Agreement to Terms
      </Text>
      <Text {...contentScaleProps} style={styles.content}>
        Using AIME, the user acknowledges that they have read and understood
        this Disclosure and agree to its terms. Users who do not accept these
        terms should refrain from using the application. Users are encouraged to
        contact the AIME support team with questions or concerns.
      </Text>

      {/* Optional: fun easter-egg tap target */}
      {/* <TouchableOpacity
        onPress={handleAIMePress}
        style={styles.hyperlinkContainer}
        accessibilityRole="button"
        accessibilityLabel="AIME Says">
        <Text
          {...contentScaleProps}
          style={[
            styles.content,
            styles.hyperlink,
            {color: colors.primaryColor},
          ]}>
          Tap here for a note from AIME
        </Text>
      </TouchableOpacity> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Platform.OS === 'android' ? 15 : 20,
    backgroundColor: colors.white,
  },
  contentContainer: {
    padding: Platform.OS === 'android' ? 15 : 20,
    paddingBottom: Platform.OS === 'android' ? 80 : 70,
  },
  logo: {
    width: Math.min(200, Platform.select({ios: 200, android: 180})),
    height: Platform.select({ios: 130, android: 115}),
    borderRadius: 25,
    alignSelf: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 18,
    maxWidth: '80%',
  },
  title: {
    fontSize: Platform.select({
      ios: isSmallScreen ? 22 : 24,
      android: isSmallScreen ? 20 : 22,
    }),
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.primaryColor,
    marginBottom: Platform.OS === 'ios' ? 20 : 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
    maxWidth: '95%',
    alignSelf: 'center',
    paddingHorizontal: 10,
  },
  subtitle: {
    fontSize: Platform.select({ios: 18, android: 17}),
    fontWeight: '600',
    color: colors.secondaryColor,
    marginTop: Platform.OS === 'ios' ? 20 : 18,
    marginBottom: Platform.OS === 'ios' ? 10 : 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: Platform.select({ios: 24, android: 22}),
    paddingHorizontal: 5,
  },
  content: {
    fontSize: Platform.select({ios: 16, android: 15}),
    lineHeight: Platform.select({ios: 24, android: 22}),
    color: colors.dark,
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginBottom: Platform.OS === 'ios' ? 0 : 2,
    paddingHorizontal: 2,
  },
  hyperlink: {
    textDecorationLine: 'underline',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  hyperlinkContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DisclaimerScreen;
