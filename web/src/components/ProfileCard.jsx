import React, { forwardRef } from 'react';
import TinderCard from 'react-tinder-card';
import { FiInfo } from 'react-icons/fi';

const ProfileCard = forwardRef(({ profile, onSwipe, onShowDetail, onCardLeftScreen, style, isTouchDevice }, ref) => {
  if (!profile) return null;

  const { first_name, age, bio, user_photos } = profile;
  const photoUrl = user_photos?.[0]?.photo;

  return (
    <div style={style} className='absolute'>
      <TinderCard
        ref={ref}
        className='w-full h-full'
        onSwipe={onSwipe}
        onCardLeftScreen={onCardLeftScreen}
        preventSwipe={isTouchDevice ? ['up', 'down'] : ['up', 'down', 'left', 'right']}
        key={profile.id}
      >
        <div
          className="w-full max-w-md h-full max-h-[85vh] aspect-[9/16] rounded-2xl shadow-2xl bg-cover bg-center relative overflow-hidden flex flex-col justify-end bg-gray-200"
        >
          {photoUrl ? (
            <div 
              style={{ backgroundImage: `url(${photoUrl})` }}
              className="absolute inset-0 w-full h-full object-cover bg-cover bg-center -z-10"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
              <p className="text-gray-500">No Photo</p>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"></div>

          <div className="relative z-10 p-6 text-white flex flex-col gap-4">
            <div className="flex items-center gap-4 cursor-pointer" onClick={onShowDetail}>
              <h1 className="text-4xl font-bold drop-shadow-lg">{first_name}, {age}</h1>
              <button
                onClick={(e) => { e.stopPropagation(); onShowDetail(); }}
                className="bg-white/20 backdrop-blur-md rounded-full p-2 hover:bg-white/30 transition"
              >
                <FiInfo size={24} />
              </button>
            </div>
            <p className="text-lg drop-shadow-md leading-relaxed cursor-pointer" onClick={onShowDetail}>{bio}</p>
          </div>
        </div>
      </TinderCard>
    </div>
  );
});

export default ProfileCard;
