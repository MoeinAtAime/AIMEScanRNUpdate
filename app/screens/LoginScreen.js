////Font Increase Limit Fix
// LoginScreen.js
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AppButton from '../components/AppButton';
import colors from '../config/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Auth, signIn, resetPassword} from 'aws-amplify/auth'; // adjust your import if different
import * as Keychain from 'react-native-keychain';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STORAGE_KEY = '@login_credentials';
const SUPPORT_EMAIL = 'support@aimescan.com';

const LoginScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({email: '', password: ''});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordRef = useRef(null);

  useEffect(() => {
    loadSavedCredentials();
    return () => {
      setFormData(prev => ({...prev, password: ''}));
    };
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const {email} = JSON.parse(saved);
        const creds = await Keychain.getGenericPassword();
        if (creds) {
          setFormData({email, password: creds.password});
          setRememberMe(true);
        }
      }
    } catch (e) {
      console.error('Error loading credentials:', e);
    }
  };

  const saveCredentials = async () => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({email: formData.email}),
      );
      await Keychain.setGenericPassword(formData.email, formData.password);
    } catch (e) {
      console.error('Error saving credentials:', e);
    }
  };

  const clearSavedCredentials = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await Keychain.resetGenericPassword();
    } catch (e) {
      console.error('Error clearing credentials:', e);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(formData.email))
      newErrors.email = 'Please enter a valid email address';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showFirstLoginInfo = () => {
    Alert.alert(
      'First-time login',
      'If it is your first time logging in, you should have received a temporary password from no-reply@aimescan.com. Please check your email. If you did not receive your temporary password, reach out to support@aimescan.com.',
    );
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Optionally: check if already signed in
      try {
        const existingUser = await Auth.currentAuthenticatedUser();
        if (existingUser) {
          navigation.replace('AppNavigator');
          return;
        }
      } catch (err) {
        // not signed in
      }

      const {isSignedIn, nextStep} = await signIn({
        username: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (isSignedIn) {
        if (rememberMe) await saveCredentials();
        else await clearSavedCredentials();
        navigation.replace('AppNavigator');
        return;
      }

      // handle next steps
      if (nextStep?.signInStep) {
        switch (nextStep.signInStep) {
          case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
            navigation.navigate('NewPassword', {
              username: formData.email.trim().toLowerCase(),
              rememberMe,
            });
            return;
          case 'RESET_PASSWORD':
            navigation.navigate('Reset Password', {username: formData.email});
            return;
          case 'CONFIRM_SIGN_UP':
            navigation.navigate('Confirmation', {username: formData.email});
            return;
          default:
            Alert.alert(
              'Additional verification',
              'Please complete the next step to finish sign-in.',
            );
            return;
        }
      }
    } catch (error) {
      console.log('signIn error →', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        $metadata: error?.$metadata,
      });

      let msg = 'Please check your email and password and try again.';
      if (error?.name === 'NotAuthorizedException') {
        msg = 'Incorrect email or password.';
      } else if (error?.name === 'UserNotConfirmedException') {
        msg =
          'Your account isn’t confirmed yet. Please check your email for the verification code.';
      } else if (error?.name === 'PasswordResetRequiredException') {
        msg =
          'Your password must be reset. Tap “Forgot Password?” to continue.';
      } else if (error?.name === 'AuthUserPoolException') {
        msg = 'Auth is not configured correctly (User Pool missing or wrong).';
      }

      Alert.alert('Login Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!formData.email) {
      setErrors(prev => ({...prev, email: 'Please enter your email'}));
      return;
    }
    try {
      const output = await resetPassword({username: formData.email});
      if (
        output.nextStep?.resetPasswordStep ===
        'CONFIRM_RESET_PASSWORD_WITH_CODE'
      ) {
        navigation.navigate('Reset Password', {username: formData.email});
      }
    } catch (error) {
      Alert.alert(
        'Reset Password Error',
        error.message || 'Failed to initiate password reset',
      );
    }
  };

  const handleRegisterPress = async () => {
    try {
      await Linking.openURL('https://aimescan.com/member/register/');
    } catch {
      Alert.alert(
        'Error',
        'Could not open registration page. Please try again.',
      );
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: null}));
    }
  };

  const containerStyle = {...styles.container, paddingTop: 0};
  const scrollContentStyle = {
    ...styles.scrollContent,
    paddingBottom:
      Platform.OS === 'ios' ? Math.max(insets.bottom + 10, 30) : 40,
  };

  return (
    <View style={containerStyle}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          contentContainerStyle={scrollContentStyle}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Image
              style={styles.logo}
              source={require('../assets/Aime_Blue_Transparent_72ppi.png')}
              resizeMode="contain"
            />
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputWithIcon}>
              <TextInput
                placeholder="Email"
                placeholderTextColor={colors.medium}
                value={formData.email}
                onChangeText={text => updateFormData('email', text.trim())}
                style={[
                  styles.input,
                  styles.inputWithRightPadding,
                  errors.email && styles.inputError,
                ]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!isLoading}
                allowFontScaling={true}
                maxFontSizeMultiplier={1.2}
              />
              <TouchableOpacity
                onPress={showFirstLoginInfo}
                style={styles.inputIconTouch}
                accessibilityRole="button"
                accessibilityLabel="First-time login information"
                disabled={isLoading}>
                <MaterialIcons
                  name="info-outline"
                  size={20}
                  color={colors.medium}
                />
              </TouchableOpacity>
            </View>
            {errors.email && (
              <Text
                style={styles.errorText}
                allowFontScaling={true}
                maxFontSizeMultiplier={1.1}>
                {errors.email}
              </Text>
            )}

            <View
              style={[
                styles.passwordContainer,
                errors.password && styles.inputError,
              ]}>
              <TextInput
                ref={passwordRef}
                placeholder="Password"
                placeholderTextColor={colors.medium}
                value={formData.password}
                onChangeText={text => updateFormData('password', text)}
                style={styles.passwordInput}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!isLoading}
                allowFontScaling={true}
                maxFontSizeMultiplier={1.2}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}>
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={24}
                  color={colors.medium}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text
                style={styles.errorText}
                allowFontScaling={true}
                maxFontSizeMultiplier={1.1}>
                {errors.password}
              </Text>
            )}

            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              disabled={isLoading}>
              <View
                style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
              />
              <Text
                style={styles.rememberMeText}
                allowFontScaling={true}
                maxFontSizeMultiplier={1.1}>
                Remember Me
              </Text>
            </TouchableOpacity>

            <AppButton
              title={isLoading ? 'Signing In…' : 'Log In'}
              onPress={handleLogin}
              disabled={isLoading}
              size="large"
              customStyle={{
                marginBottom: 15,
                minHeight: 56,
                paddingVertical: 18,
              }}
              customTextStyle={{
                fontSize: 18,
              }}
            />

            {isLoading && (
              <ActivityIndicator
                size="large"
                color={colors.primaryColor}
                style={styles.loader}
              />
            )}

            <TouchableOpacity
              onPress={handleResetPassword}
              style={styles.forgotPassword}
              disabled={isLoading}>
              <Text
                style={[styles.link, {fontSize: 14}]}
                allowFontScaling={true}
                maxFontSizeMultiplier={1.1}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRegisterPress}
              style={styles.registerContainer}
              disabled={isLoading}>
              <Text
                style={[styles.registerText, {fontSize: 14}]}
                allowFontScaling={true}
                maxFontSizeMultiplier={1.1}>
                Don’t have an account? <Text style={styles.link}>Register</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.light},
  keyboardAvoidingView: {flex: 1},
  scrollContent: {flexGrow: 1, padding: 20},
  logoContainer: {
    alignItems: 'center',
    marginVertical: Platform.OS === 'ios' ? 40 : 40,
  },
  logo: {
    width: Math.min(Dimensions.get('window').width * 0.8, 300),
    height: Platform.OS === 'ios' ? 190 : 180,
    borderRadius: 25,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingHorizontal: Platform.OS === 'android' ? 5 : 0,
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
  inputError: {borderColor: colors.danger},
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputWithIcon: {position: 'relative'},
  inputWithRightPadding: {paddingRight: 44},
  inputIconTouch: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 6,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.mediumColor,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: colors.dark,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  eyeIcon: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 5,
    marginLeft: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.mediumColor,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primaryColor,
    borderColor: colors.primaryColor,
  },
  rememberMeText: {
    color: colors.medium,
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  loginButton: {marginBottom: 15},
  loader: {marginVertical: 10},
  forgotPassword: {alignItems: 'center', marginVertical: 15},
  link: {
    color: colors.primaryColor,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  registerContainer: {marginTop: 20, alignItems: 'center'},
  registerText: {
    color: colors.medium,
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
});

export default LoginScreen;
