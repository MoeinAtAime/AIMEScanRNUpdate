///////////////////////////Font Increase Limit Fix
// // // NewPasswordScreen.js
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {confirmSignIn} from 'aws-amplify/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import AppButton from '../components/AppButton';
import colors from '../config/colors';

const PASSWORD_MIN = 8; // Align with your user-pool policy

const {width} = Dimensions.get('window');
const isSmallScreen = width < 350;

// Unified scale caps
const titleScaleProps = {allowFontScaling: true, maxFontSizeMultiplier: 1.25};
const labelScaleProps = {allowFontScaling: true, maxFontSizeMultiplier: 1.2};
const bodyScaleProps = {allowFontScaling: true, maxFontSizeMultiplier: 1.15};

export default function NewPasswordScreen({route, navigation}) {
  const {username, rememberMe} = route.params || {};
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  // eye toggles
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const saveCredsIfNeeded = async () => {
    try {
      if (rememberMe && username && newPassword) {
        await AsyncStorage.setItem(
          '@login_credentials',
          JSON.stringify({email: username}),
        );
        await Keychain.setGenericPassword(username, newPassword);
      }
    } catch {
      // non-fatal; ignore
    }
  };

  const submit = async () => {
    if (!newPassword || newPassword.length < PASSWORD_MIN) {
      Alert.alert(
        'New password',
        `Please enter at least ${PASSWORD_MIN} characters.`,
      );
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert('New password', 'Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const res = await confirmSignIn({challengeResponse: newPassword});
      if (res.isSignedIn) {
        await saveCredsIfNeeded();
        navigation.replace('AppNavigator');
      } else if (res.nextStep?.signInStep) {
        Alert.alert(
          'Next step',
          `Additional verification: ${res.nextStep.signInStep}`,
        );
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to set new password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text
        {...titleScaleProps}
        style={styles.title}
        accessibilityRole="header">
        Set a new password
      </Text>

      {!!username && (
        <Text
          {...labelScaleProps}
          style={styles.subtitle}
          accessibilityLabel={`for ${username}`}>
          for {username}
        </Text>
      )}

      {/* New Password */}
      <View style={styles.inputWrap}>
        <TextInput
          {...bodyScaleProps}
          placeholder="New password"
          placeholderTextColor={colors.medium}
          secureTextEntry={!showNew}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          value={newPassword}
          onChangeText={setNewPassword}
          style={[styles.input, styles.inputWithIcon]}
          returnKeyType="next"
          accessible
          accessibilityLabel="Enter new password"
          // Tip: if you ever use multiline, consider numberOfLines & minHeight
        />
        <TouchableOpacity
          onPress={() => setShowNew(s => !s)}
          style={styles.eye}
          accessibilityRole="button"
          accessibilityLabel={showNew ? 'Hide password' : 'Show password'}>
          <MaterialCommunityIcons
            name={showNew ? 'eye-off' : 'eye'}
            size={22}
            color={colors.medium}
          />
        </TouchableOpacity>
      </View>

      {/* Confirm Password */}
      <View style={styles.inputWrap}>
        <TextInput
          {...bodyScaleProps}
          placeholder="Confirm new password"
          placeholderTextColor={colors.medium}
          secureTextEntry={!showConfirm}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          value={confirm}
          onChangeText={setConfirm}
          style={[styles.input, styles.inputWithIcon]}
          returnKeyType="done"
          onSubmitEditing={submit}
          accessible
          accessibilityLabel="Confirm new password"
        />
        <TouchableOpacity
          onPress={() => setShowConfirm(s => !s)}
          style={styles.eye}
          accessibilityRole="button"
          accessibilityLabel={showConfirm ? 'Hide password' : 'Show password'}>
          <MaterialCommunityIcons
            name={showConfirm ? 'eye-off' : 'eye'}
            size={22}
            color={colors.medium}
          />
        </TouchableOpacity>
      </View>

      {/* NOTE: Ensure AppButton's internal Text uses allowFontScaling + a cap.
         If your AppButton accepts textProps, pass {...labelScaleProps} there. */}
      <AppButton
        title={busy ? 'Saving...' : 'Save & Continue'}
        onPress={submit}
        disabled={busy}
        // textProps={labelScaleProps} // uncomment if your AppButton supports this
      />

      {busy && (
        <ActivityIndicator
          size="large"
          color={colors.primaryColor}
          style={{marginTop: 12}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 80 : 40,
  },
  title: {
    fontSize: Platform.select({
      ios: isSmallScreen ? 20 : 22,
      android: isSmallScreen ? 18 : 20,
    }),
    fontWeight: '600',
    textAlign: 'center',
    color: colors.dark,
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: Platform.select({ios: 14, android: 13}),
    textAlign: 'center',
    color: colors.medium,
    marginBottom: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.mediumColor,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    fontSize: Platform.select({ios: 16, android: 15}),
    color: colors.dark,
    minHeight: 50,
    includeFontPadding: false, // helps Android align text vertically
    textAlignVertical: 'center',
  },
  inputWithIcon: {
    paddingRight: 48, // space for the eye button
  },
  eye: {
    position: 'absolute',
    right: 12,
    top: 12, // visually centered for ~50px height input
    height: 26,
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
