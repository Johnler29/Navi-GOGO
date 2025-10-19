const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestDrivers() {
  try {
    console.log('🚌 Adding test drivers...');

    // First, check if drivers already exist
    const { data: existingDrivers } = await supabase
      .from('drivers')
      .select('email')
      .in('email', ['gab.nakar@metrobus.com', 'john.doe@metrobus.com', 'jane.smith@metrobus.com']);

    console.log('Existing drivers:', existingDrivers);

    // Add test drivers
    const { data, error } = await supabase
      .from('drivers')
      .upsert([
        {
          name: 'Gabriel Nakar',
          email: 'gab.nakar@metrobus.com',
          license_number: 'DL123456',
          driver_status: 'off-duty',
          is_active: true,
          password_hash: 'demo123',
          phone: '09123456789',
          status: 'active'
        },
        {
          name: 'John Doe',
          email: 'john.doe@metrobus.com',
          license_number: 'DL789012',
          driver_status: 'off-duty',
          is_active: true,
          password_hash: 'password123',
          phone: '09123456788',
          status: 'active'
        },
        {
          name: 'Jane Smith',
          email: 'jane.smith@metrobus.com',
          license_number: 'DL345678',
          driver_status: 'off-duty',
          is_active: true,
          password_hash: 'driver456',
          phone: '09123456787',
          status: 'active'
        }
      ], {
        onConflict: 'email'
      });

    if (error) {
      console.error('❌ Error adding drivers:', error);
      return;
    }

    console.log('✅ Test drivers added successfully:', data);

    // Verify the drivers were added
    const { data: drivers, error: fetchError } = await supabase
      .from('drivers')
      .select('name, email, license_number, driver_status, is_active')
      .in('email', ['gab.nakar@metrobus.com', 'john.doe@metrobus.com', 'jane.smith@metrobus.com']);

    if (fetchError) {
      console.error('❌ Error fetching drivers:', fetchError);
      return;
    }

    console.log('📋 Current test drivers:');
    drivers.forEach(driver => {
      console.log(`- ${driver.name} (${driver.email}) - ${driver.driver_status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addTestDrivers();
