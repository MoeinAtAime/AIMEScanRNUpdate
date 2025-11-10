////////////////Font Increase Limit Fix

// components/AppButton.js
import React, {useState, useEffect} from 'react';
import {
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  View,
} from 'react-native';
import colors from '../config/colors';

const AppButton = ({
  title,
  onPress,
  color = 'primaryColor',
  size = 'medium',
  disabled = false,
  customStyle = {},
  customTextStyle = {},
  loading = false,
  // NEW:
  compact = false, // keeps height stable under large text
  fullWidth = true, // false makes it behave like a content-width button
}) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({window}) => {
      setDimensions(window);
    });
    return () => sub?.remove();
  }, []);

  const isSmall = dimensions.width < 375;
  const isMedium = dimensions.width >= 375 && dimensions.width < 414;
  const scale = v => (isSmall ? v * 0.9 : isMedium ? v : v * 1.1);

  const sizeConfig = {
    small: {
      pv: scale(Platform.OS === 'ios' ? 12 : 10),
      ph: scale(16),
      fs: scale(14),
      br: scale(12),
      mv: scale(6),
      mh: 44,
    },
    medium: {
      pv: scale(Platform.OS === 'ios' ? 14 : 12),
      ph: scale(18),
      fs: scale(16),
      br: scale(14),
      mv: scale(8),
      mh: 48,
    },
    large: {
      pv: scale(Platform.OS === 'ios' ? 16 : 14),
      ph: scale(22),
      fs: scale(18),
      br: scale(16),
      mv: scale(10),
      mh: 52,
    },
  };
  const S = sizeConfig[size] || sizeConfig.medium;

  // Compact mode: slightly less vertical padding to keep height stable
  const pv = compact ? Math.max(10, S.pv - 2) : S.pv;

  const backgroundColor =
    disabled || loading
      ? colors.disabled || '#cccccc'
      : colors[color] || colors.primaryColor;

  const buttonStyle = {
    backgroundColor,
    borderRadius: S.br,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: pv,
    paddingHorizontal: S.ph,
    // Full width only when you want block buttons in column layouts
    width: fullWidth ? '100%' : undefined,
    alignSelf: fullWidth ? 'stretch' : 'auto',
    marginVertical: S.mv,
    opacity: disabled ? 0.6 : 1,
    minHeight: S.mh, // fixed minimum touch target
    flexShrink: fullWidth ? 0 : 1, // allow shrinking in rows
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: disabled ? 0 : 0.1,
        shadowRadius: 3.84,
      },
      android: {elevation: disabled ? 0 : 2},
    }),
    flexDirection: 'row',
    gap: 8,
  };

  const textStyle = {
    color: disabled
      ? colors.textDisabled || '#888888'
      : colors.white || '#ffffff',
    fontSize: S.fs, // base font size (we’ll cap actual scaling below)
    textTransform: 'uppercase',
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
    lineHeight: S.fs * (Platform.OS === 'ios' ? 1.2 : 1.3),
  };

  return (
    <TouchableOpacity
      style={[buttonStyle, customStyle]}
      onPress={disabled || loading ? undefined : onPress}
      activeOpacity={disabled || loading ? 1 : 0.7}
      disabled={disabled || loading}
      accessible
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={disabled ? 'Button is disabled' : undefined}
      accessibilityState={{disabled: disabled || loading, busy: loading}}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.white || '#fff'} />
      ) : (
        <Text
          style={[textStyle, customTextStyle]}
          allowFontScaling
          // Tighter cap for CTAs so the button height doesn't balloon
          maxFontSizeMultiplier={compact ? 1.05 : 1.2}
          // Keep it to a single line and shrink slightly if needed
          numberOfLines={1}
          adjustsFontSizeToFit={compact}
          minimumFontScale={compact ? 0.9 : undefined}
          ellipsizeMode="tail">
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default AppButton;
