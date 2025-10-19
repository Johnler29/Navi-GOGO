// Script to create demo admin users in Supabase
// Run this in your browser console on the admin website or use Supabase Auth API

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Your Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDemoAdminUsers() {
  console.log('Creating demo admin users...');

  // Demo Admin User 1
  const { data: admin1, error: error1 } = await supabase.auth.signUp({
    email: 'admin@metrobus.com',
    password: 'admin123',
    options: {
      data: {
        first_name: 'Admin',
        last_name: 'User',
        role: 'super_admin'
      }
    }
  });

  if (error1) {
    console.error('Error creating admin user 1:', error1);
  } else {
    console.log('Admin user 1 created:', admin1);
  }

  // Demo Admin User 2
  const { data: admin2, error: error2 } = await supabase.auth.signUp({
    email: 'operator@metrobus.com',
    password: 'operator123',
    options: {
      data: {
        first_name: 'Fleet',
        last_name: 'Operator',
        role: 'operator'
      }
    }
  });

  if (error2) {
    console.error('Error creating admin user 2:', error2);
  } else {
    console.log('Admin user 2 created:', admin2);
  }

  console.log('Demo admin users creation completed!');
}

// Run the function
createDemoAdminUsers();
