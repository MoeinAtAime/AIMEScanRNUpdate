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

/**
 * RespirationRate - A component that displays respiration rate data if available and valid
 *
 * @returns {JSX.Element} - Rendered respiration rate text
 */
export const RespirationRate = React.memo(() => {
  const vitalSign = useVitalSigns();
  const sessionState = useSessionState();
  const warning = useSessionWarnings();
  const [respRate, setRespRate] = React.useState();

  // Update respiration rate when valid vital sign data is available
  React.useEffect(() => {
    if (vitalSign && vitalSign.type === VitalSignTypes.RESPIRATION_RATE) {
      setRespRate(vitalSign.value);
    }
  }, [vitalSign]);

  // Clear respiration rate if there is a measurement warning
  React.useEffect(() => {
    if (
      warning?.code ===
      AlertCodes.MEASUREMENT_CODE_MISDETECTION_DURATION_EXCEEDS_LIMIT_WARNING
    ) {
      setRespRate(undefined);
    }
  }, [warning]);

  // Reset respiration rate when session state is starting
  React.useEffect(() => {
    if (sessionState === SessionState.STARTING) {
      setRespRate(undefined);
    }
  }, [sessionState]);

  // More strict validation for actual numeric values
  const hasValidValue =
    respRate &&
    respRate !== '--' &&
    respRate !== 'N/A' &&
    respRate !== '' &&
    respRate !== 0 &&
    !isNaN(Number(respRate)) &&
    Number(respRate) > 0 &&
    Number(respRate) < 100;

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.valueContainer}>
          {hasValidValue ? (
            <MaterialCommunityIcons name="lungs" size={24} color="#4CAF50" />
          ) : (
            <MaterialCommunityIcons name="lungs" size={24} color="#000" />
          )}

          <Text
            style={[styles.value, {color: hasValidValue ? '#4CAF50' : '#999'}]}>
            {hasValidValue ? `${respRate} br/min` : '--'}
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
    width: screenWidth * 0.34, // Scale with screen width (slightly wider for "br/min")
    minWidth: 130, // Keep original minimum width
    maxWidth: 170, // Reasonable maximum for large screens
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
    minWidth: screenWidth * 0.2, // Responsive minimum width
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
