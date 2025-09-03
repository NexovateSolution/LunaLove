import React, { useState, useEffect, useCallback } from 'react';
import Confetti from 'react-confetti';
import { FiLoader, FiUsers, FiX, FiSliders, FiRewind, FiInfo } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { postSwipe, getPotentialMatches as getProfiles, rewindSwipe, resetSwipes } from '../api';
import ProfileDetail from './ProfileDetail';
import DiscoveryFilters from './DiscoveryFilters';

const HomeSwiping = () => {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
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

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getProfiles(filters);
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

  const handleRefresh = async () => {
    try {
      await resetSwipes();
      await fetchProfiles();
    } catch (error) {
      console.error('Failed to refresh profiles:', error);
    }
  };


  const handleSwipe = async (action) => {
    if (profiles.length === 0 || currentIndex >= profiles.length) return;

    const profileId = profiles[currentIndex].id;
    try {
      const swipeResult = await postSwipe(profileId, action);
      if (swipeResult.match) {
        setShowConfetti(true);
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
      className="w-full flex flex-col items-center justify-start bg-gradient-to-b from-fuchsia-50 to-rose-100 dark:bg-gradient-to-b dark:from-slate-800 dark:to-slate-900 relative p-4 pt-6 space-y-4 pb-36 md:pb-40"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 9rem)' }}
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
      <div className="w-full flex-grow flex items-center justify-center">
        {currentProfile ? (
                              <div className="w-full max-w-sm max-h-[70vh] bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col mb-32 md:mb-40">
            {/* Image container (more reduction to free space for bio) */}
            <div className="relative w-full h-[36%] bg-gray-300">
              {currentProfile.user_photos && currentProfile.user_photos.length > 0 ? (
                <img src={currentProfile.user_photos[0].photo} alt={currentProfile.first_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500">No Photo</div>
              )}
            </div>
            {/* Info container (more bottom padding so bio clears floating bar) */}
            <div className="p-4 pb-40 md:pb-44 flex flex-col justify-between flex-grow">
              <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{currentProfile.first_name}, {currentProfile.age}</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-1 line-clamp-6">{currentProfile.bio || 'No bio yet.'}</p>
                </div>
                <button onClick={() => handleShowDetail(currentProfile)} className="text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400">
                    <FiInfo size={24} />
                </button>
              </div>
            </div>

            {/* Action buttons moved to a floating bar */}

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

      {currentProfile && !showFilters && (
        <div
          className="fixed left-1/2 transform -translate-x-1/2 z-[100] w-[80vw] max-w-sm"
          style={{ bottom: actionBarBottom }}
        >
          <div className="flex justify-around items-center bg-white dark:bg-slate-800 shadow-xl rounded-full py-2 px-2 gap-2 border border-gray-200 dark:border-slate-700">
            <button
              className="bg-white dark:bg-slate-700 shadow-lg rounded-full p-3 text-amber-500 hover:bg-gray-50 dark:hover:bg-slate-600 transition-transform transform hover:scale-110 active:scale-95 disabled:opacity-50"
              onClick={handleRewind}
              disabled={currentIndex === 0}
              aria-label="Rewind"
            >
              <FiRewind size={20} />
            </button>
            <button
              className="bg-white dark:bg-slate-700 shadow-lg rounded-full p-3.5 text-rose-500 hover:bg-gray-50 dark:hover:bg-slate-600 transition-transform transform hover:scale-110 active:scale-95"
              onClick={() => handleSwipe('dislike')}
              aria-label="Pass"
            >
              <FiX size={22} />
            </button>
            <button
              className="bg-white dark:bg-slate-700 shadow-lg rounded-full p-3.5 text-pink-500 hover:bg-gray-50 dark:hover:bg-slate-600 transition-transform transform hover:scale-110 active:scale-95"
              onClick={() => handleSwipe('like')}
              aria-label="Like"
            >
              <FaHeart size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeSwiping;