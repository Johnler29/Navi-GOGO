const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDriversSchema() {
  try {
    console.log('🔍 Checking drivers table schema...');

    // Get a sample driver to see the actual columns
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error fetching drivers:', error);
      return;
    }

    console.log('📋 Drivers table columns:');
    if (drivers && drivers.length > 0) {
      console.log(Object.keys(drivers[0]));
      console.log('Sample driver data:', drivers[0]);
    } else {
      console.log('No drivers found in table');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDriversSchema();
