// notifications.ts

import {
  getMessaging,
  requestPermission,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
  isDeviceRegisteredForRemoteMessages,
  registerDeviceForRemoteMessages,
  deleteToken as messagingDeleteToken,
} from '@react-native-firebase/messaging';
import {getApp} from '@react-native-firebase/app';
import {Platform, PermissionsAndroid} from 'react-native';
import {ALERT_TYPE, Toast} from 'react-native-alert-notification';
import {Image} from 'react-native';
import colors from '../config/colors';

// Replace with your real backend API implementation
const api = {
  async savePushToken(args: {
    userId?: string,
    token: string,
    platform: string,
    deviceId?: string,
    appVersion?: string,
  }) {
    // e.g. POST to your server
  },
  async deletePushToken(args: {userId?: string, token: string}) {
    // e.g. DELETE in your server
  },
};

let navigationRef: any = null;
export function setNavigationRef(ref: any) {
  navigationRef = ref;
}

const SCREEN_WHITELIST = new Set([
  'MeasureScreen',
  'ResultsScreen',
  'SubscriptionsScreen',
  // add other allowed push navigation screens
]);

function safeNavigateFromPush(data: any) {
  const screen = data?.screen;
  if (!navigationRef || !screen || !SCREEN_WHITELIST.has(screen)) return;
  let params = data?.params;
  if (typeof params === 'string') {
    try {
      params = JSON.parse(params);
    } catch {
      // ignore parse error
    }
  }
  navigationRef.navigate(screen, params);
}

export async function requestUserPermission(): Promise<boolean> {
  try {
    const app = getApp();
    const messaging = getMessaging(app);

    if (Platform.OS === 'ios') {
      const status = await requestPermission(messaging);
      return status >= 1; // authorized or provisional
    }

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  } catch (error) {
    console.warn('requestUserPermission error:', error);
    return false;
  }
}

export async function getFCMToken(
  options: {
    userId?: string,
    deviceId?: string,
    appVersion?: string,
  } = {},
): Promise<string | null> {
  try {
    const app = getApp();
    const messaging = getMessaging(app);

    const registered = await isDeviceRegisteredForRemoteMessages(messaging);
    if (!registered) {
      await registerDeviceForRemoteMessages(messaging);
    }

    const token = await getToken(messaging);
    if (!token) {
      console.warn('No FCM token obtained');
      return null;
    }

    if (options.userId) {
      try {
        await api.savePushToken({
          userId: options.userId,
          token,
          platform: Platform.OS,
          deviceId: options.deviceId,
          appVersion: options.appVersion,
        });
      } catch (e) {
        console.warn('Error saving push token to backend:', e);
      }
    }

    return token;
  } catch (error) {
    console.error('Error in getFCMToken:', error);
    return null;
  }
}

export function subscribeTokenRefresh(
  onRotate: (newToken: string) => Promise<void> | void,
): () => void {
  const app = getApp();
  const messaging = getMessaging(app);
  const unsub = onTokenRefresh(messaging, async (newToken: string) => {
    try {
      await onRotate(newToken);
    } catch (e) {
      console.error('Token refresh handler error:', e);
    }
  });
  return () => {
    try {
      unsub();
    } catch {
      // ignore
    }
  };
}

export function setupMessageListeners(): () => void {
  const app = getApp();
  const messaging = getMessaging(app);

  let unsubOpened: (() => void) | undefined;
  let unsubForeground: (() => void) | undefined;

  try {
    unsubOpened = onNotificationOpenedApp(messaging, remoteMessage => {
      console.log('[Push] Opened from background:', remoteMessage?.messageId);
      safeNavigateFromPush(remoteMessage?.data);
    });
  } catch (e) {
    console.warn('onNotificationOpenedApp error:', e);
  }

  // Handle app opened from killed (quit) state
  getInitialNotification(messaging)
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('[Push] Opened from quit state:', remoteMessage?.messageId);
        safeNavigateFromPush(remoteMessage?.data);
      }
    })
    .catch(e => {
      console.warn('getInitialNotification error:', e);
    });

  try {
    unsubForeground = onMessage(messaging, remoteMessage => {
      console.log('[Push] Foreground message:', remoteMessage?.messageId);
      const {title, body} = remoteMessage.notification ?? {};
      if (title || body) {
        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: title ?? 'Notification',
          textBody: body ?? '',
          autoClose: false,
          onPress: () => safeNavigateFromPush(remoteMessage?.data),
          titleStyle: {fontSize: 16, fontWeight: 'bold'},
          textBodyStyle: {fontSize: 14},
          backgroundColor: colors.primary,
          icon: (
            <Image
              source={require('../assets/Aime_Icon_Round_White_36ppi.png')}
              style={{width: 32, height: 32}}
            />
          ),
        });
      }
    });
  } catch (e) {
    console.warn('onMessage error:', e);
  }

  return () => {
    try {
      unsubOpened?.();
    } catch {
      // ignore
    }
    try {
      unsubForeground?.();
    } catch {
      // ignore
    }
  };
}

export async function logoutPushCleanup(options: {userId?: string} = {}) {
  try {
    const app = getApp();
    const messaging = getMessaging(app);

    const token = await getToken(messaging).catch(() => null);
    if (token && options.userId) {
      try {
        await api.deletePushToken({userId: options.userId, token});
      } catch (e) {
        console.warn('Error deleting token from backend:', e);
      }
    }

    await messagingDeleteToken(messaging).catch(e => {
      console.warn('Error deleting token locally:', e);
    });
  } catch (e) {
    console.error('logoutPushCleanup error:', e);
  }
}
