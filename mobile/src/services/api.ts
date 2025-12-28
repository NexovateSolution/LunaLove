import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG } from '../constants/config';
import StorageService from '../utils/storage';
import {
  User,
  PotentialMatch,
  Like,
  Match,
  ChatMessage,
  GiftType,
  CoinPackage,
  Wallet,
  SubscriptionPlan,
  AuthResponse,
  LikeResponse,
  SwipeAction,
} from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await StorageService.getAuthToken();
        if (token) {
          config.headers.Authorization = `Token ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear auth and redirect to login
          await StorageService.clearAuthToken();
          await StorageService.clearUserData();
          // Emit event for auth state change
          // This will be handled by the auth store
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async googleLogin(idToken: string): Promise<AuthResponse> {
    const response = await this.client.post('/auth/google/', { id_token: idToken });
    return response.data;
  }

  async emailLogin(email: string, password: string): Promise<AuthResponse> {
    console.log('[API] Email login attempt:', { email, baseURL: this.client.defaults.baseURL });
    try {
      const response = await this.client.post('/login/', { username: email, password });
      console.log('[API] Login successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[API] Login failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async emailSignup(email: string, password: string, firstName: string, lastName: string): Promise<AuthResponse> {
    console.log('[API] Email signup attempt:', { email, firstName, lastName, baseURL: this.client.defaults.baseURL });
    try {
      const response = await this.client.post('/register/', {
        email,
        password,
        password2: password,
        first_name: firstName,
        last_name: lastName,
      });
      console.log('[API] Signup successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[API] Signup failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get<User>('/user/me/');
    return data;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const { data } = await this.client.patch<User>('/user/me/', updates);
    return data;
  }

  async getCities(countryCode: string): Promise<{ value: string; label: string }[]> {
    const { data } = await this.client.get<{ value: string; label: string }[]>('/cities/', {
      params: { country: countryCode },
    });
    return data;
  }

  async getCountries(): Promise<{ code: string; label: string }[]> {
    // Use public REST Countries API to fetch all countries
    const { data } = await axios.get<any[]>(
      'https://restcountries.com/v3.1/all?fields=name,cca2',
    );

    const countries: { code: string; label: string }[] = (data || [])
      .filter((country) => country?.cca2 && country?.name?.common)
      .map((country) => ({
        code: country.cca2 as string,
        label: country.name.common as string,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return countries;
  }

  async updatePreferences(preferences: any): Promise<any> {
    const { data } = await this.client.patch('/user/preferences/', preferences);
    return data;
  }

  async getPreferences(): Promise<any> {
    const { data } = await this.client.get('/user/preferences/');
    return data;
  }

  async uploadPhoto(formData: FormData): Promise<any> {
    const { data } = await this.client.post('/user/photos/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  async deletePhoto(photoId: string): Promise<void> {
    await this.client.delete(`/user/photos/${photoId}/`);
  }

  async setPrimaryPhoto(photoId: string): Promise<void> {
    await this.client.patch(`/user/photos/${photoId}/`, { is_primary: true });
  }

  // Swiping & Matches
  async getPotentialMatches(filters?: {
    minAge?: number;
    maxAge?: number;
    gender?: string;
    maxDistance?: number;
  }): Promise<PotentialMatch[]> {
    console.log('[API] Fetching potential matches...', {
      filters,
      baseURL: this.client.defaults.baseURL,
    });

    try {
      const { data } = await this.client.get<PotentialMatch[]>('/potential-matches/', {
        params: filters,
      });

      console.log('[API] Potential matches received:', {
        count: Array.isArray(data) ? data.length : 'non-array',
      });

      return data;
    } catch (error: any) {
      console.error('[API] Fetching potential matches failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  }

  async swipe(action: SwipeAction): Promise<LikeResponse> {
    const { data } = await this.client.post<LikeResponse>('/swipes/', {
      profile: action.profile_id,
      swipe_type: action.swipe_type,
    });
    return data;
  }

  async likeUser(userId: string): Promise<LikeResponse> {
    const { data } = await this.client.post<LikeResponse>('/matches/like/', {
      liked: userId,
    });
    return data;
  }

  async removeLike(likeId: string): Promise<{ success: boolean }> {
    const { data } = await this.client.post<{ success: boolean }>('/matches/remove-like/', {
      like_id: likeId,
    });
    return data;
  }

  async getPeopleILike(): Promise<Like[]> {
    const { data } = await this.client.get<Like[]>('/matches/people-i-like/');
    return data;
  }

  async getPeopleWhoLikeMe(): Promise<Like[]> {
    const { data } = await this.client.get<Like[]>('/matches/people-who-like-me/');
    return data;
  }

  async getMyMatches(): Promise<Match[]> {
    const { data } = await this.client.get<Match[]>('/matches/my-matches/');
    return data;
  }

  // Chat
  async getMatchMessages(matchId: string): Promise<ChatMessage[]> {
    const { data } = await this.client.get<ChatMessage[]>(`/matches/${matchId}/messages/`);
    return data;
  }

  async sendMessage(matchId: string, content: string): Promise<ChatMessage> {
    const { data } = await this.client.post<ChatMessage>(
      `/matches/${matchId}/send-message/`,
      { content }
    );
    return data;
  }

  async markMessagesAsRead(matchId: string): Promise<void> {
    await this.client.post(`/matches/${matchId}/mark-read/`);
  }

  // Gifts
  async getGiftTypes(): Promise<GiftType[]> {
    const { data } = await this.client.get<GiftType[]>('/gifts/types/');
    return data;
  }

  async sendGift(
    receiverId: string,
    giftTypeId: string,
    quantity: number,
    message?: string
  ): Promise<{ success: boolean; transaction: any; new_balance: number }> {
    const { data } = await this.client.post('/gifts/send/', {
      receiver_id: receiverId,
      gift_type_id: giftTypeId,
      quantity,
      message,
    });
    return data;
  }

  async getGiftHistory(type: 'sent' | 'received' | 'all' = 'all'): Promise<any[]> {
    const { data } = await this.client.get('/gifts/history/', { params: { type } });
    return data;
  }

  // Coins
  async getCoinPackages(): Promise<CoinPackage[]> {
    const { data } = await this.client.get<CoinPackage[]>('/coins/packages/');
    return data;
  }

  async getWallet(): Promise<Wallet> {
    const { data } = await this.client.get<Wallet>('/coins/wallet/');
    return data;
  }

  async purchaseCoins(
    packageId: string,
    returnUrl?: string,
  ): Promise<{ checkout_url: string; tx_ref: string; purchase_id?: string }> {
    const payload: any = { package_id: packageId };
    if (returnUrl) {
      payload.return_url = returnUrl;
    }

    const { data } = await this.client.post('/coins/purchase/', payload);
    return data;
  }

  async verifyPayment(txRef: string): Promise<{ success: boolean; new_balance: number }> {
    const { data } = await this.client.post('/coins/verify-payment/', {
      tx_ref: txRef,
    });
    return data;
  }

  // Subscriptions
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    console.log('[API] Fetching subscription plans...');
    try {
      const { data } = await this.client.get<SubscriptionPlan[]>('/subscription-plans/');
      console.log('[API] Subscription plans received:', data);
      return data;
    } catch (error: any) {
      console.error('[API] Failed to fetch subscription plans:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async subscribeToPlan(
    planId: string,
    returnUrl?: string,
  ): Promise<{ checkout_url: string; tx_ref: string; purchase_id?: string }> {
    const payload: any = { plan_id: planId };
    if (returnUrl) {
      payload.return_url = returnUrl;
    }

    const { data } = await this.client.post('/subscriptions/subscribe/', payload);
    return data;
  }

  async activateSubscription(planId: string): Promise<{ success: boolean; user: User }> {
    const { data } = await this.client.post('/subscriptions/activate/', {
      plan_id: planId,
    });
    return data;
  }

  // Earnings & Withdrawals
  async getEarnings(): Promise<any> {
    const { data } = await this.client.get('/earnings/');
    return data;
  }

  async getReceivedGifts(): Promise<any[]> {
    const { data } = await this.client.get('/earnings/gifts/');
    return data;
  }

  async getWithdrawals(): Promise<any[]> {
    const { data } = await this.client.get('/earnings/withdrawals/');
    return data;
  }

  async requestWithdrawal(amount: number): Promise<any> {
    const { data } = await this.client.post('/earnings/withdraw/', { amount });
    return data;
  }

  async getBankAccount(): Promise<any> {
    const { data } = await this.client.get('/earnings/bank-account/');
    return data;
  }

  async updateBankAccount(accountData: any): Promise<any> {
    const { data } = await this.client.post('/earnings/bank-account/', accountData);
    return data;
  }

  async getSubaccountStatus(): Promise<any> {
    const { data } = await this.client.get('/subaccount/status/');
    return data;
  }

  async getBanks(): Promise<any> {
    const { data } = await this.client.get('/banks/');
    return data;
  }

  async createSubaccount(accountData: {
    bank_code: string;
    account_number: string;
    account_name: string;
  }): Promise<any> {
    const { data } = await this.client.post('/subaccount/create/', accountData);
    return data;
  }

  async deleteSubaccount(): Promise<any> {
    const { data } = await this.client.post('/subaccount/delete/');
    return data;
  }

  // Notifications
  async getNotifications(): Promise<any[]> {
    const { data } = await this.client.get('/notifications/');
    return data;
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.client.patch(`/notifications/${id}/`, { is_read: true });
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.client.post('/notifications/mark-all-read/');
  }

  async clearNotifications(): Promise<void> {
    await this.client.delete('/notifications/clear/');
  }

  // Verification
  async submitVerification(formData: FormData): Promise<any> {
    const { data } = await this.client.post('/verification/submit/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  async getSubscriptionStatus(): Promise<{
    has_boost: boolean;
    can_see_likes: boolean;
    ad_free: boolean;
    boost_expiry: string | null;
    likes_reveal_expiry: string | null;
    ad_free_expiry: string | null;
  }> {
    const { data } = await this.client.get('/subscriptions/status/');
    return data;
  }

  // Rewind (undo last swipe)
  async rewindSwipe(): Promise<{ success: boolean; profile?: PotentialMatch }> {
    const { data } = await this.client.post('/rewind/');
    return data;
  }
}

export default new ApiService();
