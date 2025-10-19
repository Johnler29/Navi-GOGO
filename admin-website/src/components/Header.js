import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Menu, Bell, Search, User, LogOut, Settings } from 'lucide-react';

const Header = ({ onMenuClick }) => {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 
                     hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Search */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="block w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm 
                         placeholder-gray-400 focus:outline-none focus:border-amber-500 
                         focus:ring-4 focus:ring-amber-100 transition-all bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                           rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 pr-3 rounded-lg hover:bg-gray-100 
                       transition-colors"
            >
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border 
                            border-gray-200 py-2 z-50 animate-scale-in">
                <button className="flex items-center w-full px-4 py-2.5 text-sm font-medium 
                                 text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4 mr-3 text-gray-400" />
                  Settings
                </button>
                <div className="my-1 border-t border-gray-100"></div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-2.5 text-sm font-medium 
                           text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
