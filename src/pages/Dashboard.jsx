import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/layout/Sidebar';
import Overview from '../components/dashboard/Overview';

const Heatmap = lazy(() => import('../components/dashboard/Heatmap'));

const MapLoading = () => (
  <div className="flex h-full min-h-80 items-center justify-center border-2 border-black bg-gray-100 p-6 text-center text-sm font-bold uppercase tracking-widest">
    Loading map…
  </div>
);

const Dashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const villageName = user.app_metadata?.village_name || user.user_metadata?.village_name || 'Panchayat';
  const villageId = user.app_metadata?.village_id;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white font-sans text-black selection:bg-black selection:text-white lg:flex-row">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main className="flex min-w-0 flex-1 flex-col bg-white">
        <header className="shrink-0 bg-[#111] px-6 pb-28 pt-10 text-white md:px-12 md:pt-16 lg:px-16 lg:pb-36">
          <div className="flex items-center justify-between gap-6">
            <h1 className="text-3xl font-serif font-bold tracking-tight capitalize md:text-5xl lg:text-6xl">
              {villageName} Panchayat
            </h1>
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black bg-[#fef08a] text-xl font-bold text-black shadow-[2px_2px_0_0_rgba(255,255,255,1)]"
              aria-label={`${villageName} administrator`}
            >
              {villageName[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <div className="relative z-10 -mt-16 w-full flex-1 px-4 pb-12 md:-mt-20 md:px-8 lg:px-12">
          {activeTab === 'overview' && <Overview setActiveTab={setActiveTab} villageId={villageId} />}

          {activeTab === 'heatmap' && (
            <section className="relative z-20 mt-8 h-[70vh] min-h-105 w-full bg-white p-2 shadow-[12px_12px_0_0_#000]">
              <Suspense fallback={<MapLoading />}>
                <Heatmap villageId={villageId} />
              </Suspense>
            </section>
          )}

          {activeTab === 'issues-solved' && (
            <section className="mt-8 border-[3px] border-black bg-white p-8 text-xl font-bold text-black shadow-[8px_8px_0_0_#000]">
              Analytics is being connected to the reporting pipeline.
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
