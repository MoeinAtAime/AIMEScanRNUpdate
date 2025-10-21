// ProfileScreen.tsx — scrolls even inside tabs/pagers (Android-safe)

import * as React from 'react';
import {useCallback, useContext, useEffect, useReducer} from 'react';
import {
  Text,
  StyleSheet,
  Image,
  View,
  Alert,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {ScrollView as GHScrollView} from 'react-native-gesture-handler';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {signOut} from 'aws-amplify/auth';
import AuthContext from '../auth/context';
import {UserApiService} from '../api/userApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  userEmail: '',
  userHeight: '',
  userWeight: '',
  userSmokingStatus: '',
  userDisplayName: '',
  gender: '',
  isUpdating: false,
  loading: true,
  error: null as string | null,
  profileImageUri: null as string | null,
};

type State = typeof initialState;
type Action =
  | {
      type: 'SET_USER_DATA';
      payload: {
        email: string;
        height: string;
        weight: string;
        smokingStatus: string;
        displayName: string;
        gender: string;
      };
    }
  | {type: 'SET_UPDATING'; payload: boolean}
  | {type: 'SET_ERROR'; payload: string | null}
  | {type: 'SET_PROFILE_IMAGE'; payload: string | null};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_USER_DATA':
      return {
        ...state,
        ...{
          userEmail: action.payload.email,
          userHeight: action.payload.height,
          userWeight: action.payload.weight,
          userSmokingStatus: action.payload.smokingStatus,
          userDisplayName: action.payload.displayName,
          gender: action.payload.gender,
        },
        loading: false,
      };
    case 'SET_UPDATING':
      return {...state, isUpdating: action.payload};
    case 'SET_ERROR':
      return {...state, error: action.payload, loading: false};
    case 'SET_PROFILE_IMAGE':
      return {...state, profileImageUri: action.payload};
    default:
      return state;
  }
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const {setUser} = useContext(AuthContext);
  const [state, dispatch] = useReducer(reducer, initialState);
  const insets = useSafeAreaInsets();

  // Android hardware back to Scan tab
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('MainTabs', {screen: 'Home'});
        return true;
      };
      const sub =
        Platform.OS === 'android'
          ? require('react-native').BackHandler.addEventListener(
              'hardwareBackPress',
              onBackPress,
            )
          : {remove: () => {}};
      return () => sub?.remove();
    }, [navigation]),
  );

  const fetchUser = useCallback(async () => {
    try {
      const a = await UserApiService.fetchAttributes();
      dispatch({
        type: 'SET_USER_DATA',
        payload: {
          email: a.email,
          height: a['custom:Height'] || '',
          weight: a['custom:Weight'] || '',
          smokingStatus: a['custom:userSmokingStatus'] || 'No',
          displayName: a['custom:userDisplayName'] || '',
          gender: a.gender || 'Female',
        },
      });
      const savedImageUri = await AsyncStorage.getItem('user_profile_image');
      if (savedImageUri)
        dispatch({type: 'SET_PROFILE_IMAGE', payload: savedImageUri});
    } catch (e: any) {
      console.error(e);
      dispatch({type: 'SET_ERROR', payload: e?.message ?? 'Failed to load'});
      Alert.alert('Error', 'Failed to load profile. Please try again later.');
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);
  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [fetchUser]),
  );

  const calculateBMI = (height: string, weight: string) => {
    if (!height || !weight) return null;
    const [fStr, iStr] = height.split('.');
    const f = parseInt(fStr || '0', 10);
    const i = parseInt(iStr || '0', 10);
    const totalIn = f * 12 + i;
    const w = parseFloat(weight);
    if (!totalIn || !w) return null;
    const bmi = (w / (totalIn * totalIn)) * 703;
    return Number.isFinite(bmi) ? bmi.toFixed(1) : null;
  };
  const getBMICategory = (b: string | null) => {
    if (b === null) return '';
    const n = parseFloat(b);
    if (n < 18.5) return 'Underweight';
    if (n < 25) return 'Healthy';
    if (n < 30) return 'Overweight';
    return 'Obese';
  };

  const handleEditProfile = () => {
    navigation.navigate('Edit Profile', {
      currentHeight: state.userHeight,
      currentWeight: state.userWeight,
      currentSmokingStatus: state.userSmokingStatus,
      currentDisplayName: state.userDisplayName,
      currentEmail: state.userEmail,
      gender: state.gender,
      isUpdating: state.isUpdating,
      currentProfileImage: state.profileImageUri,
    });
  };
  const handleLogOut = useCallback(async () => {
    try {
      await signOut({global: true});
      setUser(null);
      let root: any = navigation;
      while (root.getParent()) root = root.getParent();
      root.reset({index: 0, routes: [{name: 'WelcomeScreen' as never}]});
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  }, [navigation, setUser]);

  const handleDeleteAccount = () => navigation.navigate('DeleteMyAccount');
  const handleDisclosure = () => navigation.navigate('DisclaimerScreen');
  const handleSupport = () => navigation.navigate('ContactScreen');
  const handleHowToScan = () =>
    require('react-native').Linking.openURL(
      'https://aimescan.com/education/how-to-scan/',
    );
  const handleFAQ = () =>
    require('react-native').Linking.openURL('https://aimescan.com/help/faq/');
  const handleErrors = () =>
    require('react-native').Linking.openURL('https://aimescan.com/error-code/');

  if (state.loading) {
    return (
      <SafeAreaView style={styles.loadingRoot} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#016097" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  const bmi = calculateBMI(state.userHeight, state.userWeight);
  const bmiCat = getBMICategory(bmi);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <GHScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: Math.max(insets.bottom, 16) + 24},
        ]}
        // 👇 these three are the usual Android lifesavers inside tabs/pagers
        nestedScrollEnabled
        overScrollMode="always"
        keyboardShouldPersistTaps="handled"
        // make sure nothing outer steals the pan:
        // @ts-ignore
        onStartShouldSetResponderCapture={() => false}
        // @ts-ignore
        onMoveShouldSetResponderCapture={() => false}>
        {/* Header pill */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <Image
              style={styles.avatar}
              source={
                state.profileImageUri
                  ? {uri: state.profileImageUri}
                  : state.gender === 'Male'
                  ? require('../assets/male.jpg')
                  : require('../assets/female.jpg')
              }
            />
            <View style={styles.profileText}>
              <Text style={styles.displayName} numberOfLines={2}>
                {state.userDisplayName || 'User Name'}
              </Text>
              <Text style={styles.email} numberOfLines={2}>
                {state.userEmail || 'user@email.com'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleEditProfile}
              hitSlop={10}
              activeOpacity={0.6}>
              <Text style={styles.editGlyph}>✏️</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.measureList}>
            <MeasureRow
              label="Height"
              value={state.userHeight ? `${state.userHeight}"` : 'Not set'}
            />
            <MeasureRow
              label="Weight"
              value={state.userWeight ? `${state.userWeight} lbs` : 'Not set'}
            />
            <MeasureRow
              label="Smoking Status"
              value={state.userSmokingStatus === 'No' ? 'Non-Smoker' : 'Smoker'}
            />
            <MeasureRow
              label="BMI"
              value={bmi ? `${bmi} ${bmiCat}` : 'Not available'}
            />
          </View>
        </View>

        {/* Menu card */}
        <View style={styles.card}>
          <NavRow title="How to Scan" onPress={handleHowToScan} />
          <Separator />
          <NavRow title="FAQ" onPress={handleFAQ} />
          <Separator />
          <NavRow title="Privacy and Terms" onPress={handleDisclosure} />
          <Separator />
          <NavRow title="Support" onPress={handleSupport} />
          <Separator />
          <NavRow title="Error Logs" onPress={handleErrors} />
          <Separator />
          <NavRow title="Log Out" onPress={handleLogOut} destructive />
          <Separator />
          <NavRow
            title="Delete My Account"
            onPress={handleDeleteAccount}
            destructive
          />
        </View>
      </GHScrollView>
    </SafeAreaView>
  );
}

/* ---- Small parts ---- */
const MeasureRow = ({label, value}: {label: string; value: string}) => (
  <View style={styles.measureRow}>
    <Text style={styles.measureLabel}>{label}</Text>
    <Text style={styles.measureValue}>{value}</Text>
  </View>
);

const NavRow = ({
  title,
  onPress,
  destructive = false,
}: {
  title: string;
  onPress: () => void;
  destructive?: boolean;
}) => (
  <TouchableOpacity style={styles.navRow} onPress={onPress} activeOpacity={0.6}>
    <Text style={[styles.navText, destructive && styles.navTextDanger]}>
      {title}
    </Text>
    <View style={styles.chevBox}>
      <Text style={styles.chev}>›</Text>
    </View>
  </TouchableOpacity>
);

const Separator = () => <View style={styles.separator} />;

/* ---- Styles ---- */
const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#B7DDF8'},
  loadingRoot: {
    flex: 1,
    backgroundColor: '#B7DDF8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b6b6b',
    textAlign: 'center',
  },

  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 16, paddingTop: 12, rowGap: 16},

  headerCard: {
    backgroundColor: '#4ca9ee',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {fontSize: 20, fontWeight: 'bold', color: '#1a1a1a'},

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    marginBottom: 10,
  },
  avatar: {width: 56, height: 56, borderRadius: 28, backgroundColor: '#eee'},
  profileText: {flex: 1, minWidth: 0},
  displayName: {fontSize: 16, fontWeight: '700', color: '#000'},
  email: {fontSize: 14, color: '#6b6b6b', marginTop: 4},
  editGlyph: {fontSize: 18, color: '#007AFF'},

  measureList: {marginTop: 6},
  measureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e6e6e6',
    columnGap: 12,
  },
  measureLabel: {fontSize: 14, color: '#333', flexShrink: 1},
  measureValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    textAlign: 'right',
    flexShrink: 1,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  navText: {fontSize: 16, fontWeight: '700', color: '#000', flexShrink: 1},
  navTextDanger: {color: '#ff0000'},
  chevBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chev: {fontSize: 18, color: '#a1a1a1'},

  separator: {height: 1, backgroundColor: '#e0e0e0'},
});
