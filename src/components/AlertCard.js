import React from 'react';

const AlertCard = ({ alert }) => {
  const getTypeStyle = (type) => {
    switch (type) {
      case 'warning':
        return {
          border: 'border-l-yellow-500 dark:border-l-yellow-400',
          bg: 'bg-yellow-50 dark:bg-yellow-900/30',
          title: 'text-yellow-900 dark:text-yellow-200',
          text: 'text-yellow-800 dark:text-yellow-300',
          time: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'info':
        return {
          border: 'border-l-blue-500 dark:border-l-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/30',
          title: 'text-blue-900 dark:text-blue-200',
          text: 'text-blue-800 dark:text-blue-300',
          time: 'text-blue-600 dark:text-blue-400'
        };
      case 'success':
        return {
          border: 'border-l-green-500 dark:border-l-green-400',
          bg: 'bg-green-50 dark:bg-green-900/30',
          title: 'text-green-900 dark:text-green-200',
          text: 'text-green-800 dark:text-green-300',
          time: 'text-green-600 dark:text-green-400'
        };
      case 'danger':
        return {
          border: 'border-l-red-500 dark:border-l-red-400',
          bg: 'bg-red-50 dark:bg-red-900/30',
          title: 'text-red-900 dark:text-red-200',
          text: 'text-red-800 dark:text-red-300',
          time: 'text-red-600 dark:text-red-400'
        };
      default:
        return {
          border: 'border-l-gray-500',
          bg: 'bg-gray-50 dark:bg-gray-800',
          title: 'text-gray-800 dark:text-white',
          text: 'text-gray-700 dark:text-gray-300',
          time: 'text-gray-500 dark:text-gray-400'
        };
    }
  };

  const style = getTypeStyle(alert.type);

  return (
    <div className={`border-l-4 ${style.border} ${style.bg} p-4 rounded-r-lg hover:shadow-lg transition-all hover:scale-[1.02]`}>
      <div className="flex items-start space-x-3">
        <span className="text-2xl flex-shrink-0">{alert.icon}</span>
        <div className="flex-1">
          <h4 className={`font-bold ${style.title} mb-1`}>{alert.title}</h4>
          <p className={`text-sm ${style.text} font-medium`}>{alert.message}</p>
          <p className={`text-xs ${style.time} mt-2 font-semibold`}>{alert.time}</p>
        </div>
      </div>
    </div>
  );
};

export default AlertCard;

