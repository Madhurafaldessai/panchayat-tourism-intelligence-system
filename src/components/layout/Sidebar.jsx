import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const villageName = localStorage.getItem('adminVillage') || 'Balli';

  // Updated to match your new structure
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '⊞' },
    { id: 'heatmap', label: 'Heatmap', icon: '🗺️' },
    { id: 'issues-solved', label: 'Issues Solved', icon: '✓' },
  ];

  return (
    <div className="w-72 flex flex-col h-full py-8 overflow-hidden bg-linear-to-t from-neutral-950 to-green-900 text-white">
      {/* Logo Area */}
      <div className="px-8 mb-12 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#f4f6ee] rounded-lg flex items-center justify-center text-black font-bold">P</div>
        <h1 className="text-white text-xl font-bold tracking-tight">AdminPortal</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 pl-2 space-y-2">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="relative">
              {isActive && (
                <>
                  <div className="absolute top-1 right-1 bottom-0 w-full bg-[#21e23a] rounded-3xl "></div>
                  <div className="absolute -top-5 right-0 w-4 h- bg-[#d9e8db] z-0 after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:bg-[#174732] after:rounded-br-[20px]"></div>
                  <div className="absolute -bottom-5 right-0 w-5 h- bg-[#d9e8db] z-0 after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:bg-[#154931] after:rounded-tr-[20px]"></div>
                </>
              )}
              
              <button
                onClick={() => setActiveTab(item.id)}
                className={`relative z-10 w-full flex items-center gap-4 px-5 py-6  transition-all duration-300 ${
                  isActive ? 'text-[rgb(9,31,22)] font-bold' : 'text-white-800 hover:text-white '
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xl tracking-wide">{item.label}</span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="px-6 mt-auto">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-red-800/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all text-md font-bold border border-red-300/10"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;