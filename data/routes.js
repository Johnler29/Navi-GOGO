// Route data with coordinates for bus routes
// This file contains fallback route paths with coordinates for major bus routes
// The app will try to fetch routes from the database first, then fall back to these

export const FALLBACK_ROUTES = {
  // Dasma to Alabang route (via Aguinaldo Highway)
  'dasma-alabang': {
    id: 'dasma-alabang',
    name: 'Dasmarinas to Alabang',
    origin: 'Dasmarinas City, Cavite',
    destination: 'Alabang, Muntinlupa',
    routeNumber: 'R001',
    color: '#3B82F6',
    strokeWidth: 5,
    estimatedDuration: 45, // minutes
    fare: 25.00,
    coordinates: [
      // Dasmarinas Terminal
      { latitude: 14.3294, longitude: 120.9366 },
      
      // Aguinaldo Highway - Dasmarinas
      { latitude: 14.3314, longitude: 120.9386 },
      { latitude: 14.3334, longitude: 120.9406 },
      { latitude: 14.3354, longitude: 120.9426 },
      
      // Imus area
      { latitude: 14.3394, longitude: 120.9466 },
      { latitude: 14.3434, longitude: 120.9506 },
      { latitude: 14.3474, longitude: 120.9546 },
      
      // Bacoor area
      { latitude: 14.3514, longitude: 120.9586 },
      { latitude: 14.3554, longitude: 120.9626 },
      { latitude: 14.3594, longitude: 120.9666 },
      { latitude: 14.3634, longitude: 120.9706 },
      
      // Las Piñas area
      { latitude: 14.3674, longitude: 120.9746 },
      { latitude: 14.3714, longitude: 120.9786 },
      { latitude: 14.3754, longitude: 120.9826 },
      { latitude: 14.3794, longitude: 120.9866 },
      
      // Alabang area
      { latitude: 14.3834, longitude: 120.9906 },
      { latitude: 14.3874, longitude: 120.9946 },
      { latitude: 14.3914, longitude: 120.9986 },
      { latitude: 14.3954, longitude: 121.0026 },
      
      // Alabang Terminal
      { latitude: 14.3994, longitude: 121.0066 }
    ],
    stops: [
      {
        name: 'Dasmarinas Terminal',
        description: 'Main terminal in Dasmarinas City',
        latitude: 14.3294,
        longitude: 120.9366,
        type: 'terminal'
      },
      {
        name: 'Imus Plaza',
        description: 'Imus City Plaza area',
        latitude: 14.3394,
        longitude: 120.9466,
        type: 'stop'
      },
      {
        name: 'Bacoor Bayan',
        description: 'Bacoor City Hall area',
        latitude: 14.3514,
        longitude: 120.9586,
        type: 'stop'
      },
      {
        name: 'Las Piñas City Hall',
        description: 'Las Piñas City Hall area',
        latitude: 14.3714,
        longitude: 120.9786,
        type: 'stop'
      },
      {
        name: 'Alabang Terminal',
        description: 'Alabang bus terminal',
        latitude: 14.3994,
        longitude: 121.0066,
        type: 'terminal'
      }
    ]
  },

  // Dasma to Manila route (via Coastal Road)
  'dasma-manila': {
    id: 'dasma-manila',
    name: 'Dasmarinas to Manila',
    origin: 'Dasmarinas City, Cavite',
    destination: 'Manila City',
    routeNumber: 'R002',
    color: '#10B981',
    strokeWidth: 5,
    estimatedDuration: 90, // minutes
    fare: 50.00,
    coordinates: [
      // Dasmarinas Terminal
      { latitude: 14.3294, longitude: 120.9366 },
      
      // Aguinaldo Highway
      { latitude: 14.3314, longitude: 120.9386 },
      { latitude: 14.3334, longitude: 120.9406 },
      { latitude: 14.3354, longitude: 120.9426 },
      
      // Imus
      { latitude: 14.3394, longitude: 120.9466 },
      { latitude: 14.3434, longitude: 120.9506 },
      
      // Bacoor
      { latitude: 14.3514, longitude: 120.9586 },
      { latitude: 14.3554, longitude: 120.9626 },
      
      // Las Piñas
      { latitude: 14.3674, longitude: 120.9746 },
      { latitude: 14.3714, longitude: 120.9786 },
      
      // Parañaque
      { latitude: 14.3754, longitude: 120.9826 },
      { latitude: 14.3794, longitude: 120.9866 },
      
      // Pasay
      { latitude: 14.3834, longitude: 120.9906 },
      { latitude: 14.3874, longitude: 120.9946 },
      
      // Manila
      { latitude: 14.3914, longitude: 120.9986 },
      { latitude: 14.3954, longitude: 121.0026 },
      { latitude: 14.3994, longitude: 121.0066 },
      { latitude: 14.4034, longitude: 121.0106 },
      
      // Manila City Hall
      { latitude: 14.5995, longitude: 120.9842 }
    ],
    stops: [
      {
        name: 'Dasmarinas Terminal',
        description: 'Main terminal in Dasmarinas City',
        latitude: 14.3294,
        longitude: 120.9366,
        type: 'terminal'
      },
      {
        name: 'Bacoor Bayan',
        description: 'Bacoor City Hall area',
        latitude: 14.3514,
        longitude: 120.9586,
        type: 'stop'
      },
      {
        name: 'Las Piñas City Hall',
        description: 'Las Piñas City Hall area',
        latitude: 14.3714,
        longitude: 120.9786,
        type: 'stop'
      },
      {
        name: 'NAIA Terminal 3',
        description: 'Ninoy Aquino International Airport',
        latitude: 14.3754,
        longitude: 120.9826,
        type: 'stop'
      },
      {
        name: 'Manila City Hall',
        description: 'Manila City Hall area',
        latitude: 14.5995,
        longitude: 120.9842,
        type: 'terminal'
      }
    ]
  },

  // Dasma to Makati route
  'dasma-makati': {
    id: 'dasma-makati',
    name: 'Dasmarinas to Makati',
    origin: 'Dasmarinas City, Cavite',
    destination: 'Makati City',
    routeNumber: 'R003',
    color: '#F59E0B',
    strokeWidth: 5,
    estimatedDuration: 75, // minutes
    fare: 45.00,
    coordinates: [
      // Dasmarinas Terminal
      { latitude: 14.3294, longitude: 120.9366 },
      
      // Aguinaldo Highway
      { latitude: 14.3314, longitude: 120.9386 },
      { latitude: 14.3334, longitude: 120.9406 },
      { latitude: 14.3354, longitude: 120.9426 },
      
      // Imus
      { latitude: 14.3394, longitude: 120.9466 },
      { latitude: 14.3434, longitude: 120.9506 },
      
      // Bacoor
      { latitude: 14.3514, longitude: 120.9586 },
      { latitude: 14.3554, longitude: 120.9626 },
      
      // Las Piñas
      { latitude: 14.3674, longitude: 120.9746 },
      { latitude: 14.3714, longitude: 120.9786 },
      
      // Parañaque
      { latitude: 14.3754, longitude: 120.9826 },
      { latitude: 14.3794, longitude: 120.9866 },
      
      // Taguig
      { latitude: 14.3834, longitude: 120.9906 },
      { latitude: 14.3874, longitude: 120.9946 },
      
      // Makati
      { latitude: 14.3914, longitude: 120.9986 },
      { latitude: 14.3954, longitude: 121.0026 },
      { latitude: 14.3994, longitude: 121.0066 },
      { latitude: 14.4034, longitude: 121.0106 },
      
      // Makati CBD
      { latitude: 14.4074, longitude: 121.0146 }
    ],
    stops: [
      {
        name: 'Dasmarinas Terminal',
        description: 'Main terminal in Dasmarinas City',
        latitude: 14.3294,
        longitude: 120.9366,
        type: 'terminal'
      },
      {
        name: 'Bacoor Bayan',
        description: 'Bacoor City Hall area',
        latitude: 14.3514,
        longitude: 120.9586,
        type: 'stop'
      },
      {
        name: 'Las Piñas City Hall',
        description: 'Las Piñas City Hall area',
        latitude: 14.3714,
        longitude: 120.9786,
        type: 'stop'
      },
      {
        name: 'BGC Taguig',
        description: 'Bonifacio Global City',
        latitude: 14.3834,
        longitude: 120.9906,
        type: 'stop'
      },
      {
        name: 'Makati CBD',
        description: 'Makati Central Business District',
        latitude: 14.4074,
        longitude: 121.0146,
        type: 'terminal'
      }
    ]
  }
};

// Helper function to get route by ID (fallback only)
export const getRouteByIdFallback = (routeId) => {
  return FALLBACK_ROUTES[routeId] || null;
};

// Helper function to get all routes (fallback only)
export const getAllRoutesFallback = () => {
  return Object.values(FALLBACK_ROUTES);
};

// Helper function to get routes by origin
export const getRoutesByOrigin = (origin) => {
  return Object.values(FALLBACK_ROUTES).filter(route => 
    route.origin.toLowerCase().includes(origin.toLowerCase())
  );
};

// Helper function to get routes by destination
export const getRoutesByDestination = (destination) => {
  return Object.values(FALLBACK_ROUTES).filter(route => 
    route.destination.toLowerCase().includes(destination.toLowerCase())
  );
};

// Function to transform database route to app format
export const transformDatabaseRoute = (dbRoute) => {
  return {
    id: dbRoute.id,
    name: dbRoute.name,
    origin: dbRoute.origin || dbRoute.start_location,
    destination: dbRoute.destination || dbRoute.end_location,
    routeNumber: dbRoute.route_number,
    color: dbRoute.route_color || '#3B82F6',
    strokeWidth: dbRoute.stroke_width || 5,
    estimatedDuration: dbRoute.estimated_duration || 0,
    fare: parseFloat(dbRoute.fare) || 0,
    coordinates: dbRoute.route_coordinates || [],
    stops: (dbRoute.stops || []).map(stop => ({
      id: stop.id,
      name: stop.stop_name || stop.name,
      description: stop.stop_description || stop.description || stop.address,
      latitude: parseFloat(stop.latitude),
      longitude: parseFloat(stop.longitude),
      stop_order: stop.stop_order || stop.sequence,
      is_active: true // Default to true since stops table doesn't have is_active column
    }))
  };
};

// Function to get all routes (database first, then fallback)
export const getAllRoutes = async (supabaseHelpers) => {
  try {
    // Try to fetch from database first
    const dbRoutes = await supabaseHelpers.getRoutesWithDetails();
    
    if (dbRoutes && dbRoutes.length > 0) {
      console.log('✅ Using database routes:', dbRoutes.length);
      return dbRoutes.map(transformDatabaseRoute);
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch routes from database, using fallback:', error);
  }
  
  // Fallback to hardcoded routes
  console.log('📋 Using fallback routes');
  return getAllRoutesFallback();
};

// Function to get route by ID (database first, then fallback)
export const getRouteById = async (routeId, supabaseHelpers) => {
  try {
    // Try to fetch from database first
    const dbRoute = await supabaseHelpers.getRouteById(routeId);
    
    if (dbRoute) {
      console.log('✅ Using database route:', dbRoute.name);
      return transformDatabaseRoute(dbRoute);
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch route from database, using fallback:', error);
  }
  
  // Fallback to hardcoded routes
  console.log('📋 Using fallback route');
  return getRouteByIdFallback(routeId);
};

// Legacy exports for backward compatibility
export const ROUTES = FALLBACK_ROUTES;
