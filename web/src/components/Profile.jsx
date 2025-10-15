import React, { useState, useEffect } from "react";
import Select from "react-select";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";
import apiClient from '../api'; // Import the centralized API client
import { 
  genderOptions, 
  religionOptions, 
  availableInterests,
  relationshipIntentOptions,
  drinkingHabitOptions,
  smokingHabitOptions
} from "../constants/appConstants";

// Add CSS for react-select dropdowns
const selectStyles = `
  .react-select-container .react-select__control {
    border-radius: 0.5rem;
    border: 1px solid #d1d5db;
    background-color: #f3f4f6;
    min-height: 42px;
  }
  .react-select-container .react-select__menu {
    z-index: 999999 !important;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  .react-select-container .react-select__option {
    cursor: pointer;
  }
  .react-select-container .react-select__option:hover {
    background-color: rgba(147,51,234,0.1);
  }
  .dark .react-select-container .react-select__control {
    border-color: #374151;
    background-color: #1f2937;
    color: #e5e7eb;
  }
  .dark .react-select-container .react-select__menu {
    background-color: #111827;
    color: #e5e7eb;
  }
  .dark .react-select-container .react-select__option:hover {
    background-color: rgba(147,51,234,0.25);
  }
`;

// Dark-mode aware react-select styles (aligned with ProfileSetup)
const useSelectStyles = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const updateTheme = () => setIsDarkTheme(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    updateTheme();
    return () => observer.disconnect();
  }, []);

  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: isDarkTheme ? '#374151' : '#d1d5db',
      backgroundColor: isDarkTheme ? '#1f2937' : '#f3f4f6',
      color: isDarkTheme ? '#e5e7eb' : '#111827',
      borderRadius: '0.5rem',
      minHeight: '42px',
      boxShadow: 'none',
      '&:hover': { borderColor: '#9333ea' },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: isDarkTheme ? '#111827' : '#ffffff',
      color: isDarkTheme ? '#e5e7eb' : '#111827',
      zIndex: 100000,
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      maxMenuHeight: 220,
    }),
    menuList: (provided) => ({
      ...provided,
      backgroundColor: isDarkTheme ? '#111827' : '#ffffff',
      color: isDarkTheme ? '#e5e7eb' : '#111827',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? (isDarkTheme ? 'rgba(147,51,234,0.25)' : 'rgba(147,51,234,0.1)')
        : (isDarkTheme ? '#111827' : '#ffffff'),
      color: isDarkTheme ? '#e5e7eb' : '#111827',
      cursor: 'pointer',
      ':active': { backgroundColor: isDarkTheme ? 'rgba(147,51,234,0.35)' : 'rgba(147,51,234,0.2)' },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDarkTheme ? '#e5e7eb' : '#111827',
    }),
    input: (provided) => ({
      ...provided,
      color: isDarkTheme ? '#e5e7eb' : '#111827',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: isDarkTheme ? '#9ca3af' : '#6b7280',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: isDarkTheme ? '#9ca3af' : '#6b7280',
      ':hover': { color: '#9333ea' },
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      backgroundColor: isDarkTheme ? '#374151' : '#d1d5db',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: isDarkTheme ? '#e5e7eb' : '#111827',
    }),
  };

  return selectStyles;
};

export default function Profile({ user, onSave }) {
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(user);
  const [photos, setPhotos] = useState(user.user_photos || []);
  const selectStyles = useSelectStyles();

  // Inject CSS styles for react-select
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .react-select-container .react-select__control {
        border-radius: 0.75rem !important;
        border: 1px solid #e2e8f0 !important;
        background-color: #f8fafc !important;
        min-height: 44px !important;
        box-shadow: none !important;
        transition: all 0.2s ease !important;
      }
      .react-select-container .react-select__control:hover {
        border-color: #a855f7 !important;
      }
      .react-select-container .react-select__control--is-focused {
        border-color: #a855f7 !important;
        box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1) !important;
      }
      .react-select-container .react-select__menu {
        z-index: 999999 !important;
        border-radius: 0.75rem !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        border: 1px solid #e2e8f0 !important;
        background-color: #ffffff !important;
        overflow: hidden !important;
      }
      .react-select-container .react-select__menu-list {
        padding: 0.5rem !important;
      }
      .react-select-container .react-select__option {
        cursor: pointer !important;
        border-radius: 0.5rem !important;
        margin: 0.125rem 0 !important;
        padding: 0.75rem 1rem !important;
        background-color: transparent !important;
        color: #1e293b !important;
        transition: all 0.15s ease !important;
      }
      .react-select-container .react-select__option:hover {
        background-color: rgba(168, 85, 247, 0.1) !important;
      }
      .react-select-container .react-select__option--is-selected {
        background-color: rgba(168, 85, 247, 0.2) !important;
      }
      .react-select-container .react-select__single-value {
        color: #1e293b !important;
      }
      .react-select-container .react-select__placeholder {
        color: #64748b !important;
      }
      .react-select-container .react-select__input-container {
        color: #1e293b !important;
      }
      .react-select-container .react-select__dropdown-indicator {
        color: #64748b !important;
        transition: color 0.2s ease !important;
      }
      .react-select-container .react-select__dropdown-indicator:hover {
        color: #a855f7 !important;
      }
      .react-select-container .react-select__indicator-separator {
        background-color: #e2e8f0 !important;
      }
      .react-select-container .react-select__multi-value {
        background-color: #f1f5f9 !important;
        border-radius: 0.5rem !important;
      }
      .react-select-container .react-select__multi-value__label {
        color: #1e293b !important;
        padding: 0.25rem 0.5rem !important;
      }
      .react-select-container .react-select__multi-value__remove {
        color: #64748b !important;
        border-radius: 0 0.5rem 0.5rem 0 !important;
      }
      .react-select-container .react-select__multi-value__remove:hover {
        background-color: #ef4444 !important;
        color: #ffffff !important;
      }

      /* Dark mode styles */
      .dark .react-select-container .react-select__control {
        border-color: #475569 !important;
        background-color: #334155 !important;
      }
      .dark .react-select-container .react-select__control:hover {
        border-color: #8b5cf6 !important;
      }
      .dark .react-select-container .react-select__control--is-focused {
        border-color: #8b5cf6 !important;
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
      }
      .dark .react-select-container .react-select__menu {
        background-color: #1e293b !important;
        border-color: #475569 !important;
      }
      .dark .react-select-container .react-select__option {
        color: #e2e8f0 !important;
      }
      .dark .react-select-container .react-select__option:hover {
        background-color: rgba(139, 92, 246, 0.2) !important;
      }
      .dark .react-select-container .react-select__option--is-selected {
        background-color: rgba(139, 92, 246, 0.3) !important;
      }
      .dark .react-select-container .react-select__single-value {
        color: #e2e8f0 !important;
      }
      .dark .react-select-container .react-select__placeholder {
        color: #94a3b8 !important;
      }
      .dark .react-select-container .react-select__input-container {
        color: #e2e8f0 !important;
      }
      .dark .react-select-container .react-select__dropdown-indicator {
        color: #94a3b8 !important;
      }
      .dark .react-select-container .react-select__dropdown-indicator:hover {
        color: #8b5cf6 !important;
      }
      .dark .react-select-container .react-select__indicator-separator {
        background-color: #475569 !important;
      }
      .dark .react-select-container .react-select__multi-value {
        background-color: #475569 !important;
      }
      .dark .react-select-container .react-select__multi-value__label {
        color: #e2e8f0 !important;
      }
      .dark .react-select-container .react-select__multi-value__remove {
        color: #94a3b8 !important;
      }
    `;
    document.head.appendChild(styleElement);
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);
  // Local copy for display to avoid blank page if parent hasn't refreshed yet
  const [displayUser, setDisplayUser] = useState(user || {});
  // Build react-select-friendly interest options from constants
  const interestOptions = (availableInterests || []).map(i => ({
    value: i.value || i.name,
    label: `${i.emoji ? i.emoji + ' ' : ''}${i.label || i.name}`
  }));

  const computeAge = (isoDate) => {
    try {
      if (!isoDate) return null;
      const dob = new Date(isoDate);
      if (isNaN(dob.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      return age;
    } catch (_) { return null; }
  };

  useEffect(() => {
    // When the user prop updates (e.g., after a save), update the photos state
    console.log('User prop updated:', user);
    console.log('User photos:', user?.user_photos);
    console.log('User first_name:', user?.first_name);
    console.log('User date_of_birth:', user?.date_of_birth);
    setPhotos(user?.user_photos || []);
    setDisplayUser(user || {});
  }, [user]);

  // Ensure we always display the freshest data when opening the Profile page
  useEffect(() => {
    const refresh = async () => {
      try {
        const { data } = await apiClient.get('/user/me/');
        console.log('Refreshed user data:', data);
        console.log('Refreshed user photos:', data.user_photos);
        console.log('Refreshed user first_name:', data.first_name);
        console.log('Refreshed user date_of_birth:', data.date_of_birth);
        console.log('Refreshed user age:', data.age);
        // Push updated user up so App state refreshes and Profile re-renders with values
        onSave(data);
        setPhotos(data.user_photos || []);
        setDisplayUser(data || {});
      } catch (e) {
        // Non-fatal; just show what we have
        console.warn('Could not refresh user profile for display:', e);
      }
    };
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // When the modal opens, sync the form state with the latest user prop
    // and format it for the react-select components.
    if (editOpen) {
      setForm({
        ...user,
        gender: genderOptions.find(o => o.value === user.gender),
        religion: religionOptions.find(o => o.value === user.religion),
        // Map API interests (objects) to availableInterests if present by name
        interests: (user.interests || []).map(intObj => 
          interestOptions.find(i => i.value === (intObj.value || intObj.name)) || { value: intObj.name, label: `${intObj.emoji ? intObj.emoji + ' ' : ''}${intObj.name}` }
        ),
        relationshipIntent: relationshipIntentOptions.find(o => o.value === user.relationship_intent),
        drinkingHabit: drinkingHabitOptions.find(o => o.value === (user.drinks_alcohol || user.drinking_habits)),
        smokingHabit: smokingHabitOptions.find(o => o.value === (user.smokes || user.smoking_habits)),
      });
    }
  }, [editOpen, user]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    const payload = {
      bio: form.bio,
      gender: form.gender?.value,
      religion: form.religion?.value,
      relationship_intent: form.relationshipIntent?.value,
      // backend expects these keys for update
      drinks_alcohol: form.drinkingHabit?.value,
      smokes: form.smokingHabit?.value,
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
    // Upload using the 'photo' key expected by the API layer
    formData.append('photo', file);

    try {
      const { data: newPhoto } = await apiClient.post('/user/photos/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Optimistic update then refresh from backend for consistency
      setPhotos(prevPhotos => [...prevPhotos, newPhoto]);
      try {
        const { data } = await apiClient.get('/user/me/');
        onSave(data);
        setPhotos(data.user_photos || []);
        setDisplayUser(data || {});
      } catch (_) {}
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="relative w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 shadow-xl">
        {/* Cover Photo Area */}
        <div className="relative h-48 bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 dark:from-purple-800 dark:via-pink-800 dark:to-rose-800">
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Edit Profile Button */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-gray-800 dark:text-white px-3 py-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-all"
              onClick={async () => {
                try {
                  const { data } = await apiClient.get('/user/me/');
                  console.log('Force refresh data:', data);
                  onSave(data);
                  setPhotos(data.user_photos || []);
                  setDisplayUser(data || {});
                } catch (e) {
                  console.error('Force refresh failed:', e);
                }
              }}
              title="Refresh Profile"
            >
              🔄
            </button>
            <button
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-gray-800 dark:text-white px-4 py-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-700 flex items-center gap-2 transition-all"
              onClick={() => setEditOpen(true)}
            >
              <FiEdit2 size={16} />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="relative px-6 pb-8">
          {/* Profile Picture */}
          <div className="relative -mt-16 mb-6">
            <img
              src={(() => {
                // Check both photos state and displayUser.user_photos
                const allPhotos = photos.length > 0 ? photos : (displayUser.user_photos || []);
                if (allPhotos && allPhotos.length > 0) {
                  // Prefer an explicit avatar if available, otherwise show the first photo
                  const avatar = allPhotos.find(p => p.is_avatar) || allPhotos[0];
                  return avatar.photo || avatar.photo_url || '/avatar.png';
                }
                return '/avatar.png';
              })()}
              alt={(displayUser.first_name || displayUser.username || 'User')}
              className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-white dark:border-slate-800 shadow-xl"
              onError={(e) => {
                console.log('Image failed to load:', e.target.src);
                e.target.src = '/avatar.png';
              }}
            />
          </div>

          {/* Name and Age */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {displayUser.first_name || displayUser.username || 'User'}
              {computeAge(displayUser.date_of_birth) && (
                <span className="text-gray-500 dark:text-gray-400">, {computeAge(displayUser.date_of_birth)}</span>
              )}
            </h1>
            {displayUser.bio && (
              <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                {displayUser.bio}
              </p>
            )}
          </div>

          {/* Interests */}
          {displayUser.interests && displayUser.interests.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {displayUser.interests.map((i) => (
                  <span key={i.id || i.name} className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-700 dark:text-purple-300 text-sm font-medium">
                    {i.emoji ? `${i.emoji} ` : ''}{i.name || i}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">About</h3>
              <div className="space-y-3">
                {displayUser.gender && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 text-sm">👤</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                      <p className="font-medium text-gray-900 dark:text-white">{displayUser.gender}</p>
                    </div>
                  </div>
                )}
                
                {displayUser.religion && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 dark:text-purple-400 text-sm">🙏</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Religion</p>
                      <p className="font-medium text-gray-900 dark:text-white">{displayUser.religion}</p>
                    </div>
                  </div>
                )}

                {displayUser.relationship_intent && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                      <span className="text-pink-600 dark:text-pink-400 text-sm">💕</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Looking for</p>
                      <p className="font-medium text-gray-900 dark:text-white">{displayUser.relationship_intent}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lifestyle</h3>
              <div className="space-y-3">
                {displayUser.country && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400 text-sm">📍</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-medium text-gray-900 dark:text-white">{displayUser.country}</p>
                    </div>
                  </div>
                )}

                {(displayUser.drinks_alcohol || displayUser.drinking_habits) && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                      <span className="text-amber-600 dark:text-amber-400 text-sm">🍷</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Drinking</p>
                      <p className="font-medium text-gray-900 dark:text-white">{displayUser.drinks_alcohol || displayUser.drinking_habits}</p>
                    </div>
                  </div>
                )}

                {(displayUser.smokes || displayUser.smoking_habits) && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">🚭</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Smoking</p>
                      <p className="font-medium text-gray-900 dark:text-white">{displayUser.smokes || displayUser.smoking_habits}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editOpen && (
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl relative max-h-[90vh] border border-gray-200 dark:border-slate-700">
              {/* Header */}
              <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <FiEdit2 size={20} />
                  </div>
                  <h3 className="text-xl font-bold">Edit Profile</h3>
                </div>
                <button
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  onClick={() => setEditOpen(false)}
                >
                  <FiX size={20} />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
                {/* Photo Management Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 text-xs">📸</span>
                    </div>
                    <label className="text-lg font-semibold text-gray-900 dark:text-white">Your Photos</label>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-2xl p-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {photos.map(photo => (
                        <div key={photo.id} className="relative group aspect-square">
                          <img 
                            src={photo.photo || photo.photo_url || '/avatar.png'} 
                            alt="User photo" 
                            className="w-full h-full object-cover rounded-xl shadow-sm" 
                          />
                          <button 
                            onClick={() => handlePhotoDelete(photo.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                          >
                            <FiX size={12} />
                          </button>
                        </div>
                      ))}
                      <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors group">
                        <div className="text-gray-400 dark:text-slate-400 group-hover:text-purple-500 transition-colors">
                          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-xs font-medium">Add Photo</span>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 dark:text-purple-400 text-xs">✍️</span>
                    </div>
                    <label className="text-lg font-semibold text-gray-900 dark:text-white">About You</label>
                  </div>
                  <textarea
                    value={form.bio || ''}
                    onChange={e => handleChange("bio", e.target.value)}
                    className="w-full p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl border-2 border-transparent focus:border-purple-500 focus:outline-none transition-all resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                {/* Personal Info Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400 text-xs">👤</span>
                    </div>
                    <label className="text-lg font-semibold text-gray-900 dark:text-white">Personal Info</label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                      <Select 
                        options={genderOptions} 
                        value={form.gender} 
                        onChange={value => handleChange("gender", value)} 
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Select your gender"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Religion</label>
                      <Select 
                        options={religionOptions} 
                        value={form.religion} 
                        onChange={value => handleChange("religion", value)} 
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Select your religion"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Relationship Intent</label>
                      <Select 
                        options={relationshipIntentOptions} 
                        value={form.relationshipIntent} 
                        onChange={value => handleChange("relationshipIntent", value)} 
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="I'm looking for..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Drinking Habit</label>
                      <Select 
                        options={drinkingHabitOptions} 
                        value={form.drinkingHabit} 
                        onChange={value => handleChange("drinkingHabit", value)} 
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Select drinking habit"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Smoking Habit</label>
                      <Select 
                        options={smokingHabitOptions} 
                        value={form.smokingHabit} 
                        onChange={value => handleChange("smokingHabit", value)} 
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Select smoking habit"
                      />
                    </div>
                  </div>
                </div>

                {/* Interests Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                      <span className="text-pink-600 dark:text-pink-400 text-xs">🎯</span>
                    </div>
                    <label className="text-lg font-semibold text-gray-900 dark:text-white">Interests</label>
                  </div>
                  <Select 
                    isMulti
                    options={interestOptions}
                    value={form.interests}
                    onChange={value => handleChange("interests", value)}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Select your interests..."
                  />
                </div>
              </div>
              <div className="p-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditOpen(false)}
                    className="flex-1 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-2xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                    onClick={handleSave}
                  >
                    <FiCheck size={18} /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}