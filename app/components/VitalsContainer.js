import * as React from 'react';
import {StyleSheet, View, Dimensions, Platform} from 'react-native';
import {PulseRate} from '../components/PulseRate';
import {RespirationRate} from '../components/RespirationRte';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

/**
 * VitalsContainer - A component that displays both PulseRate and RespirationRate in a row
 *
 * @returns {JSX.Element} - Container with both vital signs
 */
export const VitalsContainer = React.memo(() => {
  return (
    <View style={styles.container}>
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
    marginBottom: screenHeight * 0.006, // Responsive margin
  },

  vitalsBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    maxWidth: screenWidth * 0.9, // Responsive max width
    minWidth: 280, // Minimum width to ensure components fit
  },

  separator: {
    width: screenWidth * 0.04, // Responsive separator width
    minWidth: 12, // Minimum separator width
    maxWidth: 20, // Maximum separator width
  },
});
