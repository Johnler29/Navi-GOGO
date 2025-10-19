// import 'react-native-reanimated'; // Removed - not needed
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Text, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import screens
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import BusListScreen from './screens/BusListScreen';
import RouteScreen from './screens/RouteScreen';
import LoginScreen from './screens/LoginScreen';

// Import driver screens
import DriverLoginScreen from './screens/DriverLoginScreen';
import DriverHomeScreen from './screens/DriverHomeScreen';
import DriverMapScreen from './screens/DriverMapScreen';
import DriverScheduleScreen from './screens/DriverScheduleScreen';
import DriverProfileScreen from './screens/DriverProfileScreen';
import DriverEmergencyScreen from './screens/DriverEmergencyScreen';
import DriverNotificationsScreen from './screens/DriverNotificationsScreen';
import DriverAnalyticsScreen from './screens/DriverAnalyticsScreen';
import DriverMaintenanceScreen from './screens/DriverMaintenanceScreen';

// Import additional screens
import SettingsScreen from './screens/SettingsScreen';
import HelpScreen from './screens/HelpScreen';

// Import simple drawer
import SimpleDrawer from './components/SimpleDrawer';

// Import contexts
import { SupabaseProvider } from './contexts/SupabaseContext';
import { DrawerProvider, useDrawer } from './contexts/DrawerContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Passenger Tab Navigator
function PassengerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Routes') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Routes" 
        component={BusListScreen}
        options={{
          tabBarLabel: 'Routes',
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// Driver Tab Navigator
function DriverTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DriverHome') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'DriverMap') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'DriverProfile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="DriverHome" 
        component={DriverHomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="DriverMap" 
        component={DriverMapScreen}
        options={{
          tabBarLabel: 'Map',
        }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={DriverScheduleScreen}
        options={{
          tabBarLabel: 'Schedule',
        }}
      />
      <Tab.Screen 
        name="DriverProfile" 
        component={DriverProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// Driver Authentication Wrapper
function DriverAuthWrapper({ navigation }) {
  const [isDriverAuthenticated, setIsDriverAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDriverAuthentication();
  }, []);

  const checkDriverAuthentication = async () => {
    try {
      const driverSession = await AsyncStorage.getItem('driverSession');
      if (driverSession) {
        const session = JSON.parse(driverSession);
        if (session.driver_id) {
          setIsDriverAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Error checking driver authentication:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsDriverAuthenticated(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!isDriverAuthenticated) {
    return <DriverLoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return <DriverTabNavigator />;
}

// Main App Component with Authentication
function AppContent() {
  const { user, loading } = useAuth();
  const { drawerVisible, closeDrawer } = useDrawer();
  const [currentRole, setCurrentRole] = useState('passenger');
  const [driverAuthenticated, setDriverAuthenticated] = useState(false);

  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
    if (newRole === 'driver') {
      // Reset driver authentication when switching to driver mode
      setDriverAuthenticated(false);
    } else if (newRole === 'passenger') {
      // Reset driver authentication when switching to passenger mode
      setDriverAuthenticated(false);
    }
  };

  const handleDriverLogin = () => {
    setDriverAuthenticated(true);
  };

  const handleBackToPassenger = () => {
    setCurrentRole('passenger');
    setDriverAuthenticated(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // If switching to driver mode but not authenticated as driver, show driver login
  if (currentRole === 'driver' && !driverAuthenticated) {
    return (
      <SupabaseProvider>
        <DriverLoginScreen 
          onLoginSuccess={handleDriverLogin}
          onBackToPassenger={handleBackToPassenger}
        />
      </SupabaseProvider>
    );
  }

  return (
    <SupabaseProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#f59e0b" />
        <View style={styles.container}>
          {/* Simple Drawer Modal */}
          <SimpleDrawer
            visible={drawerVisible}
            onClose={closeDrawer}
            currentRole={currentRole}
            onRoleChange={handleRoleChange}
            navigation={{ navigate: (screen) => {
              // Handle navigation based on screen name
              if (screen === 'PassengerTabs') {
                setCurrentRole('passenger');
              } else if (screen === 'DriverTabs') {
                setCurrentRole('driver');
              }
            }}}
          />
          
          {/* Main Navigation */}
          {currentRole === 'passenger' ? (
            <PassengerTabNavigator />
          ) : (
            <DriverTabNavigator />
          )}
        </View>
      </NavigationContainer>
    </SupabaseProvider>
  );
}

export default function App() {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <DrawerProvider>
          <AppContent />
        </DrawerProvider>
      </AuthProvider>
    </SupabaseProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});
