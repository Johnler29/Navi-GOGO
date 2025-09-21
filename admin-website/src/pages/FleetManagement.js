import React, { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  MapPin,
  Bus,
  Users,
  Wrench,
  RefreshCw,
  Eye,
  Map,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import BusModal from '../components/BusModal';

const FleetManagement = () => {
  const { buses, drivers, routes, createBus, updateBus, deleteBus, updateBusLocation } = useSupabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [trackingFilter, setTrackingFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [showActions, setShowActions] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [sortBy, setSortBy] = useState('bus_number');
  const [sortOrder, setSortOrder] = useState('asc');

  // Enhanced filtering and sorting
  const filteredBuses = buses
    .filter(bus => {
      const matchesSearch = bus.bus_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (bus.route_id && bus.route_id.toString().toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;
      const matchesTracking = trackingFilter === 'all' || bus.tracking_status === trackingFilter;
      return matchesSearch && matchesStatus && matchesTracking;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle different data types
      if (sortBy === 'bus_number') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      } else if (sortBy === 'last_location_update') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleCreateBus = async (busData) => {
    try {
      await createBus(busData);
      toast.success('Bus created successfully!');
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to create bus: ' + error.message);
    }
  };

  const handleUpdateBus = async (id, updates) => {
    try {
      await updateBus(id, updates);
      toast.success('Bus updated successfully!');
      setShowModal(false);
      setSelectedBus(null);
    } catch (error) {
      toast.error('Failed to update bus: ' + error.message);
    }
  };

  const handleDeleteBus = async (id) => {
    if (window.confirm('Are you sure you want to delete this bus?')) {
      try {
        await deleteBus(id);
        toast.success('Bus deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete bus: ' + error.message);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // The data will be refreshed automatically by the context
      toast.success('Data refreshed!');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (busId, newStatus) => {
    try {
      await updateBus(busId, { status: newStatus });
      toast.success(`Bus status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update bus status: ' + error.message);
    }
  };

  const handleTrackingStatusChange = async (busId, newTrackingStatus) => {
    try {
      await updateBus(busId, { tracking_status: newTrackingStatus });
      toast.success(`Tracking status updated to ${newTrackingStatus}`);
    } catch (error) {
      toast.error('Failed to update tracking status: ' + error.message);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrackingStatusColor = (status) => {
    switch (status) {
      case 'moving': return 'bg-blue-100 text-blue-800';
      case 'stopped': return 'bg-orange-100 text-orange-800';
      case 'at_stop': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bus Management</h1>
          <p className="text-gray-600">Manage your bus fleet and track real-time locations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bus</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Bus className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Buses</p>
              <p className="text-2xl font-bold text-gray-900">{buses.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Buses</p>
              <p className="text-2xl font-bold text-gray-900">
                {buses.filter(bus => bus.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Wrench className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Maintenance</p>
              <p className="text-2xl font-bold text-gray-900">
                {buses.filter(bus => bus.status === 'maintenance').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">With Drivers</p>
              <p className="text-2xl font-bold text-gray-900">
                {buses.filter(bus => bus.driver_id).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search buses by number, name, or route..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            
            <div className="sm:w-48">
              <select
                value={trackingFilter}
                onChange={(e) => setTrackingFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Tracking</option>
                <option value="moving">Moving</option>
                <option value="stopped">Stopped</option>
                <option value="at_stop">At Stop</option>
              </select>
            </div>
            
            <div className="sm:w-48">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [column, order] = e.target.value.split('-');
                  setSortBy(column);
                  setSortOrder(order);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="bus_number-asc">Bus Number (A-Z)</option>
                <option value="bus_number-desc">Bus Number (Z-A)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="status-asc">Status (A-Z)</option>
                <option value="status-desc">Status (Z-A)</option>
                <option value="last_location_update-desc">Last Update (Newest)</option>
                <option value="last_location_update-asc">Last Update (Oldest)</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Filter className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">
              Showing {filteredBuses.length} of {buses.length} buses
            </span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-blue-700">
            <span>Active: {buses.filter(b => b.status === 'active').length}</span>
            <span>•</span>
            <span>Moving: {buses.filter(b => b.tracking_status === 'moving').length}</span>
            <span>•</span>
            <span>With Location: {buses.filter(b => b.latitude && b.longitude).length}</span>
          </div>
        </div>
      </div>

      {/* Buses Display */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('bus_number')}
                  >
                    <div className="flex items-center">
                      Bus
                      {sortBy === 'bus_number' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {sortBy === 'status' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('last_location_update')}
                  >
                    <div className="flex items-center">
                      Last Update
                      {sortBy === 'last_location_update' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBuses.map((bus) => {
                const driver = drivers.find(d => d.id === bus.driver_id);
                
                return (
                  <tr key={bus.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Bus className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {bus.name || `Bus ${bus.bus_number}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {bus.route_id ? `Route ${bus.route_id.slice(-3)}` : 'No route assigned'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <select
                            value={bus.status}
                            onChange={(e) => handleStatusChange(bus.id, e.target.value)}
                            className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(bus.status)}`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        </div>
                        {bus.tracking_status && (
                          <div className="flex items-center space-x-2">
                            <select
                              value={bus.tracking_status}
                              onChange={(e) => handleTrackingStatusChange(bus.id, e.target.value)}
                              className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getTrackingStatusColor(bus.tracking_status)}`}
                            >
                              <option value="moving">Moving</option>
                              <option value="stopped">Stopped</option>
                              <option value="at_stop">At Stop</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bus.latitude && bus.longitude ? (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-green-600">Live</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">No location</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {driver ? (
                        <div>
                          <div className="font-medium">{driver.first_name} {driver.last_name}</div>
                          <div className="text-gray-500">{driver.license_number}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">No driver assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bus.last_location_update ? (
                        new Date(bus.last_location_update).toLocaleString()
                      ) : (
                        'Never'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setShowActions(showActions === bus.id ? null : bus.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {showActions === bus.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedBus(bus);
                                  setShowModal(true);
                                  setShowActions(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit className="w-4 h-4 mr-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteBus(bus.id);
                                  setShowActions(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBuses.map((bus) => {
            const driver = drivers.find(d => d.id === bus.driver_id);
            
            return (
              <div key={bus.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Bus className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {bus.name || `Bus ${bus.bus_number}`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {bus.route_id ? `Route ${bus.route_id.slice(-3)}` : 'No route assigned'}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowActions(showActions === bus.id ? null : bus.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {showActions === bus.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setSelectedBus(bus);
                              setShowModal(true);
                              setShowActions(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 mr-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteBus(bus.id);
                              setShowActions(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <select
                      value={bus.status}
                      onChange={(e) => handleStatusChange(bus.id, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(bus.status)}`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  
                  {bus.tracking_status && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tracking</span>
                      <select
                        value={bus.tracking_status}
                        onChange={(e) => handleTrackingStatusChange(bus.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getTrackingStatusColor(bus.tracking_status)}`}
                      >
                        <option value="moving">Moving</option>
                        <option value="stopped">Stopped</option>
                        <option value="at_stop">At Stop</option>
                      </select>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Location</span>
                    {bus.latitude && bus.longitude ? (
                      <div className="flex items-center text-green-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">Live</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No location</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Driver</span>
                    {driver ? (
                      <span className="text-sm text-gray-900">{driver.first_name} {driver.last_name}</span>
                    ) : (
                      <span className="text-sm text-gray-500">No driver</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Update</span>
                    <span className="text-sm text-gray-500">
                      {bus.last_location_update ? (
                        new Date(bus.last_location_update).toLocaleString()
                      ) : (
                        'Never'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bus Modal */}
      {showModal && (
        <BusModal
          bus={selectedBus}
          routes={routes}
          drivers={drivers}
          onClose={() => {
            setShowModal(false);
            setSelectedBus(null);
          }}
          onSave={selectedBus ? handleUpdateBus : handleCreateBus}
        />
      )}
    </div>
  );
};

export default FleetManagement;
