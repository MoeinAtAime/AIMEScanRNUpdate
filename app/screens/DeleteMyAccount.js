import React, {useState, useContext} from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Platform, // Add this import
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {deleteUser} from 'aws-amplify/auth';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthContext from '../auth/context';
import {useCallback} from 'react';

const DeleteMyAccount = () => {
  const navigation = useNavigation();
  const {setUser} = useContext(AuthContext);
  const [isChecked, setIsChecked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle back button
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
      // Delete user from Cognito
      await deleteUser();

      // Clear any sensitive storage
      await AsyncStorage.clear();
      await Keychain.resetGenericPassword();

      // Clear user context
      setUser(null);

      Alert.alert(
        'Account Deleted',
        'Your account has been successfully deleted.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to welcome screen
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
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'There was a problem deleting your account.');
      setIsDeleting(false);
    }
  };

  const toggleCheckbox = () => {
    setIsChecked(!isChecked);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.view}>
        <View style={styles.pageContainer}>
          <View style={styles.body}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                android_ripple={{color: '#f0f0f0'}}>
                <Text style={styles.backButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Delete Account</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              contentInsetAdjustmentBehavior="automatic" // Add this for iOS
              showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                <Text style={styles.warningTitle}>
                  Are you sure you want to delete your account?
                </Text>

                <Text style={styles.warningText}>
                  This action is permanent and cannot be undone.
                </Text>
                <Text style={styles.warningText}>
                  When you delete your account:
                </Text>

                <View style={styles.bulletPoints}>
                  <Text style={styles.bulletPoint}>
                    • Deleting this account won't cancel your AIME subscription.
                    Cancel billing at aimescan.com;
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • All your personal information will be permanently removed;
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Your scan history will be erased;
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Profile settings and preferences will be deleted;
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • You'll need to create a new account to use the app again;
                  </Text>
                  <Text style={styles.bulletPoint}>
                    Allow two weeks for your data to be fully purged from
                    storage.
                  </Text>
                </View>

                {/* Confirmation Checkbox */}
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={toggleCheckbox}
                  android_ripple={{color: '#f0f0f0'}}>
                  <View style={[styles.checkbox, isChecked && styles.checked]}>
                    {isChecked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxText}>
                    I understand that deleting my account is permanent and all
                    of my data will be erased.
                  </Text>
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    (!isChecked || isDeleting) && styles.deleteButtonDisabled,
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={!isChecked || isDeleting}
                  android_ripple={{color: 'rgba(255,255,255,0.3)'}}>
                  <Text style={styles.deleteButtonText}>
                    {isDeleting ? 'Deleting Account...' : 'Delete My Account'}
                  </Text>
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => navigation.goBack()}
                  android_ripple={{color: '#f0f0f0'}}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 50, // Less padding on Android
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.OS === 'android' ? 20 : 24, // Less padding on Android
    paddingBottom: Platform.OS === 'ios' ? 20 : 16, // Less padding on Android
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20, // Add border radius for better touch feedback
    minHeight: 44, // Add minimum touch target
    minWidth: 44, // Add minimum touch target
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'NunitoSans12pt-Bold',
    textTransform: 'uppercase',
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Platform.OS === 'android' ? 20 : 24, // Less padding on Android
    paddingBottom: Platform.OS === 'android' ? 50 : 40, // More padding on Android for keyboard
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: Platform.OS === 'android' ? 20 : 24, // Less padding on Android
    shadowColor: '#000', // Add shadow for better visual depth
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warningTitle: {
    fontSize: Platform.select({ios: 20, android: 19}), // Slightly smaller on Android
    fontWeight: '700',
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'NunitoSans12pt-Bold',
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
  warningText: {
    fontSize: Platform.select({ios: 16, android: 15}),
    color: '#333',
    lineHeight: Platform.select({ios: 24, android: 22}),
    marginBottom: Platform.OS === 'ios' ? 20 : 18, // Less margin on Android
    fontFamily: 'NunitoSans12pt-Regular',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  bulletPoints: {
    marginBottom: Platform.OS === 'ios' ? 30 : 25, // Less margin on Android
  },
  bulletPoint: {
    fontSize: Platform.select({ios: 14, android: 13}), // Slightly smaller on Android
    color: '#333',
    lineHeight: Platform.select({ios: 22, android: 20}), // Adjust line height
    marginBottom: 8,
    fontFamily: 'NunitoSans12pt-Regular',
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingVertical: 5, // Add padding for better touch area
    minHeight: 44, // Add minimum touch target
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
    minWidth: 33, // Add minimum touch target
    minHeight: 33, // Add minimum touch target
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
    fontSize: Platform.select({ios: 14, android: 13}), // Slightly smaller on Android
    color: '#333',
    lineHeight: Platform.select({ios: 20, android: 18}), // Adjust line height
    fontFamily: 'NunitoSans12pt-Regular',
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    paddingVertical: Platform.OS === 'android' ? 14 : 16, // Slightly less padding on Android
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 50, // Add minimum height
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
    fontSize: Platform.select({ios: 16, android: 15}), // Slightly smaller on Android
    fontWeight: '700',
    fontFamily: 'NunitoSans12pt-Bold',
    textAlign: 'center',
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16, // Change back from Platform.OS === 'android' ? 14 : 16
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    minHeight: 50,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: Platform.select({ios: 16, android: 15}), // Slightly smaller on Android
    fontWeight: '600',
    fontFamily: 'NunitoSans12pt-Bold',
    textAlign: 'center',
    includeFontPadding: false, // Add for Android
    textAlignVertical: 'center', // Add for Android
  },
});

export default DeleteMyAccount;
