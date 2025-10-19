const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Complete Bus Movement Test');
console.log('=============================');

async function testCompleteBusMovement() {
  try {
    console.log('\n1. 🔍 Testing Database Connection...');
    const { data: testData, error: testError } = await supabase
      .from('buses')
      .select('id, bus_number')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      console.log('\n🔧 Please update the Supabase credentials in this script:');
      console.log('   - supabaseUrl: Your Supabase project URL');
      console.log('   - supabaseKey: Your Supabase anon key');
      return;
    }
    console.log('✅ Database connection successful');

    console.log('\n2. 🚌 Setting Up Test Bus...');
    
    // Create or get a test bus
    let testBus;
    const { data: existingBuses, error: busError } = await supabase
      .from('buses')
      .select('*')
      .eq('bus_number', 'TEST001')
      .limit(1);
    
    if (busError) {
      console.error('❌ Error checking for test bus:', busError.message);
      return;
    }
    
    if (existingBuses && existingBuses.length > 0) {
      testBus = existingBuses[0];
      console.log('✅ Using existing test bus:', testBus.bus_number);
    } else {
      // Create new test bus
      const { data: newBus, error: createError } = await supabase
        .from('buses')
        .insert({
          bus_number: 'TEST001',
          name: 'Test Bus for Movement',
          latitude: 14.5995,
          longitude: 120.9842,
          speed: 0,
          heading: 0,
          tracking_status: 'active',
          status: 'in_service',
          capacity: 50,
          current_passengers: 0
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create test bus:', createError.message);
        return;
      }
      
      testBus = newBus;
      console.log('✅ Created new test bus:', testBus.bus_number);
    }

    console.log('\n3. 🔄 Testing Real-Time Subscription...');
    
    let updateCount = 0;
    let subscriptionActive = false;
    
    const channel = supabase
      .channel('complete_bus_movement_test')
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
          console.log('   Bus Number:', payload.new.bus_number);
          console.log('   New Position:', payload.new.latitude, payload.new.longitude);
          console.log('   Speed:', payload.new.speed, 'km/h');
          console.log('   Heading:', payload.new.heading, '°');
          console.log('   Timestamp:', payload.new.last_location_update);
          
          // Check if this is our test bus
          if (payload.new.id === testBus.id) {
            console.log('   ✅ This is our test bus!');
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          subscriptionActive = true;
          console.log('✅ Real-time subscription active!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription failed');
          subscriptionActive = false;
        }
      });

    // Wait for subscription to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!subscriptionActive) {
      console.log('❌ Real-time subscription not ready, but continuing with test...');
    }

    console.log('\n4. 📍 Simulating Bus Movement...');
    console.log('   This will move the bus in a small circle pattern');
    console.log('   Watch for real-time updates above!');
    
    const centerLat = testBus.latitude;
    const centerLng = testBus.longitude;
    const radius = 0.002; // ~200 meters
    const totalMoves = 8;
    let moveCount = 0;
    
    const moveInterval = setInterval(async () => {
      moveCount++;
      
      // Calculate new position (move in a circle)
      const angle = (moveCount * Math.PI / 4) % (2 * Math.PI);
      const newLat = centerLat + radius * Math.cos(angle);
      const newLng = centerLng + radius * Math.sin(angle);
      const newSpeed = 20 + Math.random() * 20; // 20-40 km/h
      const newHeading = Math.floor(angle * 180 / Math.PI);
      
      console.log(`\n🚌 Move ${moveCount}/${totalMoves}:`);
      console.log(`   From: ${testBus.latitude.toFixed(6)}, ${testBus.longitude.toFixed(6)}`);
      console.log(`   To:   ${newLat.toFixed(6)}, ${newLng.toFixed(6)}`);
      console.log(`   Speed: ${newSpeed.toFixed(1)} km/h, Heading: ${newHeading}°`);
      
      // Update bus location using the RPC function
      const { data: updateResult, error: updateError } = await supabase
        .rpc('update_bus_location_simple', {
          p_bus_id: testBus.id,
          p_latitude: newLat,
          p_longitude: newLng,
          p_accuracy: 5.0,
          p_speed_kmh: newSpeed
        });
      
      if (updateError) {
        console.error('❌ RPC update failed:', updateError.message);
      } else {
        console.log('✅ RPC update successful');
        
        // Also update heading and timestamp directly
        const { error: directError } = await supabase
          .from('buses')
          .update({
            heading: newHeading,
            last_location_update: new Date().toISOString()
          })
          .eq('id', testBus.id);
        
        if (directError) {
          console.error('❌ Direct update failed:', directError.message);
        } else {
          console.log('✅ Direct update successful');
        }
      }
      
      // Update test bus position for next iteration
      testBus.latitude = newLat;
      testBus.longitude = newLng;
      
      if (moveCount >= totalMoves) {
        clearInterval(moveInterval);
        
        console.log('\n🏁 Test completed!');
        console.log('\n📊 Results Summary:');
        console.log('==================');
        console.log(`   - Total moves made: ${totalMoves}`);
        console.log(`   - Real-time updates received: ${updateCount}`);
        console.log(`   - Subscription active: ${subscriptionActive ? 'Yes' : 'No'}`);
        
        if (updateCount > 0) {
          console.log('\n✅ SUCCESS: Real-time system is working!');
          console.log('   - Bus location updates are being sent');
          console.log('   - Real-time subscriptions are receiving updates');
          console.log('   - Your app should show smooth bus movement');
        } else {
          console.log('\n❌ FAILURE: Real-time system is NOT working');
          console.log('   Possible issues:');
          console.log('   - WebSocket connection blocked by firewall');
          console.log('   - Supabase real-time not enabled in project');
          console.log('   - RLS policies preventing updates');
          console.log('   - Network connectivity issues');
        }
        
        // Cleanup
        channel.unsubscribe();
        process.exit(0);
      }
    }, 3000); // Update every 3 seconds

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Instructions
console.log('\n📋 Before running this test:');
console.log('1. Update the Supabase credentials at the top of this file');
console.log('2. Make sure your Supabase project has real-time enabled');
console.log('3. Ensure the update_bus_location_simple function exists');
console.log('4. Run: node test-bus-movement-complete.js');
console.log('\n🚀 Starting test...\n');

// Run the test
testCompleteBusMovement();
