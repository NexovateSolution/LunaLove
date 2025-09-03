import React, { useState, useEffect } from "react";
import Select from "react-select";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";
import axios from 'axios';
import apiClient from '../api'; // Import the centralized API client
import { 
  genderOptions, 
  religionOptions, 
  availableInterests,
  relationshipIntentOptions,
  drinkingHabitOptions,
  smokingHabitOptions
} from "../constants/appConstants";

const customSelectStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: 'var(--input-bg)',
    borderColor: 'var(--border-color)',
    borderRadius: '0.5rem',
    padding: '0.25rem',
    boxShadow: 'none',
    '&:hover': {
      borderColor: 'var(--primary-color)',
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'var(--input-bg)',
    borderRadius: '0.5rem',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? 'rgba(147, 51, 234, 0.1)' : 'var(--input-bg)',
    color: 'var(--text-color)',
  }),
  singleValue: (provided) => ({ ...provided, color: 'var(--text-color)' }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
  }),
  multiValueLabel: (provided) => ({ ...provided, color: '#9333ea' }),
};

export default function Profile({ user, onSave }) {
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(user);
  const [photos, setPhotos] = useState(user.user_photos || []);

  useEffect(() => {
    // When the user prop updates (e.g., after a save), update the photos state
    setPhotos(user.user_photos || []);
  }, [user.user_photos]);

  useEffect(() => {
    // When the modal opens, sync the form state with the latest user prop
    // and format it for the react-select components.
    if (editOpen) {
      setForm({
        ...user,
        gender: genderOptions.find(o => o.value === user.gender),
        religion: religionOptions.find(o => o.value === user.religion),
        interests: user.interests.map(interestName => 
          availableInterests.find(i => i.value === interestName)
        ).filter(Boolean), // Ensure no undefined values
        relationshipIntent: relationshipIntentOptions.find(o => o.value === user.relationship_intent),
        drinkingHabit: drinkingHabitOptions.find(o => o.value === user.drinking_habits),
        smokingHabit: smokingHabitOptions.find(o => o.value === user.smoking_habits),
      });
    }
  }, [editOpen, user]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    const payload = {
      bio: form.bio,
      gender: form.gender?.value,
      religion: form.religion?.value,
      interests: form.interests?.map(i => i.value),
      relationship_intent: form.relationshipIntent?.value,
      drinking_habits: form.drinkingHabit?.value,
      smoking_habits: form.smokingHabit?.value,
    };

    try {
      // The correct endpoint for updating the user's own profile is /user/me/
      const { data } = await apiClient.patch("/user/me/", payload);
      onSave(data);
      setEditOpen(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file); // 'photo' must match the serializer's write_only field

    try {
      const { data: newPhoto } = await apiClient.post('/user/photos/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setPhotos(prevPhotos => [...prevPhotos, newPhoto]);
    } catch (error) {
      console.error('Failed to upload photo:', error);
    }
  };

  const handlePhotoDelete = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      await apiClient.delete(`/user/photos/${photoId}/`);
      setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-4 bg-gradient-to-br from-pink-100 via-fuchsia-100 to-purple-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
        {/* Edit Profile Button */}
        <button
          className="absolute top-4 right-4 bg-fuchsia-600 text-white px-4 py-2 rounded-full shadow hover:bg-fuchsia-700 flex items-center gap-2"
          onClick={() => setEditOpen(true)}
        >
          <FiEdit2 />
          Edit Profile
        </button>
        <img
          src={photos.length > 0 ? photos[0].photo_url : '/placeholder.png'} // Use first photo as avatar
          alt={user.name}
          className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-fuchsia-400 mb-4"
        />
        <h2 className="text-2xl font-bold text-center text-fuchsia-700 mb-2">{user.name}, {user.age}</h2>
        <div className="text-center text-gray-600 dark:text-gray-400 mb-4 px-4 whitespace-pre-wrap">{user.bio}</div>
        <div className="flex flex-wrap gap-2 justify-center mb-2">
          {user.interests && user.interests.map(i => (
            <span key={i} className="px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 text-xs font-semibold">{availableInterests.find(ai => ai.value === i)?.label || i}</span>
          ))}
        </div>
        <div className="text-center text-sm text-gray-500 mb-1">Religion: {user.religion}</div>
        <div className="text-center text-sm text-gray-500 mb-1">Country: {user.country}</div>
        <div className="text-center text-sm text-gray-500 mb-1">Gender: {user.gender}</div>
        <div className="text-center text-sm text-gray-500 mb-1">Looking for: {user.relationship_intent}</div>
        <div className="text-center text-sm text-gray-500 mb-1">Drinks: {user.drinking_habits}</div>
        <div className="text-center text-sm text-gray-500 mb-1">Smokes: {user.smoking_habits}</div>

        {/* Edit Modal */}
        {editOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-400">Edit Profile</h3>
                <button
                  className="text-gray-400 hover:text-fuchsia-700"
                  onClick={() => setEditOpen(false)}
                >
                  <FiX size={28} />
                </button>
              </div>
              
              {/* Photo Management Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Photos</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative group aspect-square">
                      <img src={photo.photo_url} alt="User photo" className="w-full h-full object-cover rounded-lg" />
                      <button 
                        onClick={() => handlePhotoDelete(photo.id)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                  <label className="flex items-center justify-center aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <span className="text-gray-400 text-3xl">+</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                  <textarea
                    value={form.bio || ''}
                    onChange={e => handleChange("bio", e.target.value)}
                    className="w-full p-3 bg-gray-100 dark:bg-gray-900 rounded-lg border-2 border-transparent focus:border-fuchsia-500 focus:outline-none transition"
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                  <Select options={genderOptions} value={form.gender} onChange={value => handleChange("gender", value)} styles={customSelectStyles} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Religion</label>
                  <Select options={religionOptions} value={form.religion} onChange={value => handleChange("religion", value)} styles={customSelectStyles} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interests</label>
                  <Select 
                    isMulti
                    options={availableInterests}
                    value={form.interests}
                    onChange={value => handleChange("interests", value)}
                    styles={customSelectStyles}
                    placeholder="Select your interests..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Relationship Intent</label>
                  <Select options={relationshipIntentOptions} value={form.relationshipIntent} onChange={value => handleChange("relationshipIntent", value)} styles={customSelectStyles} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Drinking Habit</label>
                  <Select options={drinkingHabitOptions} value={form.drinkingHabit} onChange={value => handleChange("drinkingHabit", value)} styles={customSelectStyles} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Smoking Habit</label>
                  <Select options={smokingHabitOptions} value={form.smokingHabit} onChange={value => handleChange("smokingHabit", value)} styles={customSelectStyles} />
                </div>
              </div>

              <button
                className="w-full mt-8 px-6 py-3 rounded-full bg-fuchsia-600 text-white font-bold shadow-lg hover:bg-fuchsia-700 transition text-lg flex items-center justify-center gap-2"
                onClick={handleSave}
              >
                <FiCheck /> Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}