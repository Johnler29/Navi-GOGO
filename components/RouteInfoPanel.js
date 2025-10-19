import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RouteInfoPanel = ({ 
  routes = [], 
  selectedRoute = null, 
  onRouteSelect = null,
  onClose = null,
  isVisible = true 
}) => {
  if (!isVisible || routes.length === 0) {
    return null;
  }

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatFare = (fare) => {
    return `₱${fare.toFixed(2)}`;
  };

  const getRouteIcon = (route) => {
    // Different icons for different route types
    if (route.name?.toLowerCase().includes('express')) {
      return 'flash';
    } else if (route.name?.toLowerCase().includes('local')) {
      return 'bus';
    } else {
      return 'bus-outline';
    }
  };

  const getRouteColor = (route, index) => {
    if (route.color) return route.color;
    
    const colors = ['#4285F4', '#FBBC04', '#34A853', '#EA4335', '#9AA0A6'];
    return colors[index % colors.length];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bus" size={20} color="#4285F4" />
          <Text style={styles.headerTitle}>Available Routes</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Routes List */}
      <ScrollView style={styles.routesList} showsVerticalScrollIndicator={false}>
        {routes.map((route, index) => (
          <TouchableOpacity
            key={route.id || index}
            style={[
              styles.routeCard,
              selectedRoute?.id === route.id && styles.selectedRouteCard
            ]}
            onPress={() => onRouteSelect && onRouteSelect(route)}
          >
            {/* Route Header */}
            <View style={styles.routeHeader}>
              <View style={styles.routeInfo}>
                <View style={[
                  styles.routeIconContainer,
                  { backgroundColor: getRouteColor(route, index) + '20' }
                ]}>
                  <Ionicons 
                    name={getRouteIcon(route)} 
                    size={18} 
                    color={getRouteColor(route, index)} 
                  />
                </View>
                <View style={styles.routeDetails}>
                  <Text style={styles.routeName}>{route.name || `Route ${route.routeNumber}`}</Text>
                  <Text style={styles.routeNumber}>{route.routeNumber || `R${String(index + 1).padStart(3, '0')}`}</Text>
                </View>
              </View>
              {selectedRoute?.id === route.id && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color="#4285F4" />
                </View>
              )}
            </View>

            {/* Route Path */}
            <View style={styles.routePath}>
              <Text style={styles.origin}>{route.origin || 'Starting Point'}</Text>
              <View style={styles.pathLine}>
                <View style={[
                  styles.pathSegment,
                  { backgroundColor: getRouteColor(route, index) }
                ]} />
                <View style={[
                  styles.pathSegment,
                  { backgroundColor: '#FBBC04' }
                ]} />
                <View style={[
                  styles.pathSegment,
                  { backgroundColor: '#34A853' }
                ]} />
              </View>
              <Text style={styles.destination}>{route.destination || 'Destination'}</Text>
            </View>

            {/* Route Stats */}
            <View style={styles.routeStats}>
              <View style={styles.statItem}>
                <Ionicons name="time" size={16} color="#6B7280" />
                <Text style={styles.statText}>
                  {formatDuration(route.estimatedDuration || 0)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="cash" size={16} color="#6B7280" />
                <Text style={styles.statText}>
                  {formatFare(route.fare || 0)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="location" size={16} color="#6B7280" />
                <Text style={styles.statText}>
                  {route.stops?.length || 0} stops
                </Text>
              </View>
            </View>

            {/* Route Description */}
            {route.description && (
              <Text style={styles.routeDescription}>{route.description}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Tap a route to view on map
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 16,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  routesList: {
    flex: 1,
  },
  routeCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedRouteCard: {
    backgroundColor: '#EBF4FF',
    borderLeftWidth: 4,
    borderLeftColor: '#4285F4',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeDetails: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  routeNumber: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedIndicator: {
    marginLeft: 8,
  },
  routePath: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  origin: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  pathLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  pathSegment: {
    width: 12,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 1,
  },
  destination: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    marginLeft: 8,
    textAlign: 'right',
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  routeDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default RouteInfoPanel;
