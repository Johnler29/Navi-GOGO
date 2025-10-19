import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ 
  title, 
  value, 
  total, 
  icon: Icon, 
  color, 
  bgColor, 
  change, 
  changeType 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 
                  hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            {title}
          </p>
          <div className="flex items-baseline mb-3">
            <p className="text-3xl font-bold text-gray-900">
              {value}
            </p>
            {total && (
              <p className="ml-2 text-base text-gray-400 font-medium">/ {total}</p>
            )}
          </div>
          {change && (
            <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
              changeType === 'positive' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {changeType === 'positive' ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {change}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${bgColor} shadow-sm`}>
          <Icon className={`w-7 h-7 ${color}`} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
