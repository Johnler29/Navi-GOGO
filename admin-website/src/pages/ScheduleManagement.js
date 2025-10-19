import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, Bus, Navigation, Search, Filter, Edit, Trash2, Eye, Download, RefreshCw, MapPin, Users } from 'lucide-react';
import { useSupabase } from '../contexts/SupabaseContext';
import { notifications } from '../utils/notifications';

const ScheduleManagement = () => {
  const { schedules, routes, buses, supabase } = useSupabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoute, setFilterRoute] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'timetable'
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [showEditSchedule, setShowEditSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [stats, setStats] = useState({
    totalSchedules: 0,
    activeToday: 0,
    peakHours: '6-9 AM',
    routesCovered: 0
  });

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    routeId: '',
    busId: '',
    driverId: '',
    departureTime: '',
    arrivalTime: '',
    dayOfWeek: 'monday',
    isActive: true,
    frequency: 'daily',
    notes: ''
  });

  // Load statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
        
        const [totalSchedules, activeToday, routesWithSchedules] = await Promise.all([
          supabase.from('schedules').select('id', { count: 'exact' }),
          supabase.from('schedules').select('id', { count: 'exact' }).eq('day_of_week', dayOfWeek).eq('is_active', true),
          supabase.from('schedules').select('route_id').eq('is_active', true)
        ]);

        setStats({
          totalSchedules: totalSchedules.count || 0,
          activeToday: activeToday.count || 0,
          peakHours: '6-9 AM',
          routesCovered: new Set(routesWithSchedules.data?.map(s => s.route_id)).size || 0
        });
      } catch (error) {
        console.error('Error loading stats:', error);
        setStats({
          totalSchedules: schedules.length,
          activeToday: schedules.filter(s => s.is_active).length,
          peakHours: '6-9 AM',
          routesCovered: new Set(schedules.map(s => s.route_id)).size
        });
      }
    };
    loadStats();
  }, [schedules, supabase]);

  // Filter schedules
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.frequency?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRoute = filterRoute === 'all' || schedule.route_id === filterRoute;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' ? schedule.is_active : !schedule.is_active);
    return matchesSearch && matchesRoute && matchesStatus;
  });

  // Handle create schedule
  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert([{
          route_id: scheduleForm.routeId,
          bus_id: scheduleForm.busId,
          driver_id: scheduleForm.driverId,
          departure_time: scheduleForm.departureTime,
          arrival_time: scheduleForm.arrivalTime,
          day_of_week: scheduleForm.dayOfWeek,
          is_active: scheduleForm.isActive,
          frequency: scheduleForm.frequency,
          notes: scheduleForm.notes
        }])
        .select();

      if (error) throw error;

      notifications.scheduleCreated();
      setShowCreateSchedule(false);
      setScheduleForm({
        routeId: '',
        busId: '',
        driverId: '',
        departureTime: '',
        arrivalTime: '',
        dayOfWeek: 'monday',
        isActive: true,
        frequency: 'daily',
        notes: ''
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      notifications.showError('Error creating schedule: ' + error.message);
    }
  };

  // Handle edit schedule
  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      routeId: schedule.route_id || '',
      busId: schedule.bus_id || '',
      driverId: schedule.driver_id || '',
      departureTime: schedule.departure_time || '',
      arrivalTime: schedule.arrival_time || '',
      dayOfWeek: schedule.day_of_week || 'monday',
      isActive: schedule.is_active,
      frequency: schedule.frequency || 'daily',
      notes: schedule.notes || ''
    });
    setShowEditSchedule(true);
  };

  // Handle update schedule
  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('schedules')
        .update({
          route_id: scheduleForm.routeId,
          bus_id: scheduleForm.busId,
          driver_id: scheduleForm.driverId,
          departure_time: scheduleForm.departureTime,
          arrival_time: scheduleForm.arrivalTime,
          day_of_week: scheduleForm.dayOfWeek,
          is_active: scheduleForm.isActive,
          frequency: scheduleForm.frequency,
          notes: scheduleForm.notes
        })
        .eq('id', editingSchedule.id)
        .select();

      if (error) throw error;

      notifications.scheduleUpdated();
      setShowEditSchedule(false);
      setEditingSchedule(null);
      setScheduleForm({
        routeId: '',
        busId: '',
        driverId: '',
        departureTime: '',
        arrivalTime: '',
        dayOfWeek: 'monday',
        isActive: true,
        frequency: 'daily',
        notes: ''
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      notifications.showError('Error updating schedule: ' + error.message);
    }
  };

  // Handle delete schedule
  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;
      notifications.scheduleDeleted();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      notifications.showError('Error deleting schedule: ' + error.message);
    }
  };

  // Get route name by ID
  const getRouteName = (routeId) => {
    const route = routes.find(r => r.id === routeId);
    return route ? route.name : 'Unknown Route';
  };

  // Get bus info by ID
  const getBusInfo = (busId) => {
    const bus = buses.find(b => b.id === busId);
    return bus ? `${bus.bus_number} - ${bus.name}` : 'No Bus Assigned';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
          <p className="text-gray-600">Manage bus schedules, timetables, and route timings</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'timetable' : 'list')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>{viewMode === 'list' ? 'Timetable View' : 'List View'}</span>
          </button>
          <button 
            onClick={() => setShowCreateSchedule(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Schedule</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Schedules</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSchedules}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeToday}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Bus className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Peak Hours</p>
              <p className="text-2xl font-bold text-gray-900">{stats.peakHours}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Navigation className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Routes Covered</p>
              <p className="text-2xl font-bold text-gray-900">{stats.routesCovered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search schedules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                />
              </div>
              <select
                value={filterRoute}
                onChange={(e) => setFilterRoute(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Routes</option>
                {routes.map(route => (
                  <option key={route.id} value={route.id}>{route.name}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {viewMode === 'list' ? (
            /* List View */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Day
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frequency
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
                  {filteredSchedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getRouteName(schedule.route_id)}
                            </div>
                            <div className="text-sm text-gray-500">Route ID: {schedule.route_id?.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Bus className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">{getBusInfo(schedule.bus_id)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 mr-1" />
                            {schedule.departure_time} - {schedule.arrival_time}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {schedule.day_of_week}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {schedule.frequency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          schedule.is_active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {schedule.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-primary-600 hover:text-primary-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditSchedule(schedule)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit schedule"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete schedule"
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
          ) : (
            /* Timetable View */
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-500">
                <div className="p-2">Monday</div>
                <div className="p-2">Tuesday</div>
                <div className="p-2">Wednesday</div>
                <div className="p-2">Thursday</div>
                <div className="p-2">Friday</div>
                <div className="p-2">Saturday</div>
                <div className="p-2">Sunday</div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <div key={day} className="min-h-32 p-2 border border-gray-200 rounded-lg">
                    <div className="text-xs font-medium text-gray-600 mb-2 capitalize">{day}</div>
                    <div className="space-y-1">
                      {filteredSchedules
                        .filter(s => s.day_of_week === day)
                        .map(schedule => (
                          <div key={schedule.id} className="text-xs p-1 bg-blue-50 rounded border-l-2 border-blue-400">
                            <div className="font-medium">{getRouteName(schedule.route_id)}</div>
                            <div className="text-gray-600">{schedule.departure_time}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Schedule Modal */}
      {showCreateSchedule && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create Schedule</h3>
                <button
                  onClick={() => setShowCreateSchedule(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateSchedule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Route</label>
                  <select
                    required
                    value={scheduleForm.routeId}
                    onChange={(e) => setScheduleForm({...scheduleForm, routeId: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Route</option>
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>{route.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bus</label>
                  <select
                    value={scheduleForm.busId}
                    onChange={(e) => setScheduleForm({...scheduleForm, busId: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Bus (Optional)</option>
                    {buses.map(bus => (
                      <option key={bus.id} value={bus.id}>{bus.bus_number} - {bus.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Departure Time</label>
                    <input
                      type="time"
                      required
                      value={scheduleForm.departureTime}
                      onChange={(e) => setScheduleForm({...scheduleForm, departureTime: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Arrival Time</label>
                    <input
                      type="time"
                      required
                      value={scheduleForm.arrivalTime}
                      onChange={(e) => setScheduleForm({...scheduleForm, arrivalTime: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Day of Week</label>
                  <select
                    required
                    value={scheduleForm.dayOfWeek}
                    onChange={(e) => setScheduleForm({...scheduleForm, dayOfWeek: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency</label>
                  <select
                    required
                    value={scheduleForm.frequency}
                    onChange={(e) => setScheduleForm({...scheduleForm, frequency: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays Only</option>
                    <option value="weekends">Weekends Only</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={scheduleForm.isActive}
                      onChange={(e) => setScheduleForm({...scheduleForm, isActive: e.target.checked})}
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active Schedule</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateSchedule(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                  >
                    Create Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEditSchedule && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Schedule</h3>
                <button
                  onClick={() => {
                    setShowEditSchedule(false);
                    setEditingSchedule(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleUpdateSchedule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Route</label>
                  <select
                    required
                    value={scheduleForm.routeId}
                    onChange={(e) => setScheduleForm({...scheduleForm, routeId: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Route</option>
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>{route.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bus</label>
                  <select
                    value={scheduleForm.busId}
                    onChange={(e) => setScheduleForm({...scheduleForm, busId: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Bus (Optional)</option>
                    {buses.map(bus => (
                      <option key={bus.id} value={bus.id}>{bus.bus_number} - {bus.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Departure Time</label>
                    <input
                      type="time"
                      required
                      value={scheduleForm.departureTime}
                      onChange={(e) => setScheduleForm({...scheduleForm, departureTime: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Arrival Time</label>
                    <input
                      type="time"
                      required
                      value={scheduleForm.arrivalTime}
                      onChange={(e) => setScheduleForm({...scheduleForm, arrivalTime: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Day of Week</label>
                  <select
                    required
                    value={scheduleForm.dayOfWeek}
                    onChange={(e) => setScheduleForm({...scheduleForm, dayOfWeek: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency</label>
                  <select
                    required
                    value={scheduleForm.frequency}
                    onChange={(e) => setScheduleForm({...scheduleForm, frequency: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays Only</option>
                    <option value="weekends">Weekends Only</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={scheduleForm.isActive}
                      onChange={(e) => setScheduleForm({...scheduleForm, isActive: e.target.checked})}
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active Schedule</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditSchedule(false);
                      setEditingSchedule(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                  >
                    Update Schedule
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

export default ScheduleManagement;
