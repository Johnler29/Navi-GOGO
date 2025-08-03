import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import BusListScreen from './screens/BusListScreen';
import RouteScreen from './screens/RouteScreen';

// Import driver screens
import DriverHomeScreen from './screens/DriverHomeScreen';
import DriverMapScreen from './screens/DriverMapScreen';
import DriverScheduleScreen from './screens/DriverScheduleScreen';

// Import additional screens
import SettingsScreen from './screens/SettingsScreen';
import HelpScreen from './screens/HelpScreen';

// Import custom drawer
import CustomDrawer from './components/CustomDrawer';

// Import Supabase context
import { SupabaseProvider } from './contexts/SupabaseContext';

const Drawer = createDrawerNavigator();
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
        tabBarActiveTintColor: '#2B973A',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e9ecef',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
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
        tabBarActiveTintColor: '#2B973A',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e9ecef',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
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
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [currentRole, setCurrentRole] = useState('passenger');

  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
  };

  return (
    <SupabaseProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Drawer.Navigator
          initialRouteName="PassengerTabs"
          drawerContent={(props) => (
            <CustomDrawer 
              {...props} 
              currentRole={currentRole}
              onRoleChange={handleRoleChange}
            />
          )}
          screenOptions={{
            headerShown: false,
            drawerStyle: {
              backgroundColor: '#fff',
              width: 280,
            },
            drawerActiveTintColor: '#2B973A',
            drawerInactiveTintColor: '#666',
          }}
        >
          {/* Passenger Tab Navigator */}
          <Drawer.Screen 
            name="PassengerTabs" 
            component={PassengerTabNavigator}
            options={{
              drawerLabel: 'Passenger Mode',
              drawerIcon: ({ color, size }) => (
                <Ionicons name="people" size={size} color={color} />
              ),
            }}
          />

          {/* Driver Tab Navigator */}
          <Drawer.Screen 
            name="DriverTabs" 
            component={DriverTabNavigator}
            options={{
              drawerLabel: 'Driver Mode',
              drawerIcon: ({ color, size }) => (
                <Ionicons name="car" size={size} color={color} />
              ),
            }}
          />

          {/* Additional Screens */}
          <Drawer.Screen 
            name="RouteSearch" 
            component={RouteScreen}
            options={{
              drawerLabel: 'Route Search',
              drawerIcon: ({ color, size }) => (
                <Ionicons name="search" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen 
            name="Help" 
            component={HelpScreen}
            options={{
              drawerLabel: 'Help & Support',
              drawerIcon: ({ color, size }) => (
                <Ionicons name="help-circle" size={size} color={color} />
              ),
            }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </SupabaseProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
