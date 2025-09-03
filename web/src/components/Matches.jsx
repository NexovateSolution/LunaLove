import React, { useState } from "react";
import { FiMessageCircle, FiSliders } from "react-icons/fi";
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
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-4
      bg-gradient-to-br from-pink-100 via-fuchsia-100 to-purple-200
      dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
    >
      <h2 className="text-3xl font-extrabold text-fuchsia-700 mb-8">Your Matches</h2>
      {/* Tab Switcher */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded-full ${tab === "matches" ? "bg-fuchsia-600 text-white" : "bg-fuchsia-100 text-fuchsia-700"}`}
          onClick={() => setTab("matches")}
        >
          My Matches
        </button>
        <button
          className={`px-4 py-2 rounded-full ${tab === "likedMe" ? "bg-fuchsia-600 text-white" : "bg-fuchsia-100 text-fuchsia-700"}`}
          onClick={() => setTab("likedMe")}
        >
          People Who Liked Me
        </button>
      </div>
      {/* Recommended Match */}
      {tab === "matches" && recommendedMatch && (
        <div className="w-full max-w-lg mb-6">
          <div className="flex items-center bg-fuchsia-50 dark:bg-gray-800/80 rounded-2xl shadow-lg border-2 border-fuchsia-400 p-5 relative animate-pulse">
            <img
              src={recommendedMatch.avatar}
              alt={recommendedMatch.name}
              className="w-20 h-20 rounded-full border-4 border-fuchsia-400 mr-6"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-xl text-fuchsia-700">{recommendedMatch.name}</span>
                <span className="text-gray-400 text-lg">{recommendedMatch.age}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {recommendedMatch.interests && recommendedMatch.interests.map(i => (
                  <span key={i} className="px-2 py-0.5 bg-fuchsia-100 text-fuchsia-700 rounded-full text-xs">{i}</span>
                ))}
              </div>
              <div className="text-gray-600 dark:text-gray-200 text-sm">
                {recommendedMatch.lastMessage || "Say hi to your top match!"}
              </div>
            </div>
            <button
              className="ml-4 flex items-center gap-1 px-4 py-2 rounded-full bg-fuchsia-500 text-white font-semibold shadow hover:bg-fuchsia-600 transition"
              onClick={() => onChat(recommendedMatch)}
              title="Open Chat"
            >
              <FiMessageCircle className="text-xl" />
              Chat
            </button>
            <span className="absolute top-2 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow">
              Recommended
            </span>
          </div>
        </div>
      )}

      {/* Matches or LikedMe List */}
      <div className="w-full max-w-lg flex flex-col gap-5">
        {(tab === "matches" ? filteredMatches : filteredLikedMe).length > 0 ? (
          (tab === "matches" ? filteredMatches : filteredLikedMe).map(match => (
            <div
              key={match.id}
              className="flex items-center bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-md border border-fuchsia-100 dark:border-fuchsia-900 transition-transform hover:scale-[1.02] hover:shadow-lg p-4 relative"
            >
              <img
                src={match.avatar}
                alt={match.name}
                className="w-16 h-16 rounded-full border-2 border-fuchsia-400 mr-4"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg text-fuchsia-600">{match.name}</span>
                  <span className="text-gray-400 text-sm">{match.age}</span>
                  {match.unread && (
                    <span className="ml-2 w-3 h-3 bg-fuchsia-500 rounded-full animate-pulse"></span>
                  )}
                </div>
                <div className="text-gray-500 dark:text-gray-300 text-sm mt-1">
                  {match.lastMessage}
                </div>
                {/* Show interests */}
                {match.interests && match.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {match.interests.map(i => (
                      <span key={i} className="px-2 py-0.5 bg-fuchsia-100 text-fuchsia-700 rounded-full text-xs">{i}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="ml-4 flex items-center gap-1 px-4 py-2 rounded-full bg-fuchsia-500 text-white font-semibold shadow hover:bg-fuchsia-600 transition"
                onClick={() => onChat(match)}
                title="Open Chat"
              >
                <FiMessageCircle className="text-xl" />
                Chat
              </button>
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-center py-12">
            {tab === "matches"
              ? "No matches found. Try adjusting your filters!"
              : "No one has liked you yet. Keep swiping!"}
          </div>
        )}
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