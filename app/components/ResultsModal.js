/////////////////////////////////////Font Increase Limit Fix
// ResultsModal.js
import React, {useState, useCallback, memo, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
  Dimensions,
  ActivityIndicator,
  Platform,
  InteractionManager,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import AppButton from './AppButton';
import colors from '../config/colors';
import WellnessGauge from './WellnessGauge';
import {UserApiService} from '../api/userApi';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallScreen = screenHeight < 700;

const getResponsiveFontSize = baseSize => {
  const scale = screenWidth / 375; // Base on iPhone X width
  const minSize = baseSize * 0.8;
  const maxSize = baseSize * 1.2;
  return Math.min(Math.max(minSize, baseSize * scale), maxSize);
};
const getResponsiveSpacing = baseSpacing => {
  return isTablet ? baseSpacing * 1.3 : baseSpacing;
};

const ResultCard = memo(
  ({
    title,
    value,
    info,
    conf,
    unit,
    ranges,
    customInterpretation,
    showInfoHandler, // renamed to emphasise handling with parent
  }) => {
    const getConfidenceLevel = level => {
      switch (level) {
        case '1':
          return 'Low';
        case '2':
          return 'Normal';
        case '3':
          return 'High';
        default:
          return 'Not Captured';
      }
    };
    const formatResult = result => {
      if (result === 'N/A') return 'No Result Available';
      if (typeof result === 'number') return result.toFixed(1);
      return result;
    };
    const getInterpretation = (value, rangesArr) => {
      if (
        !rangesArr ||
        value === null ||
        value === undefined ||
        value === 'N/A'
      )
        return null;
      const numValue = parseFloat(value);
      const exactMatch = rangesArr.find(r => r.value === numValue);
      if (exactMatch) return exactMatch.label;
      if (!isNaN(numValue)) {
        for (const range of rangesArr) {
          if (
            (range.min === undefined || numValue >= range.min) &&
            (range.max === undefined || numValue <= range.max)
          ) {
            return range.label;
          }
        }
      }
      return null;
    };
    const getInterpretationColor = interp => {
      if (!interp) return '#000000';
      const lower = interp.toLowerCase();
      const lowTerms = [
        'low',
        'slow',
        'below',
        'needs attention',
        'needs work',
      ];
      const highTerms = [
        'high',
        'fast',
        'elevated',
        'hypertension',
        'very high',
      ];
      const goodTerms = [
        'normal',
        'healthy',
        'athletic',
        'excellent',
        'above average',
        'average',
        'good',
        'great',
      ];
      if (lowTerms.some(t => lower.includes(t))) return '#E67C73';
      if (highTerms.some(t => lower.includes(t))) return '#E67C73';
      if (goodTerms.some(t => lower.includes(t))) return '#57BB8A';
      return '#F4B400';
    };

    let interpretation, interpretationColor;
    if (customInterpretation) {
      interpretation = customInterpretation.text;
      interpretationColor = customInterpretation.color;
    } else {
      interpretation = ranges
        ? getInterpretation(parseFloat(value), ranges)
        : null;
      interpretationColor = interpretation
        ? getInterpretationColor(interpretation)
        : '#000000';
    }

    const handlePress = () => {
      showInfoHandler(title, info);
    };

    return (
      <TouchableOpacity
        style={[
          styles.cardContainer,
          conf === '1' && styles.lowConfidence,
          conf === '3' && styles.highConfidence,
          interpretation && {borderLeftColor: interpretationColor},
        ]}
        onPress={handlePress}
        activeOpacity={0.8}>
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text
              style={styles.cardTitle}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.2}>
              {title}
            </Text>
            {interpretation && (
              <Text
                style={[
                  styles.interpretationText,
                  {color: interpretationColor},
                ]}
                allowFontScaling={true}
                maxFontSizeMultiplier={1.2}>
                {interpretation}
              </Text>
            )}
          </View>

          <View style={styles.valueContainer}>
            <Text
              style={styles.cardValue}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.2}>
              {formatResult(value)}
            </Text>
            {unit && (
              <Text
                style={styles.unitText}
                allowFontScaling={true}
                maxFontSizeMultiplier={1.2}>
                {' ' + unit}
              </Text>
            )}
          </View>

          {conf && (
            <Text
              style={[
                styles.confidenceText,
                conf === '1' && styles.lowConfidenceText,
                conf === '3' && styles.highConfidenceText,
              ]}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.2}>
              Confidence Level: {getConfidenceLevel(conf)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  },
);

const rangeConfigurations = {
  WELLNESS_LEVEL: [
    {value: 1, label: 'Needs Attention'},
    {value: 2, label: 'Average'},
    {value: 3, label: 'Excellent'},
  ],
  WELLNESS_INDEX: [
    {min: 1, max: 2, label: 'Needs Attention'},
    {min: 3, max: 4, label: 'Below Average'},
    {min: 5, max: 6, label: 'Normal'},
    {min: 7, max: 8, label: 'Above Average'},
    {min: 9, max: 10, label: 'Excellent'},
  ],
  RESPIRATION_RATE: [
    {max: 11.9, label: 'Slow'},
    {min: 12, max: 20, label: 'Normal'},
    {min: 20.1, label: 'Fast'},
  ],
  SDNN: [
    {min: 20, max: 49, label: 'Low'},
    {min: 50, max: 100, label: 'Healthy'},
    {min: 101, max: 200, label: 'Athletic'},
  ],
  PRQ: [
    {max: 3.9, label: 'Below Average'},
    {min: 4, max: 5, label: 'Normal'},
    {min: 5.1, label: 'Above Average'},
  ],
  PULSE_RATE: [
    {max: 59, label: 'Slow'},
    {min: 60, max: 100, label: 'Normal'},
    {min: 101, label: 'Fast'},
  ],
  BLOOD_PRESSURE: [
    {max: 89, label: 'Low'},
    {min: 90, max: 120, label: 'Normal'},
    {min: 121, max: 129, label: 'Elevated'},
    {min: 130, label: 'Hypertension'},
  ],
  HEMOGLOBIN_A1C: [
    {max: 5.8, label: 'Normal'},
    {min: 5.9, label: 'Elevated'},
  ],
  OXYGEN_SATURATION: [
    {max: 94.9, label: 'Low'},
    {min: 95, max: 100, label: 'Healthy'},
  ],
  STRESS_LEVEL: [
    {value: 1, label: 'Low'},
    {value: 2, label: 'Normal'},
    {value: 3, label: 'Mild'},
    {value: 4, label: 'High'},
    {value: 5, label: 'Very High'},
  ],
  SNS_ZONE: [
    {value: 1, label: 'Great'},
    {value: 2, label: 'Good'},
    {value: 3, label: 'Needs Work'},
  ],
  PNS_ZONE: [
    {value: 1, label: 'Low'},
    {value: 2, label: 'Good'},
    {value: 3, label: 'Great'},
  ],
  HIGH_BLOOD_PRESSURE_RISK: [
    {value: 1, label: 'Low'},
    {value: 2, label: 'Normal'},
    {value: 3, label: 'High'},
  ],
  HIGH_FASTING_GLUCOSE_RISK: [
    {value: 1, label: 'Low'},
    {value: 2, label: 'Normal'},
    {value: 3, label: 'High'},
  ],
  HIGH_HEMOGLOBIN_A1C_RISK: [
    {value: 1, label: 'Low'},
    {value: 2, label: 'Normal'},
    {value: 3, label: 'High'},
  ],
  HIGH_TOTAL_CHOLESTEROL_RISK: [
    {value: 1, label: 'Low'},
    {value: 2, label: 'Normal'},
    {value: 3, label: 'High'},
  ],
  LOW_HEMOGLOBIN_RISK: [
    {value: 1, label: 'Low'},
    {value: 2, label: 'Normal'},
    {value: 3, label: 'High'},
  ],
};

const CategorySection = memo(({title, children}) => (
  <View style={styles.categoryContainer}>
    <Text
      style={styles.categoryTitle}
      allowFontScaling={true}
      maxFontSizeMultiplier={1.2}>
      {title}
    </Text>
    {children}
  </View>
));

const ScanResults = memo(({scan, showInfoHandler}) => (
  <View style={styles.scanContainer}>
    <View style={styles.timeStampContainer}>
      <Text
        style={styles.scanNumber}
        allowFontScaling={true}
        maxFontSizeMultiplier={1.2}>
        Scan {scan.scanNumber || 1}
      </Text>
      <Text
        style={styles.timestamp}
        allowFontScaling={true}
        maxFontSizeMultiplier={1.2}>
        {scan.timeStamp}
      </Text>
    </View>

    <WellnessGauge
      score={parseFloat(scan.WELLNESS_INDEX)}
      level={parseInt(scan.WELLNESS_LEVEL, 10)}
      label="Wellness Score"
      showInfoModal={info => showInfoHandler('Wellness Score', info)}
    />

    <CategorySection title="Vitals">
      <ResultCard
        title="Heart Rate"
        value={scan.PULSE_RATE}
        unit="beats/min"
        conf={scan.PULSE_RATE_CONF_LEVEL}
        ranges={rangeConfigurations.PULSE_RATE}
        info="How many times your heart beats per minute…"
        showInfoHandler={showInfoHandler}
      />
      <ResultCard
        title="Respiration Rate"
        value={scan.RESPIRATION_RATE}
        unit="breaths/min"
        conf={scan.RESPIRATION_RATE_CONF_LEVEL}
        ranges={rangeConfigurations.RESPIRATION_RATE}
        info="The number of breaths you take per minute…"
        showInfoHandler={showInfoHandler}
      />
      <ResultCard
        title="Blood Pressure"
        value={scan.BLOOD_PRESSURE}
        unit="mmHg"
        ranges={rangeConfigurations.BLOOD_PRESSURE}
        info="A measure of the force of blood pushing against your artery walls…"
        showInfoHandler={showInfoHandler}
      />
      <ResultCard
        title="Oxygen Saturation"
        value={scan.OXYGEN_SATURATION}
        unit="%"
        ranges={rangeConfigurations.OXYGEN_SATURATION}
        info="How much oxygen your blood is carrying from your lungs to the rest of your body…"
        showInfoHandler={showInfoHandler}
      />
      <ResultCard
        title="PRQ"
        value={scan.PRQ && scan.PRQ !== 'N/A' ? `${scan.PRQ}:1` : scan.PRQ}
        conf={scan.PRQ_CONF_LEVEL}
        ranges={rangeConfigurations.PRQ}
        info="A ratio comparing your heart rate to your respiration rate…"
        showInfoHandler={showInfoHandler}
      />
    </CategorySection>

    <CategorySection title="Heart Data">
      <ResultCard
        title="HRV SDNN (Heart Rate Variability)"
        value={scan.SDNN}
        unit="ms"
        conf={scan.SDNN_CONF_LEVEL}
        ranges={rangeConfigurations.SDNN}
        info="A measure of Heart Rate Variability…"
        showInfoHandler={showInfoHandler}
      />
      <ResultCard
        title="Mean RRI"
        value={scan.MEAN_RRI}
        unit="ms"
        conf={scan.MEAN_RRI_CONF_LEVEL}
        info="Average time (in milliseconds) between heartbeats…"
        showInfoHandler={showInfoHandler}
      />
      {scan.RMSSD && (
        <ResultCard
          title="RMSSD"
          value={scan.RMSSD}
          unit="ms"
          info="A measure of how much your heartbeat timing varies from beat to beat…"
          showInfoHandler={showInfoHandler}
        />
      )}
      {scan.SD1 && (
        <ResultCard
          title="SD1"
          value={scan.SD1}
          unit="%"
          info="A measure of how much your heartbeat timing changes between beats…"
          showInfoHandler={showInfoHandler}
        />
      )}
      {scan.SD2 && (
        <ResultCard
          title="SD2"
          value={scan.SD2}
          unit="%"
          info="A measure of overall patterns in your heart rhythm…"
          showInfoHandler={showInfoHandler}
        />
      )}
    </CategorySection>

    <CategorySection title="Blood Data">
      <ResultCard
        title="Hemoglobin"
        value={scan.HEMOGLOBIN}
        unit="g/dL"
        info="A measurement of how much hemoglobin…"
        showInfoHandler={showInfoHandler}
      />
      <ResultCard
        title="Hemoglobin A1C"
        value={scan.HEMOGLOBIN_A1C}
        unit="%"
        ranges={rangeConfigurations.HEMOGLOBIN_A1C}
        info="A measure of your average blood glucose level for the past two-three months…"
        showInfoHandler={showInfoHandler}
      />
    </CategorySection>

    <CategorySection title="Autonomic Nervous System">
      <ResultCard
        title="Stress Level"
        value={scan.STRESS_LEVEL}
        ranges={rangeConfigurations.STRESS_LEVEL}
        info="A measure of your body’s reaction to a challenge or demand…"
        showInfoHandler={showInfoHandler}
      />
      {scan.SNS_INDEX && (
        <ResultCard
          title="Stress Response (SNS)"
          value={scan.SNS_INDEX}
          unit="SD"
          customInterpretation={{
            text: rangeConfigurations.SNS_ZONE.find(
              r => r.value === parseInt(scan.SNS_ZONE, 10),
            )?.label,
            color: '#57BB8A',
          }}
          info="A measure of your body’s stress response…"
          showInfoHandler={showInfoHandler}
        />
      )}
      {scan.PNS_INDEX && (
        <ResultCard
          title="Recovery Ability (PNS)"
          value={scan.PNS_INDEX}
          unit="SD"
          customInterpretation={{
            text: rangeConfigurations.PNS_ZONE.find(
              r => r.value === parseInt(scan.PNS_ZONE, 10),
            )?.label,
            color: '#57BB8A',
          }}
          info="A measurement of how well your body can relax and recover after stress…"
          showInfoHandler={showInfoHandler}
        />
      )}
      <ResultCard
        title="Autonomic Balance"
        value={scan.LF_HF}
        unit="Hz"
        info="The LF/HF ratio of heart rhythm patterns indicating balance…"
        showInfoHandler={showInfoHandler}
      />
    </CategorySection>

    <CategorySection title="Risk Scores">
      {scan.ASCVD_RISK && (
        <ResultCard
          title="ASCVD Risk"
          value={scan.ASCVD_RISK}
          unit="%"
          info="An assessment of your likelihood of developing cardiovascular diseases within ten years…"
          showInfoHandler={showInfoHandler}
        />
      )}
      {scan.HIGH_BLOOD_PRESSURE_RISK && (
        <ResultCard
          title="High Blood Pressure Risk"
          customInterpretation={{
            text: rangeConfigurations.HIGH_BLOOD_PRESSURE_RISK.find(
              r => r.value === parseInt(scan.HIGH_BLOOD_PRESSURE_RISK, 10),
            )?.label,
            color: '#E67C73',
          }}
          info="An assessment of elevated blood pressure levels…"
          showInfoHandler={showInfoHandler}
        />
      )}
      {scan.HIGH_FASTING_GLUCOSE_RISK && (
        <ResultCard
          title="High Fasting Glucose Risk"
          customInterpretation={{
            text: rangeConfigurations.HIGH_FASTING_GLUCOSE_RISK.find(
              r => r.value === parseInt(scan.HIGH_FASTING_GLUCOSE_RISK, 10),
            )?.label,
            color: '#E67C73',
          }}
          info="An assessment of whether you are likely to have high blood sugar…"
          showInfoHandler={showInfoHandler}
        />
      )}
      {scan.HIGH_HEMOGLOBIN_A1C_RISK && (
        <ResultCard
          title="High Hemoglobin A1C Risk"
          customInterpretation={{
            text: rangeConfigurations.HIGH_HEMOGLOBIN_A1C_RISK.find(
              r => r.value === parseInt(scan.HIGH_HEMOGLOBIN_A1C_RISK, 10),
            )?.label,
            color: '#E67C73',
          }}
          info="An assessment of elevated Hemoglobin A1C levels…"
          showInfoHandler={showInfoHandler}
        />
      )}
      {scan.HIGH_TOTAL_CHOLESTEROL_RISK && (
        <ResultCard
          title="High Total Cholesterol Risk"
          customInterpretation={{
            text: rangeConfigurations.HIGH_TOTAL_CHOLESTEROL_RISK.find(
              r => r.value === parseInt(scan.HIGH_TOTAL_CHOLESTEROL_RISK, 10),
            )?.label,
            color: '#E67C73',
          }}
          info="A measurement of the likelihood of having unhealthy cholesterol levels…"
          showInfoHandler={showInfoHandler}
        />
      )}
      {scan.LOW_HEMOGLOBIN_RISK && (
        <ResultCard
          title="Low Hemoglobin Risk"
          customInterpretation={{
            text: rangeConfigurations.LOW_HEMOGLOBIN_RISK.find(
              r => r.value === parseInt(scan.LOW_HEMOGLOBIN_RISK, 10),
            )?.label,
            color: '#E67C73',
          }}
          info="A measurement of the likelihood of hemoglobin levels being below normal…"
          showInfoHandler={showInfoHandler}
        />
      )}
    </CategorySection>
  </View>
));

const ResultsModal = ({isVisible, onClose, scanData = []}) => {
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoText, setInfoText] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const dataToDisplay = scanData || [];
  const [userInfo, setUserInfo] = useState(null);

  // For iOS nested modal issue: we ensure the info modal only opens **after** the main modal closes/dismisses
  const [queuedInfo, setQueuedInfo] = useState(null);

  const showInfoHandler = useCallback(
    (title, info) => {
      // queue the info so that we can close main modal first (if needed)
      setQueuedInfo({title, info});
      // close the main modal first
      onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (queuedInfo && !isVisible) {
      // Wait until main modal is hidden, then show info
      InteractionManager.runAfterInteractions(() => {
        setInfoTitle(queuedInfo.title);
        setInfoText(queuedInfo.info);
        setInfoModalVisible(true);
        setQueuedInfo(null);
      });
    }
  }, [queuedInfo, isVisible]);

  useEffect(() => {
    if (isVisible) {
      (async () => {
        try {
          const attributes = await UserApiService.fetchAttributes();
          setUserInfo({
            email: attributes.email || '',
            name: attributes['custom:userDisplayName'] || '',
          });
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          setUserInfo({email: '', name: ''});
        }
      })();
    } else {
      // when main modal closes, also ensure info modal closes
      setInfoModalVisible(false);
    }
  }, [isVisible]);

  const handleShare = useCallback(async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      // Build the share message…
      await Share.share({message: 'Your scan results …'});
    } catch (err) {
      console.error('Error sharing scan results:', err);
    } finally {
      setIsSharing(false);
    }
  }, [isSharing]);

  return (
    <>
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <View style={styles.headerTitleContainer}>
                <Text
                  style={styles.modalTitle}
                  allowFontScaling={true}
                  maxFontSizeMultiplier={1.2}>
                  Scan Results
                </Text>
                <Text
                  style={styles.tapForMoreInfo}
                  allowFontScaling={true}
                  maxFontSizeMultiplier={1.2}>
                  Tap on any vitals for detailed information
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleShare}
                disabled={isSharing}
                style={[
                  styles.shareButton,
                  isSharing && styles.shareButtonDisabled,
                ]}>
                {isSharing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text
                    style={styles.shareButtonText}
                    allowFontScaling={true}
                    maxFontSizeMultiplier={1.2}>
                    Share Results
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}>
              {dataToDisplay.length > 0 ? (
                dataToDisplay.map(scan => (
                  <ScanResults
                    key={scan.timeStamp}
                    scan={scan}
                    showInfoHandler={showInfoHandler}
                  />
                ))
              ) : (
                <View style={styles.noDataContainer}>
                  <Text
                    style={styles.noDataText}
                    allowFontScaling={true}
                    maxFontSizeMultiplier={1.2}>
                    No scan data available
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text
                style={styles.closeButtonText}
                allowFontScaling={true}
                maxFontSizeMultiplier={1.2}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Info modal */}
      <Modal
        visible={infoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}>
        <View style={styles.infoModalContainer}>
          <View style={styles.infoModalContent}>
            <Text
              style={styles.infoTitle}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.2}>
              {infoTitle}
            </Text>
            <ScrollView
              style={styles.infoScrollView}
              showsVerticalScrollIndicator={true}>
              <Text
                style={styles.infoText}
                allowFontScaling={true}
                maxFontSizeMultiplier={1.2}>
                {infoText}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.infoCloseButton}
              onPress={() => setInfoModalVisible(false)}>
              <Text
                style={styles.infoCloseButtonText}
                allowFontScaling={true}
                maxFontSizeMultiplier={1.2}>
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#f5f5f7',
    borderTopLeftRadius: getResponsiveSpacing(20),
    borderTopRightRadius: getResponsiveSpacing(20),
    padding: getResponsiveSpacing(20),
    height: isSmallScreen ? '95%' : '90%',
    paddingHorizontal: screenWidth * 0.05,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(15),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  tapForMoreInfo: {
    fontSize: getResponsiveFontSize(12),
    color: '#666',
    fontStyle: 'italic',
  },
  shareButton: {
    backgroundColor: colors.primaryColor,
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(8),
    borderRadius: getResponsiveSpacing(20),
    minWidth: screenWidth * 0.25,
    alignItems: 'center',
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
  shareButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: getResponsiveFontSize(14),
  },
  shareButtonDisabled: {
    opacity: 0.7,
  },
  scanContainer: {
    marginBottom: getResponsiveSpacing(25),
    backgroundColor: 'white',
    borderRadius: getResponsiveSpacing(15),
    padding: getResponsiveSpacing(15),
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
  timeStampContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(15),
    flexWrap: 'wrap',
  },
  scanNumber: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: colors.primaryColor,
  },
  timestamp: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    marginTop: isSmallScreen ? 5 : 0,
  },
  categoryContainer: {
    marginBottom: getResponsiveSpacing(20),
  },
  categoryTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: getResponsiveSpacing(10),
    marginLeft: getResponsiveSpacing(5),
  },
  cardContainer: {
    marginBottom: getResponsiveSpacing(10),
    borderRadius: getResponsiveSpacing(12),
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardContent: {
    padding: getResponsiveSpacing(15),
    backgroundColor: '#ffffff',
    borderRadius: getResponsiveSpacing(12),
    borderLeftWidth: isTablet ? 6 : 4,
    borderLeftColor: colors.primaryColor,
  },
  titleRow: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isSmallScreen ? 'flex-start' : 'center',
    marginBottom: getResponsiveSpacing(8),
  },
  cardTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: '#333',
    flex: isSmallScreen ? 0 : 1,
    marginBottom: isSmallScreen ? 4 : 0,
    flexShrink: 1,
  },
  interpretationText: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    marginLeft: isSmallScreen ? 0 : 8,
    paddingHorizontal: getResponsiveSpacing(8),
    paddingVertical: getResponsiveSpacing(2),
    borderRadius: getResponsiveSpacing(10),
    backgroundColor: '#F8F9FA',
    alignSelf: isSmallScreen ? 'flex-start' : 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: getResponsiveSpacing(6),
    flexWrap: 'wrap',
  },
  cardValue: {
    fontSize: getResponsiveFontSize(22),
    fontWeight: '700',
    color: '#333',
  },
  unitText: {
    fontSize: getResponsiveFontSize(16),
    color: '#666',
    fontWeight: '500',
  },
  confidenceText: {
    fontSize: getResponsiveFontSize(12),
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: colors.primaryColor,
    padding: getResponsiveSpacing(15),
    borderRadius: getResponsiveSpacing(12),
    alignItems: 'center',
    marginTop: getResponsiveSpacing(10),
    marginHorizontal: screenWidth * 0.05,
  },
  closeButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveSpacing(30),
  },
  noDataText: {
    fontSize: getResponsiveFontSize(16),
    color: '#666',
    textAlign: 'center',
  },
  infoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.05,
  },
  infoModalContent: {
    width: isTablet ? '70%' : '90%',
    backgroundColor: 'white',
    borderRadius: getResponsiveSpacing(15),
    padding: getResponsiveSpacing(20),
    maxHeight: screenHeight * 0.7,
  },
  infoTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: getResponsiveSpacing(15),
  },
  infoScrollView: {
    maxHeight: screenHeight * 0.5,
  },
  infoText: {
    fontSize: getResponsiveFontSize(16),
    color: '#444',
    lineHeight: getResponsiveFontSize(24),
    marginBottom: getResponsiveSpacing(10),
  },
  infoCloseButton: {
    backgroundColor: colors.primaryColor,
    padding: getResponsiveSpacing(12),
    borderRadius: getResponsiveSpacing(10),
    alignItems: 'center',
    marginTop: getResponsiveSpacing(10),
  },
  infoCloseButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: getResponsiveSpacing(20),
  },
});

export default memo(ResultsModal);
