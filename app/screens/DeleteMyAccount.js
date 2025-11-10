//////////////Font Increase Limit Fix

// DeleteMyAccount.js
import React, {useState, useContext, useCallback} from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {deleteUser} from 'aws-amplify/auth';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthContext from '../auth/context';

const DeleteMyAccount = () => {
  const navigation = useNavigation();
  const {setUser} = useContext(AuthContext);
  const [isChecked, setIsChecked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => subscription?.remove();
    }, [navigation]),
  );

  const handleDeleteAccount = async () => {
    if (!isChecked) {
      Alert.alert(
        'Confirmation Required',
        'Please confirm that you understand the consequences of deleting your account.',
      );
      return;
    }
    setIsDeleting(true);
    try {
      await deleteUser();
      await AsyncStorage.clear();
      await Keychain.resetGenericPassword();
      setUser(null);
      Alert.alert(
        'Account Deleted',
        'Your account has been successfully deleted.',
        [
          {
            text: 'OK',
            onPress: () => {
              let rootNavigation = navigation;
              while (rootNavigation.getParent()) {
                rootNavigation = rootNavigation.getParent();
              }
              rootNavigation.reset({
                index: 0,
                routes: [{name: 'WelcomeScreen'}],
              });
            },
          },
        ],
        {cancelable: false},
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'There was a problem deleting your account.');
      setIsDeleting(false);
    }
  };

  const toggleCheckbox = () => {
    setIsChecked(prev => !prev);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.view}>
        <View style={styles.pageContainer}>
          <View style={styles.body}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                android_ripple={{color: '#f0f0f0'}}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Go back">
                <Text
                  style={styles.backButtonText}
                  allowFontScaling={true}
                  maxFontSizeMultiplier={1.2}>
                  ‹
                </Text>
              </TouchableOpacity>
              <Text
                style={styles.headerTitle}
                allowFontScaling={true}
                maxFontSizeMultiplier={1.2}>
                Delete Account
              </Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              contentInsetAdjustmentBehavior="automatic"
              showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                <Text
                  style={styles.warningTitle}
                  allowFontScaling={true}
                  maxFontSizeMultiplier={1.2}>
                  Are you sure you want to delete your account?
                </Text>

                <Text
                  style={styles.warningText}
                  allowFontScaling={true}
                  maxFontSizeMultiplier={1.2}>
                  This action is permanent and cannot be undone.
                </Text>
                <Text
                  style={styles.warningText}
                  allowFontScaling={true}
                  maxFontSizeMultiplier={1.2}>
                  When you delete your account:
                </Text>

                <View style={styles.bulletPoints}>
                  {[
                    "Deleting this account won't cancel your AIME subscription. Cancel billing at aimescan.com;",
                    'All your personal information will be permanently removed;',
                    'Your scan history will be erased;',
                    'Profile settings and preferences will be deleted;',
                    "You'll need to create a new account to use the app again;",
                    'Allow two weeks for your data to be fully purged from storage.',
                  ].map((text, idx) => (
                    <Text
                      key={idx}
                      style={styles.bulletPoint}
                      allowFontScaling={true}
                      maxFontSizeMultiplier={1.2}>
                      • {text}
                    </Text>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={toggleCheckbox}
                  android_ripple={{color: '#f0f0f0'}}
                  accessible={true}
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: isChecked}}>
                  <View style={[styles.checkbox, isChecked && styles.checked]}>
                    {isChecked && (
                      <Text
                        style={styles.checkmark}
                        allowFontScaling={true}
                        maxFontSizeMultiplier={1.2}>
                        ✓
                      </Text>
                    )}
                  </View>
                  <Text
                    style={styles.checkboxText}
                    allowFontScaling={true}
                    maxFontSizeMultiplier={1.2}>
                    I understand that deleting my account is permanent and all
                    of my data will be erased.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    (!isChecked || isDeleting) && styles.deleteButtonDisabled,
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={!isChecked || isDeleting}
                  android_ripple={{color: 'rgba(255,255,255,0.3)'}}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Delete my account">
                  <Text
                    style={styles.deleteButtonText}
                    allowFontScaling={true}
                    maxFontSizeMultiplier={1.2}>
                    {isDeleting ? 'Deleting Account…' : 'Delete My Account'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => navigation.goBack()}
                  android_ripple={{color: '#f0f0f0'}}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel account deletion">
                  <Text
                    style={styles.cancelButtonText}
                    allowFontScaling={true}
                    maxFontSizeMultiplier={1.2}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f1f1',
  },
  view: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    backgroundColor: '#f1f1f1',
  },
  body: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.OS === 'android' ? 20 : 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    minHeight: 44,
    minWidth: 44,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  headerTitle: {
    fontSize: Platform.select({ios: 17, android: 18}),
    fontWeight: '700',
    color: '#000',
    textTransform: 'uppercase',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  placeholder: {
    width: 44,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Platform.OS === 'android' ? 20 : 24,
    paddingBottom: Platform.OS === 'android' ? 50 : 40,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: Platform.OS === 'android' ? 20 : 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warningTitle: {
    fontSize: Platform.select({ios: 20, android: 19}),
    fontWeight: '700',
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  warningText: {
    fontSize: Platform.select({ios: 16, android: 15}),
    color: '#333',
    lineHeight: Platform.select({ios: 24, android: 22}),
    marginBottom: Platform.OS === 'ios' ? 20 : 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  bulletPoints: {
    marginBottom: Platform.OS === 'ios' ? 30 : 25,
  },
  bulletPoint: {
    fontSize: Platform.select({ios: 14, android: 13}),
    color: '#333',
    lineHeight: Platform.select({ios: 22, android: 20}),
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingVertical: 5,
    minHeight: 44,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d9d9d9',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 33,
    minHeight: 33,
  },
  checked: {
    backgroundColor: '#016097',
    borderColor: '#016097',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    flex: 1,
    fontSize: Platform.select({ios: 14, android: 13}),
    color: '#333',
    lineHeight: Platform.select({ios: 20, android: 18}),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    paddingVertical: Platform.OS === 'android' ? 14 : 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonDisabled: {
    backgroundColor: '#d9d9d9',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: Platform.select({ios: 16, android: 15}),
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: Platform.OS === 'android' ? 14 : 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    minHeight: 50,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: Platform.select({ios: 16, android: 15}),
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default DeleteMyAccount;
