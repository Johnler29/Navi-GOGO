import React, { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { Bell, Clock, CheckCircle, XCircle, MapPin, User, Bus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PingNotifications = () => {
  const { getPingNotifications, acknowledgePing, completePing } = useSupabase();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getPingNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (pingId) => {
    try {
      await acknowledgePing(pingId);
      await loadNotifications();
    } catch (error) {
      console.error('Error acknowledging ping:', error);
    }
  };

  const handleComplete = async (pingId) => {
    try {
      await completePing(pingId);
      await loadNotifications();
    } catch (error) {
      console.error('Error completing ping:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'acknowledged':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'acknowledged':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPingTypeColor = (type) => {
    switch (type) {
      case 'ride_request':
        return 'bg-green-100 text-green-800';
      case 'eta_request':
        return 'bg-blue-100 text-blue-800';
      case 'location_request':
        return 'bg-purple-100 text-purple-800';
      case 'general_message':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    return notification.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ping Notifications</h1>
          <p className="text-gray-600">Manage user notifications and requests</p>
        </div>
        <button
          onClick={loadNotifications}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'All', count: notifications.length },
          { key: 'pending', label: 'Pending', count: notifications.filter(n => n.status === 'pending').length },
          { key: 'acknowledged', label: 'Acknowledged', count: notifications.filter(n => n.status === 'acknowledged').length },
          { key: 'completed', label: 'Completed', count: notifications.filter(n => n.status === 'completed').length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No ping notifications have been sent yet.'
                : `No ${filter} notifications found.`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(notification.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                        {notification.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPingTypeColor(notification.ping_type)}`}>
                        {notification.ping_type.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{notification.users?.first_name} {notification.users?.last_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Bus className="w-4 h-4" />
                        <span>Bus {notification.buses?.bus_number}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>

                    {notification.message && (
                      <p className="text-gray-900 mb-3">{notification.message}</p>
                    )}

                    {notification.location_address && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{notification.location_address}</span>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      User: {notification.users?.email} | Phone: {notification.users?.phone || 'N/A'}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {notification.status === 'pending' && (
                      <button
                        onClick={() => handleAcknowledge(notification.id)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    {notification.status === 'acknowledged' && (
                      <button
                        onClick={() => handleComplete(notification.id)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PingNotifications;
