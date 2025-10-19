const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testing Real-Time Bus Movement System');
console.log('=====================================');

async function testRealtimeSystem() {
  try {
    console.log('\n1. 📡 Testing Supabase Connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('buses')
      .select('id, bus_number, latitude, longitude')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      return;
    }
    console.log('✅ Supabase connection successful');

    console.log('\n2. 🚌 Getting Current Bus Data...');
    const { data: buses, error: busesError } = await supabase
      .from('buses')
      .select('id, bus_number, latitude, longitude, speed, tracking_status, last_location_update')
      .eq('tracking_status', 'active')
      .limit(5);
    
    if (busesError) {
      console.error('❌ Failed to fetch buses:', busesError.message);
      return;
    }
    
    console.log(`✅ Found ${buses.length} active buses:`);
    buses.forEach(bus => {
      console.log(`   🚌 ${bus.bus_number}: ${bus.latitude}, ${bus.longitude} (${bus.speed || 0} km/h)`);
    });

    if (buses.length === 0) {
      console.log('⚠️ No active buses found. Creating a test bus...');
      
      const { data: newBus, error: createError } = await supabase
        .from('buses')
        .insert({
          bus_number: 'TEST001',
          name: 'Test Bus',
          latitude: 14.5995,
          longitude: 120.9842,
          speed: 0,
          heading: 0,
          tracking_status: 'active',
          status: 'in_service'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create test bus:', createError.message);
        return;
      }
      
      console.log('✅ Test bus created:', newBus.bus_number);
      buses.push(newBus);
    }

    console.log('\n3. 🔄 Testing Real-Time Subscription...');
    
    // Set up real-time subscription
    const channel = supabase
      .channel('test_bus_movement')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'buses' 
        }, 
        (payload) => {
          console.log('🎯 REAL-TIME UPDATE RECEIVED:');
          console.log('   Event:', payload.event);
          console.log('   Table:', payload.table);
          console.log('   Bus ID:', payload.new.id);
          console.log('   New Position:', payload.new.latitude, payload.new.longitude);
          console.log('   Speed:', payload.new.speed, 'km/h');
          console.log('   Timestamp:', payload.new.last_location_update);
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription failed');
        }
      });

    console.log('\n4. 📍 Simulating Bus Movement...');
    
    const testBus = buses[0];
    if (!testBus) {
      console.error('❌ No bus available for testing');
      return;
    }

    // Simulate bus movement by updating position every 2 seconds
    let moveCount = 0;
    const maxMoves = 5;
    
    const moveInterval = setInterval(async () => {
      moveCount++;
      
      // Calculate new position (move in a small circle)
      const angle = (moveCount * 0.5) % (2 * Math.PI);
      const radius = 0.001; // ~100 meters
      const newLat = testBus.latitude + radius * Math.cos(angle);
      const newLng = testBus.longitude + radius * Math.sin(angle);
      const newSpeed = 25 + Math.random() * 15; // 25-40 km/h
      
      console.log(`\n🚌 Move ${moveCount}/${maxMoves}:`);
      console.log(`   From: ${testBus.latitude.toFixed(6)}, ${testBus.longitude.toFixed(6)}`);
      console.log(`   To:   ${newLat.toFixed(6)}, ${newLng.toFixed(6)}`);
      console.log(`   Speed: ${newSpeed.toFixed(1)} km/h`);
      
      // Update bus location
      const { error: updateError } = await supabase
        .from('buses')
        .update({
          latitude: newLat,
          longitude: newLng,
          speed: newSpeed,
          heading: Math.floor(angle * 180 / Math.PI),
          last_location_update: new Date().toISOString()
        })
        .eq('id', testBus.id);
      
      if (updateError) {
        console.error('❌ Update failed:', updateError.message);
      } else {
        console.log('✅ Position updated successfully');
      }
      
      // Update test bus position for next iteration
      testBus.latitude = newLat;
      testBus.longitude = newLng;
      
      if (moveCount >= maxMoves) {
        clearInterval(moveInterval);
        console.log('\n🏁 Test completed!');
        console.log('\n📊 Summary:');
        console.log('   - Real-time subscription should have received', maxMoves, 'updates');
        console.log('   - Check if you saw the "REAL-TIME UPDATE RECEIVED" messages above');
        console.log('   - If you saw them, real-time is working! ✅');
        console.log('   - If not, there may be a subscription issue ❌');
        
        // Cleanup
        channel.unsubscribe();
        process.exit(0);
      }
    }, 2000); // Update every 2 seconds

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRealtimeSystem();
