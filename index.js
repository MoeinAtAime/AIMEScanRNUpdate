////////////New Improved
/**
 * @format
 */
import {AppRegistry, LogBox} from 'react-native';
import {Amplify} from 'aws-amplify';
import awsconfig from './src/aws-exports';
import App from './App';
import {name as appName} from './app.json';

// Import only what you need from Firebase
import messaging from '@react-native-firebase/messaging';

// Environment configuration
const IS_DEV = __DEV__;

// Silence deprecation warnings to avoid noise
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

// Configure LogBox
if (IS_DEV) {
  LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
  ]);
} else {
  LogBox.ignoreAllLogs();
}

// Configure Amplify
Amplify.configure({
  ...awsconfig,
  Auth: {
    ...awsconfig.Auth,
    mandatorySignIn: true,
  },
});

// Setup background message handler - simple and clean
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[BackgroundMessage] Received:', remoteMessage?.messageId);

  // Keep processing minimal
  const {data} = remoteMessage || {};
  if (data?.type) {
    console.log(`[BackgroundMessage] Type: ${data.type}`);
  }
});

AppRegistry.registerComponent(appName, () => App);
