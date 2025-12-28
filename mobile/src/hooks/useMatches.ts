import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../services/api';
import { useMatchStore } from '../store/matchStore';

export const useMyMatches = () => {
  const { myMatches, fetchMyMatches } = useMatchStore();
  
  return useQuery({
    queryKey: ['myMatches'],
    queryFn: fetchMyMatches,
    staleTime: 30000, // 30 seconds
    refetchOnMount: true,
  });
};

export const usePeopleILike = () => {
  const { peopleILike, fetchPeopleILike } = useMatchStore();
  
  return useQuery({
    queryKey: ['peopleILike'],
    queryFn: fetchPeopleILike,
    staleTime: 30000,
    refetchOnMount: true,
  });
};

export const usePeopleWhoLikeMe = () => {
  const { peopleWhoLikeMe, fetchPeopleWhoLikeMe } = useMatchStore();
  
  return useQuery({
    queryKey: ['peopleWhoLikeMe'],
    queryFn: fetchPeopleWhoLikeMe,
    staleTime: 30000,
    refetchOnMount: true,
  });
};

export const useRemoveLike = () => {
  const queryClient = useQueryClient();
  const { removeLike } = useMatchStore();
  
  return useMutation({
    mutationFn: (likeId: string) => removeLike(likeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peopleILike'] });
    },
  });
};
