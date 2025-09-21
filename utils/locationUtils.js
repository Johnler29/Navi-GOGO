// Location utility functions for validation and calculations

/**
 * Validate if a location is reasonable
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {number} accuracy - Location accuracy in meters
 * @returns {Object} Validation result
 */
export const validateLocation = (latitude, longitude, accuracy = null) => {
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check if coordinates are valid numbers
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    result.isValid = false;
    result.errors.push('Invalid coordinate format');
    return result;
  }

  // Check latitude range (-90 to 90)
  if (latitude < -90 || latitude > 90) {
    result.isValid = false;
    result.errors.push('Latitude out of valid range (-90 to 90)');
  }

  // Check longitude range (-180 to 180)
  if (longitude < -180 || longitude > 180) {
    result.isValid = false;
    result.errors.push('Longitude out of valid range (-180 to 180)');
  }

  // Check for null island (0, 0) - often indicates GPS error
  if (latitude === 0 && longitude === 0) {
    result.isValid = false;
    result.errors.push('Null island coordinates detected (likely GPS error)');
  }

  // Check accuracy if provided
  if (accuracy !== null) {
    if (accuracy < 0) {
      result.isValid = false;
      result.errors.push('Accuracy cannot be negative');
    } else if (accuracy > 1000) {
      result.warnings.push('Very low accuracy (>1km)');
    } else if (accuracy > 100) {
      result.warnings.push('Low accuracy (>100m)');
    }
  }

  return result;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lng1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lng2 - Second longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees to convert
 * @returns {number} Radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate speed between two points
 * @param {number} lat1 - First latitude
 * @param {number} lng1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lng2 - Second longitude
 * @param {number} timeDiffSeconds - Time difference in seconds
 * @returns {number} Speed in km/h
 */
export const calculateSpeed = (lat1, lng1, lat2, lng2, timeDiffSeconds) => {
  if (timeDiffSeconds <= 0) return 0;
  
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  const speedKmh = (distance / timeDiffSeconds) * 3600;
  
  return speedKmh;
};

/**
 * Check if a location jump is realistic
 * @param {number} lat1 - Previous latitude
 * @param {number} lng1 - Previous longitude
 * @param {number} lat2 - Current latitude
 * @param {number} lng2 - Current longitude
 * @param {number} timeDiffSeconds - Time difference in seconds
 * @param {number} maxSpeedKmh - Maximum realistic speed (default: 120 km/h)
 * @returns {Object} Jump validation result
 */
export const validateLocationJump = (lat1, lng1, lat2, lng2, timeDiffSeconds, maxSpeedKmh = 120) => {
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  const speed = calculateSpeed(lat1, lng1, lat2, lng2, timeDiffSeconds);
  
  const result = {
    isValid: true,
    distance,
    speed,
    reason: 'valid'
  };

  // Check for unrealistic speed
  if (speed > maxSpeedKmh) {
    result.isValid = false;
    result.reason = 'speed_too_high';
  }

  // Check for very large distance jumps in short time
  if (distance > 50 && timeDiffSeconds < 300) { // >50km in <5 minutes
    result.isValid = false;
    result.reason = 'distance_jump_too_large';
  }

  // Check for extremely large jumps
  if (distance > 1000) { // >1000km
    result.isValid = false;
    result.reason = 'extreme_distance_jump';
  }

  return result;
};

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
};

/**
 * Format speed for display
 * @param {number} speedKmh - Speed in km/h
 * @returns {string} Formatted speed string
 */
export const formatSpeed = (speedKmh) => {
  if (speedKmh < 1) {
    return 'Stopped';
  } else if (speedKmh < 10) {
    return `${speedKmh.toFixed(1)} km/h`;
  } else {
    return `${Math.round(speedKmh)} km/h`;
  }
};

/**
 * Format time for display
 * @param {number} minutes - Time in minutes
 * @returns {string} Formatted time string
 */
export const formatTime = (minutes) => {
  if (minutes < 1) {
    return 'Now';
  } else if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  }
};

/**
 * Get location status based on last update time
 * @param {Date|string} lastUpdate - Last update timestamp
 * @returns {Object} Status information
 */
export const getLocationStatus = (lastUpdate) => {
  const now = new Date();
  const updateTime = new Date(lastUpdate);
  const diffMinutes = (now - updateTime) / (1000 * 60);

  if (diffMinutes < 2) {
    return { status: 'live', color: '#10B981', text: 'Live' };
  } else if (diffMinutes < 5) {
    return { status: 'recent', color: '#F59E0B', text: 'Recent' };
  } else if (diffMinutes < 15) {
    return { status: 'stale', color: '#EF4444', text: 'Stale' };
  } else {
    return { status: 'offline', color: '#9CA3AF', text: 'Offline' };
  }
};

/**
 * Get capacity status information
 * @param {number} capacityPercentage - Capacity percentage (0-100)
 * @returns {Object} Capacity status information
 */
export const getCapacityStatus = (capacityPercentage) => {
  if (capacityPercentage >= 90) {
    return { 
      status: 'full', 
      color: '#EF4444', 
      text: 'Full',
      icon: '🚌'
    };
  } else if (capacityPercentage >= 70) {
    return { 
      status: 'crowded', 
      color: '#F59E0B', 
      text: 'Crowded',
      icon: '🚌'
    };
  } else if (capacityPercentage >= 40) {
    return { 
      status: 'moderate', 
      color: '#3B82F6', 
      text: 'Moderate',
      icon: '🚌'
    };
  } else if (capacityPercentage >= 10) {
    return { 
      status: 'light', 
      color: '#10B981', 
      text: 'Light',
      icon: '🚌'
    };
  } else {
    return { 
      status: 'empty', 
      color: '#6B7280', 
      text: 'Empty',
      icon: '🚌'
    };
  }
};

/**
 * Check if coordinates are within a bounding box
 * @param {number} lat - Latitude to check
 * @param {number} lng - Longitude to check
 * @param {Object} bounds - Bounding box {north, south, east, west}
 * @returns {boolean} True if within bounds
 */
export const isWithinBounds = (lat, lng, bounds) => {
  return lat >= bounds.south && 
         lat <= bounds.north && 
         lng >= bounds.west && 
         lng <= bounds.east;
};

/**
 * Get center point of multiple coordinates
 * @param {Array} coordinates - Array of {latitude, longitude} objects
 * @returns {Object} Center coordinates {latitude, longitude}
 */
export const getCenterPoint = (coordinates) => {
  if (coordinates.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      latitude: acc.latitude + coord.latitude,
      longitude: acc.longitude + coord.longitude
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: sum.latitude / coordinates.length,
    longitude: sum.longitude / coordinates.length
  };
};

/**
 * Calculate bounding box for coordinates
 * @param {Array} coordinates - Array of {latitude, longitude} objects
 * @param {number} padding - Padding in degrees (default: 0.01)
 * @returns {Object} Bounding box {north, south, east, west}
 */
export const getBoundingBox = (coordinates, padding = 0.01) => {
  if (coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  const lats = coordinates.map(coord => coord.latitude);
  const lngs = coordinates.map(coord => coord.longitude);

  return {
    north: Math.max(...lats) + padding,
    south: Math.min(...lats) - padding,
    east: Math.max(...lngs) + padding,
    west: Math.min(...lngs) - padding
  };
};
