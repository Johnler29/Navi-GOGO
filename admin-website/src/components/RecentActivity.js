import React from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { Bus, Navigation, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const RecentActivity = () => {
  const { buses, routes, drivers, feedback } = useSupabase();

  // Generate recent activity data
  const activities = [
    ...buses.slice(0, 3).map(bus => ({
      id: `bus-${bus.id}`,
      type: 'bus',
      title: `Bus ${bus.bus_number} status updated`,
      description: `Status changed to ${bus.status}`,
      time: bus.updated_at,
      icon: Bus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    })),
    ...routes.slice(0, 2).map(route => ({
      id: `route-${route.id}`,
      type: 'route',
      title: `Route ${route.route_number} updated`,
      description: `${route.origin} to ${route.destination}`,
      time: route.updated_at,
      icon: Navigation,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    })),
    ...drivers.slice(0, 2).map(driver => ({
      id: `driver-${driver.id}`,
      type: 'driver',
      title: `Driver ${driver.first_name} ${driver.last_name}`,
      description: `Status: ${driver.status}`,
      time: driver.updated_at,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    })),
    ...feedback.slice(0, 2).map(fb => ({
      id: `feedback-${fb.id}`,
      type: 'feedback',
      title: 'New feedback received',
      description: fb.message?.substring(0, 50) + '...',
      time: fb.created_at,
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                    <Icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
