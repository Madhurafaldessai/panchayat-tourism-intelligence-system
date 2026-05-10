import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Login = () => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    const { data, error: dbError } = await supabase
      .from('admin_logins')
      .select('*')
      .eq('admin_id', adminId)
      .eq('password', password)
      .single();

    if (dbError || !data) {
      setError("Invalid Admin ID or Password");
    } else {
      localStorage.setItem('isAdminLoggedIn', 'true');
      localStorage.setItem('adminVillage', data.village_name);
      window.location.href = '/dashboard';
    }
  };

  return (
    // MAIN CONTAINER: Full screen, Flex-centered
    <div className="min-h-screen relative flex items-center justify-center font-sans overflow-hidden bg-gray-900 p-6">
      
      {/* BACKGROUND LAYER: Image with Reduced Whitish Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/panchayat-hero.jpg" 
          alt="Panchayat Tourism Background" 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
      </div>

      {/* FOREGROUND LAYER: The Minimized Centered Form */}
      {/* Reduced max-width from 500px to 420px */}
      <div className="relative z-15 w-full max-w-125">
        
        {/* Brutalist Form Card - Reduced padding from p-14 to p-10 */}
        <div className="w-full bg-white border-[3px] border-black p-14 lg:p-14 shadow-[10px_10px_0px_0px_#bef264] transition-all hover:-translate-y-1 hover:shadow-[14px_14px_0px_0px_#bef264] duration-300">
          
          {/* Heading - Reduced size slightly to match smaller card */}
          <h2 className="text-4xl lg:text-5xl font-serif font-black text-black text-center mb-8 tracking-tight">
            Login
          </h2>

          {/* Error Message */}
          {error && (
            <div className="bg-[#fda4af] border-[3px] border-black text-black text-sm font-bold px-4 py-3 mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-black mb-2 uppercase tracking-widest">
                Admin ID
              </label>
              {/* Inputs - Slightly tighter padding to fit the minimized form */}
              <input 
                type="text" 
                placeholder="Enter your Admin ID"
                className="w-full px-5 py-4 bg-white border-[3px] border-black text-black placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] transition-shadow text-sm font-bold rounded-none"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black mb-2 uppercase tracking-widest">
                Password
              </label>
              <input 
                type="password" 
                placeholder="Enter your password"
                className="w-full px-5 py-4 bg-white border-[3px] border-black text-black placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] transition-shadow text-sm font-bold rounded-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Brutalist Button */}
            <button 
              type="submit" 
              className="w-full bg-[#111] text-white font-black py-5 border-[3px] border-black hover:bg-[#bef264] hover:text-black hover:shadow-[6px_6px_0px_0px_#000] transition-all mt-8 text-base tracking-widest uppercase rounded-none"
            >
              Access Portal
            </button>
          </form>
          
          {/* Register Link */}
          <div className="mt-8 text-center text-xs font-medium text-gray-600">
            <span>Don't have an account? </span>
            <a href="#" className="text-black font-black border-b-2 border-black hover:bg-[#bef264] transition-colors px-1 pb-0.5 ml-1">
              Register Now
            </a>
          </div>

        </div>
      </div>
      
    </div>
  );
};

export default Login;