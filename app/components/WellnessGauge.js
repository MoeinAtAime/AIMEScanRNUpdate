///////////////////////////////Font Increase Limit Fix

// WellnessGauge.js

import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Define maximum container size (so gauge doesn’t distort on large screens)
const MAX_CONTAINER_WIDTH = 500; // adjust as needed
const MAX_CONTAINER_HEIGHT = 250;

// Dynamic Type caps to prevent layout blow-ups
const FONT_CAPS = {
  title: 1.2,
  scoreBig: 1.2,
  scoreUnit: 1.15,
  interpretation: 1.2,
  tick: 1.1,
  info: 1.1,
};

const WellnessGauge = ({score, level, label, showInfoModal}) => {
  // Default to 0 if score is not available or invalid
  const wellnessScore = typeof score === 'number' && !isNaN(score) ? score : 0;
  const normalizedScore = Math.min(Math.max(wellnessScore, 0), 10) / 10; // Ensure value is between 0-1

  // Get wellness level (1, 2, or 3)
  const wellnessLevel =
    typeof level === 'number' && !isNaN(level) ? level : null;

  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: normalizedScore,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [normalizedScore, animatedWidth]);

  // Color logic
  const getGaugeColor = val => {
    if (val <= 0.2) return '#ff6b6b'; // Needs Attention
    if (val <= 0.4) return '#ffa94d'; // Below Average
    if (val <= 0.6) return '#74c0fc'; // Normal
    if (val <= 0.8) return '#69db7c'; // Above Average
    return '#38d9a9'; // Excellent
  };

  const getInterpretationText = lvl => {
    if (lvl === null) {
      const value = wellnessScore;
      if (value <= 2) return 'Needs Attention';
      if (value <= 4) return 'Below Average';
      if (value <= 6) return 'Normal';
      if (value <= 8) return 'Above Average';
      return 'Excellent';
    }
    switch (lvl) {
      case 1:
        return 'Needs Attention';
      case 2:
        return 'Average';
      case 3:
        return 'Excellent';
      default:
        return 'Normal';
    }
  };

  const getInterpretationColor = lvl => {
    if (lvl === null) {
      const value = wellnessScore;
      if (value <= 4) return '#E67C73'; // Red
      if (value <= 6) return '#4285F4'; // Blue
      return '#57BB8A'; // Green
    }
    switch (lvl) {
      case 1:
        return '#E67C73';
      case 2:
        return '#4285F4';
      case 3:
        return '#57BB8A';
      default:
        return '#4285F4';
    }
  };

  const interpretation = getInterpretationText(wellnessLevel);
  const interpretationColor = getInterpretationColor(wellnessLevel);
  const gaugeColor = getGaugeColor(normalizedScore);

  const wellnessDescription =
    'Your Wellness Score is a number from 1 to 10 that estimates your cardiovascular risk over the next 5-10 years, with higher scores indicating lower risk. The score analyzes key measurements, including heart rate, heart rate variability, stress levels, blood pressure, and oxygen saturation. The lowest value of these indicators determines your score, so if one measurement is outside the health range, your overall Wellness Score will reflect that. For accuracy, measure your Wellness Score while at rest, since vital signs change with activity, breathing patterns, and stress. Repeated measurements over time help ensure the reliability of results.';

  const handleInfoPress = () => {
    if (!showInfoModal) return;
    const title = label || 'Wellness Score';
    const info = wellnessDescription;

    // Call with two args (info, title) to match your previous pattern
    // If your modal expects (title, info), swap the order here.
    showInfoModal(info, title);
  };

  // Responsive container sizing
  const containerWidth = Math.min(screenWidth * 0.9, MAX_CONTAINER_WIDTH);
  const containerPadding = containerWidth * 0.05;

  return (
    <View
      style={[
        styles.container,
        {width: containerWidth, padding: containerPadding},
      ]}>
      <View style={styles.headerContainer}>
        <Text
          style={styles.title}
          allowFontScaling
          maxFontSizeMultiplier={FONT_CAPS.title}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {label || 'Wellness Score'}
        </Text>
        <View style={styles.rightContainer}>
          <View style={styles.scoreContainer}>
            <Text
              style={styles.score}
              allowFontScaling
              maxFontSizeMultiplier={FONT_CAPS.scoreBig}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {Math.round(wellnessScore * 10) / 10}
            </Text>
            <Text
              style={styles.maxScore}
              allowFontScaling
              maxFontSizeMultiplier={FONT_CAPS.scoreUnit}>
              /10
            </Text>
          </View>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={handleInfoPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="What does the Wellness Score mean?"
            accessibilityHint="Opens a description explaining the score">
            <Text
              style={styles.infoButtonText}
              allowFontScaling
              maxFontSizeMultiplier={FONT_CAPS.info}>
              !
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text
        style={[styles.interpretation, {color: interpretationColor}]}
        allowFontScaling
        maxFontSizeMultiplier={FONT_CAPS.interpretation}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {interpretation}
      </Text>

      <View style={styles.gaugeContainer}>
        <View
          style={styles.gaugeBackground}
          accessible
          accessibilityRole="progressbar">
          <Animated.View
            style={[
              styles.gaugeFill,
              {
                width: animatedWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: gaugeColor,
              },
            ]}
          />
        </View>
        <View style={styles.tickMarksContainer}>
          {Array.from({length: 11}, (_, tick) => (
            <View key={tick} style={styles.tickMark}>
              <Text
                style={styles.tickLabel}
                allowFontScaling
                maxFontSizeMultiplier={FONT_CAPS.tick}>
                {tick}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: screenHeight * 0.025,
    // Platform shadows
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
    alignSelf: 'center',
    // max height constraint
    maxHeight: MAX_CONTAINER_HEIGHT,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: screenHeight * 0.012,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    includeFontPadding: false,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
    ...Platform.select({
      ios: {fontFamily: 'System'},
      android: {fontFamily: 'Roboto'},
    }),
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  score: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    includeFontPadding: false,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
    ...Platform.select({
      ios: {fontFamily: 'System'},
      android: {fontFamily: 'Roboto'},
    }),
  },
  maxScore: {
    fontSize: 16,
    color: '#666',
    marginLeft: 2,
    includeFontPadding: false,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
    ...Platform.select({
      ios: {fontFamily: 'System'},
      android: {fontFamily: 'Roboto'},
    }),
  },
  infoButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: screenWidth * 0.025,
  },
  infoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    includeFontPadding: false,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
  },
  interpretation: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: screenHeight * 0.018,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
    ...Platform.select({
      ios: {fontFamily: 'System'},
      android: {fontFamily: 'Roboto'},
    }),
  },
  gaugeContainer: {
    position: 'relative',
    marginBottom: screenHeight * 0.025,
  },
  gaugeBackground: {
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 10,
  },
  tickMarksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: screenHeight * 0.006,
  },
  tickMark: {
    alignItems: 'center',
  },
  tickLabel: {
    fontSize: 10,
    color: '#888',
    includeFontPadding: false,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
    ...Platform.select({
      ios: {fontFamily: 'System'},
      android: {fontFamily: 'Roboto'},
    }),
  },
});

export default WellnessGauge;
