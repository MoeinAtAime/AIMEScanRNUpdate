// hooks/useNotifications.ts
import {useCallback, useRef} from 'react';
import {
  requestUserPermission,
  getFCMToken,
  setupMessageListeners,
  subscribeTokenRefresh,
  logoutPushCleanup,
} from '../utils/notifications';

interface UseNotificationsReturn {
  setupNotifications: () => () => void;
  cleanupNotifications: () => void;
}

export function useNotifications(
  userId: string | null,
): UseNotificationsReturn {
  const listenersRef = useRef<{
    unsubListeners?: () => void;
    unsubTokenRefresh?: () => void;
  }>({});

  const setupNotifications = useCallback(() => {
    let cleanup = () => {};

    const setup = async () => {
      try {
        const granted = await requestUserPermission();
        if (!granted) {
          console.log('User did not grant notification permission');
          return;
        }

        const token = await getFCMToken({userId: userId ?? undefined});
        // console.log('[FCM] token:', token);

        listenersRef.current.unsubListeners = setupMessageListeners();
        listenersRef.current.unsubTokenRefresh = subscribeTokenRefresh(
          async newToken => {
            // console.log('[FCM] token refreshed:', newToken);
            // Send new token to backend if needed
          },
        );

        cleanup = () => {
          listenersRef.current.unsubListeners?.();
          listenersRef.current.unsubTokenRefresh?.();
        };
      } catch (err) {
        console.error('Notification setup error:', err);
      }
    };

    setup();
    return cleanup;
  }, [userId]);

  const cleanupNotifications = useCallback(() => {
    if (userId) {
      logoutPushCleanup({userId});
    }
    listenersRef.current.unsubListeners?.();
    listenersRef.current.unsubTokenRefresh?.();
  }, [userId]);

  return {setupNotifications, cleanupNotifications};
}
