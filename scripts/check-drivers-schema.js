const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bukrffymmsdbpqxmdwbv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1a3JmZnltbXNkYnBxeG1kd2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDkxNDMsImV4cCI6MjA2OTc4NTE0M30.UpZBCFwo-hygvClBflw8B20rLGtcYPsyMaRGonH9omA';

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
