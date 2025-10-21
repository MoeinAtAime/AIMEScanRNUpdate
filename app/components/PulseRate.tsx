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

/**
 * PulseRate - A component that displays pulse rate data if available and valid
 *
 * @returns {JSX.Element} - Rendered pulse rate text
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

  // More strict validation for actual numeric values
  const hasValidValue =
    pulseRate &&
    pulseRate !== '--' &&
    pulseRate !== 'N/A' &&
    pulseRate !== '' &&
    pulseRate !== 0 &&
    !isNaN(Number(pulseRate)) &&
    Number(pulseRate) > 0 &&
    Number(pulseRate) < 300;

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.valueContainer}>
          {hasValidValue ? (
            <MaterialIcons name="favorite" size={24} color="#FF5252" />
          ) : (
            <MaterialIcons name="favorite-border" size={24} color="#000" />
          )}

          <Text
            style={[styles.value, {color: hasValidValue ? '#FF5252' : '#999'}]}>
            {hasValidValue ? `${pulseRate} bpm` : '--'}
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

    // Responsive width while maintaining original proportions
    width: screenWidth * 0.31, // Scale with screen width
    minWidth: 120, // Keep original minimum width
    maxWidth: 160, // Reasonable maximum for large screens
  },

  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  value: {
    fontSize: 15, // Keep original font size
    fontWeight: 'bold',
    marginLeft: 6, // Keep original margin
    minWidth: screenWidth * 0.18, // Responsive minimum width
    textAlign: 'left',

    // Platform-specific font adjustments
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'Roboto',
      },
    }),
  },

  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
