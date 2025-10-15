import React, { useState, useEffect, useCallback } from 'react';
import Confetti from 'react-confetti';
import { FiLoader, FiUsers, FiX, FiSliders, FiRewind, FiInfo, FiRefreshCw } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { likeUser, postSwipe, getPotentialMatches } from '../api';
import ProfileDetail from './ProfileDetail';
import ChatWindow from './ChatWindow';
import DiscoveryFilters from './DiscoveryFilters';

const HomeSwiping = ({ onMatch, onGift, onChatToggle }) => {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 99,
    maxDistance: 50,
    gender: 'all',
    interests: [],
  });

  // Measure bottom NavigationBar height so the floating action bar can sit just above it
  const [navOffsetPx, setNavOffsetPx] = useState(92); // sensible default
  useEffect(() => {
    const measure = () => {
      const nav = document.querySelector('nav[data-role="bottom-nav"]');
      if (nav) {
        const h = nav.getBoundingClientRect().height;
        // Sit the bar immediately above the nav
        setNavOffsetPx(Math.round(h));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Load current user info
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await fetch('/api/user/me/', {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    };
    
    loadCurrentUser();
  }, []);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPotentialMatches(filters);
      if (Array.isArray(data)) {
        setProfiles(data);
        setCurrentIndex(0); // Reset index when new profiles are fetched
      } else {
        console.error('API did not return an array for profiles, received:', data);
        setProfiles([]);
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles, filters]);

  useEffect(() => {
    fetchCurrentUser();
    fetchProfiles();
  }, []);

  // Notify parent component when chat opens/closes
  useEffect(() => {
    if (onChatToggle) {
      onChatToggle(showChat);
    }
  }, [showChat, onChatToggle]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user/me/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      // Reset current profiles and fetch new ones
      setProfiles([]);
      setCurrentIndex(0);
      await fetchProfiles();
    } catch (error) {
      console.error('Failed to refresh profiles:', error);
    }
  };


  const handleSwipe = async (action) => {
    if (profiles.length === 0 || currentIndex >= profiles.length) return;

    const profileId = profiles[currentIndex].id;
    const currentProfile = profiles[currentIndex];
    
    console.log(`=== SWIPE ACTION: ${action} ===`);
    console.log('Profile ID:', profileId);
    console.log('Profile:', currentProfile);
    
    try {
      if (action === 'like') {
        // Use the new like system for likes
        console.log('Attempting to like user with ID:', profileId);
        try {
          const likeResult = await likeUser(profileId);
          console.log('Like result:', likeResult);
          
          if (likeResult.mutual_match) {
            console.log('Mutual match detected!');
            console.log('Match data received:', likeResult.match_data);
            console.log('Current user:', currentUser);
            setShowConfetti(true);
            
            // Show notification instead of opening chat automatically
            const matchedUserName = likeResult.match_data?.liker?.first_name || likeResult.match_data?.liked?.first_name || 'Someone';
            alert(`🎉 It's a Match! You and ${matchedUserName} liked each other! Check your matches to start chatting.`);
            
            // Hide confetti after 3 seconds
            setTimeout(() => {
              setShowConfetti(false);
            }, 3000);
          } else {
            console.log('Like created successfully, no mutual match yet');
          }
        } catch (likeError) {
          const errorMessage = likeError.response?.data?.error || likeError.response?.data?.liked?.[0] || likeError.message;
          
          console.log('Like error occurred:', errorMessage);
          console.log('Full error response:', likeError.response?.data);
          
          if (errorMessage === 'You have already liked this user') {
            console.log('User already liked - advancing to next card');
            // Continue to advance to next card
          } else {
            console.error('Unexpected like error:', likeError);
            console.error('Error details:', likeError.response?.data);
            // Don't throw error, just continue to next card
            console.log('Continuing to next card despite error');
          }
        }
      } else {
        // Use old swipe system for dislikes
        const swipeResult = await postSwipe(profileId, action);
        if (swipeResult.match) {
          setShowConfetti(true);
        }
      }
      // Advance to the next card
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error(`Failed to ${action} on profile ${profileId}:`, error);
      // Optionally, show an error to the user
    }
  };

  const handleRewind = async () => {
    // Persist rewind on the backend, then move index back one if possible
    if (currentIndex > 0) {
      try {
        await rewindSwipe();
        setCurrentIndex(prev => prev - 1);
      } catch (error) {
        console.error('Failed to rewind swipe:', error);
      }
    } else {
      alert("Can't rewind any further!");
    }
  };

  const handleShowDetail = (profile) => {
    setActiveProfile(profile);
    setShowDetail(true);
  };

  // Nudge the action bar slightly lower only when detail overlay is open
  const overlayActive = showDetail;
  const actionBarBottom = `calc(env(safe-area-inset-bottom, 0px) + ${Math.max(0, navOffsetPx - (overlayActive ? 8 : 0))}px)`;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400">
        <FiLoader className="animate-spin text-4xl mb-4" />
        <p>Finding people near you...</p>
      </div>
    );
  }

  const currentProfile = profiles.length > 0 && currentIndex < profiles.length ? profiles[currentIndex] : null;

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative"
    >
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}

      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={() => setShowFilters(true)}
          className="bg-white dark:bg-slate-700 shadow rounded-full p-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition"
        >
          <FiSliders size={24} />
        </button>
      </div>

      {/* Main content area for the profile card */}
      <div className="w-full flex-grow flex items-center justify-center px-4">
        {currentProfile ? (
          <div className="relative w-full max-w-sm h-[75vh] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            {/* Main image container - takes most of the space */}
            <div className="relative w-full h-[75%] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-700">
              {currentProfile.user_photos && currentProfile.user_photos.length > 0 ? (
                <img 
                  src={currentProfile.user_photos[0].photo} 
                  alt={currentProfile.first_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-400">
                  <div className="text-center">
                    <FiUsers size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No Photo</p>
                  </div>
                </div>
              )}
              
              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Info button - top right */}
              <button 
                onClick={() => handleShowDetail(currentProfile)} 
                className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm text-white rounded-full p-2 hover:bg-black/40 transition-all duration-200"
              >
                <FiInfo size={20} />
              </button>
              
              {/* Age indicator - top left */}
              <div className="absolute top-4 left-4 bg-black/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                {currentProfile.age}
              </div>
            </div>
            
            {/* Compact info section at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 p-4 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                    {currentProfile.first_name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 leading-relaxed">
                    {currentProfile.bio || 'No bio available'}
                  </p>
                  
                  {/* Location and interests - compact */}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {currentProfile.city && (
                      <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                        📍 {currentProfile.city}
                      </span>
                    )}
                    {currentProfile.interests && currentProfile.interests.length > 0 && (
                      <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                        {currentProfile.interests[0].emoji} {currentProfile.interests[0].name}
                        {currentProfile.interests.length > 1 && ` +${currentProfile.interests.length - 1}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 flex flex-col items-center gap-4 p-4">
            <FiUsers size={64} />
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">That's everyone for now!</h2>
            <p>Try adjusting your filters or check back later.</p>
            <button onClick={handleRefresh} className="mt-4 px-6 py-2 bg-rose-500 text-white rounded-full font-semibold hover:bg-rose-600 transition">Refresh</button>
          </div>
        )}
      </div>

      {showDetail && activeProfile && (
        <ProfileDetail
          profile={activeProfile}
          onClose={() => setShowDetail(false)}
          onLike={() => { handleSwipe('like'); setShowDetail(false); }}
          onPass={() => { handleSwipe('dislike'); setShowDetail(false); }}
          />
      )}

      <DiscoveryFilters
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onChange={(newFilters) => {
          setFilters(newFilters);
          setShowFilters(false);
        }}
      />

      {currentProfile && !showFilters && !showChat && (
        <div
          className="fixed left-1/2 transform -translate-x-1/2 z-[100] w-[85vw] max-w-xs"
          style={{ bottom: actionBarBottom }}
        >
          <div className="flex justify-center items-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg shadow-2xl rounded-2xl py-3 px-4 gap-4 border border-white/20 dark:border-slate-700/50">
            <button
              className="bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg rounded-full p-3 text-white hover:from-amber-500 hover:to-orange-600 transition-all duration-200 transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleRewind}
              disabled={currentIndex === 0}
              aria-label="Rewind"
            >
              <FiRewind size={18} />
            </button>
            <button
              className="bg-gray-100 dark:bg-gray-700 shadow-lg rounded-full p-4 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 transform hover:scale-110 active:scale-95"
              onClick={() => handleSwipe('dislike')}
              aria-label="Pass"
            >
              <FiX size={24} />
            </button>
            <button
              className="bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg rounded-full p-4 text-white hover:from-pink-600 hover:to-rose-700 transition-all duration-200 transform hover:scale-110 active:scale-95"
              onClick={() => handleSwipe('like')}
              aria-label="Like"
            >
              <FaHeart size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Test Mutual Match Button - Temporary */}
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={async () => {
            if (profiles[currentIndex]) {
              try {
                // Create fake like first
                await fetch('/api/dev/create-fake-like/', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('token')}`
                  },
                  body: JSON.stringify({
                    liker_id: profiles[currentIndex].id,
                    liked_id: currentUser?.id
                  })
                });
                
                // Then like them back to create mutual match
                const likeResult = await likeUser(profiles[currentIndex].id);
                if (likeResult.mutual_match) {
                  alert('🎉 Mutual match created! Check your matches page.');
                }
              } catch (error) {
                console.error('Error creating test match:', error);
              }
            }
          }}
          className="fixed top-4 right-4 z-50 bg-purple-500 text-white px-3 py-1 rounded text-xs"
        >
          Test Match
        </button>
      )}

      {/* Chat Window for Mutual Matches */}
      {showChat && currentMatch && (
        <ChatWindow
          match={currentMatch}
          currentUser={currentUser}
          onClose={() => {
            setShowChat(false);
            setCurrentMatch(null);
          }}
        />
      )}
    </div>
  );
};

export default HomeSwiping;