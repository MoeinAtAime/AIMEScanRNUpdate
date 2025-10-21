// ImageValidityView - Displays feedback on image validity based on session state and image data
import * as React from 'react';
import {
  useImages,
  ImageValidity,
  SessionState,
  useSessionState,
} from 'biosensesignal-react-native-sdk';
import {StyleSheet, Text, View} from 'react-native';

interface ImageValidityViewProps {
  onValidityChange?: (message: string | undefined) => void;
  hideVisual?: boolean; // Add this new prop
}

export const ImageValidityView: React.FC<ImageValidityViewProps> = ({
  onValidityChange,
  hideVisual = false, // Default to false
}) => {
  const sessionState = useSessionState();
  const imageData = useImages();
  const [imageValidity, setImageValidity] = React.useState<string>();

  // Reset image validity message when session state is not in processing mode
  React.useEffect(() => {
    if (sessionState !== SessionState.PROCESSING) {
      setImageValidity(undefined);
    }
  }, [sessionState]);

  // Update image validity message based on the image validity status
  React.useEffect(() => {
    if (!imageData || imageData.imageValidity === ImageValidity.VALID) {
      setImageValidity(undefined);
    } else {
      switch (imageData.imageValidity) {
        case ImageValidity.INVALID_DEVICE_ORIENTATION:
          setImageValidity('Invalid Orientation');
          break;
        case ImageValidity.INVALID_ROI:
          setImageValidity('Face Not Detected');
          break;
        case ImageValidity.TILTED_HEAD:
          setImageValidity('Tilted Head');
          break;
        case ImageValidity.FACE_TOO_FAR:
          setImageValidity('You are Too Far');
          break;
        case ImageValidity.UNEVEN_LIGHT:
          setImageValidity('Uneven Lighting');
          break;
        default:
          setImageValidity(undefined);
      }
    }
  }, [imageData]);

  // Call the callback whenever imageValidity changes
  React.useEffect(() => {
    if (onValidityChange) {
      onValidityChange(imageValidity);
    }
  }, [imageValidity, onValidityChange]);

  // Don't render the visual box if hideVisual is true
  if (hideVisual) {
    return null;
  }

  return imageValidity ? (
    <View style={styles.container}>
      <Text style={styles.title}>Image Validity</Text>
      <Text style={styles.text}>{imageValidity}</Text>
    </View>
  ) : null;
};
const styles = StyleSheet.create({
  container: {
    height: 70,
    width: 160,
    padding: 5,
    backgroundColor: '#3D3734FF',
  },
  title: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 5,
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
});
