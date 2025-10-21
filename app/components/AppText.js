// AppText - A custom Text component for consistent styling throughout the app
import React, {useState, useEffect} from 'react';
import {Text, Dimensions, Platform} from 'react-native';
import defaultStyles from '../config/styles';

/**
 * AppText - A responsive styled text component for consistent typography
 *
 * @param {React.ReactNode} children - The text content to display
 * @param {object} style - Additional custom styles for the text
 * @param {string} variant - Text style variant: "h1", "h2", "h3", "h4", "body", "caption", "small" (default: "body")
 * @param {string} weight - Font weight: "light", "normal", "medium", "semibold", "bold" (default: "normal")
 * @param {string} color - Text color key from colors config or direct color value
 * @param {string} align - Text alignment: "left", "center", "right", "justify" (default: "left")
 * @param {number} numberOfLines - Maximum number of lines to display
 * @param {boolean} adjustsFontSizeToFit - Whether to adjust font size to fit (iOS only)
 * @param {number} minimumFontScale - Minimum scale factor for font size adjustment (iOS only)
 * @param {boolean} allowFontScaling - Whether to respect user's font size settings (default: true)
 * @param {boolean} accessible - Whether the text is accessible (default: true)
 * @param {string} accessibilityRole - Accessibility role for screen readers
 *
 * @returns {JSX.Element} - Rendered Text component with responsive and platform-specific styling
 */
const AppText = ({
  children,
  style = {},
  variant = 'body',
  weight = 'normal',
  color,
  align = 'left',
  numberOfLines,
  adjustsFontSizeToFit = false,
  minimumFontScale = 0.8,
  allowFontScaling = true,
  accessible = true,
  accessibilityRole,
  ...props
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
    return size * 1.05;
  };

  // Text variant configurations
  const variants = {
    h1: {
      fontSize: getScaledSize(Platform.OS === 'ios' ? 32 : 30),
      lineHeight: getScaledSize(Platform.OS === 'ios' ? 40 : 38),
      fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    },
    h2: {
      fontSize: getScaledSize(Platform.OS === 'ios' ? 28 : 26),
      lineHeight: getScaledSize(Platform.OS === 'ios' ? 36 : 34),
      fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    },
    h3: {
      fontSize: getScaledSize(Platform.OS === 'ios' ? 24 : 22),
      lineHeight: getScaledSize(Platform.OS === 'ios' ? 32 : 30),
      fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    },
    h4: {
      fontSize: getScaledSize(Platform.OS === 'ios' ? 20 : 18),
      lineHeight: getScaledSize(Platform.OS === 'ios' ? 28 : 26),
      fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    },
    body: {
      fontSize: getScaledSize(Platform.OS === 'ios' ? 16 : 14),
      lineHeight: getScaledSize(Platform.OS === 'ios' ? 24 : 22),
      fontWeight: Platform.OS === 'ios' ? '400' : 'normal',
    },
    caption: {
      fontSize: getScaledSize(Platform.OS === 'ios' ? 14 : 12),
      lineHeight: getScaledSize(Platform.OS === 'ios' ? 20 : 18),
      fontWeight: Platform.OS === 'ios' ? '400' : 'normal',
    },
    small: {
      fontSize: getScaledSize(Platform.OS === 'ios' ? 12 : 10),
      lineHeight: getScaledSize(Platform.OS === 'ios' ? 16 : 14),
      fontWeight: Platform.OS === 'ios' ? '400' : 'normal',
    },
  };

  // Font weight configurations
  const fontWeights = {
    light: Platform.OS === 'ios' ? '300' : 'normal',
    normal: Platform.OS === 'ios' ? '400' : 'normal',
    medium: Platform.OS === 'ios' ? '500' : 'normal',
    semibold: Platform.OS === 'ios' ? '600' : 'bold',
    bold: Platform.OS === 'ios' ? '700' : 'bold',
  };

  // Get platform-specific font family
  const getFontFamily = weight => {
    if (Platform.OS === 'ios') {
      return 'System';
    } else {
      // Android font families
      switch (weight) {
        case 'light':
          return 'sans-serif-light';
        case 'medium':
        case 'semibold':
          return 'sans-serif-medium';
        case 'bold':
          return 'sans-serif';
        default:
          return 'sans-serif';
      }
    }
  };

  // Color resolution (support both color keys and direct colors)
  const resolveColor = colorProp => {
    if (!colorProp) return undefined;

    // Check if it's a color key from defaultStyles or colors config
    if (defaultStyles.colors && defaultStyles.colors[colorProp]) {
      return defaultStyles.colors[colorProp];
    }

    // Return as direct color value
    return colorProp;
  };

  // Build responsive styles
  const currentVariant = variants[variant] || variants.body;
  const currentWeight = fontWeights[weight] || fontWeights.normal;

  const responsiveStyles = {
    ...currentVariant,
    fontWeight: currentWeight,
    fontFamily: getFontFamily(weight),
    textAlign: align,
    color: resolveColor(color),
    // Android-specific improvements
    includeFontPadding: false,
    textAlignVertical: Platform.OS === 'android' ? 'center' : undefined,
    // Ensure proper rendering on both platforms
    ...(Platform.OS === 'android' && {
      marginVertical: 0,
      paddingVertical: 0,
    }),
  };

  return (
    <Text
      style={[defaultStyles.text, responsiveStyles, style]}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={
        Platform.OS === 'ios' ? adjustsFontSizeToFit : undefined
      }
      minimumFontScale={Platform.OS === 'ios' ? minimumFontScale : undefined}
      allowFontScaling={allowFontScaling}
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      {...props}>
      {children}
    </Text>
  );
};

export default AppText;
