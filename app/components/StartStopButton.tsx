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

export const StartStopButton = (props: StartStopButtonProps) => {
  return (
    <TouchableOpacity
      style={[styles.startButton, !props.isEnabled && styles.disabledButton]}
      disabled={!props.isEnabled}
      onPress={() => props.onClick()}
      activeOpacity={0.8}>
      <Text
        style={[
          styles.startButtonTitle,
          !props.isEnabled && styles.disabledText,
        ]}>
        {props.isStop ? 'STOP' : 'START'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  startButton: {
    // Responsive width using percentage of screen width
    width: screenWidth * 0.5, // 50% of screen width
    minWidth: 120, // Minimum width for small screens
    maxWidth: 250, // Maximum width for large screens

    // Responsive height
    height: screenHeight * 0.06, // 6% of screen height
    minHeight: 40, // Minimum touch target (iOS guidelines)
    maxHeight: 45, // Maximum height

    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6200EE',
    borderRadius: 8,
    marginTop: screenHeight * 0.025, // 2.5% of screen height

    // Platform-specific shadows
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },

  startButtonTitle: {
    color: 'white',
    fontSize: screenWidth * 0.04, // 4% of screen width
    // fontSize: 14,
    // maxFontSize: 20,
    fontWeight: '600',
    textAlign: 'center',

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

  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },

  disabledText: {
    color: '#999999',
  },
});

// Alternative approach using responsive hook (optional enhancement)
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
