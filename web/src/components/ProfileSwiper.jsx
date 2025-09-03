import React, { useState } from "react";
import { FiX, FiHeart, FiSliders } from "react-icons/fi";

export default function ProfileSwiper({
  profiles,
  onLike,
  onDislike,
  onFilter,
  onProfileDetail,
  currentIndex = 0,
}) {
  const [index, setIndex] = useState(currentIndex);
  const [imgIndex, setImgIndex] = useState(0);

  if (!profiles || profiles.length === 0) return null;
  const profile = profiles[index];
  const pictures = profile.pictures && profile.pictures.length > 0 ? profile.pictures : [profile.avatar];

  const nextProfile = () => {
    setIndex((prev) => (prev + 1) % profiles.length);
    setImgIndex(0);
  };

  // Carousel controls
  const nextImage = (e) => {
    e.stopPropagation();
    setImgIndex((prev) => (prev + 1) % pictures.length);
  };
  const prevImage = (e) => {
    e.stopPropagation();
    setImgIndex((prev) => (prev - 1 + pictures.length) % pictures.length);
  };

  // Full-screen tap for detail
  const handleDetail = () => onProfileDetail(profile);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black"
      style={{ touchAction: "pan-y" }}
      onClick={handleDetail}
    >
      {/* Full-screen image carousel */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={pictures[imgIndex]}
          alt={`Profile ${imgIndex + 1}`}
          className="object-cover w-full h-full"
          draggable={false}
        />
        {/* Carousel controls */}
        {pictures.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full"
              onClick={prevImage}
              style={{ zIndex: 20 }}
            >
              ‹
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full"
              onClick={nextImage}
              style={{ zIndex: 20 }}
            >
              ›
            </button>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
              {pictures.map((_, i) => (
                <span
                  key={i}
                  className={`inline-block w-2 h-2 rounded-full ${i === imgIndex ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
          </>
        )}
        {/* Profile Info Overlay */}
        <div className="absolute bottom-32 left-0 right-0 flex flex-col items-center z-20">
          <div className="bg-black/60 rounded-xl px-6 py-3 text-white text-center max-w-xs mx-auto">
            <div className="text-xl font-bold">{profile.name}, {profile.age}</div>
            {profile.bio && <div className="text-sm mt-1">{profile.bio}</div>}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                {profile.interests.map(i => (
                  <span key={i} className="px-2 py-0.5 bg-fuchsia-500 text-white rounded-full text-xs">{i}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Overlay Buttons */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-10 z-30">
          <button
            className="bg-white/80 text-fuchsia-700 p-5 rounded-full shadow-xl hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onDislike(profile);
              nextProfile();
            }}
            title="Dislike"
          >
            <FiX size={32} />
          </button>
          <button
            className="bg-red-600 text-white p-6 rounded-full shadow-xl hover:bg-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onLike(profile);
              nextProfile();
            }}
            title="Like"
          >
            <FiHeart size={36} />
          </button>
        </div>
        {/* Filter Button */}
        <button
          className="absolute top-6 right-6 bg-white/80 text-fuchsia-700 p-3 rounded-full shadow-xl hover:bg-white z-30"
          onClick={(e) => {
            e.stopPropagation();
            onFilter();
          }}
          title="Filter"
        >
          <FiSliders size={24} />
        </button>
      </div>
    </div>
  );
}