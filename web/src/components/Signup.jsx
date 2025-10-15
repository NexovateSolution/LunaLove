import { useState } from 'react';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { FiEye, FiEyeOff, FiUser, FiMail, FiLock, FiLoader } from 'react-icons/fi';
import { GoogleLogin } from '@react-oauth/google';

export default function Signup({ onLogin, onContinue }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    // This function remains the same, handling Google sign-in/sign-up
    if (!credentialResponse.credential) {
      console.error("Google login succeeded but did not provide a credential.");
      return;
    }
    try {
      const res = await fetch('/api/auth/google/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: credentialResponse.credential }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Google login failed on the server.');
      }
      const data = await res.json();
      if (onContinue) {
        onContinue(data.user, data.token);
      }
    } catch (error) {
      console.error('Google login process failed:', error);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      // Corrected API endpoint for registration
      const res = await fetch('/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          password2: confirmPassword
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Extract error message from backend response
        const errorMessage = Object.values(data).join(' ');
        throw new Error(errorMessage || 'Signup failed');
      }

      if (onContinue) {
        onContinue(data.user, data.token);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
        <p className="text-gray-500 dark:text-gray-400">Join the community to find your match.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700"
          required
        />
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700"
          required
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700"
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-500">
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700"
            required
          />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-500">
            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-50 flex justify-center">
          {isLoading ? <FiLoader className="animate-spin" /> : 'Create Account'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
        <div className="relative px-2 bg-white dark:bg-gray-800 text-sm text-gray-500">OR</div>
      </div>

      <div className="space-y-4">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          shape="rectangular"
          theme="outline"
          size="large"
          logo_alignment="left"
          text="signup_with"
          useOneTap={false} // Disable one-tap to avoid origin issues
          auto_select={false} // Disable auto-select
        />
        <button type="button" className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-[#1877F2] text-white font-semibold hover:bg-[#166fe5] transition-colors">
          <FaFacebook className="w-6 h-6" />
          <span>Sign up with Facebook</span>
        </button>
      </div>

      <div className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <button onClick={onLogin} className="font-semibold text-primary hover:underline">
          Login
        </button>
      </div>
    </div>
  );
}