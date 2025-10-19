import React from 'react';
import { Bus } from 'lucide-react';

const LoadingSpinner = ({ size = 'large', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      {/* Logo */}
      <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center 
                    shadow-lg mb-8">
        <Bus className="w-9 h-9 text-white" />
      </div>

      {/* Spinner */}
      <div className={`${sizeClasses[size]} border-3 border-gray-200 border-t-amber-500 
                     rounded-full animate-spin`}></div>

      {/* Loading text */}
      {text && (
        <p className="mt-4 text-sm font-medium text-gray-600">{text}</p>
      )}

      {/* Branding */}
      <div className="mt-12 text-center">
        <p className="text-sm font-semibold text-gray-700">Metro NaviGo</p>
        <p className="text-xs text-gray-400 mt-1">Admin Portal</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
