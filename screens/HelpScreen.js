import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen({ navigation }) {
  const helpItems = [
    {
      title: 'How to track buses',
      icon: 'bus',
      action: () => Alert.alert('Track Buses', 'Use the map screen to see real-time bus locations. Tap on a bus marker for more details.'),
    },
    {
      title: 'Find routes',
      icon: 'search',
      action: () => Alert.alert('Find Routes', 'Use the Route Search screen to find bus routes between locations.'),
    },
    {
      title: 'Switch to driver mode',
      icon: 'car',
      action: () => Alert.alert('Driver Mode', 'Use the menu drawer to switch between passenger and driver modes.'),
    },
    {
      title: 'Contact support',
      icon: 'call',
      action: () => Alert.alert('Contact Support', 'Email: support@metronavigo.com\nPhone: +1-234-567-8900'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcomeText}>
          Need help? Here are some common questions and answers.
        </Text>
        
        {helpItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.helpItem}
            onPress={item.action}
          >
            <View style={styles.helpContent}>
              <Ionicons name={item.icon} size={24} color="#2B973A" />
              <Text style={styles.helpText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  menuButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'System',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  helpContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
    fontFamily: 'System',
  },
}); 