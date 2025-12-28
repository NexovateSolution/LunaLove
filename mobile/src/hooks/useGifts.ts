import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../services/api';
import { useWalletStore } from '../store/walletStore';

export const useGiftTypes = () => {
  return useQuery({
    queryKey: ['giftTypes'],
    queryFn: () => ApiService.getGiftTypes(),
    staleTime: 300000, // 5 minutes - gift types rarely change
  });
};

export const useSendGift = () => {
  const queryClient = useQueryClient();
  const { deductCoins } = useWalletStore();

  return useMutation({
    mutationFn: ({
      receiverId,
      giftTypeId,
      quantity,
      message,
    }: {
      receiverId: string;
      giftTypeId: string;
      quantity: number;
      message?: string;
    }) => ApiService.sendGift(receiverId, giftTypeId, quantity, message),
    onSuccess: (data) => {
      // Update wallet balance
      deductCoins(data.new_balance);
      
      // Invalidate gift history
      queryClient.invalidateQueries({ queryKey: ['giftHistory'] });
    },
  });
};

export const useGiftHistory = (type: 'sent' | 'received' | 'all' = 'all') => {
  return useQuery({
    queryKey: ['giftHistory', type],
    queryFn: () => ApiService.getGiftHistory(type),
    staleTime: 60000, // 1 minute
  });
};
