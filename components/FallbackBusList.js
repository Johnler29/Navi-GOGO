import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FallbackBusList = ({ buses = [], onBusSelect, loading = false }) => {
  const renderBusItem = ({ item: bus }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'full': return '#EF4444';
        case 'crowded': return '#F59E0B';
        case 'moderate': return '#3B82F6';
        case 'light': return '#10B981';
        default: return '#6B7280';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'full': return 'close-circle';
        case 'crowded': return 'warning';
        case 'moderate': return 'information-circle';
        case 'light': return 'checkmark-circle';
        default: return 'ellipse';
      }
    };

    return (
      <TouchableOpacity
        style={styles.busItem}
        onPress={() => onBusSelect && onBusSelect(bus)}
      >
        <View style={styles.busInfo}>
          <View style={styles.busHeader}>
            <Text style={styles.busName}>{bus.bus_name || bus.bus_number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bus.capacity_status) }]}>
              <Ionicons name={getStatusIcon(bus.capacity_status)} size={12} color="white" />
              <Text style={styles.statusText}>{bus.capacity_status || 'unknown'}</Text>
            </View>
          </View>
          
          <Text style={styles.routeName}>{bus.route_name || 'Unknown Route'}</Text>
          
          <View style={styles.busDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="people" size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                {bus.current_passengers || 0}/{bus.max_capacity || 50} passengers
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="time" size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                {bus.is_moving ? 'Moving' : 'Stopped'}
              </Text>
            </View>
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Loading buses...</Text>
      </View>
    );
  }

  if (buses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bus" size={48} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No buses available</Text>
        <Text style={styles.emptySubtitle}>
          There are currently no active buses on the map.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Buses</Text>
        <Text style={styles.headerSubtitle}>{buses.length} buses found</Text>
      </View>
      
      <FlatList
        data={buses}
        keyExtractor={(item) => item.bus_id?.toString() || item.id?.toString()}
        renderItem={renderBusItem}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  busItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  busInfo: {
    flex: 1,
  },
  busHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  busName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  routeName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  busDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
});

export default FallbackBusList;
