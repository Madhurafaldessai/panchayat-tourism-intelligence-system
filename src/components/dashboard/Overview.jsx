import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import Heatmap from './Heatmap'; // Imported the Heatmap for the right side

const Overview = () => {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({ urgent: 0, unassigned: 0, resolved: 0 });

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    const { data } = await supabase.from('issues').select('*');
    if (data) {
      setIssues(data);
      setStats({
        urgent: data.filter(i => i.status === 'urgent').length,
        unassigned: data.filter(i => i.status === 'pending').length,
        resolved: data.filter(i => i.status === 'resolved').length
      });
    }
  };

  // Mock data for the right-side blue box
  const weeklyData = [40, 70, 45, 90, 65, 80, 55];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    // A simple flex wrapper to hold your left side and the new right side side-by-side
    <div className="flex gap-8 items-start w-full">
      
      {/* ======================================================= */}
      {/* LEFT SIDE: YOUR EXACT CODE, COMPLETELY UNTOUCHED        */}
      {/* ======================================================= */}
      <div className="w-full max-w-6xl animate-fade-in font-sans">
        
        {/* 3 Neo-Brutalist Stat Cards Overlapping the Black Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          {/* Card 1: Urgent Action (Red) */}
          <div className="bg-white border-2 border-black p-6 rounded-md flex flex-col h-48 w-70 shadow-[6px_6px_0px_0px_#fca5a5] transition-transform hover:-translate-y-1 hover:shadow-[6px_10px_0px_0px_#fca5a5]">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-md font-medium text-gray-800">Urgent Action</h3>
            </div>
            {/* Real data injected here */}
            <h2 className="text-5xl font-serif font-black flex items-end gap-1">
              <span className="text-2xl mb-1"></span>{stats.urgent}
            </h2>
            
            {/* Spiking line graph visual */}
            <div className="mt-auto h-16 bg-[#fca5a5]/30 relative border-t-2 border-black overflow-hidden border-x-2 border-b-2">
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000020_1px,transparent_1px),linear-gradient(to_bottom,#00000020_1px,transparent_1px)] bg-size-[10px_10px]"></div>
               <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                 <polyline points="0,100 20,80 40,85 60,50 80,40 100,10" fill="none" stroke="black" strokeWidth="3" />
               </svg>
            </div>
          </div>

          {/* Card 2: Unassigned Tasks (Yellow) */}
          <div className="bg-white border-2 border-black p-6 flex flex-col h-48 w-70 rounded-md shadow-[6px_6px_0px_0px_#fde047] transition-transform hover:-translate-y-1 hover:shadow-[6px_10px_0px_0px_#fde047]">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-md font-medium text-gray-800">Unassigned Tasks</h3>
            </div>
            {/* Real data injected here */}
            <h2 className="text-5xl font-serif font-black">{stats.unassigned}</h2>
            
            {/* Bar chart visual */}
            <div className="mt-auto flex gap-1 items-end h-8">
              <div className="w-1/4 h-full bg-[#facc15] border-2 border-black"></div>
              <div className="w-1/4 h-3/4 bg-[#facc15] border-2 border-black"></div>
              <div className="w-1/2 border-b-2 border-dashed border-gray-300 h-1/2"></div>
            </div>
          </div>

          {/* Card 3: Solved Issues (Green) */}
          <div className="bg-white border-2 border-black p-6 flex flex-col rounded-md h-48 w-70 shadow-[6px_6px_0px_0px_#bef264] transition-transform hover:-translate-y-1 hover:shadow-[6px_10px_0px_0px_#bef264]">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-md font-medium text-gray-800">Solved Issues</h3>
            </div>
            {/* Real data injected here */}
            <h2 className="text-5xl font-serif font-black flex items-end gap-1">
              <span className="text-2xl mb-1"></span>{stats.resolved}
            </h2>
            
            {/* Rising line graph visual */}
            <div className="mt-auto h-16 bg-[#bef264]/30 relative border-t-2 border-black overflow-hidden border-x-2 border-b-2">
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000020_1px,transparent_1px),linear-gradient(to_bottom,#00000020_1px,transparent_1px)] bg-size-[10px_10px]"></div>
               <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                 <polyline points="0,100 30,70 50,75 80,30 100,0" fill="none" stroke="black" strokeWidth="3" />
               </svg>
            </div>
          </div>

        </div>

        {/* The Issue Registry Table */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-3xl font-serif font-bold text-black">Issue Registry</h2>
            <span className="text-sm font-medium text-gray-600">Sort by: <span className="text-black font-bold border-b border-black cursor-pointer">Status</span></span>
          </div>
          
          <div className="w-full">
            <table className="w-full text-left">
              <tbody className="text-sm">
                {issues.length > 0 ? issues.map((issue) => (
                  <tr key={issue.id} className="border-t-2 border-black hover:bg-gray-50 transition-colors group">
                    
                    {/* Grip dots & Avatar mock */}
                    <td className="py-4 pl-4 w-16">
                      <div className="grid grid-cols-2 gap-0.5 w-3 opacity-30 group-hover:opacity-100 transition-opacity">
                        <div className="w-1 h-1 bg-black rounded-full"></div><div className="w-1 h-1 bg-black rounded-full"></div>
                        <div className="w-1 h-1 bg-black rounded-full"></div><div className="w-1 h-1 bg-black rounded-full"></div>
                        <div className="w-1 h-1 bg-black rounded-full"></div><div className="w-1 h-1 bg-black rounded-full"></div>
                      </div>
                    </td>
                    
                    <td className="py-4 font-bold text-black flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#f22f2f] border border-black flex items-center justify-center text-xs">👤</div>
                      {issue.citizen_name || 'Citizen User'}
                    </td>

                    <td className="py-4">
                      <div className="font-bold text-black">{issue.type}</div>
                      <div className="text-gray-500 text-xs">Issue Type</div>
                    </td>

                    <td className="py-4">
                      <div className="font-bold text-black text-xs uppercase tracking-wider">{issue.status}</div>
                      <div className="text-gray-500 text-xs">Current Status</div>
                    </td>

                    <td className="py-4 text-right pr-4">
                      <button className="bg-white border-2 border-black px-4 py-1.5 font-bold text-xs hover:bg-black hover:text-white transition-colors">
                        View Action
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr className="border-t-2 border-b-2 border-black">
                    <td colSpan="5" className="py-12 text-center text-gray-500 font-bold uppercase tracking-widest text-sm">
                      No issues registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="w-full border-t-2 border-black"></div>
          </div>
        </div>

      </div>

      {/* ======================================================= */}
      {/* RIGHT SIDE: HEATMAP & ANALYTICS                       */}
      {/* ======================================================= */}
      <div className="hidden xl:flex w-40 shrink-0 flex-col">
        
        {/* GREEN BOX: Heatmap 
            Using h-48 and mb-16 to perfectly parallel the 3 cards on the left
        */}
        <div className="bg-white border-2 border-black p-3 h-110 w-150 shadow-[6px_6px_0px_0px_#4ade80] flex flex-col rounded-md mb-16">
          <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-xs font-black text-black tracking-widest uppercase">Live Heatmap</h3>
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-black"></span>
          </div>
          <div className="flex-1 relative border-2 border-black bg-gray-100 z-10 w-full overflow-hidden">
            <Heatmap />
          </div>
        </div>

        {/* BLUE BOX: Analytics Chart */}
        <div className="bg-white border-2 border-black p-5 h-110 w-150 shadow-[6px_6px_0px_0px_#3b82f6] flex flex-col rounded-md">
          <div className="mb-4">
             <h3 className="text-sm font-black text-black tracking-widest uppercase mb-1">Weekly Reports</h3>
             <p className="text-[10px] font-bold text-gray-500 uppercase">+14% vs last week</p>
          </div>
          
          {/* Brutalist Bar Chart Mock */}
          <div className="flex-1 flex items-end gap-2.5 border-b-2 border-l-2 border-black pt-4 pl-2 relative w-full">
            <div className="absolute w-full border-t border-dashed border-gray-300 top-1/4 left-0 z-0"></div>
            <div className="absolute w-full border-t border-dashed border-gray-300 top-2/4 left-0 z-0"></div>
            <div className="absolute w-full border-t border-dashed border-gray-300 top-3/4 left-0 z-0"></div>

            {weeklyData.map((height, index) => (
              <div 
                key={index} 
                className="flex-1 bg-black hover:bg-[#3b82f6] border-2 border-black transition-colors relative z-10 group" 
                style={{ height: `${height}%` }}
              >
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white border-2 border-black px-1.5 py-0.5 text-[10px] font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                  {height}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[10px] font-black mt-3 px-1 uppercase text-black w-full">
            {days.map(day => <span key={day}>{day}</span>)}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Overview;