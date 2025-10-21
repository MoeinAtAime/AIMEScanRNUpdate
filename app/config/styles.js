// styles - Defines global styles and text configurations for the app
import {Platform} from 'react-native';
import colors from './colors';

export default {
  colors,
  text: {
    color: colors.dark, // Default text color
    fontSize: 18, // Standard font size for body text
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'Avenir', // Platform-specific font
  },
};
