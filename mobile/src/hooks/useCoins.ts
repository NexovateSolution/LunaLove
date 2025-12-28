import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../services/api';
import { useWalletStore } from '../store/walletStore';

export const useCoinPackages = () => {
  return useQuery({
    queryKey: ['coinPackages'],
    queryFn: () => ApiService.getCoinPackages(),
    staleTime: 300000, // 5 minutes
  });
};

export const useWallet = () => {
  const { wallet, fetchWallet } = useWalletStore();

  return useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWallet,
    staleTime: 30000, // 30 seconds
    refetchOnMount: true,
  });
};

export const usePurchaseCoins = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ packageId, returnUrl }: { packageId: string; returnUrl?: string }) =>
      ApiService.purchaseCoins(packageId, returnUrl),
    onSuccess: () => {
      // Will be updated after payment verification
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
};

export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  const { updateBalance } = useWalletStore();

  return useMutation({
    mutationFn: (txRef: string) => ApiService.verifyPayment(txRef),
    onSuccess: (data) => {
      if (data.success) {
        updateBalance(data.new_balance);
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      }
    },
  });
};
