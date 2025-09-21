import React, { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import LiveMap from '../components/LiveMap';
import MetricCard from '../components/MetricCard';
import RecentActivity from '../components/RecentActivity';
import PerformanceChart from '../components/PerformanceChart';
import { 
  Bus, 
  Navigation, 
  Users, 
  UserCheck, 
  TrendingUp, 
  AlertTriangle,
  MapPin,
  Clock
} from 'lucide-react';

const Dashboard = () => {
  const { buses, drivers, users, routes, getAnalytics } = useSupabase();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const data = await getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [getAnalytics]);

  // Calculate real-time metrics
  const activeBuses = buses.filter(bus => bus.status === 'active').length;
  const busesWithLocation = buses.filter(bus => bus.latitude && bus.longitude).length;
  const activeDrivers = drivers.filter(driver => driver.status === 'active').length;
  const totalRoutes = routes?.length || 0;
  const totalUsers = users.length;

  // Calculate performance metrics
  const onTimePerformance = buses.length > 0 ? 
    Math.round((buses.filter(bus => bus.tracking_status === 'moving').length / buses.length) * 100) : 0;

  const metrics = [
    {
      title: 'Active Buses',
      value: activeBuses,
      total: buses.length,
      icon: Bus,
      color: 'text-primary-700',
      bgColor: 'bg-primary-50',
      change: '+2.5%',
      changeType: 'positive'
    },
    {
      title: 'Total Routes',
      value: totalRoutes,
      icon: Navigation,
      color: 'text-secondary-700',
      bgColor: 'bg-secondary-50',
      change: '+1.2%',
      changeType: 'positive'
    },
    {
      title: 'Active Drivers',
      value: activeDrivers,
      total: drivers.length,
      icon: Users,
      color: 'text-warm-700',
      bgColor: 'bg-warm-50',
      change: '+0.8%',
      changeType: 'positive'
    },
    {
      title: 'Total Users',
      value: totalUsers,
      icon: UserCheck,
      color: 'text-cool-700',
      bgColor: 'bg-cool-50',
      change: '+5.2%',
      changeType: 'positive'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Metro Link Dashboard</h1>
        <p className="text-gray-600">Real-time overview of your Metro Link operations</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-primary-500" />
                  Live Bus Tracking
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Real-time</span>
                </div>
              </div>
            </div>
            <div className="h-96">
              <LiveMap buses={buses} />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary-500" />
            Performance Overview
          </h3>
          <PerformanceChart />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary-500" />
            System Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">Database Connection</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Healthy</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">Real-time Updates</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">GPS Coverage</span>
              </div>
              <span className="text-sm text-yellow-600 font-medium">
                {busesWithLocation}/{buses.length} buses
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">On-time Performance</span>
              </div>
              <span className="text-sm text-green-600 font-medium">{onTimePerformance}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
