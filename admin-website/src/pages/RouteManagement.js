import React, { useState, useEffect } from 'react';
import { Navigation, Plus, Search, MapPin, DollarSign, Edit, Trash2, Eye, Filter, Map, Palette, Settings } from 'lucide-react';
import { useSupabase } from '../contexts/SupabaseContext';
import { notifications } from '../utils/notifications';

const RouteManagement = () => {
  const { routes, createRoute, updateRoute, deleteRoute, loading, error, supabase } = useSupabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [showRouteEditor, setShowRouteEditor] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeStops, setRouteStops] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_location: '',
    end_location: '',
    estimated_duration: '',
    fare: '',
    route_color: '#3B82F6',
    stroke_width: 5,
    is_active: true
  });

  // Filter routes based on search term and status
  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.start_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.end_location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && route.is_active) ||
                         (filterStatus === 'inactive' && !route.is_active);
    
    return matchesSearch && matchesStatus;
  });

  // Debug: Log routes to console
  useEffect(() => {
    console.log('🔍 RouteManagement - Routes loaded:', routes);
    console.log('🔍 RouteManagement - Routes count:', routes.length);
    if (routes.length > 0) {
      console.log('🔍 RouteManagement - First route:', routes[0]);
    }
  }, [routes]);

  // Calculate stats
  const totalRoutes = routes.length;
  const activeRoutes = routes.filter(route => route.is_active).length;
  const avgFare = routes.length > 0 ? 
    (routes.reduce((sum, route) => sum + (parseFloat(route.fare) || 0), 0) / routes.length).toFixed(2) : 0;

  const handleAddRoute = () => {
    setEditingRoute(null);
    setFormData({
      name: '',
      description: '',
      start_location: '',
      end_location: '',
      estimated_duration: '',
      fare: '',
      route_color: '#3B82F6',
      stroke_width: 5,
      is_active: true
    });
    setRouteCoordinates([]);
    setRouteStops([]);
    setShowModal(true);
  };

  const handleEditRoute = (route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name || '',
      description: route.description || '',
      start_location: route.start_location || '',
      end_location: route.end_location || '',
      estimated_duration: route.estimated_duration || '',
      fare: route.fare || '',
      route_color: route.route_color || '#3B82F6',
      stroke_width: route.stroke_width || 5,
      is_active: route.is_active
    });
    
    // Load existing coordinates and stops
    if (route.route_coordinates) {
      setRouteCoordinates(route.route_coordinates);
    } else {
      setRouteCoordinates([]);
    }
    
    if (route.stops) {
      setRouteStops(route.stops);
    } else {
      setRouteStops([]);
    }
    
    setShowModal(true);
  };

  const handleOpenRouteEditor = (route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name || '',
      description: route.description || '',
      start_location: route.start_location || '',
      end_location: route.end_location || '',
      estimated_duration: route.estimated_duration || '',
      fare: route.fare || '',
      route_color: route.route_color || '#3B82F6',
      stroke_width: route.stroke_width || 5,
      is_active: route.is_active
    });
    
    // Load existing coordinates and stops
    if (route.route_coordinates) {
      setRouteCoordinates(route.route_coordinates);
    } else {
      setRouteCoordinates([]);
    }
    
    if (route.stops) {
      setRouteStops(route.stops);
    } else {
      setRouteStops([]);
    }
    
    setShowRouteEditor(true);
  };

  const handleAddStop = () => {
    const newStop = {
      id: Date.now().toString(),
      name: '',
      description: '',
      latitude: '',
      longitude: '',
      stop_order: routeStops.length + 1
    };
    setRouteStops([...routeStops, newStop]);
  };

  const handleUpdateStop = (index, field, value) => {
    const updatedStops = [...routeStops];
    updatedStops[index] = { ...updatedStops[index], [field]: value };
    setRouteStops(updatedStops);
  };

  const handleRemoveStop = (index) => {
    const updatedStops = routeStops.filter((_, i) => i !== index);
    // Reorder stops
    updatedStops.forEach((stop, i) => {
      stop.stop_order = i + 1;
    });
    setRouteStops(updatedStops);
  };

  const handleAddCoordinate = () => {
    const newCoordinate = {
      latitude: '',
      longitude: ''
    };
    setRouteCoordinates([...routeCoordinates, newCoordinate]);
  };

  const handleUpdateCoordinate = (index, field, value) => {
    const updatedCoordinates = [...routeCoordinates];
    updatedCoordinates[index] = { ...updatedCoordinates[index], [field]: parseFloat(value) };
    setRouteCoordinates(updatedCoordinates);
  };

  const handleRemoveCoordinate = (index) => {
    const updatedCoordinates = routeCoordinates.filter((_, i) => i !== index);
    setRouteCoordinates(updatedCoordinates);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format coordinates properly for database
      const formattedCoordinates = routeCoordinates.length > 0 
        ? routeCoordinates.filter(coord => 
            coord.latitude && coord.longitude && 
            !isNaN(parseFloat(coord.latitude)) && 
            !isNaN(parseFloat(coord.longitude))
          ).map(coord => ({
            latitude: parseFloat(coord.latitude),
            longitude: parseFloat(coord.longitude)
          }))
        : null;

      const routeData = {
        ...formData,
        route_coordinates: formattedCoordinates
      };

      console.log('Saving route data:', routeData);

      let savedRoute;
      if (editingRoute) {
        savedRoute = await updateRoute(editingRoute.id, routeData);
      } else {
        savedRoute = await createRoute(routeData);
      }

      // Show success notification for route save
      if (editingRoute) {
        notifications.routeUpdated();
      } else {
        notifications.routeCreated();
      }

      // Handle stops separately if they exist
      if (routeStops.length > 0 && (savedRoute || editingRoute)) {
        try {
          // Use the upsert_route_stops function to save stops
          const { error: stopsError } = await supabase.rpc('upsert_route_stops', {
            p_route_id: savedRoute?.id || editingRoute?.id,
            p_stops: routeStops.map(stop => ({
              name: stop.name,
              description: stop.description || '',
              latitude: parseFloat(stop.latitude),
              longitude: parseFloat(stop.longitude)
            }))
          });
          
          if (stopsError) {
            console.error('Error saving stops:', stopsError);
            notifications.showWarning('Route saved successfully, but stops could not be saved. You can add stops later.');
            // Don't fail the entire operation for stops
          } else {
            notifications.showInfo('Route and stops saved successfully!');
          }
        } catch (stopsError) {
          console.error('Error saving stops:', stopsError);
          notifications.showWarning('Route saved successfully, but stops could not be saved. You can add stops later.');
          // Don't fail the entire operation for stops
        }
      }

      setShowModal(false);
      setShowRouteEditor(false);
      setFormData({
        name: '',
        description: '',
        start_location: '',
        end_location: '',
        estimated_duration: '',
        fare: '',
        route_color: '#3B82F6',
        stroke_width: 5,
        is_active: true
      });
      setRouteCoordinates([]);
      setRouteStops([]);
    } catch (error) {
      console.error('Error saving route:', error);
      console.error('Error details:', error.message, error.details);
      notifications.showError(`Error saving route: ${error.message || 'Please try again.'}`);
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        await deleteRoute(routeId);
        notifications.routeDeleted();
      } catch (error) {
        console.error('Error deleting route:', error);
        notifications.showError('Error deleting route. Please try again.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Management</h1>
          <p className="text-gray-600">Manage bus routes, stops, and fare information</p>
        </div>
        <button 
          onClick={handleAddRoute}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Route</span>
        </button>
      </div>

      {/* Debug Section - Remove after fixing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Debug Info</h3>
          <p className="text-sm text-yellow-700">Routes loaded: {routes.length}</p>
          <p className="text-sm text-yellow-700">Loading: {loading ? 'Yes' : 'No'}</p>
          <p className="text-sm text-yellow-700">Error: {error || 'None'}</p>
          {routes.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-yellow-700">First route: {routes[0].name}</p>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Navigation className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Routes</p>
              <p className="text-2xl font-bold text-gray-900">{totalRoutes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Routes</p>
              <p className="text-2xl font-bold text-gray-900">{activeRoutes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Fare</p>
              <p className="text-2xl font-bold text-gray-900">₱{avgFare}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Navigation className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive Routes</p>
              <p className="text-2xl font-bold text-gray-900">{totalRoutes - activeRoutes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Routes</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start - End
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fare
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{route.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{route.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {route.start_location} → {route.end_location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{route.distance} km</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₱{route.fare}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      route.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {route.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditRoute(route)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit Route Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenRouteEditor(route)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Route Path & Stops"
                      >
                        <Map className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoute(route.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Route"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredRoutes.length === 0 && (
          <div className="text-center py-12">
            <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first route.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Route Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRoute ? 'Edit Route' : 'Add New Route'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Route Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Location</label>
                    <input
                      type="text"
                      name="start_location"
                      value={formData.start_location}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Location</label>
                    <input
                      type="text"
                      name="end_location"
                      value={formData.end_location}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Distance (km)</label>
                    <input
                      type="number"
                      name="distance"
                      value={formData.distance}
                      onChange={handleInputChange}
                      step="0.1"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration (min)</label>
                    <input
                      type="number"
                      name="estimated_duration"
                      value={formData.estimated_duration}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fare (₱)</label>
                  <input
                    type="number"
                    name="fare"
                    value={formData.fare}
                    onChange={handleInputChange}
                    step="0.01"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Active Route</label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                  >
                    {editingRoute ? 'Update Route' : 'Add Route'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Route Editor Modal */}
      {showRouteEditor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium text-gray-900">
                  Route Editor: {formData.name}
                </h3>
                <button
                  onClick={() => setShowRouteEditor(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Route Details */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Route Details
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Route Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          name="route_color"
                          value={formData.route_color}
                          onChange={handleInputChange}
                          className="h-10 w-20 border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          name="route_color"
                          value={formData.route_color}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stroke Width</label>
                      <input
                        type="number"
                        name="stroke_width"
                        value={formData.stroke_width}
                        onChange={handleInputChange}
                        min="1"
                        max="10"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Route Coordinates */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-md font-medium text-gray-900">Route Coordinates</h5>
                      <button
                        type="button"
                        onClick={handleAddCoordinate}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Add Coordinate
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {routeCoordinates.map((coord, index) => (
                        <div key={index} className="flex space-x-2 items-center">
                          <input
                            type="number"
                            placeholder="Latitude"
                            value={coord.latitude || ''}
                            onChange={(e) => handleUpdateCoordinate(index, 'latitude', e.target.value)}
                            step="any"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Longitude"
                            value={coord.longitude || ''}
                            onChange={(e) => handleUpdateCoordinate(index, 'longitude', e.target.value)}
                            step="any"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveCoordinate(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Route Stops */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Route Stops
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddStop}
                      className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Add Stop
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {routeStops.map((stop, index) => (
                      <div key={stop.id || index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Stop {stop.stop_order}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStop(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Stop Name"
                            value={stop.name || ''}
                            onChange={(e) => handleUpdateStop(index, 'name', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Stop Description"
                            value={stop.description || ''}
                            onChange={(e) => handleUpdateStop(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              placeholder="Latitude"
                              value={stop.latitude || ''}
                              onChange={(e) => handleUpdateStop(index, 'latitude', e.target.value)}
                              step="any"
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Longitude"
                              value={stop.longitude || ''}
                              onChange={(e) => handleUpdateStop(index, 'longitude', e.target.value)}
                              step="any"
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowRouteEditor(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                >
                  Save Route
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteManagement;
