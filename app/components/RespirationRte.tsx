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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Dynamic Type caps
const FONT_CAPS = {
  value: 1.15, // limit text scaling
};

// Simple responsive helpers
const isSmallScreen = screenWidth < 375;
const isTablet = screenWidth >= 768;
const getScaledSize = base => {
  if (isTablet) return base * 1.2;
  if (isSmallScreen) return base * 0.9;
  return base;
};
const ICON_SIZE = getScaledSize(24);

/**
 * RespirationRate - Displays respiration rate if available and valid
 */
export const RespirationRate = React.memo(() => {
  const vitalSign = useVitalSigns();
  const sessionState = useSessionState();
  const warning = useSessionWarnings();
  const [respRate, setRespRate] = React.useState();

  // Update respiration rate when valid data is available
  React.useEffect(() => {
    if (vitalSign && vitalSign.type === VitalSignTypes.RESPIRATION_RATE) {
      setRespRate(vitalSign.value);
    }
  }, [vitalSign]);

  // Clear on warning
  React.useEffect(() => {
    if (
      warning?.code ===
      AlertCodes.MEASUREMENT_CODE_MISDETECTION_DURATION_EXCEEDS_LIMIT_WARNING
    ) {
      setRespRate(undefined);
    }
  }, [warning]);

  // Reset on new session
  React.useEffect(() => {
    if (sessionState === SessionState.STARTING) {
      setRespRate(undefined);
    }
  }, [sessionState]);

  // Validation
  const numeric = Number(respRate);
  const hasValidValue =
    respRate &&
    respRate !== '--' &&
    respRate !== 'N/A' &&
    respRate !== '' &&
    !isNaN(numeric) &&
    numeric > 0 &&
    numeric < 100;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="text"
      accessibilityLabel={
        hasValidValue
          ? `Respiration rate ${numeric} breaths per minute`
          : 'Respiration rate not available'
      }>
      <View style={styles.contentContainer}>
        <View style={styles.valueContainer}>
          <MaterialCommunityIcons
            name="lungs"
            size={ICON_SIZE}
            color={hasValidValue ? '#4CAF50' : '#000'}
          />

          <Text
            style={[styles.value, {color: hasValidValue ? '#4CAF50' : '#999'}]}
            allowFontScaling
            maxFontSizeMultiplier={FONT_CAPS.value}
            numberOfLines={1}
            ellipsizeMode="tail">
            {hasValidValue ? `${numeric} brpm` : '--'}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: screenWidth * 0.025,
    paddingVertical: screenHeight * 0.006,
    borderRadius: 20,

    // Shadows
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

    // Responsive sizing
    width: screenWidth * 0.34,
    minWidth: 130,
    maxWidth: 180,
  },

  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  value: {
    fontSize: getScaledSize(15),
    fontWeight: 'bold',
    marginLeft: 6,
    minWidth: screenWidth * 0.2,
    textAlign: 'left',

    ...Platform.select({
      ios: {fontFamily: 'System'},
      android: {fontFamily: 'Roboto'},
    }),

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
