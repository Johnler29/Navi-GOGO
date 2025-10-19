const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Debugging Bus Movement Issues');
console.log('================================');

async function debugBusMovement() {
  try {
    console.log('\n1. 🔍 Checking Database Schema...');
    
    // Check if buses table exists and has required columns
    const { data: tableInfo, error: tableError } = await supabase
      .from('buses')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Buses table error:', tableError.message);
      return;
    }
    console.log('✅ Buses table accessible');

    // Check if update_bus_location_simple function exists
    console.log('\n2. 🔍 Testing update_bus_location_simple function...');
    const { data: rpcTest, error: rpcError } = await supabase
      .rpc('update_bus_location_simple', {
        p_bus_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        p_latitude: 14.5995,
        p_longitude: 120.9842,
        p_accuracy: 10.0,
        p_speed_kmh: 25.0
      });
    
    if (rpcError) {
      console.error('❌ RPC function error:', rpcError.message);
      console.log('   This means the update_bus_location_simple function is missing or broken');
    } else {
      console.log('✅ RPC function accessible');
    }

    console.log('\n3. 🚌 Checking Active Buses...');
    const { data: buses, error: busesError } = await supabase
      .from('buses')
      .select('id, bus_number, name, latitude, longitude, speed, tracking_status, status, last_location_update')
      .eq('tracking_status', 'active');
    
    if (busesError) {
      console.error('❌ Failed to fetch buses:', busesError.message);
      return;
    }
    
    console.log(`Found ${buses.length} active buses:`);
    buses.forEach((bus, index) => {
      console.log(`\n   Bus ${index + 1}:`);
      console.log(`   - ID: ${bus.id}`);
      console.log(`   - Number: ${bus.bus_number}`);
      console.log(`   - Name: ${bus.name}`);
      console.log(`   - Position: ${bus.latitude}, ${bus.longitude}`);
      console.log(`   - Speed: ${bus.speed || 0} km/h`);
      console.log(`   - Status: ${bus.status}`);
      console.log(`   - Tracking: ${bus.tracking_status}`);
      console.log(`   - Last Update: ${bus.last_location_update || 'Never'}`);
    });

    if (buses.length === 0) {
      console.log('\n⚠️ No active buses found. Checking all buses...');
      const { data: allBuses, error: allBusesError } = await supabase
        .from('buses')
        .select('id, bus_number, name, tracking_status, status')
        .limit(10);
      
      if (allBusesError) {
        console.error('❌ Failed to fetch all buses:', allBusesError.message);
        return;
      }
      
      console.log(`Found ${allBuses.length} total buses:`);
      allBuses.forEach((bus, index) => {
        console.log(`   ${index + 1}. ${bus.bus_number} - ${bus.name} (${bus.tracking_status}, ${bus.status})`);
      });
    }

    console.log('\n4. 👨‍💼 Checking Driver Sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('driver_sessions')
      .select('id, driver_id, bus_id, status, created_at')
      .eq('status', 'active')
      .limit(5);
    
    if (sessionsError) {
      console.error('❌ Failed to fetch driver sessions:', sessionsError.message);
    } else {
      console.log(`Found ${sessions.length} active driver sessions:`);
      sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. Driver ${session.driver_id} on Bus ${session.bus_id} (${session.status})`);
      });
    }

    console.log('\n5. 📍 Testing Location Update...');
    if (buses.length > 0) {
      const testBus = buses[0];
      console.log(`Testing with bus: ${testBus.bus_number} (${testBus.id})`);
      
      // Test direct database update
      const newLat = testBus.latitude + 0.001;
      const newLng = testBus.longitude + 0.001;
      
      console.log(`Updating position from ${testBus.latitude}, ${testBus.longitude} to ${newLat}, ${newLng}`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('buses')
        .update({
          latitude: newLat,
          longitude: newLng,
          speed: 30,
          last_location_update: new Date().toISOString()
        })
        .eq('id', testBus.id)
        .select();
      
      if (updateError) {
        console.error('❌ Direct update failed:', updateError.message);
      } else {
        console.log('✅ Direct update successful');
        console.log('   Updated bus:', updateData[0]);
      }
    }

    console.log('\n6. 🔄 Testing Real-Time Subscription...');
    
    let updateCount = 0;
    const channel = supabase
      .channel('debug_bus_movement')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'buses' 
        }, 
        (payload) => {
          updateCount++;
          console.log(`\n🎯 Real-time update #${updateCount}:`);
          console.log('   Event:', payload.event);
          console.log('   Bus ID:', payload.new.id);
          console.log('   New Position:', payload.new.latitude, payload.new.longitude);
          console.log('   Speed:', payload.new.speed, 'km/h');
          console.log('   Timestamp:', payload.new.last_location_update);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Real-time subscription status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active!');
          console.log('\n7. 🧪 Triggering Test Update...');
          
          // Trigger a test update after 2 seconds
          setTimeout(async () => {
            if (buses.length > 0) {
              const testBus = buses[0];
              const testLat = testBus.latitude + 0.002;
              const testLng = testBus.longitude + 0.002;
              
              console.log(`\n🚌 Triggering test update for ${testBus.bus_number}...`);
              
              const { error: testError } = await supabase
                .from('buses')
                .update({
                  latitude: testLat,
                  longitude: testLng,
                  speed: 35,
                  last_location_update: new Date().toISOString()
                })
                .eq('id', testBus.id);
              
              if (testError) {
                console.error('❌ Test update failed:', testError.message);
              } else {
                console.log('✅ Test update sent - watch for real-time message above');
              }
              
              // Wait 5 seconds then cleanup
              setTimeout(() => {
                console.log('\n🏁 Debug complete!');
                console.log(`\n📊 Summary:`);
                console.log(`   - Real-time updates received: ${updateCount}`);
                if (updateCount > 0) {
                  console.log('   ✅ Real-time system is working!');
                } else {
                  console.log('   ❌ Real-time system is NOT working');
                  console.log('   Possible issues:');
                  console.log('   - WebSocket connection blocked');
                  console.log('   - RLS policies preventing updates');
                  console.log('   - Supabase real-time not enabled');
                }
                
                channel.unsubscribe();
                process.exit(0);
              }, 5000);
            }
          }, 2000);
        }
      });

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugBusMovement();
