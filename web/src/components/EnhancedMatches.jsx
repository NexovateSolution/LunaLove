import React, { useState, useEffect } from 'react';
import { 
  FiHeart, FiEye, FiUsers, FiMessageCircle, FiX, FiRefreshCw, FiMapPin, FiCalendar, FiUser,
  FiStar, FiActivity, FiCoffee, FiMusic, FiCamera, FiBook, FiTrendingUp, FiAward,
  FiChevronLeft, FiChevronRight, FiMoreHorizontal
} from 'react-icons/fi';
import { FaHeart, FaEye, FaUsers, FaGraduationCap, FaBriefcase, FaRulerVertical, FaWeight, 
         FaGlassCheers, FaSmoking, FaPray, FaVenus, FaMars, FaTransgender } from 'react-icons/fa';
import { 
  getPeopleILike, 
  getPeopleWhoLikeMe, 
  getMyMatches, 
  removeLike 
} from '../api';

const EnhancedMatches = ({ onChat, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('liked');
  
  // State with API functionality
  const [peopleILike, setPeopleILike] = useState([]);
  const [peopleWhoLikeMe, setPeopleWhoLikeMe] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likesData, setLikesData] = useState({ results: [], count: 0, has_subscription: false });
  const [currentUser, setCurrentUser] = useState(null);
  
  // User details modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    loadAllData();
    fetchCurrentUser();
  }, []);

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

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load people I like
      try {
        const likesResponse = await getPeopleILike();
        console.log('People I like response:', likesResponse);
        console.log('First like object:', likesResponse[0]);
        setPeopleILike(Array.isArray(likesResponse) ? likesResponse : []);
      } catch (err) {
        console.error('Error loading people I like:', err);
        setPeopleILike([]);
      }

      // Load other data (simplified for now)
      try {
        const whoLikesMeResponse = await getPeopleWhoLikeMe();
        setLikesData(whoLikesMeResponse || { results: [], count: 0, has_subscription: false });
        setPeopleWhoLikeMe(whoLikesMeResponse?.results || []);
      } catch (err) {
        console.error('Error loading people who like me:', err);
      }

      try {
        const matchesResponse = await getMyMatches();
        setMyMatches(Array.isArray(matchesResponse) ? matchesResponse : []);
      } catch (err) {
        console.error('Error loading matches:', err);
        setMyMatches([]);
      }

    } catch (err) {
      setError('Failed to load matches data');
      console.error('Error loading matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLike = async (likeId) => {
    console.log('Attempting to remove like with ID:', likeId);
    
    if (!likeId) {
      console.error('No like ID provided');
      return;
    }

    try {
      console.log('Calling removeLike API...');
      const result = await removeLike(likeId);
      console.log('Remove like result:', result);
      
      // Refresh the people I like list
      console.log('Refreshing people I like list...');
      const updatedLikes = await getPeopleILike();
      console.log('Updated likes:', updatedLikes);
      setPeopleILike(Array.isArray(updatedLikes) ? updatedLikes : []);
      
    } catch (err) {
      console.error('Error removing like:', err);
    }
  };

  const handleLikeBack = (userId) => {
    console.log('Like back:', userId);
  };

  // Helper function for getting profile image
  const getProfileImage = (user) => {
    console.log('Getting profile image for user:', user);
    
    // Try user_photos first (from UserSerializer)
    if (user?.user_photos && user.user_photos.length > 0) {
      const firstPhoto = user.user_photos[0];
      console.log('First user_photo:', firstPhoto);
      
      if (firstPhoto && typeof firstPhoto === 'object' && firstPhoto.photo) {
        console.log('Using user_photos[0].photo:', firstPhoto.photo);
        return firstPhoto.photo;
      }
    }
    
    // Try photos field (fallback)
    if (user?.photos && user.photos.length > 0) {
      const firstPhoto = user.photos[0];
      console.log('First photo:', firstPhoto);
      
      // If photos is an array of objects with photo property
      if (firstPhoto && typeof firstPhoto === 'object' && firstPhoto.photo) {
        console.log('Using photos[0].photo:', firstPhoto.photo);
        return firstPhoto.photo;
      }
      // If photos is an array of strings
      if (typeof firstPhoto === 'string') {
        console.log('Using direct photo string:', firstPhoto);
        return firstPhoto;
      }
      // If it's an object but with different structure
      if (firstPhoto && typeof firstPhoto === 'object') {
        console.log('Photo object keys:', Object.keys(firstPhoto));
        // Try common property names
        if (firstPhoto.url) return firstPhoto.url;
        if (firstPhoto.image) return firstPhoto.image;
        if (firstPhoto.src) return firstPhoto.src;
      }
    }
    
    console.log('No valid photo found, using default avatar');
    // Fallback to default avatar
    return '/avatar.png';
  };

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
    const photos = getAllPhotos(selectedUser);
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    const photos = getAllPhotos(selectedUser);
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToPhoto = (index) => {
    setCurrentPhotoIndex(index);
  };

  // Keyboard navigation for photos
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!showUserDetails) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPhoto();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextPhoto();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowUserDetails(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showUserDetails, selectedUser]);

  const renderTabButton = (tabId, icon, label, count) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex-1 flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all duration-200 ${
        activeTab === tabId
          ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
          : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
      }`}
    >
      <div className="relative">
        {icon}
        {count > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  const renderUserCard = (user, type, likeId = null) => {
    if (!user) return null;
    const isBlurred = user?.id === 'blurred';
    
    // Use the getProfileImage function defined above

    const handleCardClick = () => {
      if (!isBlurred && user) {
        setSelectedUser(user);
        setCurrentPhotoIndex(0); // Reset to first photo
        setShowUserDetails(true);
      }
    };
    
    return (
      <div
        key={user.id || Math.random()}
        onClick={handleCardClick}
        className={`bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:shadow-xl cursor-pointer transform hover:scale-105 ${
          isBlurred ? 'relative' : ''
        }`}
      >
        {/* Profile Image */}
        <div className="relative h-64">
          {isBlurred ? (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center">
              <FiLock size={48} className="text-gray-400 dark:text-gray-500" />
            </div>
          ) : (
            <img
              src={getProfileImage(user)}
              alt={user.first_name || user.username || 'User'}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                e.target.src = '/avatar.png';
              }}
            />
          )}
          
          {/* Age badge */}
          {!isBlurred && user.age && (
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
              {user.age}
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isBlurred ? '***' : (user.first_name || user.username || 'User')}
                </h3>
                {!isBlurred && user.gender && (
                  <div className="flex items-center">
                    {user.gender === 'male' && <FaMars className="text-blue-500" size={16} />}
                    {user.gender === 'female' && <FaVenus className="text-pink-500" size={16} />}
                    {user.gender === 'other' && <FaTransgender className="text-purple-500" size={16} />}
                  </div>
                )}
              </div>
              
              {!isBlurred && (
                <div className="space-y-1">
                  {user.age && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                      <FiCalendar size={12} />
                      {user.age} years old
                    </p>
                  )}
                  
                  {user.city && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                      <FiMapPin size={12} />
                      {user.city}{user.country && `, ${user.country}`}
                    </p>
                  )}
                  
                  {user.occupation && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                      <FaBriefcase size={12} />
                      {user.occupation}
                    </p>
                  )}
                  
                  {user.education && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                      <FaGraduationCap size={12} />
                      {user.education}
                    </p>
                  )}
                  
                  {user.relationship_intent && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium mt-2">
                      <FiHeart size={10} />
                      <span>{user.relationship_intent}</span>
                    </div>
                  )}
                </div>
              )}
              
              {!isBlurred && user.bio && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 line-clamp-2 italic">
                  "{user.bio}"
                </p>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              {type === 'liked' && !isBlurred && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    handleRemoveLike(likeId);
                  }}
                  className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  title="Remove like"
                >
                  <FiX className="text-gray-600 dark:text-gray-400 hover:text-red-500" />
                </button>
              )}
              
              {type === 'who-likes-me' && !isBlurred && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    handleLikeBack(user.id);
                  }}
                  className="p-2 bg-pink-100 dark:bg-pink-900/20 hover:bg-pink-200 dark:hover:bg-pink-900/40 rounded-full transition-colors"
                  title="Like back"
                >
                  <FaHeart className="text-pink-500" />
                </button>
              )}
              
              {type === 'match' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    onChat && onChat(user);
                  }}
                  className="p-2 bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/40 rounded-full transition-colors"
                  title="Start chat"
                >
                  <FiMessageCircle className="text-blue-500" />
                </button>
              )}
            </div>
          </div>

          {/* Subscription upsell for blurred profiles */}
          {isBlurred && (
            <button
              onClick={() => onNavigate && onNavigate('purchase')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center justify-center gap-2">
                <FiCrown />
                Subscribe to See
              </div>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <FiRefreshCw className="animate-spin text-4xl text-purple-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading matches...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadAllData}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'liked':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">People I Like</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {peopleILike.length} people you've liked. You can remove likes if you change your mind.
              </p>
            </div>
            
            {peopleILike.length === 0 ? (
              <div className="text-center py-20">
                <FaHeart className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No likes yet</h3>
                <p className="text-gray-500 dark:text-gray-500">Start swiping to find people you like!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {peopleILike.map((like, index) => {
                  const user = like.liked || like; // Handle different response formats
                  const likeId = like.id || like.like_id; // Handle different ID formats
                  console.log(`Rendering like ${index}:`, { like, user, likeId });
                  return (
                    <div key={likeId || index}>
                      {renderUserCard(user, 'liked', likeId)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'who-likes-me':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">People Who Like Me</h2>
              <div className="flex items-center justify-between">
                <p className="text-gray-600 dark:text-gray-400">
                  {likesData?.count || 0} people liked you
                </p>
                {!likesData?.has_subscription && likesData?.count > 0 && (
                  <button
                    onClick={() => onNavigate && onNavigate('purchase')}
                    className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                  >
                    <FiZap />
                    Unlock All
                  </button>
                )}
              </div>
            </div>

            {/* Subscription upsell banner */}
            {!likesData?.has_subscription && likesData?.count > 0 && (
              <div className="mb-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl p-1 shadow-xl">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                        <FiEye className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {likesData.upsell_message}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Subscribe to see who they are and like them back!
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate && onNavigate('purchase')}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {peopleWhoLikeMe.length === 0 ? (
              <div className="text-center py-20">
                <FaEye className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No likes yet</h3>
                <p className="text-gray-500 dark:text-gray-500">Keep swiping - someone will like you soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <p>People who like me will appear here</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'matches':
      default:
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Matches</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {myMatches.length} mutual matches. Start chatting!
              </p>
            </div>
            
            {myMatches.length === 0 ? (
              <div className="text-center py-20">
                <FaUsers className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No matches yet</h3>
                <p className="text-gray-500 dark:text-gray-500">Keep swiping to find your perfect match!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myMatches.map((match, index) => {
                  // Get the other user (not the current user)
                  const otherUser = match.liker?.id === currentUser?.id ? match.liked : match.liker;
                  if (!otherUser) return null;
                  
                  return (
                    <div key={match.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <div className="relative">
                        <img
                          src={getProfileImage(otherUser)}
                          alt={otherUser.first_name}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.target.src = '/avatar.png';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-4 left-4 text-white">
                          <h3 className="text-lg font-semibold">{otherUser.first_name}</h3>
                          <p className="text-sm opacity-90">{otherUser.age ? `${otherUser.age} years old` : ''}</p>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FaHeart className="text-pink-500" size={16} />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Mutual Match</span>
                          </div>
                          <button
                            onClick={() => onChat && onChat(match)}
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2"
                          >
                            <FiMessageCircle size={16} />
                            Chat
                          </button>
                        </div>
                        
                        {otherUser.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                            {otherUser.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
              <FiHeart className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Matches
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Discover your connections</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4">
            {renderTabButton('liked', <FiHeart size={20} />, 'People I Like', peopleILike.length)}
            {renderTabButton('who-likes-me', <FiEye size={20} />, 'Who Likes Me', likesData?.count || 0)}
            {renderTabButton('matches', <FiUsers size={20} />, 'My Matches', myMatches.length)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {renderContent()}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Enhanced Photo Gallery Header */}
            <div className="relative">
              {(() => {
                const photos = getAllPhotos(selectedUser);
                const currentPhoto = photos[currentPhotoIndex] || '/avatar.png';
                
                return (
                  <>
                    {/* Main Photo */}
                    <div className="relative h-80 bg-gray-200 dark:bg-gray-700 rounded-t-3xl overflow-hidden">
                      <img
                        src={currentPhoto}
                        alt={`${selectedUser.first_name} - Photo ${currentPhotoIndex + 1}`}
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
                        onClick={() => setShowUserDetails(false)}
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
                      {selectedUser.age && (
                        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {selectedUser.age} years old
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
                  </>
                );
              })()}
            </div>

            {/* Profile Details */}
            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedUser.first_name || selectedUser.username || 'User'}
                  {selectedUser.last_name && ` ${selectedUser.last_name}`}
                </h2>
                
                {/* Basic Info Row */}
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {selectedUser.age && (
                    <div className="flex items-center gap-1">
                      <FiCalendar size={14} />
                      <span>{selectedUser.age} years old</span>
                    </div>
                  )}
                  {selectedUser.gender && (
                    <div className="flex items-center gap-1">
                      {selectedUser.gender === 'male' && <FaMars className="text-blue-500" size={14} />}
                      {selectedUser.gender === 'female' && <FaVenus className="text-pink-500" size={14} />}
                      {selectedUser.gender === 'other' && <FaTransgender className="text-purple-500" size={14} />}
                      <span className="capitalize">{selectedUser.gender}</span>
                    </div>
                  )}
                </div>

                {/* Location */}
                {(selectedUser.city || selectedUser.country) && (
                  <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400 mb-4">
                    <FiMapPin size={16} />
                    <span>
                      {selectedUser.city}
                      {selectedUser.city && selectedUser.country && ', '}
                      {selectedUser.country}
                    </span>
                  </div>
                )}

                {/* Relationship Intent Badge */}
                {selectedUser.relationship_intent && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-4">
                    <FiHeart size={14} />
                    <span>Looking for {selectedUser.relationship_intent}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {selectedUser.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <FiUser size={18} />
                    About
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedUser.bio}
                  </p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 gap-3 mb-6">
                {/* Professional Info */}
                {selectedUser.education && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/20">
                    <FaGraduationCap className="text-blue-500" size={20} />
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Education</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedUser.education}</p>
                    </div>
                  </div>
                )}
                
                {selectedUser.occupation && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl border border-green-100 dark:border-green-800/20">
                    <FaBriefcase className="text-green-500" size={20} />
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">Occupation</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedUser.occupation}</p>
                    </div>
                  </div>
                )}

                {/* Physical Attributes */}
                {selectedUser.height && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/20">
                    <FaRulerVertical className="text-purple-500" size={20} />
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Height</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedUser.height} cm</p>
                    </div>
                  </div>
                )}

                {/* Lifestyle */}
                {selectedUser.drinking_habits && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl border border-amber-100 dark:border-amber-800/20">
                    <FaGlassCheers className="text-amber-500" size={20} />
                    <div>
                      <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Drinking</p>
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">{selectedUser.drinking_habits}</p>
                    </div>
                  </div>
                )}

                {selectedUser.smoking_habits && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/10 dark:to-slate-900/10 rounded-2xl border border-gray-100 dark:border-gray-800/20">
                    <FaSmoking className="text-gray-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Smoking</p>
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">{selectedUser.smoking_habits}</p>
                    </div>
                  </div>
                )}

                {/* Beliefs & Values */}
                {selectedUser.religion && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 rounded-2xl border border-teal-100 dark:border-teal-800/20">
                    <FaPray className="text-teal-500" size={20} />
                    <div>
                      <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">Religion</p>
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">{selectedUser.religion}</p>
                    </div>
                  </div>
                )}

                {selectedUser.relationship_type && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 rounded-2xl border border-rose-100 dark:border-rose-800/20">
                    <FiHeart className="text-rose-500" size={20} />
                    <div>
                      <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">Relationship Type</p>
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">{selectedUser.relationship_type}</p>
                    </div>
                  </div>
                )}

                {/* Profile Completeness */}
                {selectedUser.profile_completeness_score && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/20">
                    <FiTrendingUp className="text-emerald-500" size={20} />
                    <div className="flex-1">
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Profile Completeness</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${selectedUser.profile_completeness_score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedUser.profile_completeness_score}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Interests */}
              {selectedUser.interests && selectedUser.interests.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                      >
                        {interest.name || interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
                {activeTab === 'matches' && (
                  <button
                    onClick={() => {
                      setShowUserDetails(false);
                      onChat && onChat(selectedUser);
                    }}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <FiMessageCircle />
                    Start Chat
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMatches;
