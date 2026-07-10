/////with new result screen instead of modal
// AppNavigator.js

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  BackHandler,
} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {GestureHandlerRootView, Gesture} from 'react-native-gesture-handler';

import ProfileScreen from '../screens/ProfileScreen';
import History from '../screens/History';
import LandingScreen from '../screens/LandingScreen';
import DisclaimerScreen from '../screens/DisclaimerScreen';
import ContactScreen from '../screens/ContactScreen';
import PreMeasureScreen from '../screens/PreMeasureScreen';
import MeasureScreen from '../screens/MeasureScreen';
import ScanMeasurementResults from '../screens/ScanMeasurementResults'; // <-- keep old screen
import ScanResultsScreen from '../screens/ScanResultsScreen'; // <-- new screen (additional)
import ProfileEdit from '../screens/ProfileEdit';
import DeleteMyAccount from '../screens/DeleteMyAccount';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CustomBackButton = ({navigation}) => (
  <TouchableOpacity
    onPress={() => navigation.navigate('MainTabs', {screen: 'Home'})}
    style={{marginLeft: 10}}>
    <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
  </TouchableOpacity>
);

const TabNavigator = () => {
  const [lastSwipeTime, setLastSwipeTime] = React.useState(0);
  const handleSwipeGesture = Gesture.Pan().onEnd(event => {
    const {translationX, velocityX} = event;
    if (translationX > 100 && velocityX > 0) {
      const currentTime = Date.now();
      if (currentTime - lastSwipeTime < 800) {
        BackHandler.exitApp();
      } else {
        setLastSwipeTime(currentTime);
      }
    }
  });

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <View style={{flex: 1}}>
        <Tab.Navigator
          screenOptions={({route}) => ({
            tabBarIcon: ({focused, color}) => {
              let iconName;
              let iconSize = focused ? 29 : 24;

              if (route.name === 'History') {
                iconName = 'history';
              } else if (route.name === 'Home') {
                iconName = 'face-recognition';
              } else if (route.name === 'Profile') {
                iconName = 'account';
              }

              return (
                <MaterialCommunityIcons
                  name={iconName}
                  size={iconSize}
                  color={color}
                />
              );
            },
            tabBarActiveTintColor: '#fff',
            tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
            tabBarStyle: {
              backgroundColor: '#016097',
              height: Platform.OS === 'ios' ? 75 : 90,
              paddingBottom: Platform.OS === 'ios' ? 20 : 14,
              paddingTop: 1,
              paddingHorizontal: 48,
              shadowColor: 'rgba(0, 0, 0, 0.19)',
              shadowOffset: {width: 0, height: -3},
              shadowRadius: 38,
              elevation: 38,
              shadowOpacity: 1,
            },
            tabBarLabelStyle: {
              fontSize: 14,
              fontFamily: 'NunitoSans12pt-Bold',
              fontWeight: '700',
              lineHeight: 14,
              marginBottom: 4,
              allowFontScaling: false,
            },
            tabBarAllowFontScaling: false,
            tabBarItemStyle: {gap: 4},
            headerShown: false,
          })}
          initialRouteName="Home">
          <Tab.Screen
            name="History"
            component={History}
            options={{
              tabBarLabel: ({color}) => (
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 14,
                    fontFamily: 'NunitoSans12pt-Bold',
                    fontWeight: '700',
                    color: color,
                    lineHeight: 14,
                    marginBottom: 4,
                  }}>
                  History
                </Text>
              ),
            }}
          />
          <Tab.Screen
            name="Home"
            component={LandingScreen}
            options={{
              tabBarLabel: ({color}) => (
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 24,
                    fontFamily: 'NunitoSans12pt-Bold',
                    fontWeight: '700',
                    color: color,
                    lineHeight: 14,
                    marginBottom: 4,
                  }}>
                  Home
                </Text>
              ),
              tabBarButton: props => (
                <TouchableOpacity
                  {...props}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    top: Platform.OS === 'ios' ? -20 : -20,
                  }}>
                  <View
                    style={{
                      backgroundColor: props.accessibilityState?.selected
                        ? '#fff'
                        : '#f0f0f0',
                      borderRadius: 35,
                      width: 65,
                      height: 65,
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: {width: 0, height: 2},
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                      elevation: 5,
                    }}>
                    <MaterialCommunityIcons
                      name="face-recognition"
                      size={34}
                      color={
                        props.accessibilityState?.selected
                          ? '#016097'
                          : 'rgba(1, 96, 151, 0.6)'
                      }
                    />
                  </View>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 14,
                      fontFamily: 'NunitoSans12pt-Bold',
                      fontWeight: '700',
                      color: props.accessibilityState?.selected
                        ? '#fff'
                        : 'rgba(255, 255, 255, 0.6)',
                      marginTop: 2,
                      lineHeight: 14,
                      marginBottom: 4,
                    }}>
                    Home
                  </Text>
                </TouchableOpacity>
              ),
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              tabBarLabel: ({color}) => (
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 14,
                    fontFamily: 'NunitoSans12pt-Bold',
                    fontWeight: '700',
                    color: color,
                    lineHeight: 14,
                    marginBottom: 4,
                  }}>
                  Profile
                </Text>
              ),
            }}
          />
        </Tab.Navigator>
        <View {...handleSwipeGesture.contentContainerStyle}></View>
      </View>
    </GestureHandlerRootView>
  );
};

const AppNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerTitleAllowFontScaling: false,
      headerStyle: {backgroundColor: '#016097'},
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontFamily: 'NunitoSans12pt-Bold',
        fontWeight: '700',
        fontSize: 17,
      },
      headerBackTitleVisible: false,
      headerBackTitle: '',
    }}>
    <Stack.Screen
      name="MainTabs"
      component={TabNavigator}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="PreMeasure"
      component={PreMeasureScreen}
      options={{
        title: 'Preparing Scan',
        headerTitleAlign: 'center',
        unmountOnBlur: true,
      }}
    />
    <Stack.Screen
      name="MeasureScreen"
      component={MeasureScreen}
      options={{
        title: 'Scan',
        headerTitleAlign: 'center',
        unmountOnBlur: true,
      }}
    />

    {/* Keep the original ScanMeasurementResults in its old position */}
    <Stack.Screen
      name="ScanMeasurementResults"
      component={ScanMeasurementResults}
      options={({navigation}) => ({
        title: 'Results',
        headerTitleAlign: 'center',
        headerLeft: () => <CustomBackButton navigation={navigation} />,
      })}
    />

    {/* Add the new ScanResultsScreen in addition (modal-style if you want) */}
    <Stack.Screen
      name="ScanResults"
      component={ScanResultsScreen}
      options={{
        title: 'Results',
        headerTitleAlign: 'center',
        presentation: 'modal',
      }}
    />

    <Stack.Screen
      name="DisclaimerScreen"
      component={DisclaimerScreen}
      options={{title: 'Disclosure', headerTitleAlign: 'center'}}
    />
    <Stack.Screen
      name="ContactScreen"
      component={ContactScreen}
      options={{title: 'Support', headerTitleAlign: 'center'}}
    />
    <Stack.Screen
      name="HistoryStack"
      component={History}
      options={({navigation}) => ({
        title: 'History',
        headerTitleAlign: 'center',
        headerLeft: () => <CustomBackButton navigation={navigation} />,
      })}
    />
    <Stack.Screen
      name="ProfileStack"
      component={ProfileScreen}
      options={({navigation}) => ({
        title: 'Profile',
        headerTitleAlign: 'center',
        headerLeft: () => <CustomBackButton navigation={navigation} />,
      })}
    />
    <Stack.Screen
      name="Edit Profile"
      component={ProfileEdit}
      options={{title: 'Edit Profile', headerShown: false}}
    />
    <Stack.Screen
      name="DeleteMyAccount"
      component={DeleteMyAccount}
      options={{title: 'Delete My Account', headerShown: false}}
    />
    <Stack.Screen
      name="CompleteProfile"
      component={CompleteProfileScreen}
      options={{title: 'Complete Profile', headerTitleAlign: 'center'}}
    />
  </Stack.Navigator>
);

export default AppNavigator;
