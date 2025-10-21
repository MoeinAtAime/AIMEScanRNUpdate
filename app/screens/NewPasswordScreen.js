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
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {confirmSignIn} from 'aws-amplify/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import AppButton from '../components/AppButton';
import colors from '../config/colors';

const PASSWORD_MIN = 8; // Align with your user-pool policy

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
      <Text style={styles.title}>Set a new password</Text>
      {!!username && <Text style={styles.subtitle}>for {username}</Text>}

      {/* New Password */}
      <View style={styles.inputWrap}>
        <TextInput
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

      <AppButton
        title={busy ? 'Saving...' : 'Save & Continue'}
        onPress={submit}
        disabled={busy}
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
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.dark,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.medium,
    marginBottom: 20,
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
    fontSize: 16,
    color: colors.dark,
    minHeight: 50,
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
