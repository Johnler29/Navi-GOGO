import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSupabase } from '../contexts/SupabaseContext';
import { useDrawer } from '../contexts/DrawerContext';
import CapacityStatusModal from '../components/CapacityStatusModal';

const { width } = Dimensions.get('window');

// Simple UUID generator for React Native
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function DriverHomeScreen({ navigation }) {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [passengerCount, setPassengerCount] = useState(0);
  const [tripStartTime, setTripStartTime] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [currentCapacity, setCurrentCapacity] = useState(0);
  const [currentBus, setCurrentBus] = useState(null);
  const [currentDriver, setCurrentDriver] = useState(null);

  // Get data from Supabase context
  const { 
    buses, 
    routes, 
    drivers, 
    schedules, 
    driverBusAssignments,
    loading, 
    error, 
    refreshData,
    getDriverSchedules,
    getDriverBuses,
    updateDriverStatus,
    startTrip,
    endTrip,
    updatePassengerCount,
    reportEmergency,
    reportMaintenanceIssue,
    updateBusCapacityStatus,
    getBusCapacityStatus,
    startDriverSession,
    endDriverSession
  } = useSupabase();

  // Get drawer context
  const { openDrawer } = useDrawer();

  // Load current driver information on component mount
  useEffect(() => {
    const loadCurrentDriver = async () => {
      try {
        const driverSession = await AsyncStorage.getItem('driverSession');
        if (driverSession) {
          const session = JSON.parse(driverSession);
          const driver = drivers.find(d => d.id === session.driver_id);
          if (driver) {
            setCurrentDriver(driver);
            console.log('✅ Current driver loaded:', driver);
            
            // Find assigned bus for this driver using driver-bus assignments
            const assignment = driverBusAssignments.find(assignment => assignment.driver_id === driver.id);
            if (assignment) {
              // Find the bus details from the buses array
              const assignedBus = buses.find(bus => bus.id === assignment.bus_id);
              if (assignedBus) {
                setCurrentBus(assignedBus);
                console.log('✅ Assigned bus found:', assignedBus);
              } else {
                console.log('❌ Bus not found for assignment:', assignment.bus_id);
              }
            } else {
              console.log('❌ No bus assignment found for driver:', driver.id);
            }
          }
        }
      } catch (error) {
        console.error('Error loading current driver:', error);
      }
    };

    if (drivers.length > 0 && driverBusAssignments.length > 0) {
      loadCurrentDriver();
    }
  }, [drivers, buses, driverBusAssignments, routes]);

  // Calculate driver stats from real data
  const calculateDriverStats = () => {
    if (!currentDriver) return [];
    
    const today = new Date().toDateString();
    const todaySchedules = schedules.filter(schedule => 
      schedule.bus_id === currentBus?.id && 
      new Date(schedule.departure_time).toDateString() === today
    );
    
    const driverBuses = buses.filter(bus => bus.driver_id === currentDriver.id);
    const activeBuses = driverBuses.filter(bus => bus.status === 'active');
    const totalPassengers = activeBuses.reduce((sum, bus) => sum + (bus.current_passengers || 0), 0);
    const totalDistance = activeBuses.reduce((sum, bus) => sum + (bus.distance_traveled || 0), 0);
    
    return [
      {
        title: 'Today\'s Trips',
        value: todaySchedules.length.toString(),
        icon: 'car',
        color: '#4CAF50',
      },
      {
        title: 'Passengers',
        value: totalPassengers.toString(),
        icon: 'account-group',
        color: '#2196F3',
      },
      {
        title: 'Distance',
        value: `${totalDistance.toFixed(1)} km`,
        icon: 'speedometer',
        color: '#FF9800',
      },
      {
        title: 'Active Buses',
        value: activeBuses.length.toString(),
        icon: 'bus',
        color: '#F44336',
      },
    ];
  };

  // Generate recent trips from schedules
  const generateRecentTrips = () => {
    const recentSchedules = schedules
      .filter(schedule => schedule.status === 'completed')
      .slice(0, 3)
      .map(schedule => {
        const route = routes.find(r => r.id === schedule.route_id);
        return {
          id: schedule.id,
          route: route ? `Route ${route.route_number}` : `Route ${schedule.route_id}`,
          startTime: new Date(schedule.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          endTime: new Date(schedule.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          passengers: schedule.passengers_count || 0,
          status: schedule.status,
        };
      });
    
    return recentSchedules;
  };

  const driverStats = calculateDriverStats();
  const recentTrips = generateRecentTrips();

  const quickActions = [
    {
      title: 'Start Trip',
      icon: 'play-circle',
      color: '#4CAF50',
      action: 'startTrip',
    },
    {
      title: 'End Trip',
      icon: 'stop-circle',
      color: '#F44336',
      action: 'endTrip',
    },
    {
      title: 'Passengers',
      icon: 'people',
      color: '#2196F3',
      action: 'passengers',
    },
    {
      title: 'Capacity',
      icon: 'speedometer',
      color: '#00BCD4',
      action: 'capacity',
    },
    {
      title: 'Report Issue',
      icon: 'alert-circle',
      color: '#FF9800',
      action: 'reportIssue',
    },
    {
      title: 'Emergency',
      icon: 'alert-circle',
      color: '#E91E63',
      action: 'emergency',
    },
    {
      title: 'Profile',
      icon: 'person',
      color: '#9C27B0',
      action: 'profile',
    },
  ];

  const handleQuickAction = async (action) => {
    // Use the current driver from state
    if (!currentDriver) {
      Alert.alert('Error', 'Driver not found. Please log in again.');
      return;
    }
    
    // Use the current bus from state
    if (!currentBus) {
      Alert.alert('No Bus Assigned', 'No bus is currently assigned to you.');
      return;
    }

    switch (action) {
      case 'startTrip':
        if (isOnDuty) {
          Alert.alert('Already on duty', 'You are already on an active trip.');
        } else {
          try {
            setIsOnDuty(true);
            setTripStartTime(new Date());
            
            // Start trip in database
            // Use a default route ID if currentBus.route_id is null/undefined
            const routeId = currentBus.route_id || routes[0]?.id;
            if (!routeId) {
              Alert.alert('Error', 'No route available for this bus. Please contact support.');
              setIsOnDuty(false);
              return;
            }
            
            const tripResult = await startTrip(currentDriver.id, currentBus.id, routeId);
            
            // Update driver status
            await updateDriverStatus(currentDriver.id, 'active');
            
            // Create driver session in database
            const driverSession = await startDriverSession(currentDriver.id, currentBus.id);
            
            // Store session in AsyncStorage
            await AsyncStorage.setItem('driverSession', JSON.stringify(driverSession));
            
            setCurrentTrip({
              route: `Route ${routes.find(r => r.id === currentBus.route_id)?.route_number || 'Unknown'}`,
              startTime: new Date().toLocaleTimeString(),
              passengers: 0,
              busId: currentBus.id,
              scheduleId: tripResult?.id || schedules.find(s => s.bus_id === currentBus.id && s.status === 'scheduled')?.id
            });
            
            Alert.alert('Trip Started', 'Your trip has been started successfully.');
          } catch (error) {
            console.error('Error starting trip:', error);
            Alert.alert('Error', 'Failed to start trip. Please try again.');
          }
        }
        break;
      case 'endTrip':
        if (!isOnDuty || !currentTrip) {
          Alert.alert('No active trip', 'You are not currently on an active trip.');
        } else {
          try {
            // End trip in database
            await endTrip(currentTrip.scheduleId, {
              busId: currentTrip.busId
            });
            
            // Update driver status
            await updateDriverStatus(currentDriver.id, 'inactive');
            
            // End driver session
            const sessionData = await AsyncStorage.getItem('driverSession');
            if (sessionData) {
              const session = JSON.parse(sessionData);
              await endDriverSession(session.id);
            }
            
            // Clear driver session
            await AsyncStorage.removeItem('driverSession');
            
            setIsOnDuty(false);
            setCurrentTrip(null);
            setPassengerCount(0);
            setTripStartTime(null);
            
            Alert.alert('Trip Ended', 'Your trip has been ended successfully.');
          } catch (error) {
            console.error('Error ending trip:', error);
            Alert.alert('Error', 'Failed to end trip. Please try again.');
          }
        }
        break;
      case 'passengers':
        setShowPassengerModal(true);
        break;
      case 'capacity':
        if (!currentBus) {
          Alert.alert('No Bus Assigned', 'No bus is currently assigned to you.');
        } else {
          setCurrentBus(currentBus);
          setCurrentCapacity(currentBus.capacity_percentage || 0);
          setShowCapacityModal(true);
        }
        break;
      case 'reportIssue':
        navigation.navigate('DriverMaintenance');
        break;
      case 'emergency':
        navigation.navigate('DriverEmergency');
        break;
      case 'profile':
        navigation.navigate('DriverProfile');
        break;
    }
  };

  const handleCapacityUpdate = async (busId, capacityPercentage) => {
    try {
      await updateBusCapacityStatus(busId, capacityPercentage);
      setCurrentCapacity(capacityPercentage);
      // Update the bus in the local state
      const updatedBus = buses.find(bus => bus.id === busId);
      if (updatedBus) {
        updatedBus.capacity_percentage = capacityPercentage;
        updatedBus.current_passengers = Math.round((capacityPercentage / 100) * 50);
      }
    } catch (error) {
      console.error('Error updating capacity:', error);
      throw error;
    }
  };

  const handleProfilePress = () => {
    Alert.alert('Profile', 'Driver profile screen coming soon!');
  };

  const handleMenuPress = () => {
    openDrawer();
  };

  const handleRoleSwitch = () => {
    Alert.alert(
      'Switch to Passenger Mode',
      'Are you a passenger?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Switch to Passenger',
          onPress: () => navigation.navigate('Home'),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading driver data...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#F44336" />
          <Text style={styles.errorText}>Failed to load driver data</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={async () => {
            try {
              await refreshData();
            } catch (error) {
              console.error('Error refreshing data:', error);
            }
          }}>
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
          <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
            <Ionicons name="menu" size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Driver Dashboard</Text>
            <Text style={styles.headerSubtitle}>Metro NaviGo Driver</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <Ionicons name="person-circle" size={32} color="#374151" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.dutyStatus}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={[styles.statusText, { color: isOnDuty ? '#10B981' : '#EF4444' }]}>
                {isOnDuty ? 'On Duty' : 'Off Duty'}
              </Text>
            </View>
            <TouchableOpacity style={styles.switchButton} onPress={handleRoleSwitch}>
              <Ionicons name="car" size={20} color="#374151" />
              <Text style={styles.switchText}>Switch</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Trip - Prominent Card */}
        {currentTrip && (
          <View style={styles.currentTripCard}>
            <View style={styles.tripHeader}>
              <View style={styles.tripIconContainer}>
                <Ionicons name="bus" size={24} color="#3B82F6" />
              </View>
              <View style={styles.tripHeaderText}>
                <Text style={styles.currentTripTitle}>Active Trip</Text>
                <Text style={styles.tripRoute}>{currentTrip.route}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.statusBadgeText}>ON TRIP</Text>
              </View>
            </View>
            
            <View style={styles.tripStats}>
              <View style={styles.tripStatItem}>
                <Ionicons name="people" size={20} color="#6B7280" />
                <Text style={styles.tripStatLabel}>Passengers</Text>
                <Text style={styles.tripStatValue}>{passengerCount}</Text>
              </View>
              <View style={styles.tripStatItem}>
                <Ionicons name="time" size={20} color="#6B7280" />
                <Text style={styles.tripStatLabel}>Duration</Text>
                <Text style={styles.tripStatValue}>
                  {tripStartTime ? Math.floor((new Date() - tripStartTime) / 60000) : 0}m
                </Text>
              </View>
              <View style={styles.tripStatItem}>
                <Ionicons name="speedometer" size={20} color="#6B7280" />
                <Text style={styles.tripStatLabel}>Capacity</Text>
                <Text style={styles.tripStatValue}>{currentCapacity}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* Stats Overview - Horizontal Cards */}
        <View style={styles.statsOverview}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsRow}>
            {driverStats.slice(0, 2).map((stat, index) => (
              <View key={index} style={styles.statCardHorizontal}>
                <View style={[styles.statIconSmall, { backgroundColor: stat.color + '15' }]}>
                  <MaterialCommunityIcons name={stat.icon} size={20} color={stat.color} />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValueSmall}>{stat.value}</Text>
                  <Text style={styles.statTitleSmall}>{stat.title}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.statsRow}>
            {driverStats.slice(2, 4).map((stat, index) => (
              <View key={index + 2} style={styles.statCardHorizontal}>
                <View style={[styles.statIconSmall, { backgroundColor: stat.color + '15' }]}>
                  <MaterialCommunityIcons name={stat.icon} size={20} color={stat.color} />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValueSmall}>{stat.value}</Text>
                  <Text style={styles.statTitleSmall}>{stat.title}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions - Essential Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.quickActionCard,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => handleQuickAction(action.action)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Trips - Compact List */}
        {recentTrips.length > 0 && (
          <View style={styles.recentTripsSection}>
            <Text style={styles.sectionTitle}>Recent Trips</Text>
            <View style={styles.tripsListCompact}>
              {recentTrips.map((trip) => (
                <View key={trip.id} style={styles.tripCardCompact}>
                  <View style={styles.tripCardLeft}>
                    <View style={styles.tripIconSmall}>
                      <Ionicons name="bus" size={16} color="#3B82F6" />
                    </View>
                    <View style={styles.tripInfoCompact}>
                      <Text style={styles.tripRouteCompact}>{trip.route}</Text>
                      <Text style={styles.tripTimeCompact}>{trip.startTime} - {trip.endTime}</Text>
                    </View>
                  </View>
                  <View style={styles.tripCardRight}>
                    <View style={[styles.statusBadgeSmall, { backgroundColor: '#10B981' }]}>
                      <Text style={styles.statusBadgeTextSmall}>{trip.status}</Text>
                    </View>
                    <Text style={styles.tripPassengersCompact}>{trip.passengers} passengers</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Passenger Management Modal */}
      <Modal
        visible={showPassengerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPassengerModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Passenger Count</Text>
            <TouchableOpacity onPress={() => setShowPassengerModal(false)}>
              <Text style={styles.modalSave}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.passengerCounter}>
              <Text style={styles.passengerLabel}>Current Passengers</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity 
                  style={styles.counterButton}
                  onPress={() => setPassengerCount(Math.max(0, passengerCount - 1))}
                >
                  <Ionicons name="remove" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.counterText}>{passengerCount}</Text>
                <TouchableOpacity 
                  style={styles.counterButton}
                  onPress={() => setPassengerCount(passengerCount + 1)}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.capacityText}>Max Capacity: 50</Text>
            </View>

            <View style={styles.passengerActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={async () => {
                  try {
                    setPassengerCount(0);
                    if (currentTrip?.busId) {
                      await updatePassengerCount(currentTrip.busId, 0);
                    }
                    Alert.alert('Reset', 'Passenger count has been reset to 0');
                  } catch (error) {
                    console.error('Error resetting passenger count:', error);
                    Alert.alert('Error', 'Failed to reset passenger count');
                  }
                }}
              >
                <Ionicons name="refresh" size={20} color="#3B82F6" />
                <Text style={styles.actionButtonText}>Reset Count</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={async () => {
                  try {
                    const newCount = passengerCount + 1;
                    setPassengerCount(newCount);
                    if (currentTrip?.busId) {
                      await updatePassengerCount(currentTrip.busId, newCount);
                    }
                    Alert.alert('Boarding', 'Passenger boarding recorded');
                  } catch (error) {
                    console.error('Error recording boarding:', error);
                    Alert.alert('Error', 'Failed to record boarding');
                  }
                }}
              >
                <Ionicons name="arrow-up" size={20} color="#10B981" />
                <Text style={styles.actionButtonText}>Record Boarding</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={async () => {
                  try {
                    const newCount = Math.max(0, passengerCount - 1);
                    setPassengerCount(newCount);
                    if (currentTrip?.busId) {
                      await updatePassengerCount(currentTrip.busId, newCount);
                    }
                    Alert.alert('Alighting', 'Passenger alighting recorded');
                  } catch (error) {
                    console.error('Error recording alighting:', error);
                    Alert.alert('Error', 'Failed to record alighting');
                  }
                }}
              >
                <Ionicons name="arrow-down" size={20} color="#EF4444" />
                <Text style={styles.actionButtonText}>Record Alighting</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Capacity Status Modal */}
      <CapacityStatusModal
        visible={showCapacityModal}
        onClose={() => setShowCapacityModal(false)}
        currentCapacity={currentCapacity}
        onUpdateCapacity={handleCapacityUpdate}
        busId={currentBus?.id}
        busInfo={currentBus}
      />
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
    marginBottom: 20,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#1A1A1A',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dutyStatus: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  switchText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'System',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  currentTripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tripIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tripHeaderText: {
    flex: 1,
  },
  currentTripTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'System',
  },
  tripRoute: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tripStatItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tripStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'System',
  },
  tripStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'System',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  statsOverview: {
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCardHorizontal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 6,
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
  statIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValueSmall: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  statTitleSmall: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'System',
  },
  quickActionsSection: {
    marginBottom: 32,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 72) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.8,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    fontFamily: 'System',
  },
  recentTripsSection: {
    marginBottom: 32,
  },
  tripsListCompact: {
    gap: 12,
  },
  tripCardCompact: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tripCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tripCardRight: {
    alignItems: 'flex-end',
  },
  tripIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tripInfoCompact: {
    flex: 1,
  },
  tripRouteCompact: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    fontFamily: 'System',
  },
  tripTimeCompact: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'System',
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusBadgeTextSmall: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'System',
  },
  tripPassengersCompact: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'System',
  },
  tripsList: {
    marginBottom: 32,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripRoute: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'System',
  },
  tripDetails: {
    gap: 8,
  },
  tripDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tripDetailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
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
    textAlign: 'center',
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'System',
  },
  retryButton: {
    marginTop: 24,
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
  passengerCounter: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  passengerLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 24,
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  counterButton: {
    backgroundColor: '#3B82F6',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  counterText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#1A1A1A',
    marginHorizontal: 32,
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  capacityText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'System',
  },
  passengerActions: {
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
}); 