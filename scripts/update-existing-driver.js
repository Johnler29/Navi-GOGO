const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

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
