//////////////////////Font Increase Limit Fix

import * as React from 'react';
import {
  AlertCodes,
  SessionState,
  VitalSignTypes,
  useSessionState,
  useSessionWarnings,
  useVitalSigns,
} from 'biosensesignal-react-native-sdk';
import {StyleSheet, Text, View, Dimensions, Platform} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Centralized caps for Dynamic Type
const FONT_CAPS = {
  value: 1.15, // limit value text scaling
};

// Simple responsive helpers
const isSmallScreen = screenWidth < 375;
const isTablet = screenWidth >= 768;
const getScaledSize = base => {
  if (isTablet) return base * 1.2;
  if (isSmallScreen) return base * 0.9;
  return base; // baseline ~375–414
};

// Icon size scales slightly with screen (not with font scaling)
const ICON_SIZE = getScaledSize(24);

/**
 * PulseRate - Displays pulse rate data if available and valid
 */
export const PulseRate = React.memo(() => {
  const vitalSign = useVitalSigns();
  const sessionState = useSessionState();
  const warning = useSessionWarnings();
  const [pulseRate, setPulseRate] = React.useState();

  // Update pulse rate when valid vital sign data is available
  React.useEffect(() => {
    if (vitalSign && vitalSign.type === VitalSignTypes.PULSE_RATE) {
      setPulseRate(vitalSign.value);
    }
  }, [vitalSign]);

  // Clear pulse rate if there is a measurement warning
  React.useEffect(() => {
    if (
      warning?.code ===
      AlertCodes.MEASUREMENT_CODE_MISDETECTION_DURATION_EXCEEDS_LIMIT_WARNING
    ) {
      setPulseRate(undefined);
    }
  }, [warning]);

  // Reset pulse rate when session state is starting
  React.useEffect(() => {
    if (sessionState === SessionState.STARTING) {
      setPulseRate(undefined);
    }
  }, [sessionState]);

  // Strict validation for numeric values
  const numeric = Number(pulseRate);
  const hasValidValue =
    pulseRate &&
    pulseRate !== '--' &&
    pulseRate !== 'N/A' &&
    pulseRate !== '' &&
    !isNaN(numeric) &&
    numeric > 0 &&
    numeric < 300;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="text"
      accessibilityLabel={
        hasValidValue
          ? `Pulse rate ${numeric} beats per minute`
          : 'Pulse rate not available'
      }>
      <View style={styles.contentContainer}>
        <View style={styles.valueContainer}>
          {hasValidValue ? (
            <MaterialIcons name="favorite" size={ICON_SIZE} color="#FF5252" />
          ) : (
            <MaterialIcons
              name="favorite-border"
              size={ICON_SIZE}
              color="#000"
            />
          )}

          <Text
            style={[styles.value, {color: hasValidValue ? '#FF5252' : '#999'}]}
            allowFontScaling
            maxFontSizeMultiplier={FONT_CAPS.value}
            numberOfLines={1}
            ellipsizeMode="tail">
            {hasValidValue ? `${numeric} bpm` : '--'}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: screenWidth * 0.025, // Responsive padding
    paddingVertical: screenHeight * 0.006, // Responsive padding
    borderRadius: 20,

    // Platform-specific shadows
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),

    // Responsive width while maintaining proportions
    width: screenWidth * 0.31,
    minWidth: 120,
    maxWidth: 180, // bumped slightly to avoid truncation at larger sizes
  },

  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  value: {
    fontSize: getScaledSize(15), // responsive base; capped by maxFontSizeMultiplier
    fontWeight: 'bold',
    marginLeft: 6,
    minWidth: screenWidth * 0.18,
    textAlign: 'left',

    // Platform-specific font families
    ...Platform.select({
      ios: {fontFamily: 'System'},
      android: {fontFamily: 'Roboto'},
    }),

    // Better Android text box rendering
    includeFontPadding: false,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
    lineHeight: getScaledSize(18),
  },

  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
