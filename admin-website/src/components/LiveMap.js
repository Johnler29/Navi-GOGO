import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom bus icon
const createBusIcon = (color = '#f59e0b') => {
  return L.divIcon({
    className: 'custom-bus-icon',
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const MapUpdater = ({ buses }) => {
  const map = useMap();

  useEffect(() => {
    if (buses.length > 0 && map) {
      try {
        const bounds = buses
          .filter(bus => bus.latitude && bus.longitude && 
                  !isNaN(bus.latitude) && !isNaN(bus.longitude))
          .map(bus => [bus.latitude, bus.longitude]);
        
        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (error) {
        console.warn('Error updating map bounds:', error);
      }
    }
  }, [buses, map]);

  return null;
};

const LiveMap = ({ buses = [] }) => {
  const [mapCenter] = useState([14.5995, 120.9842]); // Manila coordinates
  const [mapZoom] = useState(12);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const mapRef = useRef(null);

  const busesWithLocation = buses.filter(bus => 
    bus.latitude && 
    bus.longitude && 
    !isNaN(bus.latitude) && 
    !isNaN(bus.longitude) &&
    bus.latitude >= -90 && 
    bus.latitude <= 90 &&
    bus.longitude >= -180 && 
    bus.longitude <= 180
  );

  // Reset map state when buses change
  useEffect(() => {
    setIsMapReady(false);
    setMapError(false);
    
    // Set a timeout to show error if map doesn't load within 10 seconds
    const timeout = setTimeout(() => {
      if (!isMapReady) {
        setMapError(true);
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [buses, isMapReady]);

  // Don't render map if no valid buses
  if (busesWithLocation.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="text-gray-500 mb-2">No buses with valid locations</div>
          <div className="text-sm text-gray-400">Add buses with location data to see them on the map</div>
        </div>
      </div>
    );
  }

  // Show error state if map failed to load
  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-lg">
        <div className="text-center">
          <div className="text-red-500 mb-2">Failed to load map</div>
          <div className="text-sm text-red-400">Please refresh the page to try again</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <div className="text-gray-600">Loading map...</div>
          </div>
        </div>
      )}
      <MapContainer
        ref={mapRef}
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        whenReady={() => setIsMapReady(true)}
        onError={() => setMapError(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {isMapReady && <MapUpdater buses={busesWithLocation} />}
        
        {isMapReady && busesWithLocation.map((bus) => {
          const isActive = bus.status === 'active';
          const isMoving = bus.tracking_status === 'moving';
          
          return (
            <Marker
              key={bus.id}
              position={[bus.latitude, bus.longitude]}
              icon={createBusIcon(isActive ? '#f59e0b' : '#6B7280')}
            >
              <Popup>
                <div className="p-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="font-semibold text-gray-900">
                      Bus {bus.bus_number}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-600">Route:</span>
                      <span className="ml-1 font-medium">
                        {bus.route_id ? `R${bus.route_id.slice(-3)}` : 'Unknown'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-1 font-medium ${
                        isMoving ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {bus.tracking_status || 'Unknown'}
                      </span>
                    </div>
                    
                    {bus.speed && (
                      <div>
                        <span className="text-gray-600">Speed:</span>
                        <span className="ml-1 font-medium">{bus.speed} km/h</span>
                      </div>
                    )}
                    
                    {bus.last_location_update && (
                      <div>
                        <span className="text-gray-600">Last Update:</span>
                        <span className="ml-1 font-medium">
                          {new Date(bus.last_location_update).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LiveMap;
