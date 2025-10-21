import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {Text, StyleSheet, TouchableOpacity, View, Platform} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Import your existing screen components
import ProfileScreen from '../screens/ProfileScreen';
import History from '../screens/History';
import LandingScreen from '../screens/LandingScreen';
import DisclaimerScreen from '../screens/DisclaimerScreen';
import ContactScreen from '../screens/ContactScreen';
import PreMeasureScreen from '../screens/PreMeasureScreen';
import MeasureScreen from '../screens/MeasureScreen';
import ScanMeasurementResults from '../screens/ScanMeasurementResults';
import ProfileEdit from '../screens/ProfileEdit';
import DeleteMyAccount from '../screens/DeleteMyAccount';
import {PanGestureHandler, State} from 'react-native-gesture-handler';
import {BackHandler} from 'react-native';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom back button component
const CustomBackButton = ({navigation}) => (
  <TouchableOpacity
    onPress={() => navigation.navigate('MainTabs', {screen: 'Home'})}
    style={{marginLeft: 10}}>
    <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
  </TouchableOpacity>
);

// Create the Tab Navigator as a separate component with double swipe to close
const TabNavigator = () => {
  const [lastSwipeTime, setLastSwipeTime] = React.useState(0);

  const handleSwipeGesture = event => {
    const {translationX, velocityX, state} = event.nativeEvent;

    if (state === State.END && translationX > 100 && velocityX > 0) {
      const currentTime = Date.now();
      const timeDifference = currentTime - lastSwipeTime;

      if (timeDifference < 800) {
        // Double swipe within 800ms
        BackHandler.exitApp();
      } else {
        setLastSwipeTime(currentTime);
      }
    }
  };

  return (
    <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
      <View style={{flex: 1}}>
        <Tab.Navigator
          screenOptions={({route}) => ({
            tabBarIcon: ({focused, color, size}) => {
              let iconName;
              let iconSize = focused ? 29 : 24; // 20% larger (24 * 1.2 = 28.8 ≈ 29)

              if (route.name === 'History') {
                iconName = 'history';
              } else if (route.name === 'Scan') {
                iconName = 'face-recognition';
                iconSize = focused ? 28 : 24;
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
              height: Platform.OS === 'ios' ? 75 : 75,
              paddingBottom: Platform.OS === 'ios' ? 20 : 20,
              paddingTop: 1,
              paddingHorizontal: 48,
              shadowColor: 'rgba(0, 0, 0, 0.19)',
              shadowOffset: {
                width: 0,
                height: -3,
              },
              shadowRadius: 38,
              elevation: 38,
              shadowOpacity: 1,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontFamily: 'NunitoSans12pt-Bold',
              fontWeight: '700',
              // lineHeight: 18,
              flexShrink: 1,
            },
            tabBarItemStyle: {
              gap: 4,
            },
            headerShown: false,
          })}
          initialRouteName="Home">
          <Tab.Screen
            name="History"
            component={History}
            options={{
              tabBarLabel: 'History',
            }}
          />
          <Tab.Screen
            name="Home"
            component={LandingScreen}
            options={{
              tabBarLabel: 'Home',
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
                      shadowOffset: {
                        width: 0,
                        height: 2,
                      },
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
                    style={{
                      fontSize: 12,
                      fontFamily: 'NunitoSans12pt-Bold',
                      fontWeight: '700',
                      color: props.accessibilityState?.selected
                        ? '#fff'
                        : 'rgba(255, 255, 255, 0.6)',
                      marginTop: 2,
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
              tabBarLabel: 'Profile',
            }}
          />
        </Tab.Navigator>
      </View>
    </PanGestureHandler>
  );
};

// Main AppNavigator with Stack Navigator
const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#016097',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontFamily: 'NunitoSans12pt-Bold',
          fontWeight: '700',
          fontSize: 17,
        },
        headerBackTitleVisible: false,
        headerBackTitle: '', // Add this line
      }}>
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="PreMeasure"
        component={PreMeasureScreen}
        options={{
          title: 'Preparing Scan',
          headerTitleAlign: 'center',
          unmountOnBlur: true, // ADD THIS LINE
        }}
      />
      <Stack.Screen
        name="MeasureScreen"
        component={MeasureScreen}
        options={{
          title: 'Scan',
          headerTitleAlign: 'center',
          unmountOnBlur: true, // ADD THIS LINE
        }}
      />

      {/* History screen with custom back button */}
      <Stack.Screen
        name="HistoryStack"
        component={History}
        options={({navigation}) => ({
          title: 'History',
          headerTitleAlign: 'center',
          headerLeft: () => <CustomBackButton navigation={navigation} />,
        })}
      />

      {/* ScanMeasurementResults with custom back button */}
      <Stack.Screen
        name="ScanMeasurementResults"
        component={ScanMeasurementResults}
        options={({navigation}) => ({
          title: 'Results',
          headerTitleAlign: 'center',
          headerLeft: () => <CustomBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="DisclaimerScreen"
        component={DisclaimerScreen}
        options={{
          title: 'Disclosure',
          headerTitleAlign: 'center', // Add this line
        }}
      />
      <Stack.Screen
        name="ContactScreen"
        component={ContactScreen}
        options={{
          title: 'Support',
          headerTitleAlign: 'center', // Add this line
        }}
      />

      {/* Profile screen with custom back button */}
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
        options={{
          title: 'Edit Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DeleteMyAccount"
        component={DeleteMyAccount}
        options={{
          title: 'Delete My Account',
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="CompleteProfile"
        component={CompleteProfileScreen}
        options={{
          title: 'Complete Profile',
          headerTitleAlign: 'center',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
