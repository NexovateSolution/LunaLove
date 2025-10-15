import { FiUser, FiMail, FiLock, FiLoader, FiEye, FiEyeOff } from "react-icons/fi";
import { FaFacebook } from "react-icons/fa";
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';

export default function Login({ onSignup, onContinue }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) {
      console.error("Google login succeeded but did not provide a credential.");
      setError("Google login failed: No credential received.");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Sending Google credential to backend...');
      const res = await fetch('/api/auth/google/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // Include cookies for CORS
        body: JSON.stringify({ id_token: credentialResponse.credential }),
      });
      
      console.log('Backend response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ 
          error: `Server error ${res.status}: ${res.statusText}` 
        }));
        console.error('Backend error response:', errorData);
        throw new Error(errorData.error || errorData.detail || 'Google login failed on the server.');
      }
      
      const data = await res.json();
      console.log('Google login successful:', data);
      
      if (onContinue) {
        onContinue(data.user, data.token);
      }
    } catch (error) {
      console.error('Google login process failed:', error);
      setError(`Google login failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = async () => {
    try {
      const res = await fetch('/api/dev/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Dev login not allowed. Enable DEBUG or bypass flags.' }));
        throw new Error(err.error || 'Dev login failed');
      }
      const data = await res.json();
      onContinue && onContinue(data.user, data.token);
    } catch (e) {
      console.error('Dev login failed:', e);
      alert(`Dev login failed: ${e.message}`);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google login failed on the client:', error);
    setError('Google login failed. Please try again or use Dev Login for testing.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || 'Invalid credentials.');
      }

      const data = await res.json();
      if (onContinue) {
        onContinue(data.user, data.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back!</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in to continue your journey.</p>
      </div>

      <div className="space-y-4">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          shape="rectangular"
          theme="outline"
          size="large"
          logo_alignment="left"
          text="signin_with"
          useOneTap={false} // Disable one-tap to avoid origin issues
          auto_select={false} // Disable auto-select
          cancel_on_tap_outside={false}
          itp_support={true}
        />
        <button type="button" className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-[#1877F2] text-white font-semibold hover:bg-[#166fe5] transition-colors">
          <FaFacebook className="w-6 h-6" />
          <span className="font-semibold">Sign in with Facebook</span>
        </button>
        <button type="button" onClick={handleDevLogin} className="w-full py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          Dev Login (Bypass)
        </button>
      </div>

      <div className="flex items-center justify-center space-x-2">
        <hr className="w-full border-gray-300 dark:border-gray-600" />
        <span className="px-2 text-sm text-gray-500 dark:text-gray-400">OR</span>
        <hr className="w-full border-gray-300 dark:border-gray-600" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <FiMail className="absolute inset-y-0 left-3 my-auto w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <FiLock className="absolute inset-y-0 left-3 my-auto w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <div>
          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
            {isLoading ? <FiLoader className="animate-spin w-5 h-5" /> : 'Sign In'}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">OR</span>
        </div>
      </div>

      {/* Google Login */}
      <div className="space-y-3">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          shape="rectangular"
          theme="outline"
          size="large"
          logo_alignment="left"
          text="signin_with"
          useOneTap={false}
          auto_select={false}
          cancel_on_tap_outside={false}
          itp_support={true}
        />
        
        <button 
          type="button" 
          className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <FaFacebook className="w-5 h-5 text-[#1877F2]" />
          <span>Continue with Facebook</span>
        </button>
      </div>

      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        Don't have an account? <button onClick={onSignup} className="font-medium text-primary hover:underline">Sign Up</button>
      </p>
    </div>
  );
}