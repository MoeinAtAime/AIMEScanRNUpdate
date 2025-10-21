// Custom Button Component for App
import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import colors from '../config/colors';

/**
 * AppButton - A customizable responsive button component
 *
 * @param {string} title - Text to display on the button
 * @param {function} onPress - Callback function to handle button press
 * @param {string} color - Background color key from colors config (default: "primaryColor")
 * @param {string} size - Button size: "small", "medium", "large" (default: "medium")
 * @param {boolean} disabled - Whether the button is disabled (default: false)
 * @param {object} customStyle - Custom style overrides for the button
 * @param {object} customTextStyle - Custom style overrides for the text
 *
 * @returns {JSX.Element} - Rendered button component
 */
const AppButton = ({
  title,
  onPress,
  color = 'primaryColor',
  size = 'medium',
  disabled = false,
  customStyle = {},
  customTextStyle = {},
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

  // Base font scaling
  const getScaledSize = size => {
    if (isSmallScreen) return size * 0.9;
    if (isMediumScreen) return size;
    return size * 1.1;
  };

  // Size configurations
  const sizeConfig = {
    small: {
      paddingVertical: getScaledSize(Platform.OS === 'ios' ? 12 : 10),
      paddingHorizontal: getScaledSize(16),
      fontSize: getScaledSize(14),
      borderRadius: getScaledSize(12),
      marginVertical: getScaledSize(6),
    },
    medium: {
      paddingVertical: getScaledSize(Platform.OS === 'ios' ? 15 : 13),
      paddingHorizontal: getScaledSize(20),
      fontSize: getScaledSize(16),
      borderRadius: getScaledSize(15),
      marginVertical: getScaledSize(8),
    },
    large: {
      paddingVertical: getScaledSize(Platform.OS === 'ios' ? 18 : 16),
      paddingHorizontal: getScaledSize(24),
      fontSize: getScaledSize(18),
      borderRadius: getScaledSize(18),
      marginVertical: getScaledSize(10),
    },
  };

  const currentSize = sizeConfig[size] || sizeConfig.medium;

  // Dynamic styles based on screen size and platform
  const responsiveStyles = {
    button: {
      backgroundColor: disabled
        ? colors.disabled || '#cccccc'
        : colors[color] || colors.primaryColor,
      borderRadius: currentSize.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: currentSize.paddingVertical,
      paddingHorizontal: currentSize.paddingHorizontal,
      width: '100%',
      marginVertical: currentSize.marginVertical,
      opacity: disabled ? 0.6 : 1,
      // Platform-specific shadow
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: disabled ? 0 : 0.1,
          shadowRadius: 3.84,
        },
        android: {
          elevation: disabled ? 0 : 2,
        },
      }),
      // Ensure proper touch target size (minimum 44x44 on iOS, 48x48 on Android)
      minHeight: Platform.OS === 'ios' ? 44 : 48,
    },
    text: {
      color: disabled
        ? colors.textDisabled || '#888888'
        : colors.white || '#ffffff',
      fontSize: currentSize.fontSize,
      textTransform: 'uppercase',
      fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
      textAlign: 'center',
      // Android-specific text alignment
      includeFontPadding: false,
      textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
      // Responsive line height
      lineHeight: currentSize.fontSize * (Platform.OS === 'ios' ? 1.2 : 1.3),
    },
  };

  return (
    <TouchableOpacity
      style={[responsiveStyles.button, customStyle]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
      // Accessibility improvements
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={disabled ? 'Button is disabled' : undefined}
      accessibilityState={{disabled}}>
      <Text style={[responsiveStyles.text, customTextStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default AppButton;
