import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const isAdmin = (user) => user?.app_metadata?.role === 'admin';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        setSession(data.session);
        setLoading(false);
      }
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6 font-sans text-black">
        <section className="max-w-xl border-[3px] border-black bg-white p-8 shadow-[8px_8px_0_0_#bef264]">
          <h1 className="font-serif text-3xl font-black">Configuration required</h1>
          <p className="mt-4 leading-7">
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to a local
            <code> .env.local</code> file or your deployment environment. See <code>.env.example</code>.
          </p>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 font-semibold text-emerald-900">
        Verifying Admin Access...
      </div>
    );
  }

  return (
    <Router basename="/panchayat-tourism-intelligence-system">
      <Routes>
        <Route
          path="/login"
          element={isAdmin(session?.user) ? <Navigate replace to="/dashboard" /> : <Login />}
        />
        <Route
          path="/dashboard"
          element={
            isAdmin(session?.user) ? (
              <Dashboard user={session.user} />
            ) : (
              <Navigate replace to="/login" />
            )
          }
        />
        <Route path="/" element={<Navigate replace to="/login" />} />
        <Route path="*" element={<Navigate replace to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
