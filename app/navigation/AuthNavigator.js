//////////////Font Increase Limit Fix

// AuthNavigator.js
import React from 'react';
import {Platform, Text} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';

import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import AppNavigator from '../navigation/AppNavigator';
import WelcomeScreen from '../screens/WelcomeScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ConfirmationScreen from '../screens/ConfirmationScreen';
import NewPasswordScreen from '../screens/NewPasswordScreen';

const Stack = createStackNavigator();

const defaultScreenOptions = {
  headerStyle: {
    backgroundColor: '#2196F3',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTintColor: '#FFFFFF',
  headerTitleAlign: 'center',
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 18,
    includeFontPadding: false, // Fix for Android font padding
    allowFontScaling: false, // Prevents scaling with system font size
  },
  ...(Platform.OS === 'ios' && {
    headerBackTitleVisible: false,
  }),
  headerShadowVisible: true,
};

/**
 * AuthNavigator manages the authentication flow including welcome screen,
 * login, registration, password reset, and transition to main application.
 *
 * Navigation Flow:
 * Welcome -> Login/Register
 * Login -> App/Reset Password
 * Register -> App
 * Reset Password -> Login
 */
const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={defaultScreenOptions}
    initialRouteName="WelcomeScreen">
    <Stack.Screen
      name="WelcomeScreen"
      component={WelcomeScreen}
      options={{
        headerShown: false,
        gestureEnabled: false,
      }}
    />
    <Stack.Screen
      name="Log in"
      component={LoginScreen}
      options={{
        headerTitle: () => (
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#FFFFFF',
            }}>
            Log In
          </Text>
        ),
        gestureEnabled: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    />
    <Stack.Screen
      name="Confirmation"
      component={ConfirmationScreen}
      options={{
        headerTitle: () => (
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#FFFFFF',
            }}>
            Verify Account
          </Text>
        ),
        gestureEnabled: false,
      }}
    />
    <Stack.Screen
      name="NewPassword"
      component={NewPasswordScreen}
      options={{
        headerTitle: () => (
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#FFFFFF',
            }}>
            Set New Password
          </Text>
        ),
        gestureEnabled: false,
      }}
    />
    <Stack.Screen
      name="Reset Password"
      component={ResetPasswordScreen}
      options={{
        headerTitle: () => (
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#FFFFFF',
            }}>
            Reset Password
          </Text>
        ),
        gestureEnabled: false,
      }}
    />
    <Stack.Screen
      name="AppNavigator"
      component={AppNavigator}
      options={{
        headerShown: false,
        gestureEnabled: false,
      }}
    />
  </Stack.Navigator>
);

export default AuthNavigator;
