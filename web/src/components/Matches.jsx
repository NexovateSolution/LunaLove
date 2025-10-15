import React, { useState } from "react";
import { FiMessageCircle, FiSliders, FiHeart, FiStar, FiMapPin, FiClock } from "react-icons/fi";
import DiscoveryFilters from "./DiscoveryFilters";

export default function Matches({ matches, likedMe, onChat }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    ageMin: 18,
    ageMax: 99,
    distance: 50,
    interests: [],
    religion: "",
    country: "",
    gender: "",
  });
  const [tab, setTab] = useState("matches"); // "matches" or "likedMe"

  const INTERESTS = ["Music", "Sports", "Travel", "Movies", "Art", "Food", "Tech"];

  // Filtering logic
  const filterFn = match =>
    match.age >= filters.ageMin &&
    match.age <= filters.ageMax &&
    (typeof match.distance !== "number" || match.distance <= filters.distance) &&
    (filters.interests.length === 0 ||
      (match.interests && filters.interests.some(i => filters.interests.includes(i)))) &&
    (!filters.religion || match.religion === filters.religion) &&
    (!filters.country || match.country?.toLowerCase().includes(filters.country.toLowerCase())) &&
    (!filters.gender || match.gender === filters.gender);

  const filteredMatches = matches ? matches.filter(filterFn) : [];
  const filteredLikedMe = likedMe ? likedMe.filter(filterFn) : [];

  // Recommendation logic
  let recommendedMatch = null;
  if (filteredMatches.length > 0 && filters.interests.length > 0) {
    recommendedMatch = filteredMatches
      .map(match => ({
        match,
        shared: match.interests
          ? match.interests.filter(i => filters.interests.includes(i)).length
          : 0,
      }))
      .sort((a, b) => {
        if (b.shared !== a.shared) return b.shared - a.shared;
        if (typeof a.match.distance === "number" && typeof b.match.distance === "number") {
          if (a.match.distance !== b.match.distance) return a.match.distance - b.match.distance;
        }
        return a.match.age - b.match.age;
      })[0].match;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Your Matches
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {tab === "matches" ? "People you've matched with" : "People who liked you"}
            </p>
          </div>
          
          {/* Tab Switcher */}
          <div className="flex bg-gray-100 dark:bg-slate-700 rounded-2xl p-1">
            <button
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                tab === "matches" 
                  ? "bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm" 
                  : "text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
              }`}
              onClick={() => setTab("matches")}
            >
              <FiHeart size={18} />
              My Matches
              {filteredMatches.length > 0 && (
                <span className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full text-xs font-semibold">
                  {filteredMatches.length}
                </span>
              )}
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                tab === "likedMe" 
                  ? "bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm" 
                  : "text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
              }`}
              onClick={() => setTab("likedMe")}
            >
              <FiStar size={18} />
              People Who Liked Me
              {filteredLikedMe.length > 0 && (
                <span className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full text-xs font-semibold">
                  {filteredLikedMe.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Recommended Match */}
        {tab === "matches" && recommendedMatch && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FiStar className="text-yellow-500" size={20} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Top Match</h2>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-1 rounded-3xl">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={recommendedMatch.avatar}
                      alt={recommendedMatch.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full p-1">
                      <FiStar size={12} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{recommendedMatch.name}</h3>
                      <span className="text-gray-500 dark:text-gray-400">{recommendedMatch.age}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                      {recommendedMatch.lastMessage || "Say hi to your top match! ✨"}
                    </p>
                    {recommendedMatch.interests && recommendedMatch.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {recommendedMatch.interests.slice(0, 3).map(interest => (
                          <span key={interest} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                            {interest}
                          </span>
                        ))}
                        {recommendedMatch.interests.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                            +{recommendedMatch.interests.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                    onClick={() => onChat(recommendedMatch)}
                  >
                    <FiMessageCircle size={18} />
                    Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(tab === "matches" ? filteredMatches : filteredLikedMe).length > 0 ? (
            (tab === "matches" ? filteredMatches : filteredLikedMe).map(match => (
              <div
                key={match.id}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border border-gray-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <img
                        src={match.avatar}
                        alt={match.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      {match.unread && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{match.name}</h3>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">{match.age}</span>
                      </div>
                      {match.distance && (
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm mb-2">
                          <FiMapPin size={14} />
                          <span>{match.distance}km away</span>
                        </div>
                      )}
                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                        {match.lastMessage || "Start a conversation!"}
                      </p>
                    </div>
                  </div>
                  
                  {match.interests && match.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {match.interests.slice(0, 3).map(interest => (
                        <span key={interest} className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                          {interest}
                        </span>
                      ))}
                      {match.interests.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 rounded-full text-xs">
                          +{match.interests.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <button
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    onClick={() => onChat(match)}
                  >
                    <FiMessageCircle size={18} />
                    Start Chat
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                {tab === "matches" ? (
                  <FiHeart size={48} className="mx-auto mb-4 opacity-50" />
                ) : (
                  <FiStar size={48} className="mx-auto mb-4 opacity-50" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                {tab === "matches" ? "No matches yet" : "No likes yet"}
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                {tab === "matches"
                  ? "Keep swiping to find your perfect match!"
                  : "Don't worry, someone will notice you soon!"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Discovery Filters Modal */}
      <DiscoveryFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        interestsList={INTERESTS}
      />
    </div>
  );
}