import {Alert, Linking} from 'react-native';

export const EXTERNAL_ACCESS_URL = 'https://aimescan.com/member/register/';

export const openExternalContentLink = async () => {
  try {
    await Linking.openURL(EXTERNAL_ACCESS_URL);
  } catch (error) {
    Alert.alert('Error', 'Could not open our website. Please try again.');
  }
};

export const showExternalContentDisclosure = () => {
  Alert.alert(
    'Leave AIME Scan?',
    'You are about to leave this app and continue on our website. Any account setup or process completed there will be processed outside of this app.',
    [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Continue', onPress: openExternalContentLink},
    ],
    {cancelable: true},
  );
};
