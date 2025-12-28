import { create } from 'zustand';
import { Match, Like } from '../types';
import ApiService from '../services/api';

interface MatchState {
  myMatches: Match[];
  peopleILike: Like[];
  peopleWhoLikeMe: Like[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchMyMatches: () => Promise<Match[]>;
  fetchPeopleILike: () => Promise<Like[]>;
  fetchPeopleWhoLikeMe: () => Promise<Like[]>;
  removeLike: (likeId: string) => Promise<void>;
  addMatch: (match: Match) => void;
  updateMatchUnreadCount: (matchId: string, count: number) => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  myMatches: [],
  peopleILike: [],
  peopleWhoLikeMe: [],
  isLoading: false,
  error: null,

  fetchMyMatches: async () => {
    try {
      set({ isLoading: true, error: null });
      const matches = await ApiService.getMyMatches();
      set({ myMatches: matches, isLoading: false });
      return matches;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch matches';
      set({ error: errorMessage, isLoading: false });
      return [];
    }
  },

  fetchPeopleILike: async () => {
    try {
      set({ isLoading: true, error: null });
      const likes = await ApiService.getPeopleILike();
      set({ peopleILike: likes, isLoading: false });
      return likes;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch likes';
      set({ error: errorMessage, isLoading: false });
      return [];
    }
  },

  fetchPeopleWhoLikeMe: async () => {
    try {
      set({ isLoading: true, error: null });
      const likes = await ApiService.getPeopleWhoLikeMe();
      set({ peopleWhoLikeMe: likes, isLoading: false });
      return likes;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch who likes me';
      set({ error: errorMessage, isLoading: false });
      return [];
    }
  },

  removeLike: async (likeId: string) => {
    try {
      await ApiService.removeLike(likeId);
      const currentLikes = get().peopleILike;
      set({ peopleILike: currentLikes.filter(like => like.id !== likeId) });
    } catch (error: any) {
      console.error('Error removing like:', error);
      throw error;
    }
  },

  addMatch: (match: Match) => {
    const currentMatches = get().myMatches;
    const exists = currentMatches.some(m => m.id === match.id);
    if (!exists) {
      set({ myMatches: [match, ...currentMatches] });
    }
  },

  updateMatchUnreadCount: (matchId: string, count: number) => {
    const currentMatches = get().myMatches;
    set({
      myMatches: currentMatches.map(match =>
        match.id === matchId ? { ...match, unread_count: count } : match
      ),
    });
  },
}));
