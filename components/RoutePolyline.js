import React, { useState } from 'react';
import { Polyline, Marker } from 'react-native-maps';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RoutePolyline = ({ 
  route, 
  isVisible = true, 
  showStops = true, 
  showDirection = true,
  showInfoBubbles = true,
  onStopPress = null,
  isSelected = false
}) => {
  const [showBubble, setShowBubble] = useState(false);
  const [bubblePosition, setBubblePosition] = useState({ latitude: 0, longitude: 0 });

  if (!route || !route.coordinates || route.coordinates.length < 2 || !isVisible) {
    return null;
  }

  const { 
    coordinates, 
    stops = [], 
    color = '#3B82F6', 
    strokeWidth = 4,
    estimatedDuration = 0,
    fare = 0,
    name = 'Route'
  } = route;

  // Calculate route segments for different colors (like Google Maps)
  const getRouteSegments = () => {
    if (coordinates.length < 2) return [];
    
    const segments = [];
    const segmentLength = Math.ceil(coordinates.length / 3);
    
    for (let i = 0; i < coordinates.length - 1; i += segmentLength) {
      const endIndex = Math.min(i + segmentLength, coordinates.length - 1);
      segments.push({
        coordinates: coordinates.slice(i, endIndex + 1),
        color: i === 0 ? '#4285F4' : i === segmentLength ? '#FBBC04' : '#34A853' // Blue, Yellow, Green
      });
    }
    
    return segments;
  };

  const routeSegments = getRouteSegments();
  const midPointIndex = Math.floor(coordinates.length / 2);
  const midPoint = coordinates[midPointIndex];

  const handleRoutePress = () => {
    if (showInfoBubbles) {
      setBubblePosition(midPoint);
      setShowBubble(!showBubble);
    }
  };

  return (
    <>
      {/* Route segments with different colors */}
      {routeSegments.map((segment, index) => (
        <Polyline
          key={`segment-${index}`}
          coordinates={segment.coordinates}
          strokeColor={segment.color}
          strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
          strokeOpacity={isSelected ? 1.0 : 0.8}
          onPress={handleRoutePress}
        />
      ))}

      {/* Direction arrow (if enabled and we have enough points) */}
      {showDirection && coordinates.length >= 2 && (
        <Polyline
          coordinates={coordinates.slice(-2)} // Last two points for direction
          strokeColor={color}
          strokeWidth={strokeWidth + 3}
          strokeOpacity={0.9}
        />
      )}

      {/* Route information bubble */}
      {showInfoBubbles && showBubble && (
        <Marker
          coordinate={bubblePosition}
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={styles.infoBubble}>
            <View style={styles.bubbleContent}>
              <View style={styles.bubbleHeader}>
                <Ionicons name="bus" size={16} color="#4285F4" />
                <Text style={styles.routeName}>{name}</Text>
              </View>
              <View style={styles.bubbleDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={14} color="#666" />
                  <Text style={styles.detailText}>{estimatedDuration} min</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="cash" size={14} color="#666" />
                  <Text style={styles.detailText}>₱{fare.toFixed(2)}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.bubbleArrow, { borderTopColor: 'white' }]} />
          </View>
        </Marker>
      )}

      {/* Route stops markers */}
      {showStops && stops.map((stop, index) => (
        <Marker
          key={`stop-${index}`}
          coordinate={{
            latitude: stop.latitude,
            longitude: stop.longitude
          }}
          title={stop.name}
          description={stop.description || `Stop ${index + 1}`}
          onPress={() => onStopPress && onStopPress(stop, index)}
        >
          <View style={[
            styles.stopMarker,
            { 
              backgroundColor: index === 0 ? '#10B981' : // Start (green)
                           index === stops.length - 1 ? '#EF4444' : // End (red)
                           '#F59E0B' // Middle stops (orange)
            }
          ]}>
            <Ionicons 
              name={index === 0 ? "play" : index === stops.length - 1 ? "stop" : "ellipse"} 
              size={12} 
              color="white" 
            />
          </View>
        </Marker>
      ))}

      {/* Start and end markers with special styling */}
      {coordinates.length > 0 && (
        <>
          {/* Start marker */}
          <Marker
            coordinate={coordinates[0]}
            title={`Start: ${route.name || 'Route'}`}
            description={route.origin || 'Starting point'}
          >
            <View style={[styles.endpointMarker, { backgroundColor: '#10B981' }]}>
              <Ionicons name="play" size={16} color="white" />
            </View>
          </Marker>

          {/* End marker */}
          <Marker
            coordinate={coordinates[coordinates.length - 1]}
            title={`End: ${route.name || 'Route'}`}
            description={route.destination || 'Destination'}
          >
            <View style={[styles.endpointMarker, { backgroundColor: '#EF4444' }]}>
              <Ionicons name="stop" size={16} color="white" />
            </View>
          </Marker>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  stopMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  endpointMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  infoBubble: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  bubbleContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    minWidth: 140,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 6,
  },
  bubbleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  bubbleArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});

export default RoutePolyline;