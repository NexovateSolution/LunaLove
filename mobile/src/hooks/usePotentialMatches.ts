import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../services/api';
import { SwipeAction } from '../types';

export const usePotentialMatches = (filters?: {
  minAge?: number;
  maxAge?: number;
  gender?: string;
  maxDistance?: number;
}) => {
  return useQuery({
    queryKey: ['potentialMatches', filters],
    queryFn: () => ApiService.getPotentialMatches(filters),
    staleTime: 60000, // 1 minute
    refetchOnMount: false,
  });
};

export const useSwipe = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (action: SwipeAction) => ApiService.swipe(action),
    onSuccess: (data) => {
      // Invalidate potential matches to get fresh data
      queryClient.invalidateQueries({ queryKey: ['potentialMatches'] });
      
      // If mutual match, invalidate matches
      if (data.mutual_match) {
        queryClient.invalidateQueries({ queryKey: ['myMatches'] });
      }
    },
  });
};

export const useLikeUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => ApiService.likeUser(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['peopleILike'] });
      
      if (data.mutual_match) {
        queryClient.invalidateQueries({ queryKey: ['myMatches'] });
      }
    },
  });
};

export const useRewindSwipe = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => ApiService.rewindSwipe(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['potentialMatches'] });
    },
  });
};
