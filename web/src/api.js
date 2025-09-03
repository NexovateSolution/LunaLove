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

export default apiClient; // Export the instance for general use if needed
