import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'heatmap', label: ' Heatmap' },
    { id: 'issues-solved', label: 'Analytics' },
  ];

  return (
    <div className="w-60 h-full bg-white border-r-2 border-black flex flex-col py-8 z-50">
      
      {/* Logo Block matching the top left of your image */}
      <div className="px-8 mb-16">
        <div className="w-45 h-10 border-2 border-black flex items-center justify-center font-serif font-bold text-xl">
          AdminPortal
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col w-full">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-8 py-4 border-b-2 border-transparent transition-all font-medium text-sm ${
                isActive 
                  ? 'bg-gray-200 font-bold border-black' 
                  : 'text-gray-600 hover:text-black hover:bg-gray-50'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom Upgrade/Logout Section */}
      <div className="mt-auto px-8 flex flex-col items-center text-center">
        <button 
          onClick={onLogout}
          className="w-full bg-[#111] text-white py-3 font-bold text-sm border-2 border-black hover:bg-white hover:text-black transition-colors"
        >
          Logout
        </button>
      </div>

    </div>
  );
};

export default Sidebar;