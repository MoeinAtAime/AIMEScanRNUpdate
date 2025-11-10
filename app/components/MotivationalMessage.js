/////////////////Font Increase Limit Fix

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../config/colors';

const STORAGE_KEYS = {
  SCAN_RESULTS: 'scanResults',
};

// Centralized caps for Dynamic Type
const FONT_CAPS = {
  message: 1.15, // main line
  count: 1.1, // secondary/count line
  loading: 1.1, // loading message
};

const MotivationalMessage = ({
  onScanCountUpdate,
  size = 'medium', // small, medium, large
  theme = 'light', // light, dark
  showScanCount = false,
  customStyles = {},
  animationEnabled = true,
}) => {
  const [dailyScanCount, setDailyScanCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
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
  const isTablet = dimensions.width >= 768;
  const isLandscape = dimensions.width > dimensions.height;

  // Base scaling function
  const getScaledSize = baseSize => {
    if (isTablet) return baseSize * 1.3;
    if (isSmallScreen) return baseSize * 0.85;
    if (isMediumScreen) return baseSize;
    return baseSize * 1.1;
  };

  // Size configurations
  const sizeConfigs = {
    small: {
      containerPadding: getScaledSize(12),
      marginBottom: getScaledSize(8),
      messageSize: getScaledSize(14),
      countSize: getScaledSize(11),
      loadingSize: getScaledSize(12),
      lineHeight: getScaledSize(18),
      countLineHeight: getScaledSize(14),
      spacing: getScaledSize(2),
    },
    medium: {
      containerPadding: getScaledSize(15),
      marginBottom: getScaledSize(12),
      messageSize: getScaledSize(16),
      countSize: getScaledSize(13),
      loadingSize: getScaledSize(14),
      lineHeight: getScaledSize(22),
      countLineHeight: getScaledSize(16),
      spacing: getScaledSize(4),
    },
    large: {
      containerPadding: getScaledSize(20),
      marginBottom: getScaledSize(18),
      messageSize: getScaledSize(20),
      countSize: getScaledSize(16),
      loadingSize: getScaledSize(18),
      lineHeight: getScaledSize(28),
      countLineHeight: getScaledSize(20),
      spacing: getScaledSize(6),
    },
  };

  const currentConfig = sizeConfigs[size] || sizeConfigs.medium;

  // Theme configurations
  const themes = {
    light: {
      messageColor: colors.primaryColor || '#00AA00',
      countColor: colors.secondary || '#666666',
      loadingColor: colors.medium || '#999999',
      backgroundColor: 'transparent',
    },
    dark: {
      messageColor: colors.primaryColor || '#00CC00',
      countColor: '#cccccc',
      loadingColor: '#aaaaaa',
      backgroundColor: 'transparent',
    },
  };

  const currentTheme = themes[theme] || themes.light;

  const getMotivationalMessage = useCallback(scanCount => {
    const messages = {
      0: [
        "No scans yet? Let's fix that!",
        'Ready to start your health journey?',
        'Your first scan awaits!',
        'Time to begin tracking your wellness!',
      ],
      1: [
        'One down, two to go!',
        'Great start! Keep the momentum!',
        'First scan complete - nice work!',
        "You're on your way!",
      ],
      2: [
        'Just one more scan. Finish strong!',
        'Two down, one to go!',
        'Almost there - stay consistent!',
        "You're doing amazing!",
      ],
      3: [
        'Triple win! Keep the streak alive!',
        'Perfect daily goal achieved!',
        "Three scans - you're unstoppable!",
        'Daily target smashed!',
      ],
      default: [
        'You are the champion!',
        'Incredible dedication!',
        'Health tracking superstar!',
        "You're setting the standard!",
      ],
    };

    const messageArray = messages[scanCount] || messages.default;

    // Rotate message by day of year for variety
    const dayOfYear = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) /
        (1000 * 60 * 60 * 24),
    );
    const messageIndex = dayOfYear % messageArray.length;

    return messageArray[messageIndex];
  }, []);

  const fetchTodayScanCount = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_RESULTS);
      if (data) {
        const parsedData = JSON.parse(data);
        const today = new Date().toLocaleDateString('en-US');

        const todayScans = parsedData.filter(scan => {
          const scanDate = new Date(scan.timeStamp).toLocaleDateString('en-US');
          return scanDate === today;
        });

        setDailyScanCount(todayScans.length);
        onScanCountUpdate?.(todayScans.length);
      } else {
        setDailyScanCount(0);
        onScanCountUpdate?.(0);
      }
    } catch (error) {
      console.error('Error retrieving scan data:', error);
      setDailyScanCount(0);
      onScanCountUpdate?.(0);
    } finally {
      setIsLoading(false);
    }
  }, [onScanCountUpdate]);

  useEffect(() => {
    fetchTodayScanCount();
  }, [fetchTodayScanCount]);

  // Dynamic styles based on screen size, platform, and theme
  const responsiveStyles = StyleSheet.create({
    container: {
      alignItems: 'center',
      marginBottom: currentConfig.marginBottom,
      paddingHorizontal: currentConfig.containerPadding,
      backgroundColor: currentTheme.backgroundColor,
      ...(isLandscape && {
        paddingHorizontal: currentConfig.containerPadding * 1.5,
      }),
    },
    messageText: {
      fontSize: currentConfig.messageSize,
      fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
      textAlign: 'center',
      color: currentTheme.messageColor,
      marginBottom: currentConfig.spacing,
      lineHeight: currentConfig.lineHeight,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
      includeFontPadding: false,
      textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
      ...(isTablet && {maxWidth: 600}),
      ...(isSmallScreen && {flexShrink: 1}),
    },
    countText: {
      fontSize: currentConfig.countSize,
      fontWeight: Platform.OS === 'ios' ? '500' : 'normal',
      textAlign: 'center',
      color: currentTheme.countColor,
      lineHeight: currentConfig.countLineHeight,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      includeFontPadding: false,
      textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
      marginTop: currentConfig.spacing,
    },
    loadingText: {
      fontSize: currentConfig.loadingSize,
      fontWeight: Platform.OS === 'ios' ? '500' : 'normal',
      textAlign: 'center',
      color: currentTheme.loadingColor,
      lineHeight: currentConfig.lineHeight,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      includeFontPadding: false,
      textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: getScaledSize(8),
    },
    activityIndicator: {
      transform: [{scale: isTablet ? 1.2 : isSmallScreen ? 0.8 : 1}],
    },
  });

  if (isLoading) {
    return (
      <View style={[responsiveStyles.container, customStyles.container]}>
        <View style={responsiveStyles.loadingContainer}>
          {animationEnabled && (
            <ActivityIndicator
              size={isTablet ? 'large' : 'small'}
              color={currentTheme.loadingColor}
              style={responsiveStyles.activityIndicator}
            />
          )}
          <Text
            style={[responsiveStyles.loadingText, customStyles.loadingText]}
            allowFontScaling
            maxFontSizeMultiplier={FONT_CAPS.loading}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  const message = getMotivationalMessage(dailyScanCount);

  return (
    <View
      style={[responsiveStyles.container, customStyles.container]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Motivational message: ${message}${
        showScanCount && dailyScanCount > 0
          ? `. Today's scan count: ${dailyScanCount}`
          : ''
      }`}>
      <Text
        style={[responsiveStyles.messageText, customStyles.messageText]}
        allowFontScaling
        maxFontSizeMultiplier={FONT_CAPS.message}>
        {message}
      </Text>

      {showScanCount && dailyScanCount > 0 && (
        <Text
          style={[responsiveStyles.countText, customStyles.countText]}
          allowFontScaling
          maxFontSizeMultiplier={FONT_CAPS.count}
          accessible
          accessibilityLabel={`You have completed ${dailyScanCount} scan${
            dailyScanCount === 1 ? '' : 's'
          } today`}>
          Today's scans: {dailyScanCount}
        </Text>
      )}
    </View>
  );
};

export default MotivationalMessage;

/* ===========================
   ForwardRef variant with limits
   =========================== */

export const MotivationalMessageWithRef = React.forwardRef((props, ref) => {
  const [dailyScanCount, setDailyScanCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  const {
    onScanCountUpdate,
    size = 'medium',
    theme = 'light',
    showScanCount = true, // default true here
    customStyles = {},
    animationEnabled = true,
  } = props;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Responsive calculations
  const isSmallScreen = dimensions.width < 375;
  const isMediumScreen = dimensions.width >= 375 && dimensions.width < 414;
  const isTablet = dimensions.width >= 768;
  const isLandscape = dimensions.width > dimensions.height;

  const getScaledSize = baseSize => {
    if (isTablet) return baseSize * 1.3;
    if (isSmallScreen) return baseSize * 0.85;
    if (isMediumScreen) return baseSize;
    return baseSize * 1.1;
  };

  const sizeConfigs = {
    small: {
      containerPadding: getScaledSize(12),
      marginBottom: getScaledSize(8),
      messageSize: getScaledSize(14),
      countSize: getScaledSize(11),
      loadingSize: getScaledSize(12),
      lineHeight: getScaledSize(18),
      countLineHeight: getScaledSize(14),
      spacing: getScaledSize(2),
    },
    medium: {
      containerPadding: getScaledSize(15),
      marginBottom: getScaledSize(12),
      messageSize: getScaledSize(16),
      countSize: getScaledSize(13),
      loadingSize: getScaledSize(14),
      lineHeight: getScaledSize(22),
      countLineHeight: getScaledSize(16),
      spacing: getScaledSize(4),
    },
    large: {
      containerPadding: getScaledSize(20),
      marginBottom: getScaledSize(18),
      messageSize: getScaledSize(20),
      countSize: getScaledSize(16),
      loadingSize: getScaledSize(18),
      lineHeight: getScaledSize(28),
      countLineHeight: getScaledSize(20),
      spacing: getScaledSize(6),
    },
  };

  const currentConfig = sizeConfigs[size] || sizeConfigs.medium;

  const themes = {
    light: {
      messageColor: colors.primaryColor || '#00AA00',
      countColor: colors.secondary || '#666666',
      loadingColor: colors.medium || '#999999',
      backgroundColor: 'transparent',
    },
    dark: {
      messageColor: colors.primaryColor || '#00CC00',
      countColor: '#cccccc',
      loadingColor: '#aaaaaa',
      backgroundColor: 'transparent',
    },
  };

  const currentTheme = themes[theme] || themes.light;

  const getMotivationalMessage = useCallback(scanCount => {
    const messages = {
      0: [
        "No scans yet? Let's fix that!",
        'Ready to start your health journey?',
        'Your first scan awaits!',
        'Time to begin tracking your wellness!',
      ],
      1: [
        'One down, two to go!',
        'Great start! Keep the momentum!',
        'First scan complete - nice work!',
        "You're on your way!",
      ],
      2: [
        'Just one more scan. Finish strong!',
        'Two down, one to go!',
        'Almost there - stay consistent!',
        "You're doing amazing!",
      ],
      3: [
        'Triple win! Keep the streak alive!',
        'Perfect daily goal achieved!',
        "Three scans - you're unstoppable!",
        'Daily target smashed!',
      ],
      default: [
        'You are the champion!',
        'Incredible dedication!',
        'Health tracking superstar!',
        "You're setting the standard!",
      ],
    };

    const messageArray = messages[scanCount] || messages.default;
    const dayOfYear = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) /
        (1000 * 60 * 60 * 24),
    );
    const messageIndex = dayOfYear % messageArray.length;

    return messageArray[messageIndex];
  }, []);

  const fetchTodayScanCount = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_RESULTS);
      if (data) {
        const parsedData = JSON.parse(data);
        const today = new Date().toLocaleDateString('en-US');

        const todayScans = parsedData.filter(scan => {
          const scanDate = new Date(scan.timeStamp).toLocaleDateString('en-US');
          return scanDate === today;
        });

        setDailyScanCount(todayScans.length);
        onScanCountUpdate?.(todayScans.length);
      } else {
        setDailyScanCount(0);
        onScanCountUpdate?.(0);
      }
    } catch (error) {
      console.error('Error retrieving scan data:', error);
      setDailyScanCount(0);
      onScanCountUpdate?.(0);
    } finally {
      setIsLoading(false);
    }
  }, [onScanCountUpdate]);

  useEffect(() => {
    fetchTodayScanCount();
  }, [fetchTodayScanCount]);

  React.useImperativeHandle(ref, () => ({
    refreshScanCount: fetchTodayScanCount,
    getScanCount: () => dailyScanCount,
    isLoading: () => isLoading,
  }));

  const responsiveStyles = StyleSheet.create({
    container: {
      alignItems: 'center',
      marginBottom: currentConfig.marginBottom,
      paddingHorizontal: currentConfig.containerPadding,
      backgroundColor: currentTheme.backgroundColor,
      ...(isLandscape && {
        paddingHorizontal: currentConfig.containerPadding * 1.5,
      }),
    },
    messageText: {
      fontSize: currentConfig.messageSize,
      fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
      textAlign: 'center',
      color: currentTheme.messageColor,
      marginBottom: currentConfig.spacing,
      lineHeight: currentConfig.lineHeight,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
      includeFontPadding: false,
      textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
      ...(isTablet && {maxWidth: 600}),
      ...(isSmallScreen && {flexShrink: 1}),
    },
    countText: {
      fontSize: currentConfig.countSize,
      fontWeight: Platform.OS === 'ios' ? '500' : 'normal',
      textAlign: 'center',
      color: currentTheme.countColor,
      lineHeight: currentConfig.countLineHeight,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      includeFontPadding: false,
      textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
      marginTop: currentConfig.spacing,
    },
    loadingText: {
      fontSize: currentConfig.loadingSize,
      fontWeight: Platform.OS === 'ios' ? '500' : 'normal',
      textAlign: 'center',
      color: currentTheme.loadingColor,
      lineHeight: currentConfig.lineHeight,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      includeFontPadding: false,
      textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: getScaledSize(8),
    },
    activityIndicator: {
      transform: [{scale: isTablet ? 1.2 : isSmallScreen ? 0.8 : 1}],
    },
  });

  if (isLoading) {
    return (
      <View style={[responsiveStyles.container, customStyles.container]}>
        <View style={responsiveStyles.loadingContainer}>
          {animationEnabled && (
            <ActivityIndicator
              size={isTablet ? 'large' : 'small'}
              color={currentTheme.loadingColor}
              style={responsiveStyles.activityIndicator}
            />
          )}
          <Text
            style={[responsiveStyles.loadingText, customStyles.loadingText]}
            allowFontScaling
            maxFontSizeMultiplier={FONT_CAPS.loading}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  const message = getMotivationalMessage(dailyScanCount);

  return (
    <View
      style={[responsiveStyles.container, customStyles.container]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Motivational message: ${message}${
        showScanCount && dailyScanCount > 0
          ? `. Today's scan count: ${dailyScanCount}`
          : ''
      }`}>
      <Text
        style={[responsiveStyles.messageText, customStyles.messageText]}
        allowFontScaling
        maxFontSizeMultiplier={FONT_CAPS.message}>
        {message}
      </Text>

      {showScanCount && dailyScanCount > 0 && (
        <Text
          style={[responsiveStyles.countText, customStyles.countText]}
          allowFontScaling
          maxFontSizeMultiplier={FONT_CAPS.count}
          accessible
          accessibilityLabel={`You have completed ${dailyScanCount} scan${
            dailyScanCount === 1 ? '' : 's'
          } today`}>
          Today's scans: {dailyScanCount}
        </Text>
      )}
    </View>
  );
});
