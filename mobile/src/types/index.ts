export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  bio: string;
  location_latitude: string;
  location_longitude: string;
  country: string;
  city: string;
  relationship_intent: string;
  religion: string;
  drinking_habits: string;
  smoking_habits: string;
  profile_completeness_score: number;
  interests: Interest[];
  user_photos: UserPhoto[];
  is_premium: boolean;
  has_boost: boolean;
  can_see_likes: boolean;
  ad_free: boolean;
  boost_expiry: string | null;
  likes_reveal_expiry: string | null;
  ad_free_expiry: string | null;
}

export interface UserPhoto {
  id: string;
  photo: string;
  is_avatar: boolean;
  upload_order: number;
}

export interface Interest {
  id: number;
  name: string;
  emoji: string;
}

export interface PotentialMatch {
  id: string;
  first_name: string;
  age: number;
  bio: string;
  interests: Interest[];
  user_photos: UserPhoto[];
  gender: string;
  relationship_intent: string;
  city: string;
  country: string;
  date_of_birth?: string;
  religion?: string;
  drinking_habits?: string;
  smoking_habits?: string;
  height?: string;
  education?: string;
  occupation?: string;
  distance_km?: number;
}

export interface Like {
  id: string;
  liker: User;
  liked: User;
  status: 'pending' | 'matched' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  liker: User;
  liked: User;
  status: 'matched';
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: ChatMessage;
}

export interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'gift';
  gift_data?: GiftData;
  created_at: string;
  read: boolean;
}

export interface GiftData {
  gift_type_id: string;
  gift_name: string;
  gift_icon: string;
  gift_animation: string;
  quantity: number;
  total_cost: number;
}

export interface GiftType {
  id: string;
  name: string;
  icon: string;
  animation_url: string;
  coin_cost: number;
  description: string;
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price_etb: number;
  bonus_coins: number;
  total_coins: number;
  is_popular?: boolean;
  is_active?: boolean;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  code: string;
  price_etb: string;
  description: string;
  icon: string;
  duration_days?: number;
  features?: string[];
  is_popular?: boolean;
}

export interface AuthResponse {
  token: string;
  user_id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture: string;
}

export interface ApiError {
  error: string;
  detail?: string;
}

export interface SwipeAction {
  profile_id: string;
  swipe_type: 'like' | 'dislike';
}

export interface LikeResponse {
  success: boolean;
  mutual_match: boolean;
  match_data?: Match;
}

export interface WebSocketMessage {
  type: 'new_message' | 'new_like' | 'new_match' | 'gift_received' | 'typing' | 'read_receipt';
  data: any;
}
