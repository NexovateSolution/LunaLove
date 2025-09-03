import { FiCheckCircle } from "react-icons/fi";

export default function Upgrade({ onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 font-sans">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-sm border border-primary">
        <h2 className="text-2xl font-bold text-primary mb-4 text-center">Upgrade to Premium</h2>
        <ul className="mb-6 text-gray-700 dark:text-gray-200 space-y-3">
          <li className="flex items-center gap-2"><FiCheckCircle className="text-primary" /> Unlimited Likes</li>
          <li className="flex items-center gap-2"><FiCheckCircle className="text-primary" /> See Who Liked You</li>
          <li className="flex items-center gap-2"><FiCheckCircle className="text-primary" /> Boost Profile</li>
          <li className="flex items-center gap-2"><FiCheckCircle className="text-primary" /> More Super Likes</li>
        </ul>
        <button
          className="w-full px-6 py-3 rounded-full bg-primary text-white font-semibold shadow hover:bg-primary-dark transition mb-4 text-lg"
        >
          Upgrade Now
        </button>
        <button
          className="w-full text-primary underline"
          onClick={onClose}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}