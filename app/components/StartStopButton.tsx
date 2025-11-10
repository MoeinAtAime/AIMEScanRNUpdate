////////////////////////Font Increase Limit Fix
import * as React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';

type StartStopButtonProps = {
  isEnabled: boolean;
  isStop: boolean;
  onClick: () => void;
};

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Responsive helpers
const isSmallScreen = screenWidth < 375;
const isTablet = screenWidth >= 768;
const getScaledSize = base => {
  if (isTablet) return base * 1.2;
  if (isSmallScreen) return base * 0.9;
  return base;
};

// Cap display size scaling
const FONT_CAPS = {
  buttonLabel: 1.15,
};

export const StartStopButton = (props: StartStopButtonProps) => {
  const label = props.isStop ? 'STOP' : 'START';
  const accessibleLabel = props.isStop
    ? 'Stop measurement'
    : 'Start measurement';

  return (
    <TouchableOpacity
      style={[styles.startButton, !props.isEnabled && styles.disabledButton]}
      disabled={!props.isEnabled}
      onPress={props.onClick}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibleLabel}
      accessibilityState={{disabled: !props.isEnabled}}
      accessibilityHint={
        props.isStop
          ? 'Stops the current session'
          : 'Starts a new measurement session'
      }>
      <Text
        style={[
          styles.startButtonTitle,
          !props.isEnabled && styles.disabledText,
        ]}
        allowFontScaling
        maxFontSizeMultiplier={FONT_CAPS.buttonLabel}
        numberOfLines={1}
        ellipsizeMode="tail">
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  startButton: {
    width: screenWidth * 0.5, // 50% of screen width
    minWidth: 120,
    maxWidth: 250,

    height: getScaledSize(screenHeight * 0.06),
    minHeight: 44, // Apple Human Interface Guidelines
    maxHeight: 52,

    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6200EE',
    borderRadius: getScaledSize(10),
    marginTop: getScaledSize(screenHeight * 0.025),

    // Platform-specific shadows
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  startButtonTitle: {
    color: 'white',
    fontSize: getScaledSize(16),
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,

    // Font consistency across platforms
    ...Platform.select({
      ios: {fontFamily: 'System'},
      android: {fontFamily: 'Roboto', includeFontPadding: false},
    }),

    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
    lineHeight: getScaledSize(18),
  },

  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },

  disabledText: {
    color: '#999999',
  },
});

// Optional responsive hook (for dynamic layout recalculation)
export const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = React.useState(Dimensions.get('window'));

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  return dimensions;
};
