/////////////New improved

// App.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  Suspense,
  startTransition,
} from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Text,
  TextInput,
  ErrorBoundary,
} from 'react-native';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AlertNotificationRoot} from 'react-native-alert-notification';

import AuthContext, {AuthContextType} from './app/auth/context';
import AuthNavigator from './app/navigation/AuthNavigator';
import AppNavigator from './app/navigation/AppNavigator';
import LoadingScreen from './app/screens/LoadingScreen';
import ErrorFallback from './app/components/ErrorFallback';

import {useAuth} from './app/hooks/useAuth';
import {useNotifications} from './app/hooks/useNotifications';
import {useFadeAnimation} from './app/hooks/useFadeAnimation';
import {setNavigationRef} from './app/utils/notifications';

// Prevent font scaling globally (moved to a separate utility)
import './app/utils/globalTextConfig';

// Error Boundary Component
class AppErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback: React.ComponentType<{error: Error; retry: () => void}>;
  },
  {hasError: boolean; error: Error | null}
> {
  constructor(props: any) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error: Error) {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary:', error, errorInfo);
    // Log to crash analytics service
  }

  retry = () => {
    this.setState({hasError: false, error: null});
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent error={this.state.error!} retry={this.retry} />;
    }
    return this.props.children;
  }
}

// Main App Component
function AppContent(): React.ReactElement {
  const navRef = useRef<NavigationContainerRef<any>>(null);

  // Custom hooks for cleaner separation of concerns
  const {user, setUser, isInitializing, error, refreshAuth} = useAuth();
  const {setupNotifications, cleanupNotifications} = useNotifications(user);
  const {fadeAnim, startFadeOut} = useFadeAnimation();

  const [minLoadingTimeComplete, setMinLoadingTimeComplete] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Minimum loading delay with cleanup
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setMinLoadingTimeComplete(true);
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Determine when app is ready
  useEffect(() => {
    if (!isInitializing && minLoadingTimeComplete) {
      startTransition(() => {
        setIsReady(true);
      });
    }
  }, [isInitializing, minLoadingTimeComplete]);

  // Fade out animation once ready
  useEffect(() => {
    if (!isReady) return;

    const fadeTimer = setTimeout(() => {
      startFadeOut();
    }, 100);

    return () => clearTimeout(fadeTimer);
  }, [isReady, startFadeOut]);

  // Setup navigation ref
  useEffect(() => {
    if (navRef.current) {
      setNavigationRef(navRef.current);
    }
  }, []);

  // Setup notifications
  useEffect(() => {
    const cleanup = setupNotifications();
    return () => {
      cleanup();
      if (!user) {
        cleanupNotifications();
      }
    };
  }, [user, setupNotifications, cleanupNotifications]);

  // Memoize auth context value to prevent unnecessary re-renders
  const authContextValue = useMemo<AuthContextType>(
    () => ({
      user,
      setUser,
      refreshAuth,
      isAuthenticated: !!user,
    }),
    [user, setUser, refreshAuth],
  );

  // Loading state
  if (!isReady) {
    return (
      <Animated.View style={[styles.fullScreen, {opacity: fadeAnim}]}>
        <LoadingScreen />
      </Animated.View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={refreshAuth}>
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.fullScreen,
        {
          opacity: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
        },
      ]}>
      <AlertNotificationRoot>
        <SafeAreaProvider>
          <AuthContext.Provider value={authContextValue}>
            <NavigationContainer
              ref={navRef}
              onReady={() => console.log('Navigation is ready')}
              fallback={<LoadingScreen />}>
              <Suspense fallback={<LoadingScreen />}>
                {user ? <AppNavigator /> : <AuthNavigator />}
              </Suspense>
            </NavigationContainer>
          </AuthContext.Provider>
        </SafeAreaProvider>
      </AlertNotificationRoot>
    </Animated.View>
  );
}

export default function App(): React.ReactElement {
  return (
    <AppErrorBoundary fallback={ErrorFallback}>
      <AppContent />
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  retryText: {
    color: '#007bff',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
    padding: 10,
  },
});
