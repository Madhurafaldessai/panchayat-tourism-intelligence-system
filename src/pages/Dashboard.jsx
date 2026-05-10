import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Overview from '../components/dashboard/Overview';
import Heatmap from '../components/dashboard/Heatmap'; // <-- 1. Imported the Heatmap

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const villageName = localStorage.getItem('adminVillage') || 'Balli';

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminVillage');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden text-black selection:bg-black selection:text-white">
      
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar bg-white">
        
        {/* The Black Top Section */}
        <div className="bg-[#111] text-white pt-16 pb-36 px-12 lg:px-16 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h1 className="text-6xl font-serif font-bold tracking-tight capitalize">
              {villageName} Panchayat
            </h1>
            <div className="w-12 h-12 bg-[#fef08a] rounded-full border-2 border-black flex items-center justify-center text-black font-bold shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] flex-shrink-0 text-xl">
              {villageName[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* The Content Area - Overlaps the black background */}
        <div className="px-12 lg:px-16 -mt-20 relative z-10 pb-12 w-full max-w-7xl">
          
          {activeTab === 'overview' && <Overview />}
          
          {/* 2. Replaced the placeholder with the actual Heatmap component in a Brutalist container */}
          {activeTab === 'heatmap' && (
            <div className="w-385 h-225 mt-8 bg-white border-[3px] border-black p-2 shadow-[12px_12px_0px_0px_#000] relative z-20">
              <Heatmap />
            </div>
          )}

          {activeTab === 'issues-solved' && (
            <div className="text-black font-bold text-xl mt-8 border-[3px] border-black p-8 bg-white shadow-[8px_8px_0px_0px_#000]">
              Analytics Coming Soon...
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Dashboard;