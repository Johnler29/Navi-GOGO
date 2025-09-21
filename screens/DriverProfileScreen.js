import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function DriverProfileScreen({ navigation }) {
  const [driver, setDriver] = useState(null);
  const [currentBus, setCurrentBus] = useState(null);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);

  // Get data from Supabase context
  const { 
    drivers, 
    buses, 
    schedules, 
    driverBusAssignments,
    loading, 
    error, 
    refreshData,
    refreshDriverData 
  } = useSupabase();

  // Get auth context
  const { signOut } = useAuth();

  useEffect(() => {
    // Load current driver from AsyncStorage session
    const loadCurrentDriver = async () => {
      try {
        console.log('🔍 Loading driver profile...');
        console.log('📊 Available drivers:', drivers.length);
        console.log('🚌 Available buses:', buses.length);
        console.log('🔗 Available assignments:', driverBusAssignments.length);
        
        // If no drivers loaded, try to refresh driver data
        if (drivers.length === 0) {
          console.log('⚠️ No drivers found, refreshing driver data...');
          await refreshDriverData();
          return; // Exit early, will retry on next render
        }
        
        const driverSession = await AsyncStorage.getItem('driverSession');
        console.log('💾 Driver session:', driverSession ? 'Found' : 'Not found');
        
        if (driverSession) {
          const sessionData = JSON.parse(driverSession);
          console.log('👤 Session data:', sessionData);
          const currentDriver = drivers.find(d => d.id === sessionData.driver_id);
          console.log('🔍 Found driver:', currentDriver ? 'Yes' : 'No');
          setDriver(currentDriver);
          
          if (currentDriver) {
            setEditForm({
              name: currentDriver.name,
              phone: currentDriver.phone || '',
              email: currentDriver.email,
            });
            
            // Find assigned bus for this driver
            const assignment = driverBusAssignments.find(assignment => assignment.driver_id === currentDriver.id);
            if (assignment) {
              const assignedBus = buses.find(bus => bus.id === assignment.bus_id);
              if (assignedBus) {
                setCurrentBus(assignedBus);
                console.log('✅ Assigned bus found:', assignedBus);
              } else {
                console.log('❌ Bus not found for assignment:', assignment.bus_id);
              }
            } else {
              console.log('❌ No bus assignment found for driver:', currentDriver.id);
            }
          }
        } else {
          // Fallback to first driver if no session
          console.log('⚠️ No session found, using first driver');
          const currentDriver = drivers[0];
          setDriver(currentDriver);
          if (currentDriver) {
            setEditForm({
              name: currentDriver.name,
              phone: currentDriver.phone || '',
              email: currentDriver.email,
            });
            
            // Find assigned bus for this driver
            const assignment = driverBusAssignments.find(assignment => assignment.driver_id === currentDriver.id);
            if (assignment) {
              const assignedBus = buses.find(bus => bus.id === assignment.bus_id);
              if (assignedBus) {
                setCurrentBus(assignedBus);
                console.log('✅ Assigned bus found:', assignedBus);
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Error loading driver session:', error);
        // Fallback to first driver
        const currentDriver = drivers[0];
        setDriver(currentDriver);
        if (currentDriver) {
          setEditForm({
            name: currentDriver.name,
            phone: currentDriver.phone || '',
            email: currentDriver.email,
          });
        }
      }
    };

    if (drivers.length > 0 && driverBusAssignments.length > 0) {
      loadCurrentDriver();
    } else {
      console.log('⚠️ No drivers or assignments available yet');
    }
  }, [drivers, buses, driverBusAssignments]);

  useEffect(() => {
    if (driver) {
      calculatePerformanceStats();
    }
  }, [driver, schedules, buses]);

  const calculatePerformanceStats = () => {
    if (!driver) return;

    const driverBuses = buses.filter(bus => bus.driver_id === driver.id);
    const driverSchedules = schedules.filter(schedule => 
      driverBuses.some(bus => bus.id === schedule.bus_id)
    );

    const today = new Date();
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const completedTrips = driverSchedules.filter(s => s.status === 'completed');
    const thisWeekTrips = completedTrips.filter(s => 
      new Date(s.departure_time) >= thisWeek
    );
    const thisMonthTrips = completedTrips.filter(s => 
      new Date(s.departure_time) >= thisMonth
    );

    const totalPassengers = completedTrips.reduce((sum, trip) => 
      sum + (trip.passengers_count || 0), 0
    );
    const totalDistance = completedTrips.reduce((sum, trip) => 
      sum + (trip.distance || 0), 0
    );

    const onTimePercentage = completedTrips.length > 0 ? 
      (completedTrips.filter(trip => {
        const scheduledTime = new Date(trip.departure_time);
        const actualTime = new Date(trip.actual_departure_time || trip.departure_time);
        const timeDiff = Math.abs(actualTime - scheduledTime) / (1000 * 60); // minutes
        return timeDiff <= 5; // 5 minutes tolerance
      }).length / completedTrips.length) * 100 : 0;

    setPerformanceStats({
      totalTrips: completedTrips.length,
      thisWeekTrips: thisWeekTrips.length,
      thisMonthTrips: thisMonthTrips.length,
      totalPassengers,
      totalDistance: totalDistance.toFixed(1),
      onTimePercentage: onTimePercentage.toFixed(1),
      averageRating: 4.7, // Mock data - would come from feedback table
      currentBus: driverBuses.find(bus => bus.status === 'active')?.bus_number || 'N/A',
    });
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = () => {
    // In real app, this would update the database
    Alert.alert('Profile Updated', 'Your profile has been updated successfully!');
    setShowEditModal(false);
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change feature coming soon!');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            try {
              // Clear driver session from AsyncStorage
              await AsyncStorage.removeItem('driverSession');
              // Sign out from auth context
              await signOut();
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleMenuPress = () => {
    navigation.getParent()?.openDrawer();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (error || !driver) {
    const errorMessage = error 
      ? `Database Error: ${error}` 
      : drivers.length === 0 
        ? 'No drivers found in database' 
        : 'Driver profile not found';
    
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#F44336" />
          <Text style={styles.errorText}>Failed to load profile</Text>
          <Text style={styles.errorSubtext}>{errorMessage}</Text>
          <Text style={styles.errorSubtext}>
            Available drivers: {drivers.length}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshDriverData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Driver Profile</Text>
          <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
            <Ionicons name="menu" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#3B82F6" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <Text style={styles.licenseNumber}>License: {driver.license_number}</Text>
            <Text style={styles.driverStatus}>
              Status: <Text style={[styles.statusText, { color: driver.status === 'active' ? '#10B981' : '#EF4444' }]}>
                {driver.status === 'active' ? 'Active' : 'Inactive'}
              </Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#666" />
              <Text style={styles.infoText}>{driver.phone || 'Not provided'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color="#666" />
              <Text style={styles.infoText}>{driver.email || 'Not provided'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="car" size={20} color="#666" />
              <Text style={styles.infoText}>
                Current Bus: {currentBus ? `${currentBus.bus_number} ${currentBus.name || ''}`.trim() : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Performance Statistics */}
        {performanceStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="car-multiple" size={24} color="#4CAF50" />
                <Text style={styles.statValue}>{performanceStats.totalTrips}</Text>
                <Text style={styles.statLabel}>Total Trips</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="account-group" size={24} color="#2196F3" />
                <Text style={styles.statValue}>{performanceStats.totalPassengers}</Text>
                <Text style={styles.statLabel}>Passengers</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="speedometer" size={24} color="#FF9800" />
                <Text style={styles.statValue}>{performanceStats.totalDistance} km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="clock-check" size={24} color="#9C27B0" />
                <Text style={styles.statValue}>{performanceStats.onTimePercentage}%</Text>
                <Text style={styles.statLabel}>On Time</Text>
              </View>
            </View>
          </View>
        )}

        {/* Weekly Performance */}
        {performanceStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <View style={styles.weeklyStats}>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyValue}>{performanceStats.thisWeekTrips}</Text>
                <Text style={styles.weeklyLabel}>Trips Completed</Text>
              </View>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyValue}>{performanceStats.thisMonthTrips}</Text>
                <Text style={styles.weeklyLabel}>This Month</Text>
              </View>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyValue}>{performanceStats.averageRating}</Text>
                <Text style={styles.weeklyLabel}>Rating</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.actionsList}>
            <TouchableOpacity style={styles.actionItem} onPress={handleChangePassword}>
              <Ionicons name="key" size={20} color="#666" />
              <Text style={styles.actionText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="notifications" size={20} color="#666" />
              <Text style={styles.actionText}>Notification Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="help-circle" size={20} color="#666" />
              <Text style={styles.actionText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleLogout}>
              <Ionicons name="log-out" size={20} color="#F44336" />
              <Text style={[styles.actionText, { color: '#F44336' }]}>Logout</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm({...editForm, name: text})}
                placeholder="Enter your full name"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.phone}
                onChangeText={(text) => setEditForm({...editForm, phone: text})}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.email}
                onChangeText={(text) => setEditForm({...editForm, email: text})}
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#1A1A1A',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginTop: 24,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  licenseNumber: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
    fontFamily: 'System',
  },
  driverStatus: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'System',
  },
  statusText: {
    fontWeight: '700',
  },
  editButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 72) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 6,
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'System',
  },
  weeklyStats: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  weeklyStat: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 6,
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  weeklyLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'System',
  },
  actionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
    flex: 1,
    fontWeight: '500',
    fontFamily: 'System',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'System',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FAFAFA',
  },
  errorText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'System',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    fontFamily: 'System',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  modalSave: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    fontFamily: 'System',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    fontFamily: 'System',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontFamily: 'System',
  },
});
