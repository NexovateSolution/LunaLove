import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../services/api';
import { useAuthStore } from '../store/authStore';

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      try {
        const plans = await ApiService.getSubscriptionPlans();
        console.log('[useSubscriptionPlans] Plans fetched:', plans);
        return plans || [];
      } catch (error) {
        console.error('[useSubscriptionPlans] Error:', error);
        return [];
      }
    },
    staleTime: 300000, // 5 minutes
    retry: 1,
  });
};

export const useSubscriptionStatus = () => {
  return useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: () => ApiService.getSubscriptionStatus(),
    staleTime: 60000, // 1 minute
    refetchOnMount: true,
  });
};

export const useSubscribeToPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, returnUrl }: { planId: string; returnUrl?: string }) =>
      ApiService.subscribeToPlan(planId, returnUrl),
    onSuccess: () => {
      // Will be updated after payment verification
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
    },
  });
};

export const useActivateSubscription = () => {
  const queryClient = useQueryClient();
  const { updateUser, refreshSubscriptionStatus } = useAuthStore();

  return useMutation({
    mutationFn: (planId: string) => ApiService.activateSubscription(planId),
    onSuccess: async (data) => {
      if (data.success) {
        updateUser(data.user);
        await refreshSubscriptionStatus();
        queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
      }
    },
  });
};
