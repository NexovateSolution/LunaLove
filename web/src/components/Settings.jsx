import { useState } from "react";
import { FiLogOut, FiArrowUpCircle, FiMoon, FiUser, FiCheckCircle } from "react-icons/fi";
import ProfileVerificationModal from "./ProfileVerificationModal";

export default function Settings({ onLogout, onUpgrade, isDark, onToggleDark }) {
  // Replace with your actual user state or user context
  const [user, setUser] = useState({ verified: false });
  const [showVerify, setShowVerify] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center py-10 px-4
        bg-gradient-to-br from-pink-100 via-fuchsia-100 to-purple-200
        dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
    >
      <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 rounded-3xl shadow-2xl p-8 border border-fuchsia-100 dark:border-fuchsia-900">
        <h2 className="text-2xl font-bold text-fuchsia-700 mb-8 flex items-center gap-2">
          <FiUser className="text-fuchsia-400" /> Settings
        </h2>
        <div className="flex flex-col gap-4">
          <button
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-fuchsia-50 dark:bg-gray-800 text-fuchsia-700 dark:text-fuchsia-200 font-semibold shadow hover:bg-fuchsia-100 transition"
            onClick={onUpgrade}
          >
            <FiArrowUpCircle className="text-xl" />
            Upgrade to Premium
          </button>

          <button
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-blue-200 font-semibold shadow hover:bg-blue-100 transition"
            onClick={() => setShowVerify(true)}
          >
            <FiCheckCircle className="text-xl" />
            {user.verified ? "Profile Verified" : "Verify Profile"}
            {user.verified && (
              <span className="ml-2 bg-green-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                Verified
              </span>
            )}
          </button>

          <button
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-50 dark:bg-gray-800 text-yellow-700 dark:text-yellow-200 font-semibold shadow hover:bg-yellow-100 transition"
            onClick={onToggleDark}
          >
            <FiMoon className="text-xl" />
            {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
          <button
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-gray-800 text-red-600 dark:text-red-300 font-semibold shadow hover:bg-red-100 transition"
            onClick={onLogout}
          >
            <FiLogOut className="text-xl" />
            Log Out
          </button>
        </div>
      </div>
      {/* Profile Verification Modal */}
      <ProfileVerificationModal
        open={showVerify}
        onClose={() => setShowVerify(false)}
        onVerified={() => setUser(u => ({ ...u, verified: true }))}
      />
    </div>
  );
}