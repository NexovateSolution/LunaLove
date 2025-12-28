import { create } from 'zustand';
import { User, AuthResponse } from '../types';
import ApiService from '../services/api';
import StorageService from '../utils/storage';
import WebSocketService from '../services/websocket';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasCompletedProfileSetup: boolean;
  
  // Actions
  login: (idToken: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshSubscriptionStatus: () => Promise<void>;
  completeProfileSetup: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
   hasCompletedProfileSetup: false,

  login: async (idToken: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const authResponse: AuthResponse = await ApiService.googleLogin(idToken);
      await StorageService.saveAuthToken(authResponse.token);
      
      const user = await ApiService.getCurrentUser();
      await StorageService.saveUserData(user);
      
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        hasCompletedProfileSetup: true,
      });

      // Connect WebSocket after successful login
      await WebSocketService.connect();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      set({ 
        error: errorMessage, 
        isLoading: false,
        isAuthenticated: false,
        user: null
      });
      throw error;
    }
  },

  loginWithEmail: async (email: string, password: string) => {
    try {
      console.log('[AuthStore] Starting email login...');
      set({ isLoading: true, error: null });
      
      console.log('[AuthStore] Calling API login...');
      const authResponse: AuthResponse = await ApiService.emailLogin(email, password);
      console.log('[AuthStore] Login API success, token received');
      await StorageService.saveAuthToken(authResponse.token);
      
      console.log('[AuthStore] Fetching current user...');
      const user = await ApiService.getCurrentUser();
      console.log('[AuthStore] User fetched:', user.email);
      await StorageService.saveUserData(user);
      
      console.log('[AuthStore] Setting authenticated state to TRUE');
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        hasCompletedProfileSetup: true,
      });
      console.log('[AuthStore] Login complete, isAuthenticated:', get().isAuthenticated);

      // Connect WebSocket after successful login
      await WebSocketService.connect();
    } catch (error: any) {
      console.error('[AuthStore] Login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed';
      set({ 
        error: errorMessage, 
        isLoading: false,
        isAuthenticated: false,
        user: null
      });
      throw error;
    }
  },

  signupWithEmail: async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      console.log('[AuthStore] Starting email signup...');
      set({ isLoading: true, error: null });
      
      console.log('[AuthStore] Calling API signup...');
      const authResponse: AuthResponse = await ApiService.emailSignup(email, password, firstName, lastName);
      console.log('[AuthStore] Signup API success, token received');
      await StorageService.saveAuthToken(authResponse.token);
      
      console.log('[AuthStore] Fetching current user...');
      const user = await ApiService.getCurrentUser();
      console.log('[AuthStore] User fetched:', user.email);
      await StorageService.saveUserData(user);
      
      console.log('[AuthStore] Setting authenticated state to TRUE');
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        hasCompletedProfileSetup: false,
      });
      console.log('[AuthStore] Signup complete, isAuthenticated:', get().isAuthenticated);

      // Connect WebSocket after successful login
      await WebSocketService.connect();
    } catch (error: any) {
      console.error('[AuthStore] Signup error:', error);
      const errorMessage = error.response?.data?.error || 'Signup failed';
      set({ 
        error: errorMessage, 
        isLoading: false,
        isAuthenticated: false,
        user: null
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await StorageService.clearAuthToken();
      await StorageService.clearUserData();
      WebSocketService.disconnect();
      
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });
      
      const token = await StorageService.getAuthToken();
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await ApiService.getCurrentUser();
      await StorageService.saveUserData(user);
      
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        hasCompletedProfileSetup: true,
      });

      // Connect WebSocket
      await WebSocketService.connect();
    } catch (error) {
      console.error('Load user error:', error);
      await get().logout();
    }
  },

  updateUser: (updates: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      set({ user: updatedUser });
      StorageService.saveUserData(updatedUser);
    }
  },

  completeProfileSetup: () => {
    set({ hasCompletedProfileSetup: true });
  },

  refreshSubscriptionStatus: async () => {
    try {
      const status = await ApiService.getSubscriptionStatus();
      const currentUser = get().user;
      if (currentUser) {
        get().updateUser({
          has_boost: status.has_boost,
          can_see_likes: status.can_see_likes,
          ad_free: status.ad_free,
          boost_expiry: status.boost_expiry,
          likes_reveal_expiry: status.likes_reveal_expiry,
          ad_free_expiry: status.ad_free_expiry,
        });
      }
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
    }
  },
}));
