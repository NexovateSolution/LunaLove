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
      alert("Google login failed: No credential received.");
      return;
    }
    try {
      const res = await fetch('/api/auth/google/', { // This endpoint handles both signup and login
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: credentialResponse.credential }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Server returned an invalid response.' }));
        throw new Error(errorData.error || 'Google login failed on the server.');
      }
      const data = await res.json();
      if (onContinue) {
        onContinue(data.user, data.token);
      }
    } catch (error) {
      console.error('Google login process failed:', error);
      setError(error.message);
      alert(`Login with Google failed: ${error.message}`);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed on the client.');
    alert('Google login failed. Please try again.');
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
          text="signin_with" // Key change: Use 'Sign in with Google'
        />
        <button type="button" className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-[#1877F2] text-white font-semibold hover:bg-[#166fe5] transition-colors">
          <FaFacebook className="w-6 h-6" />
          <span className="font-semibold">Sign in with Facebook</span>
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

      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        Don't have an account? <button onClick={onSignup} className="font-medium text-primary hover:underline">Sign Up</button>
      </p>
    </div>
  );
}