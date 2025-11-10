/////////////////////////////////////Font Increase Limit Fix

// AppText.tsx — A custom Text component for consistent styling throughout the app
import React, {useState, useEffect} from 'react';
import {Text, Dimensions, Platform, TextProps} from 'react-native';
import defaultStyles from '../config/styles';

type AppTextProps = TextProps & {
  children: React.ReactNode,
  style?: any,
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'small',
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold',
  color?: string,
  align?: 'left' | 'center' | 'right' | 'justify',
  numberOfLines?: number,
  adjustsFontSizeToFit?: boolean,
  minimumFontScale?: number, // iOS only
  allowFontScaling?: boolean,
  maxFontSizeMultiplier?: number, // NEW: cap for font scaling
  accessible?: boolean,
  accessibilityRole?: TextProps['accessibilityRole'],
};

const AppText: React.FC<AppTextProps> = ({
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
  maxFontSizeMultiplier = 1.4, // default cap – scale up to 120%
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

  const getScaledSize = (size: number) => {
    if (isSmallScreen) return size * 0.9;
    if (isMediumScreen) return size;
    return size * 1.05;
  };

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

  const fontWeights = {
    light: Platform.OS === 'ios' ? '300' : 'normal',
    normal: Platform.OS === 'ios' ? '400' : 'normal',
    medium: Platform.OS === 'ios' ? '500' : 'normal',
    semibold: Platform.OS === 'ios' ? '600' : 'bold',
    bold: Platform.OS === 'ios' ? '700' : 'bold',
  };

  const getFontFamily = (w: string) => {
    if (Platform.OS === 'ios') return 'System';
    switch (w) {
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
  };

  const resolveColor = (colorProp?: string) => {
    if (!colorProp) return undefined;
    if (defaultStyles.colors && defaultStyles.colors[colorProp]) {
      return defaultStyles.colors[colorProp];
    }
    return colorProp;
  };

  const currentVariant = variants[variant] || variants.body;
  const currentWeight = fontWeights[weight] || fontWeights.normal;

  const responsiveStyles = {
    ...currentVariant,
    fontWeight: currentWeight,
    fontFamily: getFontFamily(weight),
    textAlign: align,
    color: resolveColor(color),
    includeFontPadding: false,
    textAlignVertical: Platform.OS === 'android' ? 'center' : undefined,
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
      maxFontSizeMultiplier={
        allowFontScaling ? maxFontSizeMultiplier : undefined
      }
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      {...props}>
      {children}
    </Text>
  );
};

export default AppText;
