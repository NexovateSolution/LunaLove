import React, { useState, useEffect } from "react";
import { 
  FiX, FiMapPin, FiCalendar, FiUser, FiHeart, FiTrendingUp,
  FiChevronLeft, FiChevronRight, FiStar, FiActivity, FiCoffee, 
  FiMusic, FiCamera, FiBook, FiAward, FiPhone, FiMail, FiClock
} from "react-icons/fi";
import { 
  FaGraduationCap, FaBriefcase, FaRulerVertical, FaGlassCheers, 
  FaSmoking, FaPray, FaVenus, FaMars, FaTransgender, FaWeight,
  FaChild, FaPaw, FaLanguage, FaGamepad, FaPlane, FaUtensils
} from 'react-icons/fa';

export default function ProfileDetail({ profile, onClose }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!profile) return null;

  // Helper function to get all photos for a user
  const getAllPhotos = (user) => {
    const photos = [];
    
    // Try user_photos first (from UserSerializer)
    if (user?.user_photos && user.user_photos.length > 0) {
      user.user_photos.forEach(photo => {
        if (photo && typeof photo === 'object' && photo.photo) {
          photos.push(photo.photo);
        }
      });
    }
    
    // Try photos field as fallback
    if (photos.length === 0 && user?.photos && user.photos.length > 0) {
      user.photos.forEach(photo => {
        if (typeof photo === 'string') {
          photos.push(photo);
        } else if (photo && typeof photo === 'object' && photo.photo) {
          photos.push(photo.photo);
        } else if (photo && typeof photo === 'object') {
          if (photo.url) photos.push(photo.url);
          else if (photo.image) photos.push(photo.image);
          else if (photo.src) photos.push(photo.src);
        }
      });
    }
    
    // If no photos found, return default avatar
    if (photos.length === 0) {
      photos.push('/avatar.png');
    }
    
    return photos;
  };

  // Photo navigation functions
  const nextPhoto = () => {
    const photos = getAllPhotos(profile);
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    const photos = getAllPhotos(profile);
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToPhoto = (index) => {
    setCurrentPhotoIndex(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPhoto();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextPhoto();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [profile]);

  const photos = getAllPhotos(profile);
  const currentPhoto = photos[currentPhotoIndex] || '/avatar.png';

  return (
    <div className="fixed inset-0 z-[200] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Enhanced Photo Gallery Header */}
        <div className="relative">
          {/* Main Photo */}
          <div className="relative h-80 bg-gray-200 dark:bg-gray-700 rounded-t-3xl overflow-hidden">
            <img
              src={currentPhoto}
              alt={`${profile.first_name} - Photo ${currentPhotoIndex + 1}`}
              className="w-full h-full object-cover transition-all duration-300"
              onError={(e) => {
                e.target.src = '/avatar.png';
              }}
            />
            
            {/* Photo Navigation Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200"
                >
                  <FiChevronLeft size={20} />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200"
                >
                  <FiChevronRight size={20} />
                </button>
              </>
            )}
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors z-10"
            >
              <FiX size={20} />
            </button>
            
            {/* Photo Counter */}
            {photos.length > 1 && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                {currentPhotoIndex + 1} / {photos.length}
              </div>
            )}
            
            {/* Age Badge */}
            {profile.age && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                {profile.age} years old
              </div>
            )}
          </div>
          
          {/* Photo Thumbnails */}
          {photos.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex gap-2 justify-center">
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => goToPhoto(index)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      index === currentPhotoIndex
                        ? 'border-white shadow-lg scale-110'
                        : 'border-white/50 hover:border-white/80'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/avatar.png';
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Details */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {profile.first_name || profile.username || 'User'}
              {profile.last_name && ` ${profile.last_name}`}
            </h2>
            
            {/* Basic Info Row */}
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
              {profile.age && (
                <div className="flex items-center gap-1">
                  <FiCalendar size={14} />
                  <span>{profile.age} years old</span>
                </div>
              )}
              {profile.gender && (
                <div className="flex items-center gap-1">
                  {profile.gender === 'male' && <FaMars className="text-blue-500" size={14} />}
                  {profile.gender === 'female' && <FaVenus className="text-pink-500" size={14} />}
                  {profile.gender === 'other' && <FaTransgender className="text-purple-500" size={14} />}
                  <span className="capitalize">{profile.gender}</span>
                </div>
              )}
            </div>

            {/* Location */}
            {(profile.city || profile.country) && (
              <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400 mb-4">
                <FiMapPin size={16} />
                <span>
                  {profile.city}
                  {profile.city && profile.country && ', '}
                  {profile.country}
                </span>
              </div>
            )}

            {/* Relationship Intent Badge */}
            {profile.relationship_intent && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-4">
                <FiHeart size={14} />
                <span>Looking for {profile.relationship_intent}</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <FiUser size={18} />
                About
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            {/* Professional Info */}
            {profile.education && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/20">
                <FaGraduationCap className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Education</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.education}</p>
                </div>
              </div>
            )}
            
            {profile.occupation && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl border border-green-100 dark:border-green-800/20">
                <FaBriefcase className="text-green-500" size={20} />
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Occupation</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.occupation}</p>
                </div>
              </div>
            )}

            {/* Physical Attributes */}
            {profile.height && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/20">
                <FaRulerVertical className="text-purple-500" size={20} />
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Height</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.height} cm</p>
                </div>
              </div>
            )}

            {/* Lifestyle */}
            {profile.drinking_habits && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl border border-amber-100 dark:border-amber-800/20">
                <FaGlassCheers className="text-amber-500" size={20} />
                <div>
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Drinking</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{profile.drinking_habits}</p>
                </div>
              </div>
            )}

            {profile.smoking_habits && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/10 dark:to-slate-900/10 rounded-2xl border border-gray-100 dark:border-gray-800/20">
                <FaSmoking className="text-gray-500" size={20} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Smoking</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{profile.smoking_habits}</p>
                </div>
              </div>
            )}

            {/* Beliefs & Values */}
            {profile.religion && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 rounded-2xl border border-teal-100 dark:border-teal-800/20">
                <FaPray className="text-teal-500" size={20} />
                <div>
                  <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">Religion</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{profile.religion}</p>
                </div>
              </div>
            )}

            {profile.relationship_type && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 rounded-2xl border border-rose-100 dark:border-rose-800/20">
                <FiHeart className="text-rose-500" size={20} />
                <div>
                  <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">Relationship Type</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{profile.relationship_type}</p>
                </div>
              </div>
            )}

            {/* Profile Completeness */}
            {profile.profile_completeness_score && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/20">
                <FiTrendingUp className="text-emerald-500" size={20} />
                <div className="flex-1">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Profile Completeness</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${profile.profile_completeness_score}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {profile.profile_completeness_score}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Personal Details */}
            {profile.weight && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/20">
                <FaWeight className="text-indigo-500" size={20} />
                <div>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Weight</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.weight} kg</p>
                </div>
              </div>
            )}

            {profile.children && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 rounded-2xl border border-pink-100 dark:border-pink-800/20">
                <FaChild className="text-pink-500" size={20} />
                <div>
                  <p className="text-sm text-pink-600 dark:text-pink-400 font-medium">Children</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{profile.children}</p>
                </div>
              </div>
            )}

            {profile.pets && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-2xl border border-orange-100 dark:border-orange-800/20">
                <FaPaw className="text-orange-500" size={20} />
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Pets</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{profile.pets}</p>
                </div>
              </div>
            )}

            {profile.languages && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 rounded-2xl border border-violet-100 dark:border-violet-800/20">
                <FaLanguage className="text-violet-500" size={20} />
                <div>
                  <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">Languages</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.languages}</p>
                </div>
              </div>
            )}

            {/* Contact Information */}
            {profile.phone_number && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10 rounded-2xl border border-cyan-100 dark:border-cyan-800/20">
                <FiPhone className="text-cyan-500" size={20} />
                <div>
                  <p className="text-sm text-cyan-600 dark:text-cyan-400 font-medium">Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.phone_number}</p>
                </div>
              </div>
            )}

            {profile.email && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/10 dark:to-gray-900/10 rounded-2xl border border-slate-100 dark:border-slate-800/20">
                <FiMail className="text-slate-500" size={20} />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.email}</p>
                </div>
              </div>
            )}

            {/* Account Information */}
            {profile.date_joined && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-lime-50 to-green-50 dark:from-lime-900/10 dark:to-green-900/10 rounded-2xl border border-lime-100 dark:border-lime-800/20">
                <FiClock className="text-lime-500" size={20} />
                <div>
                  <p className="text-sm text-lime-600 dark:text-lime-400 font-medium">Member Since</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(profile.date_joined).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            )}

            {profile.last_login && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 rounded-2xl border border-yellow-100 dark:border-yellow-800/20">
                <FiActivity className="text-yellow-500" size={20} />
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Last Active</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(profile.last_login).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Premium Features Section */}
          {(profile.is_premium || profile.has_boost || profile.can_see_likes || profile.ad_free) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FiStar className="text-yellow-500" />
                Premium Features
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {profile.is_premium && (
                  <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl">
                    <FiStar className="text-yellow-500" size={16} />
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Premium</span>
                  </div>
                )}
                {profile.has_boost && (
                  <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
                    <FiTrendingUp className="text-orange-500" size={16} />
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Boost</span>
                  </div>
                )}
                {profile.can_see_likes && (
                  <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl">
                    <FiHeart className="text-pink-500" size={16} />
                    <span className="text-sm font-medium text-pink-700 dark:text-pink-300">See Likes</span>
                  </div>
                )}
                {profile.ad_free && (
                  <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                    <FiAward className="text-green-500" size={16} />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Ad Free</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lifestyle Preferences */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FiActivity size={18} />
              Lifestyle & Preferences
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {profile.hobbies && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                  <FiMusic className="text-purple-500" size={16} />
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Hobbies: </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{profile.hobbies}</span>
                  </div>
                </div>
              )}
              
              {profile.favorite_food && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                  <FaUtensils className="text-red-500" size={16} />
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Favorite Food: </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{profile.favorite_food}</span>
                  </div>
                </div>
              )}
              
              {profile.travel_preference && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                  <FaPlane className="text-blue-500" size={16} />
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Travel: </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{profile.travel_preference}</span>
                  </div>
                </div>
              )}

              {profile.gaming_preference && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                  <FaGamepad className="text-indigo-500" size={16} />
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Gaming: </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{profile.gaming_preference}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <span
                    key={interest.id || index}
                    className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                  >
                    {interest.name || interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}