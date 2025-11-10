///////////////////////////////Font Increase Limit Fix

import React, {useState, useCallback, useEffect, memo} from 'react';
import {
  Text,
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
  BackHandler,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {generateClient} from 'aws-amplify/api';
import {createUserData} from '../../src/graphql/mutations';

interface RouteParams {
  results: any;
  userInfo: any;
}

// ---- Font scaling caps (limit dynamic text scaling) ----
const FONT_CAPS = {
  title: 1.2, // big headers
  section: 1.2, // section headers
  label: 1.15, // field labels
  result: 1.2, // values
  confidence: 1.1, // small helper text
  button: 1.1, // buttons
  modalTitle: 1.4, // info modal title
  modalBody: 1.2, // info modal body
  small: 1.1,
};

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const isSmallPhone = SCREEN_W < 360 || SCREEN_H < 700;

// simple responsive helpers
const rs = (phone: number, tablet: number) =>
  SCREEN_W >= 768 ? tablet : phone;
const rh = (min: number, max: number) => (isSmallPhone ? min : max);

const Section = memo(
  ({title, children}: {title: string; children: React.ReactNode}) => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <Text
          style={styles.sectionTitle}
          allowFontScaling
          maxFontSizeMultiplier={FONT_CAPS.section}>
          {title}
        </Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  ),
);

const Row = memo(
  ({
    label,
    value,
    unit,
    confidence, // '1' | '2' | '3' | undefined
  }: {
    label: string;
    value: string | number;
    unit?: string;
    confidence?: string;
  }) => {
    const getConfidenceText = useCallback((lvl?: string) => {
      switch (lvl) {
        case '1':
          return 'Low';
        case '2':
          return 'Normal';
        case '3':
          return 'High';
        default:
          return undefined;
      }
    }, []);

    const confText = getConfidenceText(confidence);

    return (
      <View
        style={[
          styles.row,
          confidence === '1' && styles.rowLow,
          confidence === '3' && styles.rowHigh,
          (!confidence || confidence === '2') && styles.rowNormal,
        ]}>
        <Text
          style={styles.rowLabel}
          allowFontScaling
          maxFontSizeMultiplier={FONT_CAPS.label}
          numberOfLines={2}>
          {label}
        </Text>

        <View style={styles.rowRight}>
          <Text
            style={styles.rowValue}
            allowFontScaling
            maxFontSizeMultiplier={FONT_CAPS.result}>
            {value}
            {!!unit && (
              <Text
                style={styles.rowUnit}
                allowFontScaling
                maxFontSizeMultiplier={FONT_CAPS.small}>
                {' '}
                {unit}
              </Text>
            )}
          </Text>

          {confText && (
            <Text
              style={[
                styles.confText,
                confidence === '1' && styles.confLowText,
                confidence === '3' && styles.confHighText,
                (!confidence || confidence === '2') && styles.confNormalText,
              ]}
              allowFontScaling
              maxFontSizeMultiplier={FONT_CAPS.confidence}
              numberOfLines={1}
              adjustsFontSizeToFit>
              Confidence: {confText}
            </Text>
          )}
        </View>
      </View>
    );
  },
);

const ScanMeasurementResults = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {results, userInfo} = route.params as RouteParams;

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  const client = generateClient();

  // Handle Android back → go to Home tab
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.reset({
          index: 0,
          routes: [{name: 'MainTabs' as never, params: {screen: 'Home'}}],
        });
        return true;
      };
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => sub?.remove();
    }, [navigation]),
  );

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({window}) => {
      setDimensions(window);
    });
    return () => sub?.remove();
  }, []);

  const showConfidenceLevelInfo = () => setInfoModalVisible(true);

  const getConfidenceLevel = useCallback((level: string) => {
    switch (level) {
      case '1':
        return 'Low';
      case '2':
        return 'Normal';
      case '3':
        return 'High';
      default:
        return 'N/A';
    }
  }, []);

  const saveResultsToBackend = async () => {
    setIsSaving(true);

    const email = String(userInfo.userAttributesEmail);
    const actID = String(userInfo.activationID);
    const pulseRate = String(results.pr);
    const mRRI = String(results.meanRRI);

    // Local ISO (no trailing Z)
    const now = new Date();
    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, -1);

    const newScanResult = {
      email,
      activationID: actID,
      timeStamp: localISO,
      PULSE_RATE: String(results.pr),
      MEAN_RRI: String(results.meanRRI),
      BLOOD_PRESSURE: String(results.BP),
      HEMOGLOBIN: String(results.Hemo),
      HEMOGLOBIN_A1C: String(results.HemoA1C),
      LF_HF: String(results.LfHf),
      OXYGEN_SATURATION: String(results.OS),
      STRESS_LEVEL: String(results.SL),
      WELLNESS_INDEX: String(results.WI),
      SDNN: String(results.Sdnn),
      SDNN_CONF_LEVEL: String(results.SdnnConfLevel),
      RESPIRATION_RATE: String(results.RespRate),
      RESPIRATION_RATE_CONF_LEVEL: String(results.RespRateConfLevel),
      RRI: String(results.Rri),
      RRI_CONF_LEVEL: String(results.RriConfLevel),
      PRQ: String(results.Prq),
      PRQ_CONF_LEVEL: String(results.PrqConfLevel),
      PULSE_RATE_CONF_LEVEL: String(results.PulRateConfLevel),
      MEAN_RRI_CONF_LEVEL: String(results.MRriConfLevel),

      // 0.5.7
      PNS_INDEX: String(results.PNSIndex),
      PNS_ZONE: String(results.PNSZone),
      RMSSD: String(results.rMSSD),
      SD1: String(results.sD1),
      SD2: String(results.sD2),
      SNS_INDEX: String(results.SNSIndex),
      SNS_ZONE: String(results.SNSZone),
      STRESS_INDEX: String(results.stressIndex),
      WELLNESS_LEVEL: String(results.WellnessLevel),

      // 0.5.8
      ASCVD_RISK: String(results.ASCVDRisk),
      HEART_AGE: String(results.heartAge),
      HIGH_BLOOD_PRESSURE_RISK: String(results.highBloodPressureRisk),
      HIGH_FASTING_GLUCOSE_RISK: String(results.highFastingGlucoseRisk),
      HIGH_HEMOGLOBIN_A1C_RISK: String(results.highHemoglobinA1cRisk),
      HIGH_TOTAL_CHOLESTEROL_RISK: String(results.highTotalCholesterolRisk),
      LOW_HEMOGLOBIN_RISK: String(results.lowHemoglobinRisk),
      NORMALIZED_STRESS_INDEX: String(results.normalizedStressIndex),

      userDeviceInfoVersion: String(Platform.Version),
      userDeviceInfo: Platform.OS,
    };

    // keep last 365d and any dates manually loaded
    const filterWithPreservedData = (data: any[]) => {
      const now = new Date();
      const preserved: Record<string, boolean> = {};

      data.forEach(item => {
        const d = new Date(item.timeStamp);
        const ageDays = (now.getTime() - d.getTime()) / 86400000;
        if (ageDays > 365) {
          preserved[d.toLocaleDateString('en-US')] = true;
        }
      });

      return data.filter(item => {
        const d = new Date(item.timeStamp);
        const ageDays = (now.getTime() - d.getTime()) / 86400000;
        const key = d.toLocaleDateString('en-US');
        return !isNaN(d.getTime()) && (ageDays <= 365 || preserved[key]);
      });
    };

    try {
      const existing = await AsyncStorage.getItem('scanResults');
      const parsed = existing ? JSON.parse(existing) : [];
      const merged = [...parsed, newScanResult];
      const filtered = merged.length
        ? filterWithPreservedData(merged)
        : [newScanResult];

      await AsyncStorage.setItem('scanResults', JSON.stringify(filtered));

      await client.graphql({
        query: createUserData,
        variables: {input: newScanResult},
        authMode: 'userPool',
      });

      navigation.reset({
        index: 0,
        routes: [{name: 'MainTabs' as never, params: {screen: 'History'}}],
      });
    } catch (err) {
      console.error('Error saving data:', err);
      Alert.alert('Error', 'Failed to save results. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    navigation.reset({
      index: 0,
      routes: [{name: 'MainTabs' as never, params: {screen: 'Home'}}],
    });
  };

  // --------- UI ----------
  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      {/* Top banner */}
      <View style={styles.headerCard}>
        <Text
          style={styles.headerHint}
          allowFontScaling
          maxFontSizeMultiplier={FONT_CAPS.small}>
          To see more detailed measurement, tap{' '}
          <Text style={styles.headerHintBold}>Save Results</Text> and go to{' '}
          <Text style={styles.headerHintBold}>History</Text>.
        </Text>

        <TouchableOpacity
          onPress={showConfidenceLevelInfo}
          style={styles.infoPill}>
          <Text
            style={styles.infoPillText}
            allowFontScaling
            maxFontSizeMultiplier={FONT_CAPS.small}>
            i
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Wellness */}
        <Section title="Wellness Indicators">
          <Row label="Wellness Index" value={results.WI} unit="(score)" />
          <Row label="Stress Index" value={results.stressIndex} />
        </Section>

        {/* Vitals */}
        <Section title="Vitals">
          <Row
            label="Heart Rate"
            value={results.pr}
            unit="bpm"
            confidence={results.PulRateConfLevel}
          />
          <Row
            label="Respiration Rate"
            value={results.RespRate}
            unit="brpm"
            confidence={results.RespRateConfLevel}
          />
          <Row label="Blood Pressure" value={results.BP} unit="mmHg" />
          <Row label="Oxygen Saturation" value={results.OS} unit="%" />
        </Section>

        {/* Blood */}
        <Section title="Blood Data">
          <Row label="Hemoglobin A1C" value={results.HemoA1C} unit="%" />
        </Section>

        {/* ANS */}
        <Section title="Autonomic Nervous System">
          <Row label="PNS Index" value={results.PNSIndex} unit="SD" />
        </Section>
      </ScrollView>

      {/* Footer actions */}
      <Pressable style={styles.footerBar}>
        <TouchableOpacity
          style={[styles.btnSecondary, styles.btn]}
          onPress={handleClose}>
          <Text
            style={styles.btnSecondaryText}
            allowFontScaling
            maxFontSizeMultiplier={FONT_CAPS.button}>
            Close
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnPrimary, styles.btn, isSaving && {opacity: 0.7}]}
          onPress={saveResultsToBackend}
          disabled={isSaving}>
          <Text
            style={styles.btnPrimaryText}
            allowFontScaling
            maxFontSizeMultiplier={FONT_CAPS.button}>
            {isSaving ? 'Saving...' : 'Save Results'}
          </Text>
        </TouchableOpacity>
      </Pressable>

      {/* Confidence Info Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={infoModalVisible}
        onRequestClose={() => setInfoModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, {maxWidth: SCREEN_W * 0.9}]}>
            <Text
              style={styles.modalTitle}
              allowFontScaling
              maxFontSizeMultiplier={FONT_CAPS.modalTitle}>
              Confidence Level
            </Text>

            <ScrollView
              style={{maxHeight: dimensions.height * 0.6}}
              contentContainerStyle={{paddingBottom: 12}}
              showsVerticalScrollIndicator>
              <Text
                style={styles.modalText}
                allowFontScaling
                maxFontSizeMultiplier={FONT_CAPS.modalBody}>
                Confidence levels indicate the reliability of each measurement.
              </Text>
              <Text
                style={styles.modalText}
                allowFontScaling
                maxFontSizeMultiplier={FONT_CAPS.modalBody}>
                <Text style={styles.modalBold}>Low (1):</Text> Measurement may
                have a reduced accuracy.
              </Text>
              <Text
                style={styles.modalText}
                allowFontScaling
                maxFontSizeMultiplier={FONT_CAPS.modalBody}>
                <Text style={styles.modalBold}>Normal (2):</Text> Measurement
                has a standard level of accuracy.
              </Text>
              <Text
                style={styles.modalText}
                allowFontScaling
                maxFontSizeMultiplier={FONT_CAPS.modalBody}>
                <Text style={styles.modalBold}>High (3):</Text> Measurement has
                a high level of accuracy.
              </Text>
              <Text
                style={styles.modalText}
                allowFontScaling
                maxFontSizeMultiplier={FONT_CAPS.modalBody}>
                Movement, lighting, face position, and skin tone can affect
                confidence levels. For best results, stay still in a well-lit
                environment during the scan.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setInfoModalVisible(false)}>
              <Text
                style={styles.modalBtnText}
                allowFontScaling
                maxFontSizeMultiplier={FONT_CAPS.button}>
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Saving overlay */}
      <Modal
        animationType="fade"
        transparent
        visible={isSaving}
        onRequestClose={() => {}}>
        <View style={styles.savingOverlay}>
          <View style={styles.savingCard}>
            <ActivityIndicator size="large" color="#00619b" />
            <Text
              style={styles.savingText}
              allowFontScaling
              maxFontSizeMultiplier={FONT_CAPS.small}>
              Saving results...
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Screen
  screen: {
    flex: 1,
    backgroundColor: '#016097',
  },

  // Header card
  headerCard: {
    backgroundColor: '#00619b',
    paddingHorizontal: rs(16, 24),
    paddingTop: rh(18, 26),
    paddingBottom: rh(12, 14),
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headerHint: {
    color: '#cfe9f6',
    fontSize: rs(12, 13),
    lineHeight: Platform.OS === 'ios' ? 18 : 20,
    flex: 1,
    includeFontPadding: false,
  },
  headerHintBold: {
    fontWeight: '700',
    color: '#ffffff',
  },
  infoPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoPillText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },

  // Scroll area
  scroll: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
  scrollContent: {
    paddingHorizontal: rs(16, 24),
    paddingTop: rh(12, 16),
    paddingBottom: rh(20, 24),
    gap: rh(12, 16),
  },

  // Section card
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {elevation: 2},
    }),
  },
  sectionHeaderRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e6ea',
    paddingHorizontal: rs(14, 16),
    paddingVertical: rh(10, 12),
  },
  sectionTitle: {
    color: '#0b5381',
    fontWeight: '800',
    fontSize: rs(16, 18),
  },
  sectionBody: {
    paddingHorizontal: rs(14, 16),
    paddingVertical: rh(6, 8),
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: rh(8, 10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#edf0f2',
  },
  rowLabel: {
    fontSize: rs(13, 14),
    color: '#2e2e2e',
    flex: 1,
    paddingRight: 10,
    lineHeight: Platform.OS === 'ios' ? 20 : 22,
    includeFontPadding: false,
  },
  rowRight: {
    alignItems: 'flex-end',
    minWidth: '35%',
  },
  rowValue: {
    fontSize: rs(16, 18),
    fontWeight: '800',
    color: '#222',
    lineHeight: Platform.OS === 'ios' ? 24 : 26,
    includeFontPadding: false,
  },
  rowUnit: {
    fontSize: rs(12, 13),
    color: '#666',
    fontWeight: '500',
  },

  // Confidence styles (left accent optional in future)
  rowLow: {},
  rowHigh: {},
  rowNormal: {},

  confText: {
    marginTop: Platform.OS === 'ios' ? 4 : 2,
    fontSize: rs(11, 12),
    fontStyle: 'italic',
    color: '#666',
    includeFontPadding: false,
  },
  confLowText: {color: '#ff6b6b'},
  confHighText: {color: '#51cf66'},
  confNormalText: {color: '#666'},

  // Footer
  footerBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: rs(16, 20),
    paddingTop: rh(12, 16),
    paddingBottom: rh(16, 20),
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e6ea',
  },
  btnSecondaryText: {
    color: '#e11d48', // soft red for "Close"
    fontWeight: '700',
    fontSize: rs(16, 18),
  },
  btnPrimary: {
    backgroundColor: '#00619b',
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: rs(16, 18),
  },

  // Confidence modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: rs(16, 20),
    paddingTop: rh(16, 20),
    paddingBottom: rh(12, 16),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: {elevation: 4},
    }),
  },
  modalTitle: {
    fontSize: rs(18, 20),
    fontWeight: '800',
    color: '#222',
    marginBottom: rh(10, 12),
  },
  modalText: {
    fontSize: rs(14, 15),
    color: '#444',
    lineHeight: rs(20, 22),
    marginBottom: 10,
  },
  modalBold: {fontWeight: '800'},
  modalBtn: {
    alignSelf: 'center',
    backgroundColor: '#00619b',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 10,
  },
  modalBtnText: {color: '#fff', fontWeight: '700', fontSize: rs(15, 16)},

  // Saving modal
  savingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  savingText: {
    marginTop: 12,
    fontSize: rs(14, 16),
    color: '#222',
    fontWeight: '700',
  },
});

export default ScanMeasurementResults;
