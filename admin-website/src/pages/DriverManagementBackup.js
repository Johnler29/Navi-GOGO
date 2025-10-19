import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { Users, Plus, Search, UserCheck, Trash2, Bus, MapPin } from 'lucide-react';
import { notifications } from '../utils/notifications';

const DriverManagement = () => {
  const { supabase, buses: contextBuses, drivers: contextDrivers, syncDriverBusAssignments } = useSupabase();
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showAssignDriver, setShowAssignDriver] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [driverForm, setDriverForm] = useState({
    name: '',
    email: '',
    phone: '',
    license_number: '',
    is_admin: false
  });

  const [assignmentForm, setAssignmentForm] = useState({
    driver_id: '',
    bus_id: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use context data for drivers and buses
      setDrivers(contextDrivers || []);
      setBuses(contextBuses || []);
      console.log('Using context drivers:', contextDrivers);
      console.log('Using context buses:', contextBuses);

      // Load assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('driver_bus_assignments')
        .select('*');
      
      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, contextDrivers, contextBuses]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update local state when context data changes
  useEffect(() => {
    if (contextDrivers) {
      setDrivers(contextDrivers);
    }
  }, [contextDrivers]);

  useEffect(() => {
    if (contextBuses) {
      setBuses(contextBuses);
      console.log('Context buses updated:', contextBuses);
    }
  }, [contextBuses]);

  const handleAddDriver = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('drivers')
        .insert([driverForm])
        .select();

      if (error) throw error;
      
      setDrivers([...drivers, ...data]);
      setDriverForm({ name: '', email: '', phone: '', license_number: '', is_admin: false });
      setShowAddDriver(false);
      notifications.driverCreated();
    } catch (error) {
      console.error('Error adding driver:', error);
      window.alert('Error adding driver: ' + error.message);
    }
  };

  const handleAssignDriver = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('driver_bus_assignments')
        .insert([{
          driver_id: assignmentForm.driver_id,
          bus_id: assignmentForm.bus_id,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select('*');

      if (error) throw error;
      
      setAssignments([...assignments, ...data]);
      setAssignmentForm({ driver_id: '', bus_id: '' });
      setShowAssignDriver(false);
      notifications.driverAssigned();
    } catch (error) {
      console.error('Error assigning driver:', error);
      window.alert('Error assigning driver: ' + error.message);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) return;
    
    try {
      const { error } = await supabase
        .from('driver_bus_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      
      setAssignments(assignments.filter(a => a.id !== assignmentId));
      notifications.driverUnassigned();
    } catch (error) {
      console.error('Error removing assignment:', error);
      window.alert('Error removing assignment: ' + error.message);
    }
  };

  const handleSyncAssignments = async () => {
    try {
      const syncedCount = await syncDriverBusAssignments();
      if (syncedCount > 0) {
        window.alert(`Synced ${syncedCount} missing driver-bus assignments!`);
        // Reload assignments
        loadData();
      } else {
        window.alert('All driver-bus assignments are already in sync!');
      }
    } catch (error) {
      console.error('Error syncing assignments:', error);
      window.alert('Error syncing assignments: ' + error.message);
    }
  };

  // Ensure we have valid arrays with comprehensive safety checks
  const safeDrivers = Array.isArray(drivers) ? drivers.filter(driver => 
    driver && 
    typeof driver === 'object' && 
    driver.id && 
    (driver.name || driver.email)
  ) : [];
  const safeBuses = Array.isArray(buses) ? buses.filter(bus => 
    bus && 
    typeof bus === 'object' && 
    bus.id
  ) : [];
  const safeAssignments = Array.isArray(assignments) ? assignments.filter(assignment => 
    assignment && 
    typeof assignment === 'object' && 
    assignment.id
  ) : [];
  
  // Debug drivers array
  console.log('Drivers array:', safeDrivers);
  console.log('Drivers array length:', safeDrivers.length);
  
  const filteredDrivers = safeDrivers.filter(driver => {
    if (!driver || typeof driver !== 'object') {
      console.warn('Invalid driver in filter:', driver);
      return false;
    }
    
    const hasName = driver.name && typeof driver.name === 'string';
    const hasEmail = driver.email && typeof driver.email === 'string';
    const hasLicense = driver.license_number && typeof driver.license_number === 'string';
    
    if (!hasName || !hasEmail || !hasLicense) {
      console.warn('Driver missing required fields:', driver);
      return false;
    }
    
    return driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           driver.license_number.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const activeDrivers = safeDrivers.filter(driver => driver && !driver.is_admin).length;
  const assignedDrivers = safeAssignments.length;
  const availableBuses = safeBuses.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading drivers...</div>
      </div>
    );
  }

  // Early return if we don't have valid data
  if (!Array.isArray(safeDrivers)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error: Invalid drivers data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
          <p className="text-gray-600">Manage driver profiles, assignments, and performance</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleSyncAssignments}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Sync Assignments</span>
          </button>
          <button 
            onClick={() => setShowAssignDriver(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Bus className="w-4 h-4" />
            <span>Assign Driver</span>
          </button>
          <button 
            onClick={() => setShowAddDriver(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Driver</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Drivers</p>
              <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Drivers</p>
              <p className="text-2xl font-bold text-gray-900">{activeDrivers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Bus className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Available Buses</p>
            <p className="text-2xl font-bold text-gray-900">{availableBuses}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <MapPin className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned</p>
              <p className="text-2xl font-bold text-gray-900">{assignedDrivers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search drivers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Drivers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Bus</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(() => {
                try {
                  if (!Array.isArray(filteredDrivers) || filteredDrivers.length === 0) {
                    return (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          No drivers found
                        </td>
                      </tr>
                    );
                  }
                  
                  return filteredDrivers.map((driver, index) => {
                    try {
                      // Comprehensive null checks for driver
                      if (!driver || typeof driver !== 'object') {
                        console.warn('Invalid driver object at index', index, driver);
                        return null;
                      }
                      
                      // Check if driver has required properties
                      const driverName = driver.name || 'Unknown Driver';
                      const driverEmail = driver.email || 'No email';
                      const driverPhone = driver.phone || 'No phone';
                      const driverLicense = driver.license_number || 'No license';
                      
                      // Find assignment from the assignments array
                      const assignment = safeAssignments.find(a => a.driver_id === driver.id);
                      
                      // Find the assigned bus using the assignment data
                      const assignedBus = assignment ? safeBuses.find(bus => bus.id === assignment.bus_id) : null;
                      
                      return (
                        <tr key={driver.id || index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {driverName.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{driverName}</div>
                                <div className="text-sm text-gray-500">{driverEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {driverPhone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {driverLicense}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              driver.is_admin 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {driver.is_admin ? 'Admin' : 'Driver'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {assignedBus && assignedBus.bus_number ? (
                              <div>
                                <div className="font-medium">{assignedBus.bus_number}</div>
                                <div className="text-gray-500">{assignedBus.name || 'Unknown Bus'}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Not assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setAssignmentForm({ ...assignmentForm, driver_id: driver.id });
                                setShowAssignDriver(true);
                              }}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                            >
                              <Bus className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    } catch (error) {
                      console.error('Error rendering driver at index', index, error, driver);
                      return null;
                    }
                  });
                } catch (error) {
                  console.error('Error in driver mapping', error);
                  return (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-red-500">
                        Error loading drivers
                      </td>
                    </tr>
                  );
                }
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignments Table */}
      {assignments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Current Assignments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{assignment.drivers.name}</div>
                      <div className="text-sm text-gray-500">{assignment.drivers.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.buses.bus_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.buses.routes?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(assignment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddDriver && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Driver</h3>
              <form onSubmit={handleAddDriver} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    value={driverForm.name}
                    onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={driverForm.email}
                    onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    required
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">License Number</label>
                  <input
                    type="text"
                    required
                    value={driverForm.license_number}
                    onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_admin"
                    checked={driverForm.is_admin}
                    onChange={(e) => setDriverForm({ ...driverForm, is_admin: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-900">
                    Admin privileges
                  </label>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddDriver(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  >
                    Add Driver
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {showAssignDriver && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Driver to Bus</h3>
              <form onSubmit={handleAssignDriver} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Driver</label>
                  <select
                    required
                    value={assignmentForm.driver_id}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, driver_id: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select a driver</option>
                    {safeDrivers.filter(d => !d.is_admin).map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} ({driver.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bus ({safeBuses.length} available)
                  </label>
                  <select
                    required
                    value={assignmentForm.bus_id}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, bus_id: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select a bus</option>
                    {safeBuses.length > 0 ? safeBuses.map(bus => (
                      <option key={bus.id} value={bus.id}>
                        {bus.bus_number} - {bus.name} ({bus.routes?.name})
                      </option>
                    )) : (
                      <option disabled>No buses available</option>
                    )}
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAssignDriver(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Assign Driver
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;