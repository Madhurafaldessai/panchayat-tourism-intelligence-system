import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Overview from '../components/dashboard/Overview';
import Heatmap from '../components/dashboard/Heatmap';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const villageName = localStorage.getItem('adminVillage') || 'Balli';

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminVillage');
    window.location.href = '/login';
  };

  return (
    // Note: Ensure your Sidebar.jsx also uses this same background color for a seamless look.
    <div className="flex h-screen bg-linear-to-t from-neutral-950 to-green-900 overflow-hidden font-sans">
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      {/* THIN BORDER WRAPPER: Padding on top, right, and bottom. Left is 0 to connect to sidebar */}
      <div className="flex-1 py-4 pr-4 pl-0 h-full">
        <main className="w-full h-full bg-[#d9e8db] rounded-4xl shadow-2xl flex flex-col relative overflow-hidden border border-[#ffffff15]">
          
          {/* Header moved INSIDE the white card */}
          <header className="flex justify-between items-center px-10 py-6 rounded-t-xl bg-[#d9e8db] border-6 border-gray-100">
                  <div className=" flex justify-between items-start">
                   <div>
                   <h1 className="text-[2rem] font-black text-[#112a20] tracking-tight uppercase flex items-center gap-3">
                   {villageName} <span className="text-[hsla(90,40%,6%,1)]">PANCHAYAT</span>
                   </h1>
                  </div>
        </div>
            
            <div className="bg-[#fefcfb] px-4 py-2.5 rounded-full border border-white-100 flex items-center gap-3 shadow-xl">
              <div className="text-[9px] text-black font-bold uppercase text-right leading-tight">
                Authorized Access<br/>
                <span className="text-black text-xs font-black">{villageName}</span>
              </div>
              <div className="w-8 h-8 bg-[#112a20] text-white rounded-full flex items-center justify-center font-bold text-xs shadow-inner">
                {villageName[0]}
              </div>
            </div>
          </header>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-10">
            {/* Conditional Rendering */}
            {activeTab === 'overview' && <Overview />}
            {activeTab === 'heatmap' && <Heatmap />} {/* <-- UPDATE THIS LINE */}
            {activeTab === 'issues-solved' && <div className="text-gray-400 font-bold text-xl">Issues Solved Component Coming Soon...</div>}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;