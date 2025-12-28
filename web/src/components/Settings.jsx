import { useState } from "react";
import { 
  FiLogOut, FiArrowUpCircle, FiMoon, FiSun, FiUser, FiCheckCircle, 
  FiShield, FiBell, FiHeart, FiEye, FiLock, FiTrash2, FiSettings,
  FiHelpCircle, FiMail, FiPhone, FiMapPin, FiVolume2, FiVolumeX,
  FiChevronRight, FiInfo, FiStar, FiGift, FiDollarSign
} from "react-icons/fi";
import ProfileVerificationModal from "./ProfileVerificationModal";

import { deleteAccount } from '../api';

export default function Settings({ onLogout, onUpgrade, isDark, onToggleDark, giftSoundsEnabled = true, onToggleGiftSounds, onRerunSetup, onNavigate }) {

  const [user, setUser] = useState({ verified: false });
  const [showVerify, setShowVerify] = useState(false);
  const [notifications, setNotifications] = useState({
    matches: true,
    messages: true,
    likes: true,
    marketing: false
  });
  const [privacy, setPrivacy] = useState({
    showAge: true,
    showDistance: true,
    showOnline: true
  });

  const handleNotificationToggle = (type) => {
    setNotifications(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handlePrivacyToggle = (type) => {
    setPrivacy(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
              <FiSettings className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Account & Premium Section */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiStar className="text-purple-500" />
                Account & Premium
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <button
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white transition-all duration-200 transform hover:scale-105"
                onClick={onUpgrade}
              >
                <div className="flex items-center gap-3">
                  <FiArrowUpCircle className="text-xl" />
                  <span className="font-semibold">Upgrade to Premium</span>
                </div>
                <FiChevronRight />
              </button>

              <button
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-blue-50 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors"
                onClick={() => setShowVerify(true)}
              >
                <div className="flex items-center gap-3">
                  <FiCheckCircle className="text-blue-600 dark:text-blue-400 text-xl" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {user.verified ? "Profile Verified" : "Verify Profile"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user.verified ? "Your profile is verified" : "Increase your credibility"}
                    </div>
                  </div>
                </div>
                {user.verified ? (
                  <span className="bg-green-500 text-white rounded-full px-3 py-1 text-xs font-bold">
                    ✓ Verified
                  </span>
                ) : (
                  <FiChevronRight className="text-gray-400" />
                )}
              </button>

              <button
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                onClick={() => onRerunSetup && onRerunSetup()}
              >
                <div className="flex items-center gap-3">
                  <FiUser className="text-indigo-600 dark:text-indigo-400 text-xl" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">Re-run Profile Setup</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Update your profile information</div>
                  </div>
                </div>
                <FiChevronRight className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Earnings & Bank Account Section */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiDollarSign className="text-green-500" />
                Earnings & Bank Account
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3 mb-3">
                  <FiGift className="text-green-600 dark:text-green-400 text-xl mt-1" />
                  <div>
                    <div className="font-semibold text-green-900 dark:text-green-100">Earn from Gifts</div>
                    <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Receive 70% of gift values directly to your bank account!
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-200 transform hover:scale-105"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('earnings');
                  } else {
                    alert('Earnings dashboard coming soon! This will show your gift earnings and bank account setup.');
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <FiDollarSign className="text-xl" />
                  <span className="font-semibold">View Earnings & Setup Bank</span>
                </div>
                <FiChevronRight />
              </button>

              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Set up your bank account to start receiving earnings from gifts
              </div>
            </div>
          </div>

          {/* Privacy & Security Section */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiShield className="text-green-500" />
                Privacy & Security
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-700">
                <div className="flex items-center gap-3">
                  <FiEye className="text-gray-600 dark:text-gray-400 text-xl" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Show Age</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Display your age on profile</div>
                  </div>
                </div>
                <button
                  onClick={() => handlePrivacyToggle('showAge')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    privacy.showAge ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    privacy.showAge ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-700">
                <div className="flex items-center gap-3">
                  <FiMapPin className="text-gray-600 dark:text-gray-400 text-xl" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Show Distance</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Display distance to matches</div>
                  </div>
                </div>
                <button
                  onClick={() => handlePrivacyToggle('showDistance')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    privacy.showDistance ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    privacy.showDistance ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Show Online Status</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Let others see when you're online</div>
                  </div>
                </div>
                <button
                  onClick={() => handlePrivacyToggle('showOnline')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    privacy.showOnline ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    privacy.showOnline ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiBell className="text-blue-500" />
                Notifications
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-700">
                <div className="flex items-center gap-3">
                  <FiHeart className="text-pink-500 text-xl" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">New Matches</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Get notified about new matches</div>
                  </div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('matches')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications.matches ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications.matches ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-700">
                <div className="flex items-center gap-3">
                  <FiMail className="text-blue-500 text-xl" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Messages</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Get notified about new messages</div>
                  </div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('messages')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications.messages ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications.messages ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-700">
                <div className="flex items-center gap-3">
                  <FiStar className="text-yellow-500 text-xl" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Likes</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Get notified when someone likes you</div>
                  </div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('likes')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications.likes ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications.likes ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* App Preferences Section */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiSettings className="text-gray-500" />
                App Preferences
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-700">
                <div className="flex items-center gap-3">
                  {isDark ? <FiSun className="text-yellow-500 text-xl" /> : <FiMoon className="text-indigo-500 text-xl" />}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Dark Mode</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {isDark ? "Switch to light theme" : "Switch to dark theme"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onToggleDark}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    isDark ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    isDark ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-700">
                <div className="flex items-center gap-3">
                  {giftSoundsEnabled ? <FiVolume2 className="text-green-500 text-xl" /> : <FiVolumeX className="text-gray-500 text-xl" />}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Gift Sounds</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Play sounds when receiving gifts</div>
                  </div>
                </div>
                <button
                  onClick={() => onToggleGiftSounds && onToggleGiftSounds()}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    giftSoundsEnabled ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    giftSoundsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Support & Help Section */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden lg:col-span-2">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiHelpCircle className="text-orange-500" />
                Support & Help
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                  <FiHelpCircle className="text-blue-500 text-xl" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">Help Center</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Get answers to common questions</div>
                  </div>
                </button>

                <button className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                  <FiMail className="text-green-500 text-xl" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">Contact Support</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Send us a message</div>
                  </div>
                </button>

                <button className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                  <FiInfo className="text-purple-500 text-xl" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">About ShebaLove</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">App version & info</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-red-200 dark:border-red-800 overflow-hidden lg:col-span-2">
            <div className="p-6 border-b border-red-200 dark:border-red-800">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                <FiTrash2 className="text-red-500" />
                Danger Zone
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  className="flex items-center justify-between p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 transition-colors"
                  onClick={onLogout}
                >
                  <div className="flex items-center gap-3">
                    <FiLogOut className="text-red-600 dark:text-red-400 text-xl" />
                    <div className="text-left">
                      <div className="font-medium text-red-600 dark:text-red-400">Log Out</div>
                      <div className="text-sm text-red-500 dark:text-red-500">Sign out of your account</div>
                    </div>
                  </div>
                  <FiChevronRight className="text-red-400" />
                </button>

                <button
                  className="flex items-center justify-between p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 transition-colors"
                  onClick={async () => {
                    if (!window.confirm('⚠️ This will permanently delete your account and all data. This action cannot be undone. Are you sure?')) return;
                    if (!window.confirm('This is your final warning. Your account will be permanently deleted. Continue?')) return;
                    try {
                      await deleteAccount();
                      onLogout && onLogout();
                    } catch (e) {
                      const detail = e?.response?.data || e?.message || 'Failed to delete account';
                      window.alert(typeof detail === 'string' ? detail : JSON.stringify(detail));
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <FiTrash2 className="text-red-600 dark:text-red-400 text-xl" />
                    <div className="text-left">
                      <div className="font-medium text-red-600 dark:text-red-400">Delete Account</div>
                      <div className="text-sm text-red-500 dark:text-red-500">Permanently delete your account</div>
                    </div>
                  </div>
                  <FiChevronRight className="text-red-400" />
                </button>
              </div>
            </div>
          </div>
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