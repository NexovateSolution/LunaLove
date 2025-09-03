import React from "react";

export default function SplashScreen({ onNext }) {
  React.useEffect(() => {
    const timer = setTimeout(onNext, 1800);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-400 to-fuchsia-600 dark:from-gray-800 dark:to-gray-900 transition-all">
      <img src="/logo192.png" alt="Shebalove Logo" className="w-24 h-24 mb-6 rounded-full shadow-lg" />
      <h1 className="text-4xl font-bold text-white mb-2 tracking-wide">Shebalove</h1>
      <p className="text-lg text-white opacity-80 mb-8">Find your vibe. Match. Chat. Gift. Love.</p>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
    </div>
  );
}