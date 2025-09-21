const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bukrffymmsdbpqxmdwbv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1a3JmZnltbXNkYnBxeG1kd2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDkxNDMsImV4cCI6MjA2OTc4NTE0M30.UpZBCFwo-hygvClBflw8B20rLGtcYPsyMaRGonH9omA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSampleRoutes() {
  try {
    console.log('🚌 Adding sample routes...');

    // Sample routes data
    const sampleRoutes = [
      {
        name: 'Metro Link Express',
        description: 'Fast express service connecting downtown to business district',
        start_location: 'Downtown Terminal',
        end_location: 'Business District',
        distance: 15.5,
        estimated_duration: 45,
        fare: 25.00,
        is_active: true
      },
      {
        name: 'City Circle Route',
        description: 'Circular route covering major city landmarks and shopping areas',
        start_location: 'Central Station',
        end_location: 'Central Station',
        distance: 22.3,
        estimated_duration: 60,
        fare: 30.00,
        is_active: true
      },
      {
        name: 'University Line',
        description: 'Direct route from residential areas to university campus',
        start_location: 'Residential District',
        end_location: 'University Campus',
        distance: 12.8,
        estimated_duration: 35,
        fare: 20.00,
        is_active: true
      },
      {
        name: 'Airport Shuttle',
        description: 'Express service to and from the international airport',
        start_location: 'City Center',
        end_location: 'International Airport',
        distance: 28.7,
        estimated_duration: 50,
        fare: 45.00,
        is_active: true
      },
      {
        name: 'Hospital Route',
        description: 'Medical district route serving hospitals and clinics',
        start_location: 'Main Hospital',
        end_location: 'Medical Center',
        distance: 8.2,
        estimated_duration: 25,
        fare: 15.00,
        is_active: true
      },
      {
        name: 'Shopping Mall Circuit',
        description: 'Route connecting major shopping malls and retail centers',
        start_location: 'Mall of the City',
        end_location: 'Grand Shopping Center',
        distance: 18.9,
        estimated_duration: 40,
        fare: 22.00,
        is_active: true
      },
      {
        name: 'Industrial Zone Line',
        description: 'Service route for industrial and manufacturing areas',
        start_location: 'Industrial Park',
        end_location: 'Manufacturing District',
        distance: 14.6,
        estimated_duration: 30,
        fare: 18.00,
        is_active: true
      },
      {
        name: 'Beach Express',
        description: 'Weekend and holiday service to coastal areas',
        start_location: 'City Center',
        end_location: 'Beach Resort',
        distance: 35.2,
        estimated_duration: 65,
        fare: 50.00,
        is_active: true
      },
      {
        name: 'Night Owl Route',
        description: 'Late night service for shift workers and nightlife',
        start_location: 'Downtown',
        end_location: 'Entertainment District',
        distance: 11.4,
        estimated_duration: 30,
        fare: 25.00,
        is_active: true
      },
      {
        name: 'Suburban Connector',
        description: 'Connects suburban areas to main city transportation hubs',
        start_location: 'Suburban Station',
        end_location: 'Central Hub',
        distance: 20.1,
        estimated_duration: 55,
        fare: 28.00,
        is_active: true
      },
      {
        name: 'Old Route 7',
        description: 'Legacy route being phased out due to low ridership',
        start_location: 'Old Terminal',
        end_location: 'Historic District',
        distance: 9.8,
        estimated_duration: 35,
        fare: 12.00,
        is_active: false
      },
      {
        name: 'Construction Detour',
        description: 'Temporary route due to road construction',
        start_location: 'Main Street',
        end_location: 'Alternative Terminal',
        distance: 16.3,
        estimated_duration: 45,
        fare: 20.00,
        is_active: false
      }
    ];

    // Check if routes already exist
    const { data: existingRoutes } = await supabase
      .from('routes')
      .select('name')
      .in('name', sampleRoutes.map(route => route.name));

    console.log('Existing routes:', existingRoutes?.map(r => r.name) || []);

    // Filter out existing routes
    const existingNames = existingRoutes?.map(r => r.name) || [];
    const newRoutes = sampleRoutes.filter(route => !existingNames.includes(route.name));

    if (newRoutes.length === 0) {
      console.log('✅ All sample routes already exist in the database');
      return;
    }

    // Add new routes
    const { data, error } = await supabase
      .from('routes')
      .insert(newRoutes);

    if (error) {
      console.error('❌ Error adding routes:', error);
      return;
    }

    console.log(`✅ Successfully added ${newRoutes.length} new routes`);

    // Verify the routes were added
    const { data: allRoutes, error: fetchError } = await supabase
      .from('routes')
      .select('name, start_location, end_location, fare, is_active')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching routes:', fetchError);
      return;
    }

    console.log('📋 Current routes in database:');
    allRoutes.forEach((route, index) => {
      console.log(`${index + 1}. ${route.name} (${route.start_location} → ${route.end_location}) - ₱${route.fare} - ${route.is_active ? 'Active' : 'Inactive'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addSampleRoutes();
