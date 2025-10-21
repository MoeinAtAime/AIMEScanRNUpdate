/// RegisterScreen.js
import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Button,
} from 'react-native';
///////////////////////////////////////
import {TouchableWithoutFeedback, Keyboard} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import RadioButtonGroup from '../components/RadioButtonGroup';
import colors from '../config/colors';
import {Amplify} from 'aws-amplify';
import {signUp, confirmSignUp, resendSignUpCode} from 'aws-amplify/auth';
import AppButton from '../components/AppButton';
import awsconfig from '../../src/aws-exports';
// import MaterialCommunityIcons from '@react-native-vector-icons/material-icons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

Amplify.configure(awsconfig);

const WEIGHT_RANGE = {
  lbs: {min: 90, max: 440}, // 40-200 kg in pounds
  kg: {min: 40, max: 200},
};
const HEIGHT_RANGE = {
  cm: {min: 130, max: 230},
  feet: {min: 4, max: 7}, // Approximate equivalent in feet
};
const AGE_RANGE = {min: 18, max: 110};
const RESEND_COOLDOWN = 30; // Cooldown period in seconds

const feetInchesToCm = (feet, inches) => {
  return (feet * 12 + parseInt(inches)) * 2.54;
};

const lbsToKg = lbs => {
  return lbs * 0.453592;
};

const RegisterScreen = ({navigation}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userDisplayName: '',
    birthdate: new Date(),
    gender: '',
    weight: '150',
    heightFeet: '6',
    heightInches: '01',
    userSmokingStatus: '',
    confirmationCode: '',

    phone_number: '', // Add this line
  });

  const [showPassword, setShowPassword] = useState(false);

  const [uiState, setUiState] = useState({
    currentStep: 1, // Start at step 1
    isConfirmationStep: false,
    showDatePicker: false,
    isTermsChecked: false,
    isAgeGenderAcknowledged: false,
    loading: false,
    resendCooldown: 0,
    showEmailConfirmation: false,
  });

  const togglePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  const getFullHeight = () => {
    const feet = parseInt(formData.heightFeet) || 0;
    const inches = formData.heightInches || '00'; // Keep as string to preserve leading zero
    return `${feet}.${inches}`; // Simple concatenation: "5.01", "6.11"
  };

  const scrollViewRef = useRef();

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  }, []);

  // Add resend cooldown timer
  React.useEffect(() => {
    let timer;
    if (uiState.resendCooldown > 0) {
      timer = setInterval(() => {
        setUiState(prev => ({
          ...prev,
          resendCooldown: prev.resendCooldown - 1,
        }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [uiState.resendCooldown]);

  ///////////////////////////
  // Add these functions before validateStep1
  const validatePhoneNumber = phone => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    // Check if it's a valid US phone number (10 digits)
    if (cleaned.length === 10) {
      return true;
    }

    // Check if it's a valid international number with country code
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return true;
    }

    return false;
  };

  const formatPhoneNumber = value => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');

    // Apply US phone number formatting (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6,
        10,
      )}`;
    }
  };
  //////////////////////////

  // const validateStep1 = () => {
  //   if (!uiState.isTermsChecked) {
  //     Alert.alert(
  //       'Terms Agreement',
  //       'Please agree to the terms of use and policy.',
  //     );
  //     return false;
  //   }

  //   if (!formData.userDisplayName.trim()) {
  //     Alert.alert('Missing Information', 'Please enter a display name.');
  //     return false;
  //   }

  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   if (!emailRegex.test(formData.email)) {
  //     Alert.alert('Invalid Email', 'Please enter a valid email address.');
  //     return false;
  //   }

  //   const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?=.{8,})/;
  //   if (!passwordRegex.test(formData.password)) {
  //     Alert.alert(
  //       'Password Requirements',
  //       'Password must include:\n- At least 8 characters\n- One uppercase letter\n- One lowercase letter\n- One special character',
  //     );
  //     return false;
  //   }

  //   return true;
  // };

  const validateStep1 = () => {
    if (!uiState.isTermsChecked) {
      Alert.alert(
        'Terms Agreement',
        'Please agree to the terms of use and policy.',
      );
      return false;
    }

    if (!formData.userDisplayName.trim()) {
      Alert.alert('Missing Information', 'Please enter a display name.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    // ADD THESE PHONE VALIDATION LINES
    if (!formData.phone_number.trim()) {
      Alert.alert('Missing Information', 'Please enter a phone number.');
      return false;
    }

    if (!validatePhoneNumber(formData.phone_number)) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid phone number (10 digits for US numbers).',
      );
      return false;
    }
    // END OF PHONE VALIDATION

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?=.{8,})/;
    if (!passwordRegex.test(formData.password)) {
      Alert.alert(
        'Password Requirements',
        'Password must include:\n- At least 8 characters\n- One uppercase letter\n- One lowercase letter\n- One special character',
      );
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.gender) {
      Alert.alert('Missing Information', 'Please select your gender.');
      return false;
    }

    // Add age validation
    const today = new Date();
    const birthDate = new Date(formData.birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < AGE_RANGE.min || age > AGE_RANGE.max) {
      Alert.alert(
        'Invalid Age',
        `You must be between ${AGE_RANGE.min} and ${AGE_RANGE.max} years old to register.`,
      );
      return false;
    }

    if (!uiState.isAgeGenderAcknowledged) {
      Alert.alert(
        'Missing Acknowledgment',
        'Please acknowledge that age and gender cannot be changed after registration.',
      );
      return false;
    }

    return true;
  };

  const validateStep3 = () => {
    // Weight validation (lbs but checking kg range)
    const weightLbs = parseInt(formData.weight);
    if (
      isNaN(weightLbs) ||
      weightLbs < WEIGHT_RANGE.lbs.min ||
      weightLbs > WEIGHT_RANGE.lbs.max
    ) {
      Alert.alert(
        'Invalid Weight',
        `Please enter a weight between ${WEIGHT_RANGE.lbs.min} and ${WEIGHT_RANGE.lbs.max} lbs (${WEIGHT_RANGE.kg.min}-${WEIGHT_RANGE.kg.max} kg)`,
      );
      return false;
    }

    // Height validation
    const feet = parseInt(formData.heightFeet);
    const inches = parseInt(formData.heightInches);

    if (isNaN(feet) || feet < 4 || feet > 7) {
      Alert.alert(
        'Invalid Height (feet)',
        'Please enter a valid height in feet (4-7)',
      );
      return false;
    }

    if (
      isNaN(inches) ||
      inches < 0 ||
      inches > 11 ||
      (formData.heightInches.length !== 2 && formData.heightInches !== '')
    ) {
      Alert.alert(
        'Invalid Height (inches)',
        'Please enter inches as 2 digits (00-11)',
      );
      return false;
    }

    // Convert height to cm and validate
    const heightCm = feetInchesToCm(feet, inches);
    if (heightCm < HEIGHT_RANGE.cm.min || heightCm > HEIGHT_RANGE.cm.max) {
      Alert.alert(
        'Invalid Height',
        `Your height must be between ${HEIGHT_RANGE.cm.min} and ${HEIGHT_RANGE.cm.max} cm`,
      );
      return false;
    }

    if (!formData.userSmokingStatus) {
      Alert.alert(
        'Missing Information',
        'Please indicate your smoking status.',
      );
      return false;
    }

    return true;
  };

  const NarrowButton = ({
    title,
    onPress,
    color = 'primaryColor',
    disabled,
    loading,
  }) => {
    return (
      <TouchableOpacity
        style={[
          styles.narrowButton,
          {backgroundColor: colors[color] || colors.primaryColor},
          disabled && styles.disabledButton,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}>
        <Text style={styles.narrowButtonText}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const handleNextStep = () => {
    if (uiState.currentStep === 1) {
      if (!validateStep1()) return;

      // Show email confirmation alert
      Alert.alert(
        'Email Confirmation',
        'Please confirm that you are using the same email you registered with on aimescan.com',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: () => {
              setUiState(prev => ({...prev, currentStep: 2}));
              // Scroll to top when going to step 2
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({x: 0, y: 0, animated: true});
              }
            },
          },
        ],
        {cancelable: false},
      );
    } else if (uiState.currentStep === 2) {
      if (!validateStep2()) return;
      setUiState(prev => ({...prev, currentStep: 3}));

      // Scroll to top when changing steps
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({x: 0, y: 0, animated: true});
      }
    }
  };

  const handleEmailConfirmationYes = () => {
    setUiState(prev => ({
      ...prev,
      showEmailConfirmation: false,
      currentStep: 2,
    }));

    // Scroll to top when going to step 2
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({x: 0, y: 0, animated: true});
    }
  };

  const handleEmailConfirmationNo = () => {
    setUiState(prev => ({...prev, showEmailConfirmation: false}));
  };

  const handleBackStep = () => {
    if (uiState.currentStep > 1) {
      setUiState(prev => ({...prev, currentStep: prev.currentStep - 1}));
    }
  };

  const handleRegister = async () => {
    if (!validateStep3()) return;

    const lowercaseEmail = formData.email.toLowerCase();

    setUiState(prev => ({...prev, loading: true}));
    try {
      // const signUpResponse = await signUp({
      //   username: lowercaseEmail,
      //   password: formData.password,
      //   options: {
      //     userAttributes: {
      //       email: lowercaseEmail,
      //       'custom:userDisplayName': formData.userDisplayName,
      //       birthdate: formData.birthdate.toISOString().split('T')[0],
      //       gender: formData.gender,
      //       'custom:Weight': formData.weight,
      //       'custom:Height': getFullHeight(),
      //       'custom:userSmokingStatus': formData.userSmokingStatus,
      //     },
      //     autoSignIn: false,
      //   },
      // });

      // ADD THIS LINE BEFORE signUp
      const cleanedPhone = formData.phone_number.replace(/\D/g, '');

      const signUpResponse = await signUp({
        username: lowercaseEmail,
        password: formData.password,
        options: {
          userAttributes: {
            email: lowercaseEmail,
            phone_number: `+1${cleanedPhone}`, // ADD THIS LINE
            'custom:userDisplayName': formData.userDisplayName,
            birthdate: formData.birthdate.toISOString().split('T')[0],
            gender: formData.gender,
            'custom:Weight': formData.weight,
            'custom:Height': getFullHeight(),
            'custom:userSmokingStatus': formData.userSmokingStatus,
          },
          autoSignIn: false,
        },
      });

      // Navigate to confirmation screen instead of changing state
      navigation.navigate('Confirmation', {
        username: lowercaseEmail,
      });
    } catch (error) {
      setUiState(prev => ({...prev, loading: false}));
      if (error.name === 'UsernameExistsException') {
        Alert.alert(
          'Account Exists',
          'This email is already registered. Please login or use a different email.',
        );
      } else {
        Alert.alert('Registration Error', error.message);
      }
    }
  };
  const handleConfirmation = async () => {
    if (!formData.confirmationCode) {
      Alert.alert('Missing Code', 'Please enter the confirmation code.');
      return;
    }

    // Set loading to true at the beginning
    setUiState(prev => ({...prev, loading: true}));

    try {
      const {isSignUpComplete} = await confirmSignUp({
        username: formData.email.toLowerCase(), // Convert to lowercase here too
        confirmationCode: formData.confirmationCode,
      });

      // Set loading to false after completion
      setUiState(prev => ({...prev, loading: false}));

      if (isSignUpComplete) {
        Alert.alert(
          'Success',
          'Your account has been verified. Please login.',
          [{text: 'OK', onPress: () => navigation.navigate('Login')}],
        );
      }
    } catch (error) {
      // Make sure to set loading to false in case of error
      setUiState(prev => ({...prev, loading: false}));
      Alert.alert('Verification Error', error.message);
    }
  };

  const handleResendCode = async () => {
    if (uiState.resendCooldown > 0) return;

    setUiState(prev => ({...prev, loading: true}));
    try {
      await resendSignUpCode({
        username: formData.email.toLowerCase(), // Convert to lowercase here too
      });

      setUiState(prev => ({
        ...prev,
        loading: false,
        resendCooldown: RESEND_COOLDOWN,
      }));

      Alert.alert(
        'Code Sent',
        'A new verification code has been sent to your email.',
      );
    } catch (error) {
      setUiState(prev => ({...prev, loading: false}));
      Alert.alert('Resend Error', error.message);
    }
  };

  const renderStep1 = () => (
    <>
      <TextInput
        placeholder="Display Name"
        placeholderTextColor={colors.medium}
        value={formData.userDisplayName}
        onChangeText={value => handleInputChange('userDisplayName', value)}
        style={styles.input}
        autoCapitalize="words"
      />

      <TextInput
        placeholder="Email"
        placeholderTextColor={colors.medium}
        value={formData.email}
        onChangeText={value => handleInputChange('email', value)}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={styles.starNote}>
        * Use the same email as you used to register on aimescan.com
      </Text>

      {/* ADD THIS PHONE NUMBER INPUT */}
      <TextInput
        placeholder="Phone Number"
        placeholderTextColor={colors.medium}
        value={formData.phone_number}
        onChangeText={value => {
          // Format the phone number as user types
          const formatted = formatPhoneNumber(value);
          handleInputChange('phone_number', formatted);
        }}
        style={styles.input}
        keyboardType="phone-pad"
        maxLength={14} // (XXX) XXX-XXXX format
      />

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.medium}
          value={formData.password}
          onChangeText={value => handleInputChange('password', value)}
          secureTextEntry={!showPassword}
          style={styles.passwordInput}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={togglePasswordVisibility}>
          <MaterialIcons
            name={showPassword ? 'visibility-off' : 'visibility'}
            size={24}
            color={colors.medium}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          onPress={() =>
            setUiState(prev => ({
              ...prev,
              isTermsChecked: !prev.isTermsChecked,
            }))
          }
          style={styles.checkbox}>
          {uiState.isTermsChecked && <View style={styles.checkboxChecked} />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>
          I agree to the{' '}
          <Text
            style={styles.linkText}
            onPress={() =>
              Linking.openURL('https://aimescan.com/legal/terms-of-use/')
            }>
            terms of use
          </Text>{' '}
          and{' '}
          <Text
            style={styles.linkText}
            onPress={() =>
              Linking.openURL('https://aimescan.com/legal/app-privacy/')
            }>
            privacy policy
          </Text>
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <AppButton
          title="Next"
          color={colors.primaryColor}
          onPress={handleNextStep}
          disabled={uiState.loading}
          loading={uiState.loading}
        />
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <TouchableOpacity
        onPress={() => setUiState(prev => ({...prev, showDatePicker: true}))}
        style={styles.dateInput}>
        <Text style={styles.dateText}>
          Birthdate: {formData.birthdate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      <Text style={styles.starNote}>
        * This is required for accurate measurements.
      </Text>

      {uiState.showDatePicker &&
        (Platform.OS === 'ios' ? (
          <View
            style={{
              backgroundColor: '#fff',
              padding: 20,
              borderRadius: 10,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 5,
            }}>
            <DateTimePicker
              value={formData.birthdate}
              mode="date"
              display="spinner"
              onChange={(_, date) => {
                setUiState(prev => ({...prev, showDatePicker: false}));
                if (date) handleInputChange('birthdate', date);
              }}
              themeVariant="light"
              textColor="black"
              style={{width: '100%'}}
            />
          </View>
        ) : (
          <DateTimePicker
            value={formData.birthdate}
            mode="date"
            display="spinner" // you can also try "default"
            onChange={(_, date) => {
              setUiState(prev => ({...prev, showDatePicker: false}));
              if (date) handleInputChange('birthdate', date);
            }}
          />
        ))}

      <Text style={styles.sectionLabel}>Sex at Birth</Text>
      <View style={styles.genderButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.genderButton,
            formData.gender === 'Male' && styles.genderButtonSelected,
          ]}
          onPress={() => handleInputChange('gender', 'Male')}>
          <Text
            style={[
              styles.genderButtonText,
              formData.gender === 'Male' && styles.genderButtonTextSelected,
            ]}>
            Male
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.genderButton,
            formData.gender === 'Female' && styles.genderButtonSelected,
          ]}
          onPress={() => handleInputChange('gender', 'Female')}>
          <Text
            style={[
              styles.genderButtonText,
              formData.gender === 'Female' && styles.genderButtonTextSelected,
            ]}>
            Female
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.starNote}>
        * This is required for accurate measurements.
      </Text>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          onPress={() =>
            setUiState(prev => ({
              ...prev,
              isAgeGenderAcknowledged: !prev.isAgeGenderAcknowledged,
            }))
          }
          style={styles.checkbox}>
          {uiState.isAgeGenderAcknowledged && (
            <View style={styles.checkboxChecked} />
          )}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>
          I understand that my age and sex cannot be changed after I register
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backLink} onPress={handleBackStep}>
          <Text style={styles.backLinkText}>Back</Text>
        </TouchableOpacity>

        <NarrowButton
          title="Next"
          color="primaryColor"
          onPress={handleNextStep}
          disabled={uiState.loading}
          loading={uiState.loading}
        />
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.sectionLabel}>Height</Text>
      <View style={styles.heightContainer}>
        <View style={styles.heightInputContainer}>
          <TextInput
            placeholder="Feet"
            placeholderTextColor={colors.medium}
            value={formData.heightFeet}
            onChangeText={value =>
              handleInputChange('heightFeet', value.replace(/[^0-9]/g, ''))
            }
            style={styles.heightInput}
            keyboardType="numeric"
            maxLength={1}
          />
          <Text style={styles.heightLabel}>feet</Text>
        </View>
        <View style={styles.heightInputContainer}>
          <TextInput
            placeholder="Inches"
            placeholderTextColor={colors.medium}
            value={formData.heightInches}
            onChangeText={value => {
              const numericValue = value.replace(/[^0-9]/g, '');

              // If user completely clears the field, allow it to be empty
              if (numericValue === '') {
                handleInputChange('heightInches', '');
                return;
              }

              // For single digit, allow it (will be validated on blur)
              if (numericValue.length === 1) {
                handleInputChange('heightInches', numericValue);
                return;
              }

              // For 2 digits, check if it's in valid range (00-11)
              if (numericValue.length === 2) {
                const numValue = parseInt(numericValue);
                if (numValue >= 0 && numValue <= 11) {
                  handleInputChange('heightInches', numericValue);
                }
                // If invalid, don't update (reject the input)
              }
            }}
            onBlur={() => {
              // Format to 2 digits when user finishes editing
              const current = formData.heightInches;
              if (current === '') {
                handleInputChange('heightInches', '00');
              } else if (current.length === 1) {
                const paddedValue = '0' + current;
                const numValue = parseInt(paddedValue);
                if (numValue <= 11) {
                  handleInputChange('heightInches', paddedValue);
                } else {
                  handleInputChange('heightInches', '00');
                }
              }
            }}
            style={styles.heightInput}
            keyboardType="numeric"
            maxLength={2}
          />
          <Text style={styles.heightLabel}>inches</Text>
        </View>
      </View>
      <Text style={styles.infoText}>
        Enter height between 4 ft 4 inches and 7 ft 5 inches ({''}
        {HEIGHT_RANGE.cm.min}-{HEIGHT_RANGE.cm.max} cm).
      </Text>
      <Text style={styles.infoText}>Inches must be double digits (00,11).</Text>
      <Text style={styles.sectionLabel}>Weight (lbs)</Text>
      <TextInput
        placeholder="Weight in pounds"
        placeholderTextColor={colors.medium}
        value={formData.weight}
        onChangeText={value =>
          handleInputChange('weight', value.replace(/[^0-9]/g, ''))
        }
        style={styles.input}
        keyboardType="numeric"
      />
      <Text style={styles.infoText}>
        Enter weight between {WEIGHT_RANGE.lbs.min} and {WEIGHT_RANGE.lbs.max}{' '}
        lbs ({WEIGHT_RANGE.kg.min}-{WEIGHT_RANGE.kg.max} kg).
      </Text>
      <Text style={styles.sectionLabel}>Are you a smoker?</Text>
      <RadioButtonGroup
        options={['Yes', 'No']}
        selectedOption={formData.userSmokingStatus}
        onSelectOption={value => handleInputChange('userSmokingStatus', value)}
      />

      <Text style={styles.starNote}>
        * All information on this page is required for accurate results. You can
        edit these values anytime in your user profile.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backLink} onPress={handleBackStep}>
          <Text style={styles.backLinkText}>Back</Text>
        </TouchableOpacity>

        <NarrowButton
          title="Activate/Register"
          color="primaryColor"
          onPress={handleRegister}
          disabled={uiState.loading}
          loading={uiState.loading}
        />
      </View>
    </>
  );

  // Update the renderConfirmationForm function to properly disable the button
  const renderConfirmationForm = () => (
    <>
      <TextInput
        placeholder="Enter confirmation code"
        value={formData.confirmationCode}
        onChangeText={value => handleInputChange('confirmationCode', value)}
        style={styles.input}
        keyboardType="number-pad"
        editable={!uiState.loading}
      />
      <AppButton
        title={uiState.loading ? 'Verifying...' : 'Verify Account'}
        color={colors.primaryColor}
        onPress={handleConfirmation}
        disabled={uiState.loading || !formData.confirmationCode}
        loading={uiState.loading}
      />

      <View style={styles.resendContainer}>
        <TouchableOpacity
          onPress={handleResendCode}
          disabled={uiState.resendCooldown > 0 || uiState.loading}
          style={styles.resendButton}>
          <Text
            style={[
              styles.resendText,
              (uiState.resendCooldown > 0 || uiState.loading) &&
                styles.resendTextDisabled,
            ]}>
            {uiState.resendCooldown > 0
              ? `Resend code in ${uiState.resendCooldown}s`
              : 'Resend verification code'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderStepIndicator = () => {
    if (uiState.isConfirmationStep) return null;

    return (
      <View style={styles.stepIndicatorContainer}>
        <View style={styles.stepRow}>
          <View
            style={[
              styles.stepCircle,
              uiState.currentStep >= 1 && styles.activeStep,
            ]}>
            <Text style={styles.stepText}>1</Text>
          </View>
          <View style={styles.stepLine} />
          <View
            style={[
              styles.stepCircle,
              uiState.currentStep >= 2 && styles.activeStep,
            ]}>
            <Text style={styles.stepText}>2</Text>
          </View>
          <View style={styles.stepLine} />
          <View
            style={[
              styles.stepCircle,
              uiState.currentStep >= 3 && styles.activeStep,
            ]}>
            <Text style={styles.stepText}>3</Text>
          </View>
        </View>
        <View style={styles.stepLabelRow}>
          <Text style={styles.stepLabel}>Account</Text>
          <Text style={styles.stepLabel}>Profile</Text>
          <Text style={styles.stepLabel}>Health</Text>
        </View>
      </View>
    );
  };

  {
    uiState.showEmailConfirmation &&
      Alert.alert(
        'Email Confirmation',
        'Are you sure you used the same email as you did to subscribe on aimescan.com website?',
        [
          {
            text: 'No',
            onPress: handleEmailConfirmationNo,
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: handleEmailConfirmationYes,
          },
        ],
        {cancelable: false},
      );
  }

  const getStepContent = () => {
    if (uiState.isConfirmationStep) {
      return renderConfirmationForm();
    }

    switch (uiState.currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        ref={scrollViewRef}
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
          />
          {uiState.isConfirmationStep && (
            <Text style={styles.tagline}>
              Please enter the verification code sent to your email. Your
              account will be disabled if not verified.
            </Text>
          )}
        </View>

        {renderStepIndicator()}
        {getStepContent()}

        {!uiState.isConfirmationStep && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}>
            <Text style={styles.link}>Already have an account? Login</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    paddingBottom: Platform.OS === 'android' ? 40 : 20, // Extra padding on Android
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  logo: {
    width: Math.min(300, Platform.select({ios: 300, android: 280})),
    height: Platform.select({ios: 185, android: 175}),
    maxWidth: '90%', // Add responsive width
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: colors.dark,
    paddingHorizontal: 20,
    marginTop: 10,
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
  stepIndicatorContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: Platform.OS === 'ios' ? '80%' : '70%', // Adjust width for Android
    marginTop: 5,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.light,
    borderWidth: 2,
    borderColor: colors.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStep: {
    backgroundColor: colors.primaryColor,
    borderColor: colors.primaryColor,
  },
  stepText: {
    color: colors.dark,
    fontWeight: 'bold',
  },
  stepLine: {
    height: 2,
    width: Platform.OS === 'ios' ? 70 : 80, // Adjust line width for Android
    backgroundColor: colors.medium,
  },
  stepLabel: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.dark,
    marginTop: 10,
    marginBottom: 8,
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
  starNote: {
    fontSize: 12,
    color: colors.medium,
    marginTop: -5,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.mediumColor,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: colors.dark,
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
    minHeight: 50, // Add minimum height for consistency
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateInput: {
    backgroundColor: colors.white,
    borderColor: colors.mediumColor,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    minHeight: 50, // Add minimum height
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateText: {
    fontSize: 16,
    color: colors.dark,
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
  genderButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  genderButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.medium,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: colors.white,
    minHeight: 50, // Add minimum height
    justifyContent: 'center', // Add for better alignment
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  genderButtonSelected: {
    backgroundColor: colors.primaryColor,
    borderColor: colors.primaryColor,
  },
  genderButtonText: {
    fontSize: 16,
    color: colors.dark,
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
  genderButtonTextSelected: {
    color: colors.white,
    fontWeight: '500',
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
  heightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: Platform.OS === 'ios' ? 10 : 8, // Add gap between inputs
  },
  heightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    minWidth: 120, // Add minimum width
  },
  heightInput: {
    backgroundColor: colors.white,
    borderColor: colors.mediumColor,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    fontSize: 16,
    color: colors.dark,
    flex: 1,
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
    minHeight: 50, // Add minimum height
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  heightLabel: {
    marginLeft: 10,
    fontSize: 16,
    color: colors.dark,
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
  infoText: {
    fontSize: 12,
    color: colors.medium,
    marginTop: -5,
    marginBottom: 15,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 12,
    color: colors.medium,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    height: 24,
    width: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 0,
    alignSelf: 'flex-start', // Add this line
    minWidth: 22, // Add minimum touch target
    minHeight: 22, // Add minimum touch target
  },
  checkboxChecked: {
    width: 14,
    height: 14,
    backgroundColor: colors.primaryColor,
    borderRadius: 2,
  },
  checkboxText: {
    fontSize: 14,
    color: colors.dark,
    flex: 1,
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
    lineHeight: 20, // Add this to control line height
  },
  linkText: {
    color: colors.primaryColor,
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  backLink: {
    paddingVertical: 10,
  },
  backLinkText: {
    color: colors.primaryColor,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  loginLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  link: {
    color: colors.primaryColor,
    fontSize: 16,
  },
  resendContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  resendButton: {
    padding: 10,
  },
  resendText: {
    color: colors.primaryColor,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  resendTextDisabled: {
    color: colors.medium,
    textDecorationLine: 'none',
  },

  narrowButton: {
    backgroundColor: colors.primaryColor,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    minWidth: 150, // Ensure minimum space
    marginVertical: 10,
  },

  narrowButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    includeFontPadding: false, // Helps Android
    lineHeight: 22, // Keep consistent line height
  },

  disabledButton: {
    backgroundColor: colors.medium,
    opacity: 0.7,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.mediumColor,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    minHeight: 50, // Add minimum height
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
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
  eyeIcon: {
    padding: 10,
    minWidth: 44, // Add minimum touch target
    minHeight: 44, // Add minimum touch target
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RegisterScreen;
