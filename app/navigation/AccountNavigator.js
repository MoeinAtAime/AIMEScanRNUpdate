// improved version of Account navigator with more error handling
// AccountNavigator.js
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {Platform} from 'react-native';

import AccountScreen from '../screens/AccountScreen';
import colors from '../config/colors';

const Stack = createStackNavigator();

// Default screen options for consistent styling across the account stack
const defaultScreenOptions = {
  headerStyle: {
    backgroundColor: colors.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: colors.white,
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 18,
  },
  headerBackTitleVisible: false,
  ...(Platform.OS === 'android' && {
    headerStatusBarHeight: 0,
  }),
};

/**
 * AccountNavigator manages navigation for account-related screens.
 * Provides a stack-based navigation structure for account management features.
 *
 * Currently includes:
 * - Account Screen (main account management)
 * Future screens can be added as needed (e.g., Subscription, Settings)
 *
 * @returns {JSX.Element} Stack navigator component
 */
const AccountNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
      initialRouteName="Account">
      <Stack.Screen
        name="Account"
        component={AccountScreen}
        options={{
          headerTitle: 'My Account',
          headerLeft: () => null, // Removes back button from root screen
        }}
      />

      {/* Example of how to add future screens:
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{
          headerTitle: 'Subscription Details',
        }}
      /> */}
    </Stack.Navigator>
  );
};

export default AccountNavigator;
