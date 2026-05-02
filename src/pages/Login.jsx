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
    // MAIN CONTAINER: Deep Green background
    <div className="min-h-screen bg-linear-to-t from-neutral-900 to-green-900 bg-opacity-75 flex font-sans overflow-hidden">
      
      {/* LEFT COLUMN: Shrunk to 38% width to push everything leftward */}
      <div className="hidden md:flex w-[38%] bg-white p-10 flex-col justify-center items-center md:rounded-r-[15rem] relative">
        
        {/* Central Illustration Area */}
        <div className="flex-1 w-full flex items-center justify-center relative mt-8">
          
          {/* Organic Teal Blob Frame */}
           <div
            className="w-full max-w-125 aspect-square bg-[#e2fde4] flex items-center justify-center p- shadow-inner group transition-all"
            style={{ borderRadius: '24% 76% 67% 35% / 40% 33% 69% 56%' }}
            >
            {/* Panchayat Image - mix-blend-multiply removes the white box */}
            <img 
              src="/panchayat-hero.jpg" 
              alt="Panchayat" 
              className="w-full h-full object-contain mix-blend-multiply opacity-95 group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          
          {/* Decorative floating circles */}
          <div className="absolute top-10 right-16 w-20 h-20  bg-[#d4e9e4]/40 rounded-full"></div>
          <div className="absolute top-1/4 left-10 w-10 h-10 bg-[#d4e9e4]/50 rounded-full"></div>
          <div className="absolute bottom-1/4 right-20 w-8 h-8 bg-[#d4e9e4]/30 rounded-full"></div>
          <div className="absolute bottom-1/4 right-20 w-8 h-8 bg-[#d4e9e4]/30 rounded-full"></div>
        </div>

        {/* Bottom copyright aligned left */}
        <div className="text-[10px] text-[#050e0b] font-medium mt-auto w-full text-left pl-6">
          <span>© 2026 Panchayat Tourism System</span><br/>
          <span>Admin Portal</span>
        </div>

      </div>

      {/* RIGHT COLUMN: Expanded to 62% width to give the larger form room */}
      {/* Added lg:pr-24 to subtly anchor it slightly left-of-center within its large space */}
      <div className="w-full md:w-[62%] flex flex-col items-center justify-center p-12 lg:p-20 lg:pr-32 relative">
        
        {/* Form Container - Increased max-width from 400px to 500px for a significantly larger form */}
        <div className="w-full max-w-125">
          
          {/* Heading - Increased to 5xl */}
          <h2 className="text-5xl font-bold text-white text-left mb-12 tracking-tight">Login</h2>

          {error && (
            <div className="bg-red-50 text-red-500 text-sm font-bold px-4 py-3 rounded-xl mb-6 text-center border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              {/* Labels - Increased to text-sm */}
              <label className="block text-sm font-bold text-white mb-3 ml-5 uppercase tracking-widest">
                Admin ID
              </label>
              {/* Inputs - Increased padding (py-5) and text size (text-base) */}
              <input 
                type="text" 
                placeholder="Enter your Admin ID"
                className="w-full px-8 py-8 rounded-full border border-[#031708] shadow-xl/30 bg-[#c3d9cf] text-black placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all text-base font-medium shadow-inner"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-3 ml-5 uppercase tracking-widest">
                Password
              </label>
              <input 
                type="password" 
                placeholder="Enter your password"
                className="w-full px-8 py-8 rounded-full border border-[#031708] shadow-xl/30 bg-[#c3d9cf] text-black placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all text-base font-large shadow-inner"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>


            {/* Button - Increased padding (py-5) and text size (text-lg) */}
            <button 
              type="submit" 
              className="w-full bg-[#0e9f3f] text-white font-extrabold py-8 rounded-full hover:bg-white hover:text-[#274B3C] transition-all shadow-lg shadow-black/10 mt-8 text-2xl tracking-wide"
            >
              Login
            </button>
          </form>
          
          <div className="mt-10 text-center text-base">
            <span className="text-gray-300">Don't have an account? </span>
            <a href="#" className="text-white hover:text-[#62B5B1] font-bold transition-colors">Register Now</a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;