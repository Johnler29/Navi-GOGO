// Script to create demo admin users in Supabase
// Run this in your browser console on the admin website or use Supabase Auth API

const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://bukrffymmsdbpqxmdwbv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1a3JmZnltbXNkYnBxeG1kd2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDkxNDMsImV4cCI6MjA2OTc4NTE0M30.UpZBCFwo-hygvClBflw8B20rLGtcYPsyMaRGonH9omA';

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
