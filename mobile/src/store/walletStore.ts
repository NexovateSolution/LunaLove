import { create } from 'zustand';
import { Wallet } from '../types';
import ApiService from '../services/api';

interface WalletState {
  wallet: Wallet | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchWallet: () => Promise<Wallet | null>;
  updateBalance: (newBalance: number) => void;
  deductCoins: (amount: number) => void;
  addCoins: (amount: number) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallet: null,
  isLoading: false,
  error: null,

  fetchWallet: async () => {
    try {
      set({ isLoading: true, error: null });
      const wallet = await ApiService.getWallet();
      set({ wallet, isLoading: false });
      return wallet;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch wallet';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  updateBalance: (newBalance: number) => {
    const currentWallet = get().wallet;
    if (currentWallet) {
      set({ 
        wallet: { 
          ...currentWallet, 
          balance: newBalance 
        } 
      });
    }
  },

  deductCoins: (amount: number) => {
    const currentWallet = get().wallet;
    if (currentWallet) {
      set({ 
        wallet: { 
          ...currentWallet, 
          balance: Math.max(0, currentWallet.balance - amount),
          total_spent: currentWallet.total_spent + amount
        } 
      });
    }
  },

  addCoins: (amount: number) => {
    const currentWallet = get().wallet;
    if (currentWallet) {
      set({ 
        wallet: { 
          ...currentWallet, 
          balance: currentWallet.balance + amount,
          total_earned: currentWallet.total_earned + amount
        } 
      });
    }
  },
}));
