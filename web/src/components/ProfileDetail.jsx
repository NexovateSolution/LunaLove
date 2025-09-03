import React from "react";
import { FiX } from "react-icons/fi";

export default function ProfileDetail({ profile, onClose }) {
  if (!profile) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center">
      <div className="max-w-md w-full mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-fuchsia-700"
          onClick={onClose}
        >
          <FiX size={28} />
        </button>
        <img
          src={profile.user_photos && profile.user_photos.length > 0 ? profile.user_photos[0].photo : '/default-avatar.png'}
          alt={profile.first_name}
          className="w-40 h-40 object-cover rounded-full mx-auto border-4 border-fuchsia-400 mb-4"
        />
        <h2 className="text-2xl font-bold text-center text-fuchsia-700 mb-2">{profile.first_name}, {profile.age}</h2>
        <div className="text-center text-gray-600 mb-4">{profile.bio || 'No bio available.'}</div>
        <div className="flex flex-wrap gap-2 justify-center mb-2">
          {profile.interests && profile.interests.map(interest => (
            <span key={interest.id} className="px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 text-xs">{interest.name}</span>
          ))}
        </div>
        <div className="text-center text-sm text-gray-500 mb-1">Religion: {profile.religion || 'Not specified'}</div>
        <div className="text-center text-sm text-gray-500 mb-1">Country: {profile.country || 'Not specified'}</div>
        <div className="text-center text-sm text-gray-500 mb-1">Gender: {profile.gender || 'Not specified'}</div>
      </div>
    </div>
  );
}