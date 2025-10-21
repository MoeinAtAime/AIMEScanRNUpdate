// Screen - A responsive wrapper component that provides a safe area and padding for content
import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';

/**
 * Screen - A responsive component that wraps content in a safe area with customizable styling
 *
 * @param {React.ReactNode} children - The content to render inside the screen
 * @param {object} style - Additional styles to apply to the screen container
 * @param {object} containerStyle - Additional styles to apply to the inner container
 * @param {string} statusBarStyle - Status bar style: "light-content", "dark-content", "default" (default: "dark-content")
 * @param {string} statusBarBackgroundColor - Status bar background color (Android only)
 * @param {boolean} statusBarHidden - Whether to hide the status bar (default: false)
 * @param {boolean} statusBarTranslucent - Whether status bar is translucent (Android only, default: false)
 * @param {string} backgroundColor - Background color for the screen (default: "#fff")
 * @param {boolean} safeAreaEnabled - Whether to use SafeAreaView (default: true)
 * @param {Array<string>} safeAreaEdges - Which edges to apply safe area to (default: ['top', 'bottom', 'left', 'right'])
 * @param {string} padding - Padding variant: "none", "small", "medium", "large" (default: "medium")
 * @param {boolean} keyboardAware - Whether to adjust for keyboard (default: true)
 * @param {string} theme - Theme variant: "light", "dark" (default: "light")
 *
 * @returns {JSX.Element} - Rendered responsive safe area screen component
 */
const Screen = ({
  children,
  style = {},
  containerStyle = {},
  statusBarStyle = 'dark-content',
  statusBarBackgroundColor,
  statusBarHidden = false,
  statusBarTranslucent = false,
  backgroundColor = '#fff',
  safeAreaEnabled = true,
  safeAreaEdges = ['top', 'bottom', 'left', 'right'],
  padding = 'medium',
  keyboardAware = true,
  theme = 'light',
}) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Responsive calculations
  const isSmallScreen = dimensions.width < 375;
  const isMediumScreen = dimensions.width >= 375 && dimensions.width < 414;
  const isLargeScreen = dimensions.width >= 414;
  const isTablet = dimensions.width >= 768;
  const isLandscape = dimensions.width > dimensions.height;

  // Base scaling function
  const getScaledSize = baseSize => {
    if (isTablet) return baseSize * 1.2;
    if (isSmallScreen) return baseSize * 0.9;
    if (isMediumScreen) return baseSize;
    return baseSize * 1.05;
  };

  // Padding configurations
  const paddingConfigs = {
    none: {
      horizontal: 0,
      vertical: 0,
      top: 0,
      bottom: 0,
    },
    small: {
      horizontal: getScaledSize(12),
      vertical: getScaledSize(8),
      top: getScaledSize(8),
      bottom: getScaledSize(8),
    },
    medium: {
      horizontal: getScaledSize(16),
      vertical: getScaledSize(12),
      top: getScaledSize(12),
      bottom: getScaledSize(12),
    },
    large: {
      horizontal: getScaledSize(24),
      vertical: getScaledSize(20),
      top: getScaledSize(20),
      bottom: getScaledSize(20),
    },
  };

  const currentPadding = paddingConfigs[padding] || paddingConfigs.medium;

  // Theme configurations
  const themes = {
    light: {
      backgroundColor: backgroundColor || '#ffffff',
      statusBarStyle: statusBarStyle || 'dark-content',
      statusBarBackgroundColor: statusBarBackgroundColor || '#ffffff',
    },
    dark: {
      backgroundColor: backgroundColor || '#000000',
      statusBarStyle: statusBarStyle || 'light-content',
      statusBarBackgroundColor: statusBarBackgroundColor || '#000000',
    },
  };

  const currentTheme = themes[theme] || themes.light;

  // Calculate status bar height for different platforms and scenarios
  const getStatusBarHeight = () => {
    if (Platform.OS === 'ios') {
      // iOS automatically handles this with SafeAreaView
      return 0;
    } else {
      // Android - use StatusBar.currentHeight or fallback
      return statusBarTranslucent ? StatusBar.currentHeight || 24 : 0;
    }
  };

  // Calculate additional padding based on device characteristics
  const getAdditionalPadding = () => {
    let additionalPadding = {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    };

    // Add extra padding for landscape mode on phones
    if (isLandscape && !isTablet) {
      additionalPadding.paddingLeft = currentPadding.horizontal * 0.5;
      additionalPadding.paddingRight = currentPadding.horizontal * 0.5;
    }

    // Add extra padding for tablets
    if (isTablet) {
      additionalPadding.paddingLeft = currentPadding.horizontal * 0.5;
      additionalPadding.paddingRight = currentPadding.horizontal * 0.5;
    }

    // Handle notched devices (approximate detection)
    if (Platform.OS === 'ios' && dimensions.height >= 812) {
      // iPhone X and newer - SafeAreaView handles this, but we might need extra spacing
      additionalPadding.paddingBottom = isLandscape
        ? 0
        : currentPadding.bottom * 0.3;
    }

    return additionalPadding;
  };

  const additionalPadding = getAdditionalPadding();

  // Dynamic styles based on screen size, platform, and theme
  const responsiveStyles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: currentTheme.backgroundColor,
    },
    container: {
      flex: 1,
      paddingTop: Platform.select({
        ios: currentPadding.top,
        android: getStatusBarHeight() + currentPadding.top,
      }),
      paddingBottom: currentPadding.bottom + additionalPadding.paddingBottom,
      paddingHorizontal: currentPadding.horizontal,
      paddingLeft: currentPadding.horizontal + additionalPadding.paddingLeft,
      paddingRight: currentPadding.horizontal + additionalPadding.paddingRight,
      // Ensure proper layout on different screen sizes
      minHeight: '100%',
      // Handle keyboard aware layouts
      ...(keyboardAware &&
        Platform.OS === 'android' && {
          behavior: 'padding',
        }),
    },
    // Alternative container for when SafeAreaView is disabled
    containerNoSafeArea: {
      flex: 1,
      paddingTop: Platform.select({
        ios: currentPadding.top + (dimensions.height >= 812 ? 44 : 20), // Status bar height approximation
        android: getStatusBarHeight() + currentPadding.top,
      }),
      paddingBottom:
        Platform.select({
          ios:
            currentPadding.bottom +
            (isLandscape ? 0 : dimensions.height >= 812 ? 34 : 0), // Home indicator height
          android: currentPadding.bottom,
        }) + additionalPadding.paddingBottom,
      paddingHorizontal: currentPadding.horizontal,
      paddingLeft: currentPadding.horizontal + additionalPadding.paddingLeft,
      paddingRight: currentPadding.horizontal + additionalPadding.paddingRight,
      minHeight: '100%',
      ...(keyboardAware &&
        Platform.OS === 'android' && {
          behavior: 'padding',
        }),
    },
  });

  // Configure StatusBar props
  const statusBarProps = {
    barStyle: currentTheme.statusBarStyle,
    hidden: statusBarHidden,
    ...(Platform.OS === 'android' && {
      backgroundColor: currentTheme.statusBarBackgroundColor,
      translucent: statusBarTranslucent,
    }),
  };

  // Render with or without SafeAreaView based on props
  if (safeAreaEnabled) {
    return (
      <SafeAreaView
        style={[responsiveStyles.screen, style]}
        edges={safeAreaEdges}>
        <StatusBar {...statusBarProps} />
        <View
          style={[responsiveStyles.container, containerStyle]}
          accessible={false}>
          {children}
        </View>
      </SafeAreaView>
    );
  } else {
    return (
      <View style={[responsiveStyles.screen, style]}>
        <StatusBar {...statusBarProps} />
        <View
          style={[responsiveStyles.containerNoSafeArea, containerStyle]}
          accessible={false}>
          {children}
        </View>
      </View>
    );
  }
};

export default Screen;
