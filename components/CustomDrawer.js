import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomDrawer = ({ navigation, currentRole = 'passenger', onRoleChange }) => {
  const [isDriverMode, setIsDriverMode] = useState(currentRole === 'driver');

  const handleRoleSwitch = (value) => {
    setIsDriverMode(value);
    const newRole = value ? 'driver' : 'passenger';
    onRoleChange?.(newRole);
    
    if (value) {
      // Switch to driver mode
      navigation.navigate('DriverTabs');
    } else {
      // Switch to passenger mode
      navigation.navigate('PassengerTabs');
    }
  };

  const handleMenuPress = (screenName, role) => {
    if (role === 'driver' && !isDriverMode) {
      Alert.alert('Switch to Driver Mode', 'Please switch to driver mode to access this feature.');
      return;
    }
    if (role === 'passenger' && isDriverMode) {
      Alert.alert('Switch to Passenger Mode', 'Please switch to passenger mode to access this feature.');
      return;
    }
    navigation.navigate(screenName);
  };

  const menuItems = [
    {
      title: 'Passenger Mode',
      icon: 'people',
      screen: 'PassengerTabs',
      role: 'passenger',
    },
    {
      title: 'Driver Mode',
      icon: 'car',
      screen: 'DriverTabs',
      role: 'driver',
    },
    {
      title: 'Route Search',
      icon: 'search',
      screen: 'RouteSearch',
      role: 'passenger',
    },
    {
      title: 'Help & Support',
      icon: 'help-circle',
      screen: 'Help',
      role: 'both',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="bus" size={32} color="#2B973A" />
          <Text style={styles.appName}>Metro NaviGo</Text>
        </View>
        <Text style={styles.version}>v1.0.0</Text>
      </View>

      {/* Role Switch */}
      <View style={styles.roleSwitchContainer}>
        <Text style={styles.roleLabel}>Switch Mode</Text>
        <View style={styles.switchContainer}>
          <Text style={[styles.roleText, !isDriverMode && styles.activeRole]}>
            Passenger
          </Text>
          <Switch
            value={isDriverMode}
            onValueChange={handleRoleSwitch}
            trackColor={{ false: '#e9ecef', true: '#2B973A' }}
            thumbColor={isDriverMode ? '#fff' : '#fff'}
            style={styles.switch}
          />
          <Text style={[styles.roleText, isDriverMode && styles.activeRole]}>
            Driver
          </Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => {
          const isVisible = item.role === 'both' || 
            (item.role === 'passenger' && !isDriverMode) ||
            (item.role === 'driver' && isDriverMode);

          if (!isVisible) return null;

          return (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.screen, item.role)}
            >
              <View style={styles.menuItemContent}>
                <Ionicons name={item.icon} size={24} color="#666" />
                <Text style={styles.menuText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton}>
          <Ionicons name="log-out" size={20} color="#FF6B6B" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2B973A',
    marginLeft: 12,
    fontFamily: 'System',
  },
  version: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'System',
  },
  roleSwitchContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'System',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'System',
  },
  activeRole: {
    color: '#2B973A',
    fontWeight: '600',
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
    fontFamily: 'System',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginLeft: 8,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default CustomDrawer; 