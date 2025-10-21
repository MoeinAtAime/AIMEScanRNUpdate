import React, {useEffect} from 'react';
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

const WellnessGauge = ({score, level, label, showInfoModal}) => {
  // Default to 0 if score is not available or invalid
  const wellnessScore = typeof score === 'number' && !isNaN(score) ? score : 0;
  const normalizedScore = Math.min(Math.max(wellnessScore, 0), 10) / 10; // Ensure value is between 0-1

  // Get wellness level (1, 2, or 3)
  const wellnessLevel =
    typeof level === 'number' && !isNaN(level) ? level : null;

  const animatedWidth = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: normalizedScore,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [normalizedScore]);

  // Determine color based on score
  const getGaugeColor = score => {
    if (score <= 0.2) return '#ff6b6b'; // Needs Attention (1-2)
    if (score <= 0.4) return '#ffa94d'; // Below Average (3-4)
    if (score <= 0.6) return '#74c0fc'; // Normal (5-6)
    if (score <= 0.8) return '#69db7c'; // Above Average (7-8)
    return '#38d9a9'; // Excellent (9-10)
  };

  // Get interpretation text based on wellness_level
  const getInterpretationText = level => {
    if (level === null) {
      // Fallback to using score if level is not provided
      const value = score * 10;
      if (value <= 2) return 'Needs Attention';
      if (value <= 4) return 'Below Average';
      if (value <= 6) return 'Normal';
      if (value <= 8) return 'Above Average';
      return 'Excellent';
    }

    // Use wellness_level for interpretation
    switch (level) {
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

  // Get interpretation color based on wellness_level
  const getInterpretationColor = level => {
    if (level === null) {
      // Fallback to using score if level is not provided
      const value = score * 10;
      if (value <= 4) return '#E67C73'; // Red for concerning levels
      if (value <= 6) return '#4285F4'; // Blue for normal
      return '#57BB8A'; // Green for good
    }

    // Use wellness_level for color
    switch (level) {
      case 1:
        return '#E67C73'; // Red for Needs Attention
      case 2:
        return '#4285F4'; // Blue for Average
      case 3:
        return '#57BB8A'; // Green for Excellent
      default:
        return '#4285F4'; // Blue for fallback
    }
  };

  const interpretation = getInterpretationText(wellnessLevel);
  const interpretationColor = getInterpretationColor(wellnessLevel);
  const gaugeColor = getGaugeColor(normalizedScore);

  // Wellness Index description for info modal
  const wellnessDescription =
    'Your Wellness Score is a number from 1 to 10 that estimates your cardiovascular risk over the next 5-10 years, with higher scores indicating lower risk. The score analyzes key measurements, including heart rate, heart rate variability, stress levels, blood pressure, and oxygen saturation. The lowest value of these indicators determines your score, so if one measurement is outside the health range, your overall Wellness Score will reflect that. For accuracy, measure your Wellness Score while at rest, since vital signs change with activity, breathing patterns, and stress. Repeated measurements over time help ensure the reliability of results.';
  const handleInfoPress = () => {
    if (showInfoModal) {
      showInfoModal(wellnessDescription);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{label || 'Wellness Score'}</Text>
        <View style={styles.rightContainer}>
          <View style={styles.scoreContainer}>
            <Text style={styles.score}>
              {Math.round(wellnessScore * 10) / 10}
            </Text>
            <Text style={styles.maxScore}>/10</Text>
          </View>
          <TouchableOpacity style={styles.infoButton} onPress={handleInfoPress}>
            <Text style={styles.infoButtonText}>!</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.interpretation, {color: interpretationColor}]}>
        {interpretation}
      </Text>

      <View style={styles.gaugeContainer}>
        <View style={styles.gaugeBackground}>
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
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tick => (
            <View key={tick} style={styles.tickMark}>
              <Text style={styles.tickLabel}>{tick}</Text>
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
    padding: screenWidth * 0.05, // Responsive padding
    marginBottom: screenHeight * 0.025, // Responsive margin

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
  },

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: screenHeight * 0.012, // Responsive margin
  },

  title: {
    fontSize: 18, // Keep original font size
    fontWeight: 'bold',
    color: '#333',

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

  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  score: {
    fontSize: 28, // Keep original font size
    fontWeight: 'bold',
    color: '#333',

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

  maxScore: {
    fontSize: 16, // Keep original font size
    color: '#666',
    marginLeft: 2,

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

  infoButton: {
    width: 22, // Keep original size
    height: 22, // Keep original size
    borderRadius: 11,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: screenWidth * 0.025, // Responsive margin
  },

  infoButtonText: {
    color: 'white',
    fontSize: 14, // Keep original font size
    fontWeight: 'bold',
  },

  interpretation: {
    fontSize: 16, // Keep original font size
    fontWeight: '600',
    marginBottom: screenHeight * 0.018, // Responsive margin

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

  gaugeContainer: {
    position: 'relative',
    marginBottom: screenHeight * 0.025, // Responsive margin
  },

  gaugeBackground: {
    height: 20, // Keep original height
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
    marginTop: screenHeight * 0.006, // Responsive margin
  },

  tickMark: {
    alignItems: 'center',
  },

  tickLabel: {
    fontSize: 10, // Keep original font size
    color: '#888',

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
});

export default WellnessGauge;
