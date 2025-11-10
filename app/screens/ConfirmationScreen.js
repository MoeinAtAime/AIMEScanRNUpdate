////////////////////////////////Font Increase Limit Fix
// ConfirmationScreen.js
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import {confirmSignUp, resendSignUpCode} from 'aws-amplify/auth';
import AppButton from '../components/AppButton';
import colors from '../config/colors';

const RESEND_COOLDOWN = 30;

const {width} = Dimensions.get('window');
const isSmallScreen = width < 350;

// Unified scale caps
const titleScaleProps = {allowFontScaling: true, maxFontSizeMultiplier: 1.25};
const labelScaleProps = {allowFontScaling: true, maxFontSizeMultiplier: 1.2};
const bodyScaleProps = {allowFontScaling: true, maxFontSizeMultiplier: 1.15};

const ConfirmationScreen = ({navigation, route}) => {
  const {username} = route.params || {};
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleConfirmation = async () => {
    if (!confirmationCode) {
      Alert.alert('Missing Code', 'Please enter the confirmation code.');
      return;
    }
    setLoading(true);
    try {
      const {isSignUpComplete} = await confirmSignUp({
        username: (username || '').toLowerCase(),
        confirmationCode,
      });
      if (isSignUpComplete) {
        Alert.alert(
          'Success',
          'Your account has been verified. Please login.',
          [{text: 'OK', onPress: () => navigation.navigate('Login')}],
        );
      }
    } catch (error) {
      Alert.alert('Verification Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await resendSignUpCode({username: (username || '').toLowerCase()});
      setResendCooldown(RESEND_COOLDOWN);
      Alert.alert(
        'Code Sent',
        'A new verification code has been sent to your email.',
      );
    } catch (error) {
      Alert.alert('Resend Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Image
            style={styles.logo}
            source={require('../assets/Aime_Blue_Transparent_72ppi.png')}
            resizeMode="contain"
            accessible
            accessibilityLabel="AIME logo"
          />
        </View>

        <View style={styles.contentContainer}>
          <Text
            {...titleScaleProps}
            style={styles.title}
            accessibilityRole="header">
            Verify Your Account
          </Text>

          <Text {...labelScaleProps} style={styles.subtitle}>
            We've sent a verification code to{'\n'}
            {!!username && (
              <Text {...labelScaleProps} style={styles.email}>
                {username}
              </Text>
            )}
          </Text>

          <TextInput
            {...bodyScaleProps}
            placeholder="Enter 6-digit code"
            placeholderTextColor={colors.medium}
            value={confirmationCode}
            onChangeText={setConfirmationCode}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
            accessible
            accessibilityLabel="Enter 6 digit verification code"
            returnKeyType="done"
            onSubmitEditing={handleConfirmation}
          />

          {/* Ensure AppButton's internal Text uses allowFontScaling/maxFontSizeMultiplier too */}
          <AppButton
            title={loading ? 'Verifying...' : 'Verify Account'}
            onPress={handleConfirmation}
            disabled={loading || !confirmationCode}
            style={styles.button}
            // textProps={labelScaleProps} // uncomment if your AppButton supports passing text props
          />

          <TouchableOpacity
            onPress={handleResendCode}
            disabled={resendCooldown > 0 || loading}
            style={styles.resendButton}
            accessibilityRole="button"
            accessibilityLabel={
              resendCooldown > 0
                ? `Resend code in ${resendCooldown} seconds`
                : 'Resend verification code'
            }>
            <Text
              {...labelScaleProps}
              style={[
                styles.resendText,
                (resendCooldown > 0 || loading) && styles.resendTextDisabled,
              ]}>
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : 'Resend verification code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to Login">
            <Text {...labelScaleProps} style={styles.backText}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 40 : 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 40 : 30,
    marginBottom: Platform.OS === 'ios' ? 30 : 25,
  },
  logo: {
    width: Math.min(250, Platform.select({ios: 250, android: 230})),
    height: Platform.select({ios: 154, android: 145}),
    maxWidth: '90%',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'android' ? 15 : 20,
  },

  // Typography
  title: {
    fontSize: Platform.select({
      ios: isSmallScreen ? 26 : 28,
      android: isSmallScreen ? 24 : 26,
    }),
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 10,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    maxWidth: '90%',
  },
  subtitle: {
    fontSize: Platform.select({ios: 16, android: 15}),
    color: colors.medium,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: Platform.select({ios: 22, android: 20}),
    includeFontPadding: false,
    textAlignVertical: 'center',
    maxWidth: '95%',
  },
  email: {
    color: colors.primaryColor,
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Input
  input: {
    backgroundColor: colors.white,
    borderColor: colors.mediumColor,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: Platform.select({ios: 18, android: 17}),
    color: colors.dark,
    width: '100%',
    maxWidth: 300,
    textAlign: 'center',
    letterSpacing: 5,
    includeFontPadding: false,
    textAlignVertical: 'center',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Buttons/links
  button: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 20,
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resendButton: {
    padding: 10,
    marginBottom: 15,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    color: colors.primaryColor,
    fontSize: Platform.select({ios: 16, android: 15}),
    textDecorationLine: 'underline',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  resendTextDisabled: {
    color: colors.medium,
    textDecorationLine: 'none',
    opacity: Platform.select({ios: 0.6, android: 0.5}),
  },
  backButton: {
    padding: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: colors.primaryColor,
    fontSize: Platform.select({ios: 16, android: 15}),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default ConfirmationScreen;
