/////////////////////Font Increase Limit Fix

import * as React from 'react';
import {StyleSheet, View, Dimensions, Platform} from 'react-native';
import {PulseRate} from '../components/PulseRate';
import {RespirationRate} from '../components/RespirationRte';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Responsive helpers
const isSmallScreen = screenWidth < 375;
const isTablet = screenWidth >= 768;
const getScaledSize = base => {
  if (isTablet) return base * 1.2;
  if (isSmallScreen) return base * 0.9;
  return base;
};

/**
 * VitalsContainer - Displays both PulseRate and RespirationRate side by side
 */
export const VitalsContainer = React.memo(() => {
  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="summary"
      accessibilityLabel="Vital signs container displaying pulse rate and respiration rate">
      <View style={styles.vitalsBox}>
        <PulseRate />
        <View style={styles.separator} />
        <RespirationRate />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getScaledSize(screenHeight * 0.006),

    // Slight padding adjustments for larger or smaller devices
    paddingVertical: getScaledSize(2),
  },

  vitalsBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    maxWidth: screenWidth * 0.9,
    minWidth: 280,

    // Optional subtle shadow for visual separation (especially on tablets)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },

  separator: {
    width: getScaledSize(screenWidth * 0.04),
    minWidth: 12,
    maxWidth: 20,
  },
});
