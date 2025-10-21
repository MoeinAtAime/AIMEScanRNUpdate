// navigationTheme - Custom theme for React Navigation, integrating app colors
import {DefaultTheme} from '@react-navigation/native';
import colors from '../config/colors';

export default {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primaryColor, // Sets primary color for navigation elements
    background: colors.white, // Sets background color for screens
  },
};
