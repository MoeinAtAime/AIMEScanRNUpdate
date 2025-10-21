// CameraPreview - A component to preview camera feed with face detection overlay
import {CameraPreviewView, useImages} from 'biosensesignal-react-native-sdk';
import React, {useState} from 'react';
import {
  Image,
  LayoutChangeEvent,
  LayoutRectangle,
  PixelRatio,
  StyleSheet,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

/**
 * CameraPreview - Displays camera feed with an overlay image and face detection
 *
 * @returns {JSX.Element} - Rendered camera preview component
 */
export const CameraPreview: React.FC = () => {
  const [previewSize, setPreviewSize] = useState<LayoutRectangle>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Handler for layout change to set preview size
  const onLayout = (event: LayoutChangeEvent) => {
    setPreviewSize(event.nativeEvent.layout);
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <CameraPreviewView style={styles.preview} />
      <Image
        source={require('../../app/assets/rppg_video_mask.png')}
        style={styles.image}
      />
      <FaceDetection previewSize={previewSize} />
    </View>
  );
};

/**
 * FaceDetection - Renders a smooth face detection outline using SVG
 *
 * @param {LayoutRectangle} previewSize - The size of the camera preview area
 *
 * @returns {JSX.Element | null} - Rendered face detection overlay or null if data is unavailable
 */
const FaceDetection: React.FC<{previewSize: LayoutRectangle}> = ({
  previewSize,
}) => {
  const imageData = useImages();

  if (!imageData || !imageData.roi) return null;

  // Calculating the position and size of the face detection overlay
  const devicePixelRatio = PixelRatio.get();
  const widthFactor =
    previewSize.width / (imageData.imageWidth / devicePixelRatio);
  const heightFactor =
    previewSize.height / (imageData.imageHeight / devicePixelRatio);

  const left = (imageData.roi.left * widthFactor) / devicePixelRatio;
  const top = (imageData.roi.top * heightFactor) / devicePixelRatio;
  const width = (imageData.roi.width * widthFactor) / devicePixelRatio;
  const height = (imageData.roi.height * heightFactor) / devicePixelRatio;

  return (
    <View
      style={[
        styles.faceDetectionContainer,
        {width, height, left, top, position: 'absolute'},
      ]}>
      <Svg
        width="150%" // Increased from 140% to make oval larger
        height="150%" // Increased from 140% to make oval larger
        viewBox="-45 -35 337 403" // Adjusted viewBox for better centering and larger size
        style={styles.svgOverlay}>
        {/* Clean face outline with small integrated ears - adjusted for better centering */}
        <Path
          d="M128.45 0.72
             C236.45 0.72 243.45 101.72 242.45 123.72
             C250.45 118.72 255.45 125.72 256.45 135.72
             C257.45 145.72 255.45 155.72 250.45 160.72
             C245.45 165.72 241.45 163.72 242.45 158.72
             C242.45 145.72 240.95 164.22 237.95 180.72
             C234.95 197.22 230.45 233.72 229.45 247.72
             C228.65 258.92 221.12 273.05 217.45 278.72
             C217.45 278.72 191.82 317.65 165.95 327.72
             C161.00 329.65 158.19 330.83 152.95 331.72
             C146.21 332.86 142.28 331.72 135.45 331.72
             C129.79 331.72 126.47 332.98 120.95 331.72
             C114.48 330.24 111.49 327.39 105.95 323.72
             C99.36 319.36 98.62 318.05 90.45 310.72
             C82.28 303.39 67.60 293.97 58.95 278.72
             C52.64 267.60 48.45 247.72 48.45 247.72
             C48.45 247.72 44.15 197.12 38.95 180.72
             C33.75 164.32 33.45 158.72 34.45 163.72
             C35.45 168.72 31.45 170.72 26.45 165.72
             C21.45 160.72 19.45 150.72 20.45 140.72
             C21.45 130.72 26.45 123.72 34.45 128.72
             C34.45 123.72 40.45 0.72 138.45 0.72 Z"
          stroke="white"
          strokeWidth="2"
          fill="none"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 0.75, // Keep original aspect ratio
    width: '100%',
  },

  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  preview: {
    flex: 1,
  },

  faceDetectionContainer: {
    // Container for the entire face detection area
  },

  svgOverlay: {
    position: 'absolute',
    top: '-30%', // Adjusted from -20% for better positioning with larger oval
    left: '-30%', // Adjusted from -20% for better positioning with larger oval
  },

  faceDetection: {
    borderColor: '#0653F4',
    borderWidth: 4,
    borderRadius: 9999, // Keep original border radius for circular shape
  },
});
