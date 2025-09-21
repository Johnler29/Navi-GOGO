const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bukrffymmsdbpqxmdwbv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1a3JmZnltbXNkYnBxeG1kd2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDkxNDMsImV4cCI6MjA2OTc4NTE0M30.UpZBCFwo-hygvClBflw8B20rLGtcYPsyMaRGonH9omA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateExistingDriver() {
  try {
    console.log('🔍 Finding existing driver...');

    // Find the existing driver
    const { data: existingDriver, error: findError } = await supabase
      .from('drivers')
      .select('*')
      .eq('email', 'gab.nakar@metrobus.com')
      .single();

    if (findError) {
      console.error('❌ Error finding driver:', findError);
      return;
    }

    console.log('📋 Found driver:', existingDriver);

    // Update the existing driver with password
    const { data, error } = await supabase
      .from('drivers')
      .update({
        password_hash: 'demo123',
        is_active: true,
        driver_status: 'off-duty',
        status: 'active'
      })
      .eq('id', existingDriver.id);

    if (error) {
      console.error('❌ Error updating driver:', error);
      return;
    }

    console.log('✅ Driver updated successfully');

    // Test authentication
    console.log('🧪 Testing authentication...');
    const { data: authTest, error: authError } = await supabase
      .from('drivers')
      .select('*')
      .eq('email', 'gab.nakar@metrobus.com')
      .eq('password_hash', 'demo123')
      .eq('is_active', true)
      .single();

    if (authError) {
      console.error('❌ Authentication test failed:', authError);
    } else {
      console.log('✅ Authentication test successful:', authTest);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateExistingDriver();
