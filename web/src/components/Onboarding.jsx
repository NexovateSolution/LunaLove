import { useEffect, useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import { FaHeart } from "react-icons/fa"; // For a heart spinner

export default function Onboarding({ onFinish }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for 2.5s
    const t = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-fuchsia-100 to-purple-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center">
          <FaHeart className="animate-bounce text-pink-500" size={64} />
          <div className="mt-6 text-xl font-bold text-primary animate-pulse">Loading Shebalove...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-fuchsia-100 to-purple-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 border border-primary flex flex-col items-center">
        {/* Logo or Illustration */}
        <img src="/logo.svg" alt="Shebalove" className="w-20 h-20 mb-6" />
        <h1 className="text-3xl font-bold text-primary mb-2 text-center">
          Welcome to Shebalove!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8 text-lg">
          Discover new friends, meaningful connections, and maybe even love. Let’s get started!
        </p>
        {/* Cute illustration (optional) */}
        <img
          src="/onboarding-illustration.svg"
          alt="Onboarding"
          className="w-40 h-40 mb-8"
          onError={e => (e.target.style.display = 'none')}
        />
        <button
          className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-bold shadow hover:bg-primary-dark transition text-lg"
          onClick={onFinish}
        >
          Get Started <FiChevronRight size={22} />
        </button>
      </div>
    </div>
  );
}