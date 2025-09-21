import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSupabase } from '../contexts/SupabaseContext';

const RealtimeTest = () => {
  const { supabase } = useSupabase();
  const [status, setStatus] = useState('Not started');
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testRealtime = async () => {
    try {
      addLog('Starting real-time test...');
      
      if (!supabase) {
        addLog('❌ Supabase client not available');
        return;
      }

      addLog('✅ Supabase client available');
      addLog(`Supabase URL: ${supabase.supabaseUrl}`);

      if (!supabase.channel) {
        addLog('❌ Real-time not available - channel method missing');
        return;
      }

      addLog('✅ Real-time channel method available');

      const subscription = supabase
        .channel('test_channel')
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'buses'
          }, 
          (payload) => {
            addLog(`🎯 Real-time update received: ${JSON.stringify(payload)}`);
          }
        )
        .subscribe((status) => {
          addLog(`🎯 Subscription status: ${status}`);
          setStatus(status);
          
          if (status === 'SUBSCRIBED') {
            addLog('✅ Real-time subscription successful!');
          } else if (status === 'CHANNEL_ERROR') {
            addLog('❌ Real-time subscription failed');
          } else if (status === 'TIMED_OUT') {
            addLog('❌ Real-time subscription timed out');
          } else if (status === 'CLOSED') {
            addLog('❌ Real-time subscription closed');
          }
        });

      addLog('Real-time subscription setup complete');

    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
      console.error('Real-time test error:', error);
    }
  };

  const testDatabaseUpdate = async () => {
    try {
      addLog('Testing database update...');
      
      const { data, error } = await supabase
        .from('buses')
        .update({ 
          latitude: 14.4850 + (Math.random() - 0.5) * 0.01,
          longitude: 120.9050 + (Math.random() - 0.5) * 0.01,
          updated_at: new Date().toISOString()
        })
        .eq('name', 'Metro Express 1');

      if (error) {
        addLog(`❌ Database update error: ${error.message}`);
      } else {
        addLog('✅ Database update successful');
      }
    } catch (error) {
      addLog(`❌ Database update error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Real-Time Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={testRealtime}>
        <Text style={styles.buttonText}>Test Real-Time</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testDatabaseUpdate}>
        <Text style={styles.buttonText}>Test Database Update</Text>
      </TouchableOpacity>
      
      <Text style={styles.status}>Status: {status}</Text>
      
      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Logs:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 8,
  },
  logsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logText: {
    color: '#0f0',
    fontSize: 12,
    marginBottom: 2,
  },
});

export default RealtimeTest;
