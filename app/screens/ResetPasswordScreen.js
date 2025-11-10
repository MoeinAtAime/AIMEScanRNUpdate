//////////Font Increase Limit Fix

// ResetPasswordScreen.js
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {confirmResetPassword, resetPassword} from 'aws-amplify/auth';
import AppButton from '../components/AppButton';
import colors from '../config/colors';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
const CODE_REGEX = /^\d{6}$/;

const ResetPasswordScreen = ({navigation, route}) => {
  const {username} = route.params;

  const [formData, setFormData] = useState({
    confirmationCode: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  useEffect(() => {
    let timer;
    if (resendDisabled && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
      setCountdown(30);
    }
    return () => clearInterval(timer);
  }, [resendDisabled, countdown]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.confirmationCode) {
      newErrors.confirmationCode = 'Confirmation code is required';
    } else if (!CODE_REGEX.test(formData.confirmationCode)) {
      newErrors.confirmationCode = 'Code must be 6 digits';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!PASSWORD_REGEX.test(formData.newPassword)) {
      newErrors.newPassword =
        'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await confirmResetPassword({
        username,
        confirmationCode: formData.confirmationCode,
        newPassword: formData.newPassword,
      });

      Alert.alert(
        'Success',
        'Your password has been reset successfully.',
        [
          {
            text: 'Login',
            onPress: () => navigation.replace('Log in'),
          },
        ],
        {cancelable: false},
      );
    } catch (error) {
      let errorMessage = 'Failed to reset password';
      switch (error.name) {
        case 'CodeMismatchException':
          errorMessage = 'Invalid confirmation code. Please try again.';
          break;
        case 'LimitExceededException':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        case 'ExpiredCodeException':
          errorMessage =
            'Confirmation code has expired. Please request a new code.';
          break;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendDisabled) return;

    setIsLoading(true);
    setResendDisabled(true);

    try {
      const output = await resetPassword({username});
      if (
        output.nextStep?.resetPasswordStep ===
        'CONFIRM_RESET_PASSWORD_WITH_CODE'
      ) {
        Alert.alert(
          'Code Sent',
          'A new confirmation code has been sent to your email.',
          [{text: 'OK'}],
        );
        setCountdown(30);
      }
    } catch (error) {
      let errorMessage = 'Failed to send confirmation code';
      switch (error.name) {
        case 'LimitExceededException':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        case 'UserNotFoundException':
          errorMessage = 'Account not found. Please check your email address.';
          break;
        case 'InvalidParameterException':
          errorMessage = 'Please provide a valid email address.';
          break;
        default:
          errorMessage = error.message || 'An unexpected error occurred.';
      }
      Alert.alert('Error', errorMessage);
      setResendDisabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: null}));
    }
  };

  const renderPasswordRequirements = () => (
    <View style={styles.requirementsContainer}>
      <Text
        style={styles.requirementsTitle}
        allowFontScaling={true}
        maxFontSizeMultiplier={1.1}>
        Password Requirements:
      </Text>
      {[
        {
          text: '• Minimum 8 characters',
          valid: formData.newPassword.length >= 8,
        },
        {
          text: '• At least one uppercase letter',
          valid: /[A-Z]/.test(formData.newPassword),
        },
        {
          text: '• At least one lowercase letter',
          valid: /[a-z]/.test(formData.newPassword),
        },
        {text: '• At least one number', valid: /\d/.test(formData.newPassword)},
        {
          text: '• At least one special character (@$!%*?&#)',
          valid: /[@$!%*?&#]/.test(formData.newPassword),
        },
      ].map((req, idx) => (
        <Text
          key={idx}
          style={[styles.requirementText, req.valid && styles.requirementMet]}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.1}>
          {req.text}
        </Text>
      ))}
    </View>
  );

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
        <View style={styles.formContainer}>
          <Text
            style={styles.title}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.2}>
            Reset Password
          </Text>
          <Text
            style={styles.subtitle}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.1}>
            Enter the confirmation code sent to {username}
          </Text>

          <TextInput
            placeholder="Confirmation Code"
            placeholderTextColor={colors.medium}
            value={formData.confirmationCode}
            onChangeText={text =>
              updateFormData('confirmationCode', text.replace(/[^0-9]/g, ''))
            }
            style={[styles.input, errors.confirmationCode && styles.inputError]}
            keyboardType="number-pad"
            maxLength={6}
            returnKeyType="next"
            onSubmitEditing={() => newPasswordRef.current?.focus()}
            editable={!isLoading}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.2}
          />
          {errors.confirmationCode && (
            <Text
              style={styles.errorText}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.1}>
              {errors.confirmationCode}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleResendCode}
            disabled={resendDisabled}
            style={styles.resendContainer}>
            <Text
              style={[
                styles.resendText,
                resendDisabled && styles.resendDisabled,
              ]}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.1}>
              {resendDisabled
                ? `Resend code in ${countdown}s`
                : 'Resend confirmation code'}
            </Text>
          </TouchableOpacity>

          <TextInput
            ref={newPasswordRef}
            placeholder="New Password"
            placeholderTextColor={colors.medium}
            value={formData.newPassword}
            onChangeText={text => updateFormData('newPassword', text)}
            style={[styles.input, errors.newPassword && styles.inputError]}
            secureTextEntry={!showPassword}
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            editable={!isLoading}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.2}
          />
          {errors.newPassword && (
            <Text
              style={styles.errorText}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.1}>
              {errors.newPassword}
            </Text>
          )}

          {renderPasswordRequirements()}

          <TextInput
            ref={confirmPasswordRef}
            placeholder="Confirm New Password"
            placeholderTextColor={colors.medium}
            value={formData.confirmPassword}
            onChangeText={text => updateFormData('confirmPassword', text)}
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleResetPassword}
            editable={!isLoading}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.2}
          />
          {errors.confirmPassword && (
            <Text
              style={styles.errorText}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.1}>
              {errors.confirmPassword}
            </Text>
          )}

          <TouchableOpacity
            style={styles.showPasswordContainer}
            onPress={() => setShowPassword(!showPassword)}>
            <Text
              style={styles.showPasswordText}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.1}>
              {showPassword ? 'Hide' : 'Show'} Password
            </Text>
          </TouchableOpacity>

          <AppButton
            title={isLoading ? 'Resetting Password…' : 'Reset Password'}
            onPress={handleResetPassword}
            disabled={isLoading}
            size="large"
            customStyle={{minHeight: 56, paddingVertical: 18, marginBottom: 15}}
            customTextStyle={{fontSize: 18}}
          />

          {isLoading && (
            <ActivityIndicator
              size="large"
              color={colors.primaryColor}
              style={styles.loader}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.light},
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 40 : 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingHorizontal: Platform.OS === 'android' ? 5 : 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.dark,
    marginBottom: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.medium,
    textAlign: 'center',
    marginBottom: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.mediumColor,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    fontSize: 16,
    color: colors.dark,
    includeFontPadding: false,
    textAlignVertical: 'center',
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 2,
    shadowColor: colors.danger,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  resendContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingVertical: 5,
    minHeight: 44,
  },
  resendText: {
    color: colors.primaryColor,
    fontSize: 14,
    textDecorationLine: 'underline',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  resendDisabled: {
    color: colors.medium,
    textDecorationLine: 'none',
  },
  requirementsContainer: {
    backgroundColor: colors.light,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.mediumColor,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: colors.medium,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  requirementText: {
    fontSize: 12,
    color: colors.medium,
    marginBottom: 3,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  requirementMet: {
    color: colors.success,
    fontWeight: '500',
  },
  showPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingVertical: 5,
    minHeight: 44,
  },
  showPasswordText: {
    color: colors.primaryColor,
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  resetButton: {
    marginBottom: 15,
    marginTop: Platform.OS === 'android' ? 10 : 5,
  },
  loader: {
    marginVertical: 10,
  },
});

export default ResetPasswordScreen;
