import React from 'react';

const KPICard = ({ title, value, subtitle, icon, color = 'blue', trend }) => {
  const colorClasses = {
    blue: 'kpi-blue',
    green: 'kpi-green',
    purple: 'kpi-purple',
    orange: 'kpi-orange',
    red: 'kpi-red'
  };

  return (
    <div className="card kpi-card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">{value}</h3>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          {trend && (
            <div className={`text-xs mt-2 font-semibold ${trend.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center text-2xl flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default KPICard;

