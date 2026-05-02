import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const Overview = () => {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({ urgent: 0, unassigned: 0, resolved: 0 });
  const villageName = localStorage.getItem('adminVillage') || 'Balli';

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

  return (
    <div className="w-full max-w-6xl mx-auto bg-[#d9e8db] animate-fade-in">
       
      {/* 3 Stat Cards - Glassmorphism UI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-11">
        {/* Card 1 */}
        <div className="bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-xl shadow-black/5 flex flex-col justify-between transition-all">
          <div className="w-8 h-8 bg-red-50 text-red-400 rounded-lg flex items-center justify-center mb-6 text-sm shadow-sm">🛡️</div>
          <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1">Urgent Action</p>
          <h2 className="text-4xl font-black text-gray-900">{stats.urgent}</h2>
        </div>

        {/* Card 2 */}
        <div className="bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-xl shadow-black/5 flex flex-col justify-between transition-all">
          <div className="w-8 h-8 bg-orange-50 text-orange-400 rounded-lg flex items-center justify-center mb-6 text-sm shadow-sm">🕒</div>
          <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1">Unassigned</p>
          <h2 className="text-4xl font-black text-gray-900">{stats.unassigned}</h2>
        </div>

        {/* Card 3 */}
        <div className="bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-xl shadow-black/5 flex flex-col justify-between transition-all">
          <div className="w-8 h-8 bg-emerald-50 text-emerald-400 rounded-lg flex items-center justify-center mb-6 text-sm shadow-sm">✓</div>
          <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1">Resolved</p>
          <h2 className="text-4xl font-black text-[#2ca469]">{stats.resolved}</h2>
        </div>
      </div>

      {/* Issue Action Registry Table - Glassmorphism UI */}
      <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2rem] border border-white/60 shadow-xl shadow-black/5">
        <h3 className="text-lg font-extrabold text-gray-900 mb-8 tracking-tight">Issue Action Registry</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] text-gray-500 uppercase tracking-widest border-b border-gray-300/50">
                <th className="pb-4 font-bold">Citizen</th>
                <th className="pb-4 font-bold">Issue Type</th>
                <th className="pb-4 font-bold">Status</th>
                <th className="pb-4 font-bold">Official Proof</th>
                <th className="pb-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {issues.length > 0 ? issues.map((issue) => (
                <tr key={issue.id} className="border-b border-gray-300/30 last:border-0 hover:bg-white/40 transition-colors">
                  <td className="py-5 font-bold text-gray-800 text-xs">{issue.citizen_name || 'Madhura S.'}</td>
                  <td className="py-5 font-bold text-gray-700 text-xs flex items-center gap-2">
                    <span className="text-gray-400 text-lg">📁</span> {issue.type}
                  </td>
                  <td className="py-5">
                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      issue.status === 'resolved' ? 'bg-emerald-50 text-[#2ca469]' : 
                      issue.status === 'urgent' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'
                    }`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="py-5">
                    <button className="px-3 py-1.5 bg-emerald-50 text-[#2ca469] rounded-full text-[9px] font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors uppercase tracking-wider">
                      <span>👁️</span> View Photo
                    </button>
                  </td>
                  <td className="py-5 text-right">
                    <button className="w-8 h-8 bg-white/60 hover:bg-white rounded-full items-center justify-center transition-colors inline-flex text-gray-500 text-xs shadow-sm">
                      ⚙️
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">
                    No issues registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;