import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import panchayatHero from '../assets/panchayat-hero.jpg';

const Login = () => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Note: Since you're using 'Admin ID', you'll likely check this 
    // against a specific 'admins' table in Supabase or use email-based auth.
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminId, // Assuming Admin ID is used as the identifier
      password: password,
    });

    if (error) {
      alert(error.message);
    } else {
      console.log('Login successful:', data);
      // Redirect logic will go here
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side: Illustration */}
      <div className="hidden lg:flex w-1/2 bg-[#f0f9f6] items-center justify-center p-12">
        <div className="relative w-full max-w-lg">
          <img 
            src={panchayatHero} 
            alt="Panchayat Illustration" 
            className="rounded-3xl shadow-sm object-contain"
          />
        </div>
      </div>

      {/* Right Side: Admin Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-24 lg:px-32">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Log in</h2>
          <p className="text-gray-500 mb-8 text-sm">Panchayat Tourism Intelligence System — Admin Portal</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin ID</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter your admin ID"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3d4451] text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200"
            >
              {loading ? 'Authenticating...' : 'Log in'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <a href="#" className="text-sm text-emerald-600 hover:underline">Forgot login or password?</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;