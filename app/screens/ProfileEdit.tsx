// ////////////////////////Font Increase Limit Fix

// // ProfileEdit.tsx — keyboard-safe + boot loader + completeness redirect

/////////////phone Number Added

// ProfileEdit.tsx — keyboard-safe + boot loader + completeness redirect

import * as React from 'react';
import {useState, useEffect, useCallback, useContext} from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import PropTypes from 'prop-types';

import colors from '../config/colors';
import {
  validateHeight,
  validateWeight,
  formatWeight,
} from '../utils/validation';
import {UserApiService} from '../api/userApi';
import AuthContext from '../auth/context';
import ProfileImagePicker from '../components/ProfileImagePicker';
import {fetchUserAttributes} from 'aws-amplify/auth';

import AppText from '../components/AppText';

const ProfileEdit = ({navigation, route}) => {
  const {
    currentHeight = '',
    currentWeight = '',
    currentSmokingStatus = '',
    currentDisplayName = '',
    currentEmail = '',
  } = route?.params || {};

  const insets = useSafeAreaInsets();
  const {user} = useContext(AuthContext);

  const parseHeight = heightStr => {
    if (!heightStr) return {feet: '', inches: ''};
    const parts = String(heightStr).split('.');
    return {feet: parts[0] || '', inches: parts[1] || ''};
  };
  const composeHeight = (f, i) => {
    const padded = i && i.length === 1 ? `0${i}` : i || '00';
    return `${f || '0'}.${padded}`;
  };

  const initialHeight = parseHeight(currentHeight);
  const [feet, setFeet] = useState(initialHeight.feet);
  const [inches, setInches] = useState(initialHeight.inches);
  const [weight, setWeight] = useState(currentWeight || '');
  const [isSmoker, setIsSmoker] = useState(currentSmokingStatus === 'Yes');
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [email, setEmail] = useState(currentEmail || '');
  const [gender, setGender] = useState(
    user?.gender || route?.params?.gender || '',
  );
  const [birthdate, setBirthdate] = useState(
    user?.birthdate || route?.params?.birthdate || '',
  );

  // ✅ New: optional phone number
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  const [heightError, setHeightError] = useState('');
  const [weightError, setWeightError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [booting, setBooting] = useState(true);

  const feetRef = React.useRef<TextInput>(null);
  const inchesRef = React.useRef<TextInput>(null);
  const weightRef = React.useRef<TextInput>(null);
  const displayNameRef = React.useRef<TextInput>(null);
  const phoneRef = React.useRef<TextInput>(null);

  const blurAllInputs = () => {
    feetRef.current?.blur();
    inchesRef.current?.blur();
    weightRef.current?.blur();
    displayNameRef.current?.blur();
    phoneRef.current?.blur();
    Keyboard.dismiss();
  };

  const handleImageSelected = useCallback(imageUri => {
    setSelectedImage(imageUri);
  }, []);
  const handleDeleteImage = () => setSelectedImage(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const attrs = await fetchUserAttributes();
        if (cancelled) return;

        const h = attrs?.['custom:Height'] || currentHeight || '';
        const w = attrs?.['custom:Weight'] || currentWeight || '';
        const s =
          attrs?.['custom:userSmokingStatus'] || currentSmokingStatus || '';
        const dn =
          attrs?.['custom:userDisplayName'] || currentDisplayName || '';
        const g = attrs?.['gender'] || gender;
        const bd = attrs?.['birthdate'] || birthdate;
        const em = attrs?.['email'] || email;
        const ph = attrs?.['phone_number'] || ''; // ✅ new

        const parsed = parseHeight(h);
        setFeet(parsed.feet);
        setInches(parsed.inches);
        setWeight(w);
        setIsSmoker(s === 'Yes');
        setDisplayName(dn);
        setGender(g);
        setBirthdate(bd);
        setEmail(em);
        setPhoneNumber(ph); // ✅ new

        const heightStr = composeHeight(parsed.feet, parsed.inches);
        const hasHeight = heightStr !== '0.00' && validateHeight(heightStr);
        const hasWeight = !!w && validateWeight(w);
        const hasGender = !!g;
        const hasSmoking = s === 'Yes' || s === 'No';
        const hasBirthdate = !!bd;

        const isComplete =
          hasHeight && hasWeight && hasGender && hasSmoking && hasBirthdate;

        if (!isComplete) {
          navigation.replace('CompleteProfile', {
            prefill: {
              heightFeet: parsed.feet,
              heightInches: parsed.inches,
              weight: w,
              userSmokingStatus: s || '',
              gender: g,
              birthdate: bd,
            },
          });
          return;
        }

        setBooting(false);
      } catch (e) {
        setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateHeightFields = (feetValue, inchesValue) => {
    const f = parseInt(feetValue || '0', 10);
    const i = parseInt(inchesValue || '0', 10);
    const totalInches = f * 12 + i;
    const heightInCm = totalInches * 2.54;
    if (heightInCm >= 130 && heightInCm <= 230) {
      setHeightError('');
    }
  };

  const handleFeetChange = value => {
    const v = value.replace(/[^0-9]/g, '');
    setFeet(v);
    validateHeightFields(v, inches);
  };

  const handleInchesChange = value => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= 1) {
      setInches(numericValue);
      validateHeightFields(feet, numericValue);
      return;
    }
    const num = parseInt(numericValue, 10);
    if (num >= 0 && num <= 11) {
      setInches(numericValue);
      validateHeightFields(feet, numericValue);
    }
  };

  const handleInchesBlur = () => {
    let computed = inches;
    if (computed === '') computed = '00';
    else if (computed.length === 1) computed = `0${computed}`;
    const numValue = parseInt(computed, 10);
    if (isNaN(numValue) || numValue > 11) computed = '00';
    setInches(computed);
    validateHeightFields(feet, computed);
  };

  const handleWeightChange = value => {
    const formatted = formatWeight(value);
    setWeight(formatted);
    if (validateWeight(formatted) || formatted === '') {
      setWeightError('');
    }
  };

  const handleDisplayNameChange = value => {
    setDisplayName(value);
    if (value.trim() === '') {
      setDisplayNameError('Display name cannot be empty');
    } else {
      setDisplayNameError('');
    }
  };

  const toggleSmoker = () => setIsSmoker(prev => !prev);

  const handleSave = async () => {
    // Commit any in-progress edits before reading state
    blurAllInputs();
    await new Promise(requestAnimationFrame); // one frame is enough to flush edits

    let isValid = true;
    const heightStr = composeHeight(feet, inches);
    if (!validateHeight(heightStr)) {
      setHeightError(
        'Height must be between 130 and 230 centimeters (4\'3" to 7\'6")',
      );
      isValid = false;
    }
    if (!validateWeight(weight)) {
      setWeightError('Weight must be between 90 and 440 pounds');
      isValid = false;
    }
    if (displayName.trim() === '') {
      setDisplayNameError('Display name cannot be empty');
      isValid = false;
    }
    if (!isValid) return;

    setIsUpdating(true);
    try {
      // Core updates
      await Promise.all([
        UserApiService.updateAttribute('custom:Height', heightStr),
        UserApiService.updateAttribute('custom:Weight', weight),
        UserApiService.updateAttribute(
          'custom:userSmokingStatus',
          isSmoker ? 'Yes' : 'No',
        ),
        UserApiService.updateAttribute('custom:userDisplayName', displayName),
      ]);

      // ✅ Optional phone number (no verification flow)
      if (phoneNumber && phoneNumber.trim()) {
        await UserApiService.updatePhoneNumber(phoneNumber, '+1');
      }

      Alert.alert('Success', 'Profile updated successfully!');
      navigation?.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again later.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBack = () => navigation?.goBack();

  if (booting) {
    return (
      <SafeAreaView style={styles.booting} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#016097" />
        <AppText style={styles.bootingText}>Loading your profile…</AppText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.mainContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
            android_ripple={{color: '#f0f0f0'}}>
            <AppText
              style={styles.backButtonText}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.2}>
              ‹
            </AppText>
          </Pressable>
          <View style={styles.editProfileWrapper}>
            <AppText
              style={styles.title}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.2}>
              Edit Profile
            </AppText>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <KeyboardAwareScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              {paddingBottom: insets.bottom + 64},
            ]}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            enableOnAndroid
            extraHeight={80}
            extraScrollHeight={24}
            bounces={false}
            onScrollBeginDrag={() => {
              if (Platform.OS === 'android') Keyboard.dismiss();
            }}>
            {/* Tap outside to dismiss */}
            <TouchableWithoutFeedback
              onPress={Keyboard.dismiss}
              accessible={false}>
              <View>
                {/* Profile Content */}
                <View style={styles.frameGroup}>
                  <View style={styles.frameContainer}>
                    <View style={styles.frameView}>
                      <ProfileImagePicker
                        gender={gender || 'Female'}
                        onImageSelected={handleImageSelected}
                        style={styles.frameChild}
                        selectedImage={selectedImage}
                      />
                    </View>
                    {email ? (
                      <AppText
                        style={[styles.sarahMistergmaillcom, styles.textClr]}
                        allowFontScaling={true}
                        maxFontSizeMultiplier={1.2}>
                        {email}
                      </AppText>
                    ) : null}
                  </View>

                  <View style={styles.parentFlexBox}>
                    {/* Display Name */}
                    <View style={styles.selectionTextField}>
                      <View style={styles.labelWrapper}>
                        <AppText
                          style={[styles.label1, styles.labelLayout]}
                          allowFontScaling={true}
                          maxFontSizeMultiplier={1.2}>
                          Display Name
                        </AppText>
                      </View>
                      <View style={styles.fieldWrapper}>
                        <TextInput
                          ref={displayNameRef}
                          style={[
                            styles.fieldInput,
                            displayNameError ? styles.inputError : null,
                          ]}
                          value={displayName}
                          onChangeText={handleDisplayNameChange}
                          placeholder="Your display name"
                          returnKeyType="done"
                          allowFontScaling={true}
                          maxFontSizeMultiplier={1.1}
                        />
                      </View>
                      {displayNameError ? (
                        <AppText
                          style={styles.errorText}
                          allowFontScaling={true}
                          maxFontSizeMultiplier={1.1}>
                          {displayNameError}
                        </AppText>
                      ) : null}
                    </View>

                    {/* ✅ Phone Number (optional) */}
                    <View style={styles.selectionTextField}>
                      <View style={styles.labelWrapper}>
                        <AppText
                          style={[styles.label1, styles.labelLayout]}
                          allowFontScaling={true}
                          maxFontSizeMultiplier={1.2}>
                          Phone Number (optional)
                        </AppText>
                      </View>
                      <View style={styles.fieldWrapper}>
                        <TextInput
                          ref={phoneRef}
                          style={styles.fieldInput}
                          value={phoneNumber}
                          onChangeText={setPhoneNumber}
                          placeholder="+1 555 123 4567"
                          keyboardType="phone-pad"
                          textContentType="telephoneNumber"
                          autoComplete="tel"
                          allowFontScaling={true}
                          maxFontSizeMultiplier={1.1}
                        />
                      </View>
                    </View>

                    {/* Height + Weight */}
                    <View style={[styles.frameParent1, styles.parentFlexBox]}>
                      <View style={styles.selectionTextFieldGroup}>
                        <View style={styles.selectionTextField1}>
                          <View style={styles.labelWrapper}>
                            <AppText
                              style={[styles.label1, styles.labelLayout]}
                              allowFontScaling={true}
                              maxFontSizeMultiplier={1.2}>
                              Height
                            </AppText>
                          </View>
                          <View style={styles.fieldParent}>
                            <TextInput
                              ref={feetRef}
                              style={[
                                styles.field1,
                                heightError ? styles.inputError : null,
                              ]}
                              value={feet}
                              onChangeText={handleFeetChange}
                              placeholder="5"
                              keyboardType="numeric"
                              maxLength={1}
                              returnKeyType="next"
                              allowFontScaling={true}
                              maxFontSizeMultiplier={1.1}
                            />
                            <AppText
                              style={[styles.text4, styles.textClr]}
                              allowFontScaling={true}
                              maxFontSizeMultiplier={1.1}>
                              ft
                            </AppText>
                          </View>
                        </View>

                        <View style={styles.selectionTextField1}>
                          <View style={styles.labelWrapper}>
                            <AppText
                              style={[styles.label1, styles.labelLayout]}
                              allowFontScaling={true}
                              maxFontSizeMultiplier={1.2}>
                              {' '}
                            </AppText>
                          </View>
                          <View style={styles.fieldParent}>
                            <TextInput
                              ref={inchesRef}
                              style={[
                                styles.field1,
                                heightError ? styles.inputError : null,
                              ]}
                              value={inches}
                              onChangeText={handleInchesChange}
                              onBlur={handleInchesBlur}
                              placeholder="11"
                              keyboardType="numeric"
                              maxLength={2}
                              returnKeyType="next"
                              allowFontScaling={true}
                              maxFontSizeMultiplier={1.1}
                            />
                            <AppText
                              style={[styles.text4, styles.textClr]}
                              allowFontScaling={true}
                              maxFontSizeMultiplier={1.1}>
                              in
                            </AppText>
                          </View>
                        </View>
                      </View>

                      <View style={styles.selectionTextFieldWrapper}>
                        <View style={styles.selectionTextField3}>
                          <View style={styles.labelWrapper}>
                            <AppText
                              style={[styles.label1, styles.labelLayout]}
                              allowFontScaling={true}
                              maxFontSizeMultiplier={1.2}>
                              Weight
                            </AppText>
                          </View>
                          <View style={styles.fieldParent}>
                            <TextInput
                              ref={weightRef}
                              style={[
                                styles.field1,
                                weightError ? styles.inputError : null,
                              ]}
                              value={weight}
                              onChangeText={handleWeightChange}
                              placeholder="195"
                              keyboardType="numeric"
                              returnKeyType="done"
                              allowFontScaling={true}
                              maxFontSizeMultiplier={1.1}
                            />
                            <AppText
                              style={[styles.text4, styles.textClr]}
                              allowFontScaling={true}
                              maxFontSizeMultiplier={1.1}>
                              lbs
                            </AppText>
                          </View>
                        </View>
                      </View>

                      {(heightError || weightError) && (
                        <View style={styles.errorContainer}>
                          {heightError && (
                            <AppText
                              style={styles.errorText}
                              allowFontScaling={true}
                              maxFontSizeMultiplier={1.1}>
                              {heightError}
                            </AppText>
                          )}
                          {weightError && (
                            <AppText
                              style={styles.errorText}
                              allowFontScaling={true}
                              maxFontSizeMultiplier={1.1}>
                              {weightError}
                            </AppText>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Smoking Status */}
                    <View style={styles.selectionTextField}>
                      <View style={styles.labelWrapper2}>
                        <AppText
                          style={[styles.label5, styles.labelLayout]}
                          allowFontScaling={true}
                          maxFontSizeMultiplier={1.2}>
                          Smoking Status
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.selectionRadioWlabelParent,
                          styles.itemParentFlexBox,
                        ]}>
                        <Pressable
                          style={styles.selectionRadioWlabel}
                          onPress={() => setIsSmoker(true)}
                          android_ripple={{color: '#f0f0f0'}}>
                          <View style={styles.iconWrapper}>
                            <View
                              style={[
                                styles.selectionRadio,
                                styles.selectionLayout,
                                isSmoker && styles.selectedRadio,
                              ]}>
                              {isSmoker && (
                                <View style={styles.selectionRadioChild} />
                              )}
                            </View>
                          </View>
                          <View style={styles.iconWrapper}>
                            <AppText
                              style={[styles.text2, styles.labelLayout]}
                              allowFontScaling={true}
                              maxFontSizeMultiplier={1.1}>
                              Yes, I smoke
                            </AppText>
                          </View>
                        </Pressable>
                        <Pressable
                          style={styles.selectionRadioWlabel}
                          onPress={() => setIsSmoker(false)}
                          android_ripple={{color: '#f0f0f0'}}>
                          <View style={styles.iconWrapper}>
                            <View
                              style={[
                                styles.selectionRadio1,
                                styles.selectionLayout,
                                !isSmoker && styles.selectedRadio,
                              ]}>
                              {!isSmoker && (
                                <View style={styles.selectionRadioChild} />
                              )}
                            </View>
                          </View>
                          <View style={styles.iconWrapper}>
                            <AppText
                              style={[styles.text2, styles.labelLayout]}
                              allowFontScaling={true}
                              maxFontSizeMultiplier={1.1}>
                              No, I do not smoke
                            </AppText>
                          </View>
                        </Pressable>
                      </View>
                    </View>

                    {/* Save Button */}
                    <Pressable
                      style={[
                        styles.saveButton,
                        isUpdating && styles.disabledButton,
                      ]}
                      onPress={handleSave}
                      android_ripple={{color: 'rgba(255,255,255,0.3)'}}
                      disabled={isUpdating}>
                      {isUpdating ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <AppText
                          style={styles.saveButtonText}
                          allowFontScaling={true}
                          maxFontSizeMultiplier={1.2}>
                          Save Changes
                        </AppText>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAwareScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

ProfileEdit.propTypes = {
  navigation: PropTypes.object,
  route: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#4ca9ee'},
  mainContainer: {flex: 1},
  contentContainer: {flex: 1, backgroundColor: '#B7DDF8'},

  booting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B7DDF8',
    padding: 24,
  },
  bootingText: {marginTop: 12, color: '#1a1a1a', fontSize: 16},

  header: {
    padding: Platform.OS === 'android' ? 15 : 20,
    paddingTop: Platform.select({ios: 20, android: 40}),
    backgroundColor: '#4ca9ee',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: Platform.select({ios: 24, android: 22}),
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    fontFamily: 'NunitoSans12pt-Bold',
  },
  editProfileWrapper: {flex: 1, paddingRight: 32},
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    minHeight: 44,
    minWidth: 44,
  },
  backButtonText: {fontSize: 28, color: '#1a1a1a', fontWeight: 'bold'},

  scrollView: {flex: 1},
  scrollContent: {padding: 16, flexGrow: 1},

  textClr: {color: '#6b6b6b', fontFamily: 'NunitoSans12pt-Regular'},
  itemParentFlexBox: {
    gap: 0,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  labelLayout: {lineHeight: 24, fontSize: 16},
  parentFlexBox: {gap: 24, alignSelf: 'stretch'},
  selectionLayout: {height: 24, justifyContent: 'center'},

  frameChild: {width: 150, borderRadius: 100, height: 150, overflow: 'hidden'},
  frameView: {
    gap: 10,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  sarahMistergmaillcom: {
    height: 25,
    lineHeight: 21,
    fontSize: 14,
    color: '#6b6b6b',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  frameContainer: {gap: 16, alignItems: 'center', alignSelf: 'stretch'},

  label1: {
    textAlign: 'left',
    fontFamily: 'NunitoSans12pt-Bold',
    fontWeight: '700',
    color: '#000',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  labelWrapper: {justifyContent: 'center', alignSelf: 'stretch'},

  text2: {
    textAlign: 'left',
    color: '#6b6b6b',
    fontFamily: 'NunitoSans12pt-Regular',
    lineHeight: 24,
    fontSize: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  fieldWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  fieldInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
    borderRadius: 15,
    backgroundColor: '#fff',
    flex: 1,
    fontSize: 16,
    color: '#6b6b6b',
    fontFamily: 'NunitoSans12pt-Regular',
    includeFontPadding: false,
    textAlignVertical: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  selectionTextField: {gap: 8, alignSelf: 'stretch'},

  field1: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
    borderRadius: 15,
    backgroundColor: '#fff',
    flex: 1,
    fontSize: 16,
    color: '#6b6b6b',
    fontFamily: 'NunitoSans12pt-Regular',
    includeFontPadding: false,
    textAlignVertical: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  text4: {textAlign: 'left', lineHeight: 21, fontSize: 14, color: '#6b6b6b'},
  fieldParent: {
    gap: 8,
    alignItems: 'center',
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  selectionTextField1: {minWidth: 99, gap: 8, flex: 1},
  selectionTextFieldGroup: {
    gap: 16,
    minWidth: 214,
    flexDirection: 'row',
    flex: 1,
  },
  selectionTextField3: {gap: 8, flex: 1},
  selectionTextFieldWrapper: {minWidth: 107, flexDirection: 'row', flex: 1},
  frameParent1: {
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    flexDirection: 'row',
  },

  errorContainer: {gap: 4, alignSelf: 'stretch', marginTop: 4},
  label5: {
    textAlign: 'left',
    width: '100%',
    fontFamily: 'NunitoSans12pt-Bold',
    fontWeight: '700',
    color: '#000',
  },
  labelWrapper2: {flexDirection: 'row', alignSelf: 'stretch'},

  selectionRadio: {
    borderColor: 'rgba(1, 96, 151, 0.31)',
    borderWidth: 2,
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderStyle: 'solid',
    borderRadius: 30,
    alignItems: 'center',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  selectedRadio: {borderColor: '#016097'},
  selectionRadioWlabel: {
    gap: 8,
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 44,
  },
  selectionRadioChild: {
    width: 12,
    height: 12,
    backgroundColor: '#016097',
    borderRadius: 30,
    overflow: 'hidden',
  },
  selectionRadio1: {
    borderColor: '#016097',
    padding: 2,
    borderWidth: 2,
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderStyle: 'solid',
    borderRadius: 30,
    alignItems: 'center',
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  selectionRadioWlabelParent: {alignSelf: 'stretch'},
  frameGroup: {gap: 48, minWidth: 214, alignSelf: 'stretch'},
  iconWrapper: {alignItems: 'center', flexDirection: 'row'},

  inputError: {borderColor: colors.danger, borderWidth: 1},
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'NunitoSans12pt-Regular',
  },

  saveButton: {
    backgroundColor: colors.primaryColor,
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'NunitoSans12pt-Bold',
  },
  disabledButton: {opacity: 0.7},
  deleteImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  deleteImageText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});

export default ProfileEdit;
