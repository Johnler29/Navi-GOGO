import React from 'react';
import { Settings as SettingsIcon, Database, Bell, Shield, Globe } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your MetroBus admin system settings</p>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Database</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Configure database connections and backup settings
          </p>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Configure →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <Bell className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Notifications</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Set up email and push notification preferences
          </p>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Configure →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Shield className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Security</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Manage user permissions and security settings
          </p>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Configure →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Globe className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">General</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Basic system configuration and preferences
          </p>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Configure →
          </button>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Settings</h3>
        <p className="text-gray-600 mb-6">
          This section will allow you to configure various system settings and preferences.
        </p>
        <div className="text-sm text-gray-500">
          Features coming soon:
          <ul className="mt-2 space-y-1">
            <li>• Database configuration</li>
            <li>• Notification settings</li>
            <li>• Security and permissions</li>
            <li>• System preferences</li>
            <li>• API configuration</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
