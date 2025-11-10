//////////////////////////////Font Increase Limit Fix

// CompleteProfileScreen.tsx — updated with font-scaling caps for accessibility
// CompleteProfileScreen.js
// screens/CompleteProfileScreen.js
import React, {useState} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useRoute} from '@react-navigation/native';
import colors from '../config/colors';
import RadioButtonGroup from '../components/RadioButtonGroup';
import AppButton from '../components/AppButton';
import {UserApiService} from '../api/userApi';

const HEIGHT_RANGE = {cm: {min: 130, max: 230}};
const WEIGHT_RANGE = {lbs: {min: 90, max: 440}, kg: {min: 40, max: 200}};
const AGE_RANGE = {min: 18, max: 110};

const feetInchesToCm = (feet, inches) =>
  (feet * 12 + parseInt(inches || '0', 10)) * 2.54;

export default function CompleteProfileScreen({navigation}) {
  const route = useRoute();
  const prefill =
    route.params && route.params.prefill ? route.params.prefill : {};

  const [ui, setUi] = useState({
    step: 1,
    showDatePicker: false,
    loading: false,
  });
  const [immutableAck, setImmutableAck] = useState(false);
  const [form, setForm] = useState({
    birthdate: prefill.birthdate
      ? new Date(prefill.birthdate)
      : new Date(1995, 0, 1),
    gender: prefill.gender || '',
    displayName: prefill.displayName || '',
    heightFeet: (prefill.heightFeet ?? '').toString(),
    heightInches: (prefill.heightInches ?? '00').toString().padStart(2, '0'),
    weight: (prefill.weight ?? '150').toString().replace(/[^0-9]/g, ''),
    userSmokingStatus: prefill.userSmokingStatus || '',
  });

  const handle = (k, v) => setForm(prev => ({...prev, [k]: v}));

  const validateStep1 = () => {
    const today = new Date();
    const bd = new Date(form.birthdate);
    let age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
    if (isNaN(age) || age < AGE_RANGE.min || age > AGE_RANGE.max) {
      Alert.alert(
        'Invalid Age',
        `You must be between ${AGE_RANGE.min} and ${AGE_RANGE.max}.`,
      );
      return false;
    }
    if (!form.gender) {
      Alert.alert('Missing Information', 'Please select your sex at birth.');
      return false;
    }
    if (form.displayName.trim() === '') {
      Alert.alert('Missing Information', 'Please enter your Display Name.');
      return false;
    }
    if (!immutableAck) {
      Alert.alert(
        'Please Confirm',
        'You must acknowledge that your date of birth and sex at birth cannot be changed later.',
      );
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const w = parseInt(form.weight, 10);
    if (isNaN(w) || w < WEIGHT_RANGE.lbs.min || w > WEIGHT_RANGE.lbs.max) {
      Alert.alert(
        'Invalid Weight',
        `Enter a weight between ${WEIGHT_RANGE.lbs.min} and ${WEIGHT_RANGE.lbs.max} lbs.`,
      );
      return false;
    }
    const feet = parseInt(form.heightFeet, 10);
    const inches = parseInt(form.heightInches, 10);
    if (isNaN(feet) || feet < 4 || feet > 7) {
      Alert.alert(
        'Invalid Height (feet)',
        'Enter a valid height in feet (4–7).',
      );
      return false;
    }
    if (
      isNaN(inches) ||
      inches < 0 ||
      inches > 11 ||
      (form.heightInches.length !== 2 && form.heightInches !== '')
    ) {
      Alert.alert(
        'Invalid Height (inches)',
        'Inches must be 2 digits (00–11).',
      );
      return false;
    }
    const cm = feetInchesToCm(feet, inches);
    if (cm < HEIGHT_RANGE.cm.min || cm > HEIGHT_RANGE.cm.max) {
      Alert.alert(
        'Invalid Height',
        `Height must be between ${HEIGHT_RANGE.cm.min}–${HEIGHT_RANGE.cm.max} cm.`,
      );
      return false;
    }
    if (!form.userSmokingStatus) {
      Alert.alert(
        'Missing Information',
        'Please indicate your smoking status.',
      );
      return false;
    }
    return true;
  };

  const saveAndContinue = async () => {
    if (ui.step === 1) {
      if (!validateStep1()) return;
      setUi(s => ({...s, step: 2}));
      return;
    }
    if (!validateStep2()) return;

    const heightFeet = parseInt(form.heightFeet || '0', 10);
    const heightInchesStr = (form.heightInches || '00')
      .toString()
      .padStart(2, '0');

    const payload = {
      birthdate: form.birthdate.toISOString().split('T')[0],
      gender: form.gender,
      'custom:userDisplayName': form.displayName,
      'custom:Weight': form.weight,
      'custom:Height': `${heightFeet}.${heightInchesStr}`,
      'custom:userSmokingStatus': form.userSmokingStatus,
    };

    try {
      setUi(s => ({...s, loading: true}));
      await UserApiService.updateAttributes(payload);
      navigation.replace('MainTabs');
    } catch (e) {
      console.error('Profile update failed:', e);
      Alert.alert(
        'Update Failed',
        e?.message || 'Unable to save your profile. Please try again.',
      );
      setUi(s => ({...s, loading: false}));
    }
  };

  const renderStep1 = () => (
    <>
      <TouchableOpacity
        onPress={() => setUi(s => ({...s, showDatePicker: true}))}
        style={styles.dateInput}>
        <Text
          style={styles.dateText}
          allowFontScaling
          maxFontSizeMultiplier={1.2}>
          Birthdate: {form.birthdate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      {ui.showDatePicker &&
        (Platform.OS === 'ios' ? (
          <View style={styles.iosPickerCard}>
            <DateTimePicker
              value={form.birthdate}
              mode="date"
              display="spinner"
              onChange={(_, date) => {
                setUi(s => ({...s, showDatePicker: false}));
                if (date) handle('birthdate', date);
              }}
              themeVariant="light"
              textColor="black"
              style={{width: '100%'}}
            />
          </View>
        ) : (
          <DateTimePicker
            value={form.birthdate}
            mode="date"
            display="spinner"
            onChange={(_, date) => {
              setUi(s => ({...s, showDatePicker: false}));
              if (date) handle('birthdate', date);
            }}
          />
        ))}

      <Text
        style={styles.sectionLabel}
        allowFontScaling
        maxFontSizeMultiplier={1.2}>
        Sex at Birth
      </Text>
      <View style={styles.genderRow}>
        <TouchableOpacity
          style={[
            styles.genderBtn,
            form.gender === 'Male' && styles.genderBtnSelected,
          ]}
          onPress={() => handle('gender', 'Male')}>
          <Text
            style={[
              styles.genderText,
              form.gender === 'Male' && styles.genderTextSelected,
            ]}
            allowFontScaling
            maxFontSizeMultiplier={1.1}>
            Male
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.genderBtn,
            form.gender === 'Female' && styles.genderBtnSelected,
          ]}
          onPress={() => handle('gender', 'Female')}>
          <Text
            style={[
              styles.genderText,
              form.gender === 'Female' && styles.genderTextSelected,
            ]}
            allowFontScaling
            maxFontSizeMultiplier={1.1}>
            Female
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{marginVertical: 12}}>
        <Text
          style={[styles.sectionLabel, {marginBottom: 4}]}
          allowFontScaling
          maxFontSizeMultiplier={1.2}>
          Display Name
        </Text>
        <TextInput
          placeholder="Your display name"
          placeholderTextColor={colors.medium}
          value={form.displayName}
          onChangeText={v => handle('displayName', v)}
          style={styles.input}
          allowFontScaling
          maxFontSizeMultiplier={1.1}
        />
      </View>

      <Pressable
        onPress={() => setImmutableAck(v => !v)}
        style={styles.checkRow}
        accessibilityRole="checkbox"
        accessibilityState={{checked: immutableAck}}
        accessibilityLabel="Acknowledge that date of birth and sex at birth cannot be changed later">
        <View
          style={[
            styles.checkboxBox,
            immutableAck && styles.checkboxBoxChecked,
          ]}>
          {immutableAck && (
            <Text
              style={styles.checkboxCheck}
              allowFontScaling
              maxFontSizeMultiplier={1.1}>
              ✓
            </Text>
          )}
        </View>
        <Text
          style={styles.checkLabel}
          allowFontScaling
          maxFontSizeMultiplier={1.1}>
          I understand my date of birth and sex at birth cannot be changed
          later.
        </Text>
      </Pressable>

      {/* Block-style button here is fine; keep full width.
          Add compact to keep height stable on large text. */}
      <AppButton
        title="Next"
        color="primaryColor"
        onPress={saveAndContinue}
        disabled={ui.loading || !immutableAck}
        loading={ui.loading}
        compact
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <Text
        style={styles.sectionLabel}
        allowFontScaling
        maxFontSizeMultiplier={1.2}>
        Height
      </Text>
      <View style={styles.heightRow}>
        <View style={styles.heightInputWrap}>
          <TextInput
            placeholder="Feet"
            placeholderTextColor={colors.medium}
            value={form.heightFeet}
            onChangeText={v => handle('heightFeet', v.replace(/[^0-9]/g, ''))}
            style={styles.heightInput}
            keyboardType="numeric"
            maxLength={1}
            allowFontScaling
            maxFontSizeMultiplier={1.1}
          />
          <Text
            style={styles.heightUnit}
            allowFontScaling
            maxFontSizeMultiplier={1.1}>
            feet
          </Text>
        </View>
        <View style={styles.heightInputWrap}>
          <TextInput
            placeholder="Inches"
            placeholderTextColor={colors.medium}
            value={form.heightInches}
            onChangeText={v => {
              const n = v.replace(/[^0-9]/g, '');
              if (n === '') return handle('heightInches', '');
              if (n.length === 1) return handle('heightInches', n);
              if (n.length === 2) {
                const num = parseInt(n, 10);
                if (num >= 0 && num <= 11) handle('heightInches', n);
              }
            }}
            onBlur={() => {
              const cur = form.heightInches;
              if (cur === '') handle('heightInches', '00');
              else if (cur.length === 1) {
                const padded = '0' + cur;
                const num = parseInt(padded, 10);
                handle('heightInches', num <= 11 ? padded : '00');
              }
            }}
            style={styles.heightInput}
            keyboardType="numeric"
            maxLength={2}
            allowFontScaling
            maxFontSizeMultiplier={1.1}
          />
          <Text
            style={styles.heightUnit}
            allowFontScaling
            maxFontSizeMultiplier={1.1}>
            inches
          </Text>
        </View>
      </View>

      <Text
        style={styles.sectionLabel}
        allowFontScaling
        maxFontSizeMultiplier={1.2}>
        Weight (lbs)
      </Text>
      <TextInput
        placeholder="Weight in pounds"
        placeholderTextColor={colors.medium}
        value={form.weight}
        onChangeText={v => handle('weight', v.replace(/[^0-9]/g, ''))}
        style={styles.input}
        keyboardType="numeric"
        allowFontScaling
        maxFontSizeMultiplier={1.1}
      />

      <Text
        style={styles.sectionLabel}
        allowFontScaling
        maxFontSizeMultiplier={1.2}>
        Are you a smoker?
      </Text>
      <RadioButtonGroup
        options={['Yes', 'No']}
        selectedOption={form.userSmokingStatus}
        onSelectOption={v => handle('userSmokingStatus', v)}
      />

      <View style={styles.btnRow}>
        <TouchableOpacity
          onPress={() => setUi(s => ({...s, step: 1}))}
          style={styles.backLink}>
          <Text
            style={styles.backLinkText}
            allowFontScaling
            maxFontSizeMultiplier={1.1}>
            Back
          </Text>
        </TouchableOpacity>

        {/* Make Save & Continue behave like a compact, content-width button */}
        <AppButton
          title={ui.loading ? 'Saving...' : 'Save & Continue'}
          color="primaryColor"
          onPress={saveAndContinue}
          disabled={ui.loading}
          loading={ui.loading}
          compact
          fullWidth={false}
        />
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Image
            style={styles.logo}
            source={require('../assets/Aime_Blue_Transparent_72ppi.png')}
            resizeMode="contain"
          />
          <Text
            style={styles.title}
            allowFontScaling
            maxFontSizeMultiplier={1.2}>
            Complete Your Profile
          </Text>
          <Text
            style={styles.tagline}
            allowFontScaling
            maxFontSizeMultiplier={1.1}>
            We need a few details for accurate measurements.
          </Text>
        </View>

        {ui.step === 1 ? renderStep1() : renderStep2()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.light},
  scrollContent: {padding: 20, flexGrow: 1},
  logoWrap: {alignItems: 'center', marginVertical: 10},
  logo: {width: 260, height: 160, maxWidth: '90%'},
  title: {fontSize: 20, fontWeight: '700', color: colors.dark, marginTop: 8},
  tagline: {
    fontSize: 14,
    color: colors.medium,
    textAlign: 'center',
    marginTop: 6,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.dark,
    marginTop: 14,
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: colors.white,
    borderColor: colors.mediumColor,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateText: {fontSize: 16, color: colors.dark},
  iosPickerCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.medium,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: colors.white,
    minHeight: 50,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  genderBtnSelected: {
    backgroundColor: colors.primaryColor,
    borderColor: colors.primaryColor,
  },
  genderText: {fontSize: 16, color: colors.dark},
  genderTextSelected: {color: colors.white, fontWeight: '500'},
  heightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  heightInputWrap: {flexDirection: 'row', alignItems: 'center', width: '48%'},
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
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  heightUnit: {marginLeft: 10, fontSize: 16, color: colors.dark},
  input: {
    backgroundColor: colors.white,
    borderColor: colors.mediumColor,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: colors.dark,
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  backLink: {paddingVertical: 10},
  backLinkText: {
    color: colors.primaryColor,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.mediumColor,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: colors.primaryColor,
    borderColor: colors.primaryColor,
  },
  checkboxCheck: {
    color: colors.white,
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '700',
  },
  checkLabel: {flex: 1, color: colors.dark, fontSize: 14},
});
