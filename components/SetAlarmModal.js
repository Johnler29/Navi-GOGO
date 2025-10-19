import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupabase } from '../contexts/SupabaseContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SetAlarmModal = ({ visible, onClose, userType = 'passenger', selectedBus = null }) => {
  const [alarmType, setAlarmType] = useState('arrival');
  const [selectedBusId, setSelectedBusId] = useState(selectedBus?.id || '');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [alarmTime, setAlarmTime] = useState('');
  const [alarmMessage, setAlarmMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const { buses: contextBuses, routes: contextRoutes } = useSupabase();

  useEffect(() => {
    if (visible) {
      setBuses(contextBuses || []);
      setRoutes(contextRoutes || []);
      if (selectedBus) {
        setSelectedBusId(selectedBus.id);
        setSelectedRouteId(selectedBus.route_id || '');
      }
    }
  }, [visible, contextBuses, contextRoutes, selectedBus]);

  const alarmTypes = [
    {
      id: 'arrival',
      title: 'Bus Arrival',
      description: 'Get notified when your bus arrives',
      icon: 'bus',
      color: '#10B981',
      timeOptions: ['5 minutes before', '10 minutes before', '15 minutes before', 'When bus arrives']
    },
    {
      id: 'departure',
      title: 'Bus Departure',
      description: 'Get notified when your bus is about to leave',
      icon: 'time',
      color: '#F59E0B',
      timeOptions: ['5 minutes before', '10 minutes before', '15 minutes before', 'When bus departs']
    },
    {
      id: 'schedule',
      title: 'Schedule Reminder',
      description: 'Set a custom time reminder',
      icon: 'alarm',
      color: '#3B82F6',
      timeOptions: ['Custom time']
    }
  ];

  const timeOptions = alarmTypes.find(type => type.id === alarmType)?.timeOptions || [];

  const handleSetAlarm = async () => {
    if (!selectedBusId) {
      Alert.alert('Error', 'Please select a bus');
      return;
    }

    if (!alarmTime) {
      Alert.alert('Error', 'Please select when to be notified');
      return;
    }

    setLoading(true);
    try {
      const selectedBus = buses.find(bus => bus.id === selectedBusId);
      const selectedRoute = routes.find(route => route.id === selectedRouteId);

      const alarmData = {
        id: Date.now().toString(),
        type: alarmType,
        busId: selectedBusId,
        busNumber: selectedBus?.bus_number || 'Unknown',
        routeId: selectedRouteId,
        routeName: selectedRoute?.name || 'Unknown Route',
        alarmTime: alarmTime,
        message: alarmMessage.trim() || `Reminder for ${selectedBus?.bus_number || 'bus'}`,
        createdAt: new Date().toISOString(),
        isActive: true,
        userType: userType
      };

      // Save alarm to AsyncStorage
      const existingAlarms = await AsyncStorage.getItem('userAlarms');
      const alarms = existingAlarms ? JSON.parse(existingAlarms) : [];
      alarms.push(alarmData);
      await AsyncStorage.setItem('userAlarms', JSON.stringify(alarms));

      Alert.alert(
        'Alarm Set!',
        `You'll be notified ${alarmTime.toLowerCase()} for Bus ${selectedBus?.bus_number || 'Unknown'}`,
        [{ text: 'OK', onPress: onClose }]
      );

      // Reset form
      setAlarmType('arrival');
      setSelectedBusId('');
      setSelectedRouteId('');
      setAlarmTime('');
      setAlarmMessage('');
    } catch (error) {
      console.error('Error setting alarm:', error);
      Alert.alert('Error', 'Failed to set alarm. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAlarmType('arrival');
    setSelectedBusId('');
    setSelectedRouteId('');
    setAlarmTime('');
    setAlarmMessage('');
    onClose();
  };

  const filteredBuses = buses.filter(bus => 
    bus.driver_id && bus.status === 'active' && bus.latitude && bus.longitude
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="alarm" size={24} color="#3B82F6" />
              <Text style={styles.title}>Set Bus Alarm</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Set a reminder for your bus schedule
            </Text>

            {/* Alarm Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alarm Type</Text>
              {alarmTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    alarmType === type.id && styles.typeButtonSelected,
                    { borderColor: type.color }
                  ]}
                  onPress={() => setAlarmType(type.id)}
                >
                  <View style={styles.typeButtonContent}>
                    <View style={[styles.typeIcon, { backgroundColor: type.color }]}>
                      <Ionicons name={type.icon} size={20} color="#fff" />
                    </View>
                    <View style={styles.typeText}>
                      <Text style={[
                        styles.typeTitle,
                        alarmType === type.id && { color: type.color }
                      ]}>
                        {type.title}
                      </Text>
                      <Text style={styles.typeDescription}>{type.description}</Text>
                    </View>
                    {alarmType === type.id && (
                      <Ionicons name="checkmark-circle" size={24} color={type.color} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bus Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Bus</Text>
              <View style={styles.dropdown}>
                <Text style={styles.dropdownText}>
                  {selectedBusId ? 
                    `Bus ${buses.find(bus => bus.id === selectedBusId)?.bus_number || 'Unknown'}` : 
                    'Choose a bus'
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </View>
              {selectedBusId && (
                <ScrollView style={styles.busList} nestedScrollEnabled>
                  {filteredBuses.map((bus) => (
                    <TouchableOpacity
                      key={bus.id}
                      style={[
                        styles.busItem,
                        selectedBusId === bus.id && styles.busItemSelected
                      ]}
                      onPress={() => {
                        setSelectedBusId(bus.id);
                        setSelectedRouteId(bus.route_id || '');
                      }}
                    >
                      <View style={styles.busInfo}>
                        <Text style={styles.busNumber}>Bus {bus.bus_number}</Text>
                        <Text style={styles.busRoute}>
                          {routes.find(r => r.id === bus.route_id)?.name || 'Unknown Route'}
                        </Text>
                      </View>
                      <View style={styles.busStatus}>
                        <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.statusText}>Active</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Time Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>When to notify you</Text>
              {timeOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.timeButton,
                    alarmTime === option && styles.timeButtonSelected
                  ]}
                  onPress={() => setAlarmTime(option)}
                >
                  <Text style={[
                    styles.timeButtonText,
                    alarmTime === option && styles.timeButtonTextSelected
                  ]}>
                    {option}
                  </Text>
                  {alarmTime === option && (
                    <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Message */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Custom Message (Optional)</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Add a custom message for your alarm..."
                value={alarmMessage}
                onChangeText={setAlarmMessage}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={100}
              />
              <Text style={styles.characterCount}>{alarmMessage.length}/100</Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.setButton, loading && styles.setButtonDisabled]}
              onPress={handleSetAlarm}
              disabled={loading || !selectedBusId || !alarmTime}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="alarm" size={20} color="#fff" />
                  <Text style={styles.setButtonText}>Set Alarm</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  typeButton: {
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  typeButtonSelected: {
    backgroundColor: '#F0F9FF',
  },
  typeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeText: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  busList: {
    maxHeight: 200,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  busItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  busItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  busInfo: {
    flex: 1,
  },
  busNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  busRoute: {
    fontSize: 14,
    color: '#6B7280',
  },
  busStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  timeButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  timeButtonTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    minHeight: 80,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  setButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    gap: 8,
  },
  setButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  setButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SetAlarmModal;
