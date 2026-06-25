import React from 'react';

const NavigationTabs = ({
  tabs,
  activeTab,
  setActiveTab,
  colorScheme = 'green',
  className = ''
}) => {
  const colorClasses = {
    green: {
      active: 'border-green-500 text-green-600',
      inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    },
    purple: {
      active: 'border-purple-500 text-purple-600',
      inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    },
    orange: {
      active: 'border-orange-500 text-orange-600',
      inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    },
    blue: {
      active: 'border-blue-500 text-blue-600',
      inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }
  };

  const colors = colorClasses[colorScheme] || colorClasses.green;

  return (
    <div className={`bg-white border-b ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id ? colors.active : colors.inactive
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default NavigationTabs;
