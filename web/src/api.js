import axios from 'axios';

// Create a centralized Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 10000, // 10 second timeout
});

// --- Interceptor to add the auth token to every request ---
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- API Functions ---

export const getPotentialMatches = async (filters) => {
  try {
    const response = await apiClient.get('/potential-matches/', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching potential matches:', error);
    throw error;
  }
};

export const postSwipe = async (profileId, swipeType) => {
  try {
    const response = await apiClient.post('/swipes/', { 
      profile: profileId, 
      swipe_type: swipeType 
    });
    return response.data;
  } catch (error) {
    console.error(`Error posting swipe (${swipeType}):`, error);
    throw error;
  }
};

export const rewindSwipe = async () => {
  try {
    const response = await apiClient.post('/rewind/');
    return response.data;
  } catch (error) {
    console.error('Error rewinding swipe:', error);
    throw error;
  }
};

export const resetSwipes = async () => {
  try {
    const response = await apiClient.post('/reset-swipes/');
    return response.data;
  } catch (error) {
    console.error('Error resetting swipes:', error);
    throw error;
  }
};

export const getMatches = async () => {
  try {
    const response = await apiClient.get('/matches/');
    return response.data;
  } catch (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }
};

// You can add other API functions here, using the `apiClient` instance.

export const initializePayment = async (payload = {}) => {
  try {
    const response = await apiClient.post('/initialize-payment/', payload);
    return response.data;
  } catch (error) {
    console.error('Error initializing payment:', error);
    throw error;
  }
};

// --- Coins & Gifts ---
export const getCoinPackages = async () => {
  try {
    const response = await apiClient.get('/coins/packages/');
    return response.data;
  } catch (error) {
    console.error('Error fetching coin packages:', error);
    throw error;
  }
};

export const createTopUp = async (packageId) => {
  try {
    const response = await apiClient.post('/coins/purchase/', { package_id: packageId });
    return response.data;
  } catch (error) {
    console.error('Error creating coin purchase:', error);
    throw error;
  }
};

export const getWallet = async () => {
  try {
    const response = await apiClient.get('/coins/wallet/');
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet:', error);
    throw error;
  }
};

// --- Subscriptions ---
export const getSubscriptionPlans = async () => {
  try {
    const response = await apiClient.get('/subscription-plans/');
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
};

export const subscribeToPlan = async (planId) => {
  try {
    const response = await apiClient.post('/subscriptions/subscribe/', { plan_id: planId });
    return response.data;
  } catch (error) {
    console.error('Error subscribing to plan:', error);
    throw error;
  }
};

export const activateSubscription = async (planId) => {
  try {
    const response = await apiClient.post('/subscriptions/activate/', { plan_id: planId });
    return response.data;
  } catch (error) {
    console.error('Error activating subscription:', error);
    throw error;
  }
};

// --- Gifts ---
export const getGifts = async () => {
  try {
    const response = await apiClient.get('/gifts/types/');
    return response.data;
  } catch (error) {
    console.error('Error fetching gifts:', error);
    throw error;
  }
};

export const sendGift = async (recipientId, giftTypeId, quantity = 1, message = '') => {
  try {
    const response = await apiClient.post('/gifts/send/', { 
      receiver_id: recipientId, 
      gift_type_id: giftTypeId,
      quantity: quantity,
      message: message
    });
    return response.data;
  } catch (error) {
    console.error('Error sending gift:', error);
    throw error;
  }
};

// --- Gift History ---
export const getGiftHistory = async (type = 'all') => {
  try {
    const response = await apiClient.get(`/gifts/history/?type=${type}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching gift history:', error);
    throw error;
  }
};

// --- Bank Account Management ---
export const getBanks = async () => {
  try {
    const response = await apiClient.get('/banks/');
    return response.data;
  } catch (error) {
    console.error('Error fetching banks:', error);
    throw error;
  }
};

export const createSubAccount = async (bankCode, accountNumber, accountName) => {
  try {
    const response = await apiClient.post('/subaccount/create/', {
      bank_code: bankCode,
      account_number: accountNumber,
      account_name: accountName
    });
    return response.data;
  } catch (error) {
    console.error('Error creating subaccount:', error);
    throw error;
  }
};

// --- Account Management ---
export const deleteAccount = async () => {
  try {
    const response = await apiClient.delete('/user/me/');
    // If backend returns 204, treat as success
    if (response.status === 204) {
      localStorage.removeItem('token'); // Clear token on success
      return { detail: 'Deleted' };
    }
    return response.data;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

// --- Dev Utilities ---
export const devGrantCoins = async (coins) => {
  try {
    const response = await apiClient.post('/dev/grant-coins/', { coins });
    return response.data;
  } catch (error) {
    console.error('Error granting coins (dev):', error);
    throw error;
  }
};

// ===== ENHANCED MATCHING SYSTEM API FUNCTIONS =====

// Like a user
export const likeUser = async (userId) => {
  try {
    console.log('API: Sending like request for user:', userId);
    const response = await apiClient.post('/matches/like/', { liked: userId });
    console.log('API: Like response:', response.data);
    console.log('API: Mutual match?', response.data.mutual_match);
    console.log('API: Match data:', response.data.match_data);
    return response.data;
  } catch (error) {
    console.error('API: Error liking user:', error);
    console.error('API: Error details:', error.response?.data);
    throw error;
  }
};

// Get people I liked
export const getPeopleILike = async () => {
  try {
    const response = await apiClient.get('/matches/people-i-like/');
    return response.data;
  } catch (error) {
    console.error('Error fetching people I like:', error);
    throw error;
  }
};

// Get people who liked me (with subscription gating)
export const getPeopleWhoLikeMe = async () => {
  try {
    const response = await apiClient.get('/matches/people-who-like-me/');
    return response.data;
  } catch (error) {
    console.error('Error fetching people who like me:', error);
    throw error;
  }
};

// Get my matches
export const getMyMatches = async () => {
  try {
    const response = await apiClient.get('/matches/my-matches/');
    return response.data;
  } catch (error) {
    console.error('Error fetching my matches:', error);
    throw error;
  }
};

// Get messages for a specific match
export const getMatchMessages = async (matchId) => {
  try {
    const response = await apiClient.get(`/matches/${matchId}/messages/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching match messages:', error);
    throw error;
  }
};

// Remove a like
export const removeLike = async (likeId) => {
  try {
    const response = await apiClient.post('/matches/remove-like/', { like_id: likeId });
    return response.data;
  } catch (error) {
    console.error('Error removing like:', error);
    throw error;
  }
};

// Get match details
export const getMatchDetails = async (matchId) => {
  try {
    const response = await apiClient.get(`/matches/${matchId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching match details:', error);
    throw error;
  }
};

// Send message in a match
export const sendMatchMessage = async (matchId, content) => {
  try {
    const response = await apiClient.post(`/matches/${matchId}/send-message/`, { content });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export default apiClient; // Export the instance for general use if needed
