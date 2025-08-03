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
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupabase } from '../contexts/SupabaseContext';

const { width } = Dimensions.get('window');

export default function DriverHomeScreen({ navigation }) {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);

  // Get data from Supabase context
  const { 
    buses, 
    routes, 
    drivers, 
    schedules, 
    loading, 
    error, 
    refreshData 
  } = useSupabase();

  // Calculate driver stats from real data
  const calculateDriverStats = () => {
    const today = new Date().toDateString();
    const todaySchedules = schedules.filter(schedule => 
      new Date(schedule.departure_time).toDateString() === today
    );
    
    const activeBuses = buses.filter(bus => bus.status === 'active');
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
  ];

  const handleQuickAction = (action) => {
    switch (action) {
      case 'startTrip':
        if (isOnDuty) {
          Alert.alert('Already on duty', 'You are already on an active trip.');
        } else {
          setIsOnDuty(true);
          setCurrentTrip({
            route: 'Route 101',
            startTime: new Date().toLocaleTimeString(),
            passengers: 0,
          });
          Alert.alert('Trip Started', 'Your trip has been started successfully.');
        }
        break;
      case 'endTrip':
        if (!isOnDuty) {
          Alert.alert('No active trip', 'You are not currently on duty.');
        } else {
          setIsOnDuty(false);
          setCurrentTrip(null);
          Alert.alert('Trip Ended', 'Your trip has been ended successfully.');
        }
        break;
      case 'reportIssue':
        Alert.alert('Report Issue', 'Issue reporting feature coming soon!');
        break;
      case 'emergency':
        Alert.alert('Emergency', 'Emergency contact feature coming soon!');
        break;
    }
  };

  const handleProfilePress = () => {
    Alert.alert('Profile', 'Driver profile screen coming soon!');
  };

  const handleMenuPress = () => {
    navigation.getParent()?.openDrawer();
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
          <ActivityIndicator size="large" color="#2B973A" />
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
          <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
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
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Driver Dashboard</Text>
            <Text style={styles.headerSubtitle}>Metro NaviGo Driver</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <Ionicons name="person-circle" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.dutyStatus}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={[styles.statusText, { color: isOnDuty ? '#4CAF50' : '#FF6B6B' }]}>
                {isOnDuty ? 'On Duty' : 'Off Duty'}
              </Text>
            </View>
            <TouchableOpacity style={styles.switchButton} onPress={handleRoleSwitch}>
              <Ionicons name="car" size={20} color="#fff" />
              <Text style={styles.switchText}>Switch</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Trip */}
        {currentTrip && (
          <View style={styles.currentTripCard}>
            <Text style={styles.currentTripTitle}>Current Trip</Text>
            <View style={styles.tripInfo}>
              <Text style={styles.tripRoute}>{currentTrip.route}</Text>
              <Text style={styles.tripTime}>Started: {currentTrip.startTime}</Text>
              <Text style={styles.tripPassengers}>Passengers: {currentTrip.passengers}</Text>
            </View>
          </View>
        )}

        {/* Driver Stats */}
        <Text style={styles.sectionTitle}>Today's Stats</Text>
        <View style={styles.statsGrid}>
          {driverStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <MaterialCommunityIcons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => handleQuickAction(action.action)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent Trips */}
        <Text style={styles.sectionTitle}>Recent Trips</Text>
        <View style={styles.tripsList}>
          {recentTrips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Text style={styles.tripRoute}>{trip.route}</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
                  <Text style={styles.statusBadgeText}>{trip.status}</Text>
                </View>
              </View>
              <View style={styles.tripDetails}>
                <View style={styles.tripDetail}>
                  <Ionicons name="time" size={16} color="#666" />
                  <Text style={styles.tripDetailText}>{trip.startTime} - {trip.endTime}</Text>
                </View>
                <View style={styles.tripDetail}>
                  <Ionicons name="people" size={16} color="#666" />
                  <Text style={styles.tripDetailText}>{trip.passengers} passengers</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: '#2B973A',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  menuButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
    fontFamily: 'System',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    fontFamily: 'System',
  },
  profileButton: {
    padding: 4,
  },
  dutyStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
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
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
    fontFamily: 'System',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'System',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  currentTripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  currentTripTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    fontFamily: 'System',
  },
  tripInfo: {
    gap: 4,
  },
  tripRoute: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B973A',
    fontFamily: 'System',
  },
  tripTime: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'System',
  },
  tripPassengers: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'System',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    fontFamily: 'System',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    fontFamily: 'System',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'System',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  actionCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    fontFamily: 'System',
  },
  tripsList: {
    marginBottom: 20,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripRoute: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'System',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'System',
  },
  tripDetails: {
    gap: 4,
  },
  tripDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontFamily: 'System',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'System',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'System',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
    fontFamily: 'System',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#2B973A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
}); 