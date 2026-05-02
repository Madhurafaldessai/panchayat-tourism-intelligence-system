import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  // We use a boolean state since we are manually managing the login via our custom table
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage to see if the user successfully logged in through our table
    const checkLoginStatus = () => {
      const authStatus = localStorage.getItem('isAdminLoggedIn') === 'true';
      setIsLoggedIn(authStatus);
      setLoading(false);
    };

    checkLoginStatus();

    // Optional: Listen for storage changes in case the user logs out in another tab
    window.addEventListener('storage', checkLoginStatus);
    return () => window.removeEventListener('storage', checkLoginStatus);
  }, []);

  // Simple loading screen to prevent flickering while checking localStorage
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-emerald-900 font-semibold">
        Verifying Admin Access...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* If not logged in, show Login page. If already logged in, skip to Dashboard */}
        <Route 
          path="/login" 
          element={!isLoggedIn ? <Login /> : <Navigate to="/dashboard" />} 
        />
        
        {/* Protected Dashboard Route: Redirects to login if the flag isn't in localStorage */}
        <Route 
          path="/dashboard" 
          element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} 
        />

        {/* Default Route sends everyone to login check */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;