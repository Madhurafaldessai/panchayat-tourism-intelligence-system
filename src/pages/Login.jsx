import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Login = () => {
  const [villageName, setVillageName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const authIdentifier = `${villageName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')}@panchayat.local`;

    const { data, error: authError } =
      await supabase.auth.signInWithPassword({
        email: authIdentifier,
        password,
      });

    if (authError || !data.user) {
      setError('Invalid village name or password.');
      setIsSubmitting(false);
      return;
    }

    if (data.user.app_metadata?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('This account is not authorised for the admin portal.');
      setIsSubmitting(false);
      return;
    }

    navigate('/dashboard', { replace: true });
  };

  return (
    <main
      className="
        relative
        flex
        min-h-screen
        items-center
        justify-center
        overflow-hidden
        bg-gray-900
        p-4
        sm:p-6
        font-sans
      "
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <picture>
          <source
            srcSet={`${import.meta.env.BASE_URL}panchayat-hero.jpg`}
            type="image/jpeg"
          />

          <img
            src={`${import.meta.env.BASE_URL}panchayat-hero.jpg`}
            alt=""
            className="h-full w-full object-cover opacity-80"
            fetchPriority="high"
          />
        </picture>

        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
      </div>

      {/* Login Section */}
      <section className="relative z-10 w-full max-w-2xl">
        <div
          className="
            min-h-[800px]
            w-full
            border-[3px]
            border-black
            bg-white
            px-6
            py-10
            shadow-[8px_8px_0_0_#bef264]
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-[12px_12px_0_0_#bef264]

            sm:min-h-[700px]
            sm:px-10
            sm:py-12
            sm:shadow-[10px_10px_0_0_#bef264]
            sm:hover:shadow-[14px_14px_0_0_#bef264]

            lg:px-14
            lg:py-14
          "
        >
          {/* Heading */}
          <h1
            className="
              mb-10
              text-center
              font-serif
              text-4xl
              font-black
              tracking-tight
              text-black

              sm:mb-12
              sm:text-5xl
            "
          >
            Login
          </h1>

          {/* Error Message */}
          {error && (
            <div
              className="
                mb-6
                border-[3px]
                border-black
                bg-[#d81028]
                px-4
                py-3
                text-center
                text-sm
                font-bold
                text-black
              "
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className="space-y-7 sm:space-y-8"
          >
            {/* Village Name */}
            <div>
              <label
                htmlFor="village-name"
                className="
                  mb-2
                  block
                  text-base
                  font-black
                  uppercase
                  tracking-widest
                  text-black

                  sm:text-lg
                "
              >
                Village name
              </label>

              <input
                id="village-name"
                type="text"
                autoComplete="username"
                placeholder="Enter your village name"
                className="
                  w-full
                  rounded-none
                  border-[3px]
                  border-black
                  bg-white
                  px-4
                  py-4
                  text-sm
                  font-bold
                  text-black
                  placeholder-gray-400
                  transition-shadow
                  focus:shadow-[4px_4px_0_0_#000]
                  focus:outline-none

                  sm:px-5
                  sm:py-5
                "
                value={villageName}
                onChange={(event) =>
                  setVillageName(event.target.value)
                }
                required
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="admin-password"
                className="
                  mb-2
                  block
                  text-base
                  font-black
                  uppercase
                  tracking-widest
                  text-black

                  sm:text-lg
                "
              >
                Password
              </label>

              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="
                  w-full
                  rounded-none
                  border-[3px]
                  border-black
                  bg-white
                  px-4
                  py-4
                  text-sm
                  font-bold
                  text-black
                  placeholder-gray-400
                  transition-shadow
                  focus:shadow-[4px_4px_0_0_#000]
                  focus:outline-none

                  sm:px-5
                  sm:py-5
                "
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                mt-8
                w-full
                rounded-none
                border-[3px]
                border-black
                bg-[#111]
                py-5
                text-sm
                font-black
                uppercase
                tracking-widest
                text-white
                transition-all
                hover:bg-[#bef264]
                hover:text-black
                hover:shadow-[6px_6px_0_0_#000]
                disabled:cursor-not-allowed
                disabled:opacity-60

                sm:text-base
              "
            >
              {isSubmitting
                ? 'Signing in…'
                : 'Access Portal'}
            </button>
          </form>

          {/* Information */}
          <p
            className="
              mt-8
              text-center
              text-xs
              font-medium
              leading-relaxed
              text-gray-600

              sm:mt-10
            "
          >
            Administrator accounts are issued by the panchayat
            system administrator.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;