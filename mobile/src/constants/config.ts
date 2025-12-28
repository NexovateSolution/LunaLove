export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://10.86.208.86:8000/api' : 'https://api.lunalove.app/api',
  WS_URL: __DEV__ ? 'ws://10.86.208.86:8000/ws' : 'wss://api.lunalove.app/ws',
  // BASE_URL: __DEV__ ? 'http://192.168.1.6:8000/api' : 'https://api.lunalove.app/api',
  // WS_URL: __DEV__ ? 'ws://192.168.1.6:8000/ws' : 'wss://api.lunalove.app/ws',
  // Computer IP from ipconfig: 172.16.99.22
  // BASE_URL: __DEV__ ? 'http://172.16.99.22:8000/api' : 'https://api.lunalove.app/api',
  // WS_URL: __DEV__ ? 'ws://172.16.99.22:8000/ws' : 'wss://api.lunalove.app/ws',
  TIMEOUT: 10000,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'lunalove_auth_token',
  USER_DATA: 'lunalove_user_data',
  SUBSCRIPTION_STATE: 'lunalove_subscription_state',
};

export const SUBSCRIPTION_PLANS = {
  BOOST: 'boost',
  LIKES_REVEAL: 'likes_reveal',
  AD_FREE: 'ad_free',
};

export const AD_CONFIG = {
  SWIPES_BETWEEN_ADS: 7, // Show ad every 7 swipes for free users
  AD_DURATION_MS: 5000,
};

export const ANIMATION_DURATIONS = {
  SWIPE_CARD: 300,
  GIFT_ANIMATION: 3000,
  MATCH_CELEBRATION: 2500,
  LIKE_BUTTON: 150,
};

export const COLORS = {
  // Primary theme colors from web app (Figma design)
  primary: '#F72585', // Main fuchsia/pink
  primaryDark: '#B5179E',
  primaryLight: '#FDE8F4',
  accent: '#7209B7', // Purple accent
  
  // Backgrounds
  background: '#FFFFFF',
  backgroundDark: '#FFF0F6', // Light pink background from web
  backgroundLight: '#FAFAFA',
  
  // Text colors
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  
  // UI elements
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Gradients (web app style - fuchsia to purple)
  gradientPrimary: ['#F72585', '#B5179E'], // Main gradient
  gradientPurple: ['#7209B7', '#B5179E'],
  gradientPink: ['#F72585', '#FDE8F4'],
  gradientPurplePink: ['#7209B7', '#F72585'], // Purple to Pink
  gradientPurplePinkReverse: ['#F72585', '#7209B7'],
  
  // Gray scale
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Additional colors
  purple: '#7209B7',
  purpleLight: '#B5179E',
  purpleDark: '#560BAD',
  pink: '#F72585',
  pinkLight: '#FDE8F4',
  pinkDark: '#B5179E',
  orange: '#F59E0B',
  orangeLight: '#FBBF24',
  blue: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
  yellow: '#F59E0B',
  
  // Badge colors
  badgeRed: '#FEE2E2',
  badgeRedText: '#991B1B',
  badgePurple: '#F3E8FF',
  badgePurpleText: '#6B21A8',
  badgeOrange: '#FEF3C7',
  badgeOrangeText: '#92400E',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8,
  },
};
