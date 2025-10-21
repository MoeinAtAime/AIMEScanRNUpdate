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
    showInfoModal,
  }) => {
    const getConfidenceLevel = useCallback(level => {
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
    }, []);

    const formatResult = useCallback(result => {
      if (result === 'N/A') {
        return 'No Result Available';
      }

      // Handle numeric formatting if needed
      if (typeof result === 'number') {
        return result.toFixed(1);
      }

      return result;
    }, []);

    // Function to get interpretation from ranges
    const getInterpretation = useCallback((value, ranges) => {
      if (!ranges || value === null || value === undefined || value === 'N/A')
        return null;

      const numValue = parseFloat(value);

      // First check for exact value matches (used for wellness_level, stress level, PNS, SNS)
      const exactMatch = ranges.find(range => range.value === numValue);
      if (exactMatch) return exactMatch.label;

      // If no exact match, check for range matches
      if (!isNaN(numValue)) {
        for (const range of ranges) {
          if (
            (range.min === undefined || numValue >= range.min) &&
            (range.max === undefined || numValue <= range.max)
          ) {
            return range.label;
          }
        }
      }

      return null;
    }, []);

    // Determine color based on interpretation
    const getInterpretationColor = useCallback(interpretation => {
      if (!interpretation) return '#000000';

      const lowerInterpretation = interpretation.toLowerCase();
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

      if (lowTerms.some(term => lowerInterpretation.includes(term)))
        return '#E67C73'; // Red for low
      if (highTerms.some(term => lowerInterpretation.includes(term)))
        return '#E67C73'; // Red for high
      if (goodTerms.some(term => lowerInterpretation.includes(term)))
        return '#57BB8A'; // Green for good

      return '#F4B400'; // Yellow/amber for other cases
    }, []);

    // Use custom interpretation if provided, otherwise calculate from ranges
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

    const handlePress = useCallback(() => {
      showInfoModal(title, info);
    }, [title, info, showInfoModal]);

    return (
      <TouchableOpacity
        style={[
          styles.cardContainer,
          conf === '1' && styles.lowConfidence,
          conf === '3' && styles.highConfidence,
          interpretation && {borderLeftColor: interpretationColor},
        ]}
        onPress={handlePress}>
        <View style={styles.cardContent}>
          {/* First line: Title with interpretation (if available) */}
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{title}</Text>
            {interpretation && (
              <Text
                style={[
                  styles.interpretationText,
                  {color: interpretationColor},
                ]}>
                {interpretation}
              </Text>
            )}
          </View>

          {/* Second line: Value and unit */}
          <View style={styles.valueContainer}>
            <Text style={styles.cardValue}>{formatResult(value)}</Text>
            {unit && <Text style={styles.unitText}> {unit}</Text>}
          </View>

          {/* Third line: Confidence level (if available) */}
          {conf && (
            <Text
              style={[
                styles.confidenceText,
                conf === '1' && styles.lowConfidenceText,
                conf === '3' && styles.highConfidenceText,
              ]}>
              Confidence Level: {getConfidenceLevel(conf)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  },
);

// Range configurations for result interpretations
const rangeConfigurations = {
  // Wellness Indicators
  WELLNESS_LEVEL: [
    {value: 1, label: 'Needs Attention'},
    {value: 2, label: 'Average'},
    {value: 3, label: 'Excellent'},
  ],
  // Keep the existing WELLNESS_INDEX configuration for backward compatibility
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

  // Blood Data
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

  // SNS Zone (1-3 scale)
  SNS_ZONE: [
    {value: 1, label: 'Great'},
    {value: 2, label: 'Good'},
    {value: 3, label: 'Needs Work'},
  ],

  // PNS Zone (1-3 scale)
  PNS_ZONE: [
    {value: 1, label: 'Low'},
    {value: 2, label: 'Good'},
    {value: 3, label: 'Great'},
  ],

  // New risk assessment configurations
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
    <Text style={styles.categoryTitle}>{title}</Text>
    {children}
  </View>
));

// Function to get risk level interpretation
const getRiskInterpretation = level => {
  switch (level) {
    case 1:
      return 'Low';
    case 2:
      return 'Normal';
    case 3:
      return 'High';
    default:
      return null;
  }
};

// Function to get risk level color
const getRiskColor = level => {
  switch (level) {
    case 1:
      return '#57BB8A'; // Green for low risk
    case 2:
      return '#F4B400'; // Yellow for normal risk
    case 3:
      return '#E67C73'; // Red for high risk
    default:
      return '#000000';
  }
};

const ScanResults = memo(({scan, showInfoModal}) => {
  // Helper function for interpreting SNS and PNS zones
  const getZoneInterpretation = (value, rangeConfig) => {
    if (value === null || value === undefined || value === 'N/A') return null;

    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return null;

    const exactMatch = rangeConfig.find(range => range.value === numValue);
    return exactMatch ? exactMatch.label : null;
  };

  // Helper function for WellnessGauge
  const handleWellnessInfoPress = info => {
    showInfoModal('Wellness Score', info);
  };
  // Helper function to get interpretation color
  const getZoneInterpretationColor = interpretation => {
    if (!interpretation) return '#000000';

    const lowerInterpretation = interpretation.toLowerCase();
    const lowTerms = ['low', 'slow', 'below', 'needs attention', 'needs work'];
    const highTerms = ['high', 'fast', 'elevated', 'hypertension', 'very high'];
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

    if (lowTerms.some(term => lowerInterpretation.includes(term)))
      return '#E67C73'; // Red for low
    if (highTerms.some(term => lowerInterpretation.includes(term)))
      return '#E67C73'; // Red for high
    if (goodTerms.some(term => lowerInterpretation.includes(term)))
      return '#57BB8A'; // Green for good

    return '#F4B400'; // Yellow/amber for other cases
  };

  return (
    <View style={styles.scanContainer}>
      <View style={styles.timeStampContainer}>
        <Text style={styles.scanNumber}>Scan {scan.scanNumber || 1}</Text>
        <Text style={styles.timestamp}>{scan.timeStamp}</Text>
      </View>
      {/* Updated WellnessGauge with level parameter */}
      <WellnessGauge
        score={parseFloat(scan.WELLNESS_INDEX)}
        level={parseInt(scan.WELLNESS_LEVEL, 10)} // Pass the wellness level
        label="Wellness Score"
        // showInfoModal={showInfoModal}
        showInfoModal={handleWellnessInfoPress}
      />
      <CategorySection title="Vitals">
        <ResultCard
          title="Heart Rate"
          value={scan.PULSE_RATE}
          unit="beats/min"
          conf={scan.PULSE_RATE_CONF_LEVEL}
          ranges={rangeConfigurations.PULSE_RATE}
          info="How many times your heart beats per minute. A normal resting rate is 60-100 beats per minute. Tracking your heart rate can help you understand your overall health and fitness level. If you take heart medication, your doctor may instruct you to monitor your heart rate closely.

Heart rate changes based on activity, so factors such as exercise, stress, caffeine use, medications, and even body position can affect it. Heart rates are usually lower at rest, so a fast heart rate while resting could signal health issues like infection, dehydration, anxiety, or heart problems.

If your heart feels like it's beating unusually fast, slow, or irregularly, speak with your doctor."
          showInfoModal={showInfoModal}
        />
        <ResultCard
          title="Respiration Rate"
          value={scan.RESPIRATION_RATE}
          unit="breaths/min"
          conf={scan.RESPIRATION_RATE_CONF_LEVEL}
          ranges={rangeConfigurations.RESPIRATION_RATE}
          info="The number of breaths you take per minute. A normal resting rate is 12-20 breaths per minute, though women tend to breathe slightly faster than men. Tracking your breathing rate (respiration) can provide you and your healthcare provider with helpful information about your health.

When you inhale, oxygen goes to your organs. When you exhale, your body eliminates carbon dioxide. Your body automatically adjusts how fast you breathe to keep the correct balance of these gases in your blood.

Your breathing rate can change for various reasons, including illness, emotional stress, medication, and underlying medical conditions. Changes may be normal or abnormal. If you notice your breathing is rapid, slow, or different from your usual pattern, speak with your doctor.
"
          showInfoModal={showInfoModal}
        />
        <ResultCard
          title="Blood Pressure"
          value={scan.BLOOD_PRESSURE}
          unit="mmHg"
          ranges={rangeConfigurations.BLOOD_PRESSURE}
          info="A measure of the force of blood pushing against your artery walls as your heart pumps. Normal ranges are 100-129 (systolic) over 60-80 (diastolic). Blood pressure should always be measured when you are at rest, as it changes with activity.

Blood pressure helps move blood and oxygen through your body. Systolic, the top or first number, measures pressure when your heart contracts and pushes blood out. Diastolic, the second or bottom number, measures pressure when your heart relaxes and fills with blood.

Consistently high blood pressure (130+ systolic) is known as hypertension. It’s often called “the silent killer” because it typically has no symptoms. It raises your risk for heart disease, heart attack, and stroke. Low blood pressure (systolic below 100) can cause dizziness or fainting.

Blood pressure measurements fluctuate throughout the day, and a single high reading is usually not a cause for concern. If your readings are out of normal ranges, your doctor will want multiple readings."
          showInfoModal={showInfoModal}
        />
        <ResultCard
          title="Oxygen Saturation"
          value={scan.OXYGEN_SATURATION}
          unit="%"
          ranges={rangeConfigurations.OXYGEN_SATURATION}
          info="How much oxygen your blood carrying from your lungs to the rest of your body. Normal levels are 95-100% for healthy people, but those with lung conditions may have lower normal ranges. Below 90% is called hypoxemia.

Oxygen saturation tells you how well your lungs and red blood cells are working. Various factors, including lung diseases or heart conditions, apnea, illness, altitude changes, or medications, can cause low oxygen levels. Symptoms of low oxygen saturation may include shortness of breath, fatigue, changes in heart rate, and a bluish discoloration of the skin.

If your oxygen level is low or you’re feeling unwell, speak with your doctor."
          showInfoModal={showInfoModal}
        />
        <ResultCard
          title="(Pulse-Respiration Quotient)"
          value={scan.PRQ && scan.PRQ !== 'N/A' ? `${scan.PRQ}:1` : scan.PRQ}
          conf={scan.PRQ_CONF_LEVEL}
          ranges={rangeConfigurations.PRQ}
          info="A ratio comparing your heart rate to your respiration rate. The Pulse-Respiration Quotient shows how well your heart and lungs are working together. Most healthy people have a PRQ of 5.

PRQ is calculated by dividing the number of heartbeats per minute by the number of breaths. If your heart beats 60 times and you breathe 12 times in one minute, your PRQ is 5 (60 ÷ 12 = 5).

If your PRQ is higher or lower than 5, this may mean your heart and lungs aren't working together as efficiently as they should. An unusual PRQ could be a sign of an illness or health condition, so if you notice any changes, you should speak with your doctor."
          showInfoModal={showInfoModal}
        />
      </CategorySection>
      <CategorySection title="Heart Data">
        <ResultCard
          title="HRV SDNN (Heart Rate Variability)"
          value={scan.SDNN}
          unit="ms"
          conf={scan.SDNN_CONF_LEVEL}
          ranges={rangeConfigurations.SDNN}
          info="A measure of Heart Rate Variability that reflects how much your heartbeat timing varies over time. A normal value is over 50, but values naturally decrease with age, and normal ranges vary among individuals. A higher HRV SDNN often indicates that your body handles stress more effectively and recovers well. A lower HRV SDNN can be a sign of fatigue, anxiety, or poor recovery.

Variations in the timing of heartbeats are normal. A heart that beats too rigidly can suggest your nervous system isn’t responding well to changes. Higher HRV SDNN can indicate better cardiovascular fitness and health, as well as stress resilience. You may see improvements in your numbers if you implement lifestyle changes, such as regular exercise, improved sleep, and relaxation techniques.

If your HRV is consistently low or you have concerns about your heart rate patterns, consult your doctor for guidance on what is normal for you."
          showInfoModal={showInfoModal}
        />
        <ResultCard
          title="Mean RRI"
          value={scan.MEAN_RRI}
          unit="ms"
          conf={scan.MEAN_RRI_CONF_LEVEL}
          info="Average time (in milliseconds) between heartbeats. A longer Mean RRI (R-R interval) usually means a slower heart rate, and that you’re relaxed and recovering well. A higher reading indicates greater stress. Mean RRi is one of several values analyzed for your overall Recovery Ability/PNS reading."
          showInfoModal={showInfoModal}
        />
        {scan.RMSSD && (
          <ResultCard
            title="RMSSD"
            value={scan.RMSSD}
            unit="ms"
            info="A measure of how much your heartbeat timing varies from beat to beat. RMSDD (Root Mean Square of Successive Differences) can help identify general fatigue. Higher values usually indicate better recovery and relaxation. Lower values can suggest stress, fatigue, or overtraining. RMSSD is one of several values analyzed for your overall Recovery Ability/PNS reading."
            showInfoModal={showInfoModal}
          />
        )}
        {scan.SD1 && (
          <ResultCard
            title="SD1"
            value={scan.SD1}
            unit="%"
            info="A measure of how much your heartbeat timing changes between beats. A higher SD1 (Standard Deviation 1) usually means more variation between heartbeats, which is a sign of a healthy rest and recovery system. SD1 is one of several values analyzed for your overall Recovery Ability/PNS reading."
            showInfoModal={showInfoModal}
          />
        )}
        {scan.SD2 && (
          <ResultCard
            title="SD2"
            value={scan.SD2}
            unit="%"
            info="A measure of overall patterns in your heart rhythm. A higher SD2 (Standard Deviation 2) typically indicates greater variability in your heart rhythm, which helps assess your stress response system. SD2 is one of several values analyzed for your overall Stress Response/SNS reading."
            showInfoModal={showInfoModal}
          />
        )}
        {/* {scan.HEART_AGE && (
          <ResultCard
            title="Heart Age"
            value={scan.HEART_AGE}
            unit="years"
            info="An estimate of the heart’s biological age. A Heart Age that equals or is younger than your chronological age suggests your heart health is normal or above average. A Heart Age older than your chronological age suggests higher risk and potential need for lifestyle changes or medical care.

This calculation is based on the Framingham Heart Study. Heart age calculations assess personal cardiovascular risk factors against optimal ones."
            showInfoModal={showInfoModal}
          />
        )} */}
      </CategorySection>
      <CategorySection title="Blood Data">
        <ResultCard
          title="Hemoglobin"
          value={scan.HEMOGLOBIN}
          unit="g/dL"
          info="A measurement of how much hemoglobin, an oxygen-carrying protein, is in your red blood cells. Healthy hemoglobin levels vary by sex. Typical ranges are 14 to 18 g/dL for men and 12 to 16 g/dL for women.

Hemoglobin measurement tells you how well your blood is carrying oxygen throughout your body. This can indicate overall health, energy levels, and how well your organs are getting adequate oxygen. Low levels can be a sign of anemia, which may cause fatigue, weakness, or shortness of breath. High levels may indicate dehydration or other underlying conditions.

If you are concerned about your hemoglobin readings, please share your results with your doctor."
          showInfoModal={showInfoModal}
        />
        <ResultCard
          title="Hemoglobin A1C"
          value={scan.HEMOGLOBIN_A1C}
          unit="%"
          ranges={rangeConfigurations.HEMOGLOBIN_A1C}
          info="A measure of your average blood glucose level for the past two to three months. For people without diabetes, HbA1C levels indicate the risk of developing prediabetes and diabetes. For people with diabetes, HbA1C levels are important for monitoring how well treatment is working.

Normal < 5.6 %
Prediabetes risk: ≥ 5.7% and ≤ 6.4%
Diabetes risk > 6.5 %"
          showInfoModal={showInfoModal}
        />
      </CategorySection>
      {/* Autonomic Nervous System Section with the fix */}
      <CategorySection title="Autonomic Nervous System">
        <ResultCard
          title="Stress Level"
          value={scan.STRESS_LEVEL}
          unit=""
          ranges={rangeConfigurations.STRESS_LEVEL}
          info="A measure of your body's reaction to a challenge or demand. There are five stress level measurements: Low, Normal, Mild, High, and Very High. These levels are dynamic and should be monitored over time to detect trends.

Your body is designed to experience and respond both physically and mentally to stress. Stress can be positive, motivating us or guiding us from danger, but unrelieved or long-term stress negatively impacts physical and mental health.

Stress Level readings are based on Baevsky's Stress Index and calculated with heart rate variability measurements. Your Stress Levels are indicative, not diagnostic. Your doctor may use these readings as part of an overall assessment of your health."
          showInfoModal={showInfoModal}
        />

        {/* SNS card to show SNS_INDEX value with SNS_ZONE interpretation */}
        {scan.SNS_INDEX && (
          <ResultCard
            title="Stress Response (SNS)"
            value={scan.SNS_INDEX}
            unit="SD"
            customInterpretation={{
              text: getZoneInterpretation(
                scan.SNS_ZONE,
                rangeConfigurations.SNS_ZONE,
              ),
              color: getZoneInterpretationColor(
                getZoneInterpretation(
                  scan.SNS_ZONE,
                  rangeConfigurations.SNS_ZONE,
                ),
              ),
            }}
            info="A measure of your body’s stress response, commonly known as “fight or flight.” This reading analyzes activity in your sympathetic nervous system (SNS). The measurement is scored in three zones: Low, Normal, and High. Low and Normal suggest that your stress system is activating appropriately. High blood pressure may indicate that your body is in stress mode. Chronic stress is a risk factor for physical and mental health issues.

The Stress Response/SNS readings are general guides. If you consistently show high readings or feel constantly “on edge,” speak with your doctor for further evaluation."
            showInfoModal={showInfoModal}
          />
        )}

        {/* PNS card to show PNS_INDEX value with PNS_ZONE interpretation */}
        {scan.PNS_INDEX && (
          <ResultCard
            title="Recovery Ability (PNS)"
            value={scan.PNS_INDEX}
            unit="SD"
            customInterpretation={{
              text: getZoneInterpretation(
                scan.PNS_ZONE,
                rangeConfigurations.PNS_ZONE,
              ),
              color: getZoneInterpretationColor(
                getZoneInterpretation(
                  scan.PNS_ZONE,
                  rangeConfigurations.PNS_ZONE,
                ),
              ),
            }}
            info="A measurement of how well your body can relax and recover after stress. PNS is scored in three zones: Low, Normal, and High.

Your parasympathetic nervous system (PNS) helps you recover by slowing your heart, relaxing your muscles, and restoring your energy after stress. Normal and High readings show that your body is effectively recovering from stress. A Low reading shows your body is struggling to shift out of stress.

The zone readings are general guides. If you consistently experience low readings in your PNS or feel that you cannot relax or recover well from daily stress, consult your doctor for an additional evaluation."
            showInfoModal={showInfoModal}
          />
        )}

        <ResultCard
          title="Autonomic Balance"
          value={scan.LF_HF}
          unit="Hz"
          info="he LF/RF ratio of heart rhythm patterns indicating the balance between your sympathetic nervous system (stress) and your parasympathetic nervous system (recovery). A lower ratio (closer to 0.27) shows your recovery system is active. A higher ratio (0.38 or above) shows your body is experiencing more stress.

LF (Low Frequency) reflects your sympathetic nervous system, which activates during stress or activity. HF (High Frequency) reflects your parasympathetic nervous system, which helps you rest and relax. The overall ratio shows whether your body is leaning more toward stress or recovery at a given time. If your LF/HF ratio is consistently outside the normal range, your doctor can help you evaluate what's affecting your stress-recovery balance."
          showInfoModal={showInfoModal}
        />
      </CategorySection>

      {/* Modified Risk Scores Section */}
      <CategorySection title="Risk Scores">
        {scan.ASCVD_RISK && (
          <ResultCard
            title="ASCVD Risk"
            value={scan.ASCVD_RISK}
            unit="%"
            info="An assessment of your likelihood of developing cardiovascular diseases within ten years. The ASCVD (Atherosclerotic Cardiovascular Disease) risk level is based on the Framingham score and is calculated from multiple measurements and personal details such as age and sex. Risk is presented in three levels: Low, Moderate, and High.

These levels reflect your estimated risk of experiencing a cardiovascular event within the next ten years: low risk is less than 5%, moderate risk is 5–20%, and high risk is greater than 20%."
            showInfoModal={showInfoModal}
          />
        )}
        {scan.HIGH_BLOOD_PRESSURE_RISK && (
          <ResultCard
            title="High Blood Pressure Risk"
            // value={getRiskInterpretation(
            //   getRiskLevel(scan.HIGH_BLOOD_PRESSURE_RISK),
            // )}
            customInterpretation={{
              text: getRiskInterpretation(
                parseInt(scan.HIGH_BLOOD_PRESSURE_RISK, 10),
              ),
              color: getRiskColor(parseInt(scan.HIGH_BLOOD_PRESSURE_RISK, 10)),
            }}
            info="An assessment of elevated blood pressure levels and risk of hypertension. This indicator utilizes systolic and diastolic measurements to categorize high blood pressure risk into three levels: Low, Medium, and High.

Regularly checking your blood pressure helps you catch changes early. Consistently high blood pressure often has no symptoms and is sometimes called “the silent killer.” It raises your risk for heart disease, heart attack, stroke, and other complications. Monitoring your blood pressure regularly is an easy way to help protect your health."
            showInfoModal={showInfoModal}
          />
        )}
        {scan.HIGH_FASTING_GLUCOSE_RISK && (
          <ResultCard
            title="High Fasting Glucose Risk"
            // value={getRiskLevel(scan.HIGH_FASTING_GLUCOSE_RISK)}
            customInterpretation={{
              text: getRiskInterpretation(
                parseInt(scan.HIGH_FASTING_GLUCOSE_RISK, 10),
              ),
              color: getRiskColor(parseInt(scan.HIGH_FASTING_GLUCOSE_RISK, 10)),
            }}
            info="An assessment of whether you are likely to have high blood sugar after fasting for 8–12 hours. This indicator is labeled as either low or high.

High fasting glucose can mean your body isn’t managing blood sugar well, which can be an early sign of prediabetes or diabetes. Because high glucose often doesn’t cause symptoms right away, tracking helps you monitor your blood sugar and make healthy changes early.

Note: This assessment is still under research."
            showInfoModal={showInfoModal}
          />
        )}
        {scan.HIGH_HEMOGLOBIN_A1C_RISK && (
          <ResultCard
            title="High Hemoglobin A1C Risk"
            // value={getRiskLevel(scan.HIGH_HEMOGLOBIN_A1C_RISK)}
            customInterpretation={{
              text: getRiskInterpretation(
                parseInt(scan.HIGH_HEMOGLOBIN_A1C_RISK, 10),
              ),
              color: getRiskColor(parseInt(scan.HIGH_HEMOGLOBIN_A1C_RISK, 10)),
            }}
            info="An assessment of elevated Hemoglobin A1C levels, which indicate higher blood sugar levels over time. Elevated A1C levels can be a sign of prediabetes or diabetes. The risk level utilizes glycated HbA1C measurements and categorizes diabetes risk into three levels: Low, Medium, and High.

Regular monitoring of HbA1C levels provides insight into blood sugar control. If your High HbA1C Risk is consistently medium or high, you're in a window where lifestyle changes can make a real difference. Your doctor can work with you to make essential lifestyle changes that can help bring your blood sugar levels back to healthier ranges.

Note: This assessment is still under research."
            showInfoModal={showInfoModal}
          />
        )}
        {scan.HIGH_TOTAL_CHOLESTEROL_RISK && (
          <ResultCard
            title="High Total Cholesterol Risk"
            // value={getRiskLevel(scan.HIGH_TOTAL_CHOLESTEROL_RISK)}
            customInterpretation={{
              text: getRiskInterpretation(
                parseInt(scan.HIGH_TOTAL_CHOLESTEROL_RISK, 10),
              ),
              color: getRiskColor(
                parseInt(scan.HIGH_TOTAL_CHOLESTEROL_RISK, 10),
              ),
            }}
            info="A measurement of the likelihood of having unhealthy cholesterol levels. The risk is assessed in three levels: Low, Medium, and High.

Cholesterol is a fat-like substance needed for essential cell function and hormone production. However, excessive cholesterol levels can contribute to the buildup of fatty deposits in blood vessels, which narrows and hardens the arteries, increasing the risk of cardiovascular diseases. Knowing your cholesterol risk level is essential for early detection.

If your risk is Medium or High, lifestyle changes can help. Your doctor may also recommend medication if needed.

Note: This assessment is still under research."
            showInfoModal={showInfoModal}
          />
        )}
        {scan.LOW_HEMOGLOBIN_RISK && (
          <ResultCard
            title="Low Hemoglobin Risk"
            // value={getRiskLevel(scan.LOW_HEMOGLOBIN_RISK)}
            customInterpretation={{
              text: getRiskInterpretation(
                parseInt(scan.LOW_HEMOGLOBIN_RISK, 10),
              ),
              color: getRiskColor(parseInt(scan.LOW_HEMOGLOBIN_RISK, 10)),
            }}
            info="TA measurement of the likelihood of hemoglobin levels below normal. The risk is based on hemoglobin concentration in the blood and assessed as either low or high.

Hemoglobin measurement tells you how well your blood is carrying oxygen throughout your body. If your risk is High, you may have or be developing anemia. This could be due to iron deficiency, blood loss, or other health conditions. Early detection enables you to work with your doctor to identify the cause and take steps to restore healthy hemoglobin levels through dietary adjustments, supplements, or treatment of underlying conditions.

Note: This assessment is still under research."
            showInfoModal={showInfoModal}
          />
        )}
        {scan.NORMALIZED_STRESS_INDEX && (
          <ResultCard
            title="Normalized Stress Index"
            value={scan.NORMALIZED_STRESS_INDEX}
            info="A measure of your body's reaction to a challenge or demand. Your Stress Index is a numerical value used to indicate your Stress Level, ranging from low to very high. Measurement is based on physiological conditions. The values use Baevsky's Stress Index, a well-established evaluation of stress, and calculations of your heart rate variability.
"
            showInfoModal={showInfoModal}
          />
        )}
      </CategorySection>
    </View>
  );
});

const ResultsModal = ({isVisible, onClose, scanData = []}) => {
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoText, setInfoText] = useState('');
  const [infoTitle, setInfoTitle] = useState(''); // New state for storing title
  const [isSharing, setIsSharing] = useState(false);
  const dataToDisplay = scanData || [];
  const [userInfo, setUserInfo] = useState(null);

  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  // Add orientation change handling
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setDimensions(window);
    });
    return subscription?.remove;
  }, []);

  useEffect(() => {
    if (isVisible) {
      const fetchUserInfo = async () => {
        try {
          const attributes = await UserApiService.fetchAttributes();
          // console.log(attributes);
          setUserInfo({
            email: attributes.email || '',
            // name: attributes['custom:userDisplayName'] || 'User',
            name: 'User',
          });
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          // Set default values if fetch fails
          setUserInfo({
            email: '',
            name: 'User',
          });
        }
      };
      fetchUserInfo();
    }
  }, [isVisible]);

  // const showInfoModal = useCallback(info => {
  //   setInfoText(info);
  //   setInfoModalVisible(true);
  // }, []);
  const showInfoModal = useCallback((title, info) => {
    setInfoTitle(title); // Store the title
    setInfoText(info);
    setInfoModalVisible(true);
  }, []);

  const handleShare = useCallback(async () => {
    if (isSharing) return;

    setIsSharing(true);
    try {
      // The display names for each field in the order they should appear
      const fieldDisplayOrder = [
        {key: 'WELLNESS_INDEX', display: 'Wellness Score', unit: ''},
        {key: 'WELLNESS_LEVEL', display: 'Wellness Level', unit: ''},
        {key: 'RESPIRATION_RATE', display: 'Respiratory Rate', unit: 'brpm'},
        {key: 'PULSE_RATE', display: 'Heart Rate', unit: 'bpm'},
        {key: 'PRQ', display: 'Pulse-Respiration Quotient', unit: ''},
        {key: 'BLOOD_PRESSURE', display: 'Blood Pressure', unit: 'mmHg'},
        {key: 'OXYGEN_SATURATION', display: 'Oxygen Saturation', unit: '%'},
        {key: 'HEMOGLOBIN', display: 'Hemoglobin', unit: 'g/dL'},
        {key: 'HEMOGLOBIN_A1C', display: 'Hemoglobin A1c', unit: '%'},
        {key: 'SDNN', display: 'Heart Rate Variability', unit: 'ms'},
        {key: 'LF_HF', display: 'Parasympathetic Activity', unit: 'Hz'},
        {key: 'MEAN_RRI', display: 'Mean RRI', unit: 'ms'},
        {key: 'RMSSD', display: 'RMSSD', unit: 'ms'},
        {key: 'SD1', display: 'SD1', unit: '%'},
        {key: 'SD2', display: 'SD2', unit: '%'},
        {key: 'STRESS_INDEX', display: 'Stress index', unit: ''},
        {key: 'STRESS_LEVEL', display: 'Stress level', unit: ''},
        {key: 'SNS_INDEX', display: 'SNS Index', unit: 'SD'},
        {key: 'SNS_ZONE', display: 'Stress Response', unit: ''},
        {key: 'PNS_INDEX', display: 'PNS Index', unit: 'SD'},
        {key: 'PNS_ZONE', display: 'Recovery Ability', unit: ''},
        {
          key: 'HIGH_BLOOD_PRESSURE_RISK',
          display: 'High Blood Pressure Risk',
          unit: '',
        },
        {
          key: 'HIGH_HEMOGLOBIN_A1C_RISK',
          display: 'High Hemoglobin A1c Risk',
          unit: '',
        },
        {key: 'ASCVD_RISK', display: 'ASCVD Risk', unit: ''},
        // {key: 'HEART_AGE', display: 'Heart Age', unit: ''},
        {
          key: 'HIGH_FASTING_GLUCOSE_RISK',
          display: 'High Fasting Glucose Risk',
          unit: '',
        },
        {
          key: 'HIGH_TOTAL_CHOLESTEROL_RISK',
          display: 'High Total Cholesterol Risk',
          unit: '',
        },
        {key: 'LOW_HEMOGLOBIN_RISK', display: 'Low Hemoglobin Risk', unit: ''},
      ];

      // Helper function to format risk values for sharing
      const formatRiskValue = (key, value) => {
        // Check if this is one of our risk fields
        const riskFields = [
          'HIGH_BLOOD_PRESSURE_RISK',
          'HIGH_FASTING_GLUCOSE_RISK',
          'HIGH_HEMOGLOBIN_A1C_RISK',
          'HIGH_TOTAL_CHOLESTEROL_RISK',
          'LOW_HEMOGLOBIN_RISK',
        ];

        // Handle wellness index interpretation
        if (key === 'WELLNESS_INDEX' && value) {
          const numValue = parseFloat(value);
          for (const range of rangeConfigurations.WELLNESS_INDEX) {
            if (
              (range.min === undefined || numValue >= range.min) &&
              (range.max === undefined || numValue <= range.max)
            ) {
              return `${value} (${range.label})`;
            }
          }
        }

        // Handle PRQ value (add ,1 to it)
        if (key === 'PRQ' && value && value !== 'N/A') {
          return `${value} :1`;
        }

        // Handle stress level interpretation
        if (key === 'STRESS_LEVEL' && value) {
          const numValue = parseInt(value, 10);
          const match = rangeConfigurations.STRESS_LEVEL.find(
            range => range.value === numValue,
          );
          if (match) return match.label;
        }

        // Handle stress response (SNS) interpretation
        if (key === 'SNS_ZONE' && value) {
          const numValue = parseInt(value, 10);
          const match = rangeConfigurations.SNS_ZONE.find(
            range => range.value === numValue,
          );
          if (match) return match.label;
        }

        // Handle recovery ability (PNS) interpretation
        if (key === 'PNS_ZONE' && value) {
          const numValue = parseInt(value, 10);
          const match = rangeConfigurations.PNS_ZONE.find(
            range => range.value === numValue,
          );
          if (match) return match.label;
        }

        // Handle risk fields (already using interpretations)
        if (riskFields.includes(key) && value) {
          return getRiskInterpretation(parseInt(value, 10));
        }

        return value;
      };

      // Create a formatted message for each scan
      // const message = dataToDisplay
      //   .map(scan => {
      //     // Start with the AIME header
      //     let scanText = `AIME measured my vitals today:\n\nTime: ${scan.timeStamp}\n\n`;

      //     // Build the formatted string with each metric and its value
      //     fieldDisplayOrder.forEach(field => {
      //       const formattedValue =
      //         formatRiskValue(field.key, scan[field.key]) || '--';
      //       const unit = scan[field.key] && field.unit ? field.unit : '';
      //       scanText += `${field.display}: ${formattedValue}${
      //         unit ? ' ' + unit : ''
      //       }\n`;
      //     });

      //     // Add the website link
      //     scanText += `\nhttps://aimescan.com/`;

      //   return scanText;
      // })
      // .join('\n\n');

      const message = dataToDisplay
        .map(scan => {
          // Start with personalized header
          let scanText = '';
          if (userInfo) {
            if (userInfo.name && userInfo.email) {
              scanText = `${userInfo.name} (${userInfo.email}) - AIME Health Report\n\n`;
            } else if (userInfo.name) {
              scanText = `${userInfo.name} - AIME Health Report\n\n`;
            } else if (userInfo.email) {
              scanText = `${userInfo.email} - AIME Health Report\n\n`;
            }
          }

          scanText += `AIME measured my vitals today:\n\nTime: ${scan.timeStamp}\n\n`;

          // Build the formatted string with each metric and its value
          fieldDisplayOrder.forEach(field => {
            const formattedValue =
              formatRiskValue(field.key, scan[field.key]) || '--';
            const unit = scan[field.key] && field.unit ? field.unit : '';
            scanText += `${field.display}: ${formattedValue}${
              unit ? ' ' + unit : ''
            }\n`;
          });

          // Add the website link
          scanText += `\nhttps://aimescan.com/`;

          return scanText;
        })
        .join('\n\n');

      await Share.share({message});
    } catch (error) {
      console.error('Error sharing scan results:', error);
    } finally {
      setIsSharing(false);
    }
  }, [dataToDisplay, isSharing, userInfo]);

  return (
    <>
      <Modal visible={isVisible} transparent={true} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.modalTitle}>Scan Results</Text>
                  <Text style={styles.tapformoreinfo}>
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
                    <Text style={styles.shareButtonText}>Share Results</Text>
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
                      showInfoModal={showInfoModal}
                    />
                  ))
                ) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>
                      No scan data available
                    </Text>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      {/* First, modify the InfoModal implementation in the ResultsModal
      component: */}
      <Modal visible={infoModalVisible} transparent={true} animationType="fade">
        <View style={styles.infoModalContainer}>
          <View style={styles.infoModalContent}>
            <Text style={styles.infoTitle}>{infoTitle}</Text>
            <ScrollView
              style={styles.infoScrollView}
              showsVerticalScrollIndicator={true}>
              <Text style={styles.infoText}>{infoText}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.infoCloseButton}
              onPress={() => setInfoModalVisible(false)}>
              <Text style={styles.infoCloseButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const {width} = Dimensions.get('window');

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  tapformoreinfo: {
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
    flexWrap: 'wrap', // Allow wrapping on smaller screens
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  shareButtonDisabled: {
    opacity: 0.7,
  },
  lowConfidence: {
    borderLeftColor: '#ff6b6b',
  },
  highConfidence: {
    borderLeftColor: '#51cf66',
  },
  lowConfidenceText: {
    color: '#ff6b6b',
  },
  highConfidenceText: {
    color: '#51cf66',
  },
  wellnessGaugeContainer: {
    paddingHorizontal: getResponsiveSpacing(16),
    marginBottom: getResponsiveSpacing(10),
  },
});
export default memo(ResultsModal);
