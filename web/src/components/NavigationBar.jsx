import { FiHome, FiUser, FiSettings, FiMessageCircle, FiCreditCard } from "react-icons/fi";

const navs = [
  { key: "home", label: "Home", icon: <FiHome size={24} /> },
  { key: "matches", label: "Matches", icon: <FiMessageCircle size={24} /> },
  { key: "purchase", label: "Purchase", icon: <FiCreditCard size={24} /> },
  { key: "profile", label: "Profile", icon: <FiUser size={24} /> },
  { key: "settings", label: "Settings", icon: <FiSettings size={24} /> },
];

export default function NavigationBar({ current, onNavigate }) {
  return (
    <nav data-role="bottom-nav" className="fixed bottom-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex justify-around w-[95vw] max-w-md mx-auto py-2 px-2 z-50 border border-gray-200 dark:border-gray-800">
      {navs.map(nav => (
        <button
          key={nav.key}
          className={`flex flex-col items-center flex-1 py-1 transition-colors duration-150 ${
            current === nav.key ? "text-primary font-bold" : "text-gray-400"
          }`}
          onClick={() => onNavigate(nav.key)}
        >
          {nav.icon}
          <span className="text-xs mt-1 font-medium">{nav.label}</span>
        </button>
      ))}
    </nav>
  );
}