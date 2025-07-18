import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  linkPartnerByEmail,
  acceptPartnerInvite,
  addSharedGoal,
  editSharedGoal,
  deleteSharedGoal,
  contributeToGoal,
  getCoupleDataByUserEmail,
  getSharedGoals,
  getGoalContributions
} from '@/lib/firestore';

// Fetch couple data for a user by email
export function useCoupleData(userEmail) {
  return useQuery({
    queryKey: ['coupleData', userEmail],
    queryFn: () => getCoupleDataByUserEmail(userEmail),
    enabled: !!userEmail,
  });
}

// Fetch shared goals for a couple
export function useSharedGoals(coupleId) {
  return useQuery({
    queryKey: ['sharedGoals', coupleId],
    queryFn: () => getSharedGoals(coupleId),
    enabled: !!coupleId,
  });
}

// Fetch all contributions for a goal
export function useGoalContributions(coupleId, goalId) {
  return useQuery({
    queryKey: ['goalContributions', coupleId, goalId],
    queryFn: () => getGoalContributions(coupleId, goalId),
    enabled: !!coupleId && !!goalId,
  });
}

// Mutation: Link partner by email
export function useLinkPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, userEmail, partnerEmail }) => linkPartnerByEmail(userId, userEmail, partnerEmail),
    onSuccess: (_, { userEmail }) => {
      queryClient.invalidateQueries({ queryKey: ['coupleData', userEmail] });
    },
  });
}

// Mutation: Accept partner invite
export function useAcceptPartnerInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, userEmail, coupleId }) => acceptPartnerInvite(userId, userEmail, coupleId),
    onSuccess: (_, { userEmail }) => {
      queryClient.invalidateQueries({ queryKey: ['coupleData', userEmail] });
    },
  });
}

// Mutation: Add shared goal
export function useAddSharedGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coupleId, goalData }) => addSharedGoal(coupleId, goalData),
    onSuccess: (_, { coupleId }) => {
      queryClient.invalidateQueries({ queryKey: ['sharedGoals', coupleId] });
    },
  });
}

// Mutation: Edit shared goal
export function useEditSharedGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coupleId, goalId, updates }) => editSharedGoal(coupleId, goalId, updates),
    onSuccess: (_, { coupleId }) => {
      queryClient.invalidateQueries({ queryKey: ['sharedGoals', coupleId] });
    },
  });
}

// Mutation: Delete shared goal
export function useDeleteSharedGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coupleId, goalId }) => deleteSharedGoal(coupleId, goalId),
    onSuccess: (_, { coupleId }) => {
      queryClient.invalidateQueries({ queryKey: ['sharedGoals', coupleId] });
    },
  });
}

// Mutation: Contribute to goal
export function useContributeToGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coupleId, goalId, amount, userEmail }) => contributeToGoal(coupleId, goalId, amount, userEmail),
    onSuccess: (_, { coupleId, goalId }) => {
      queryClient.invalidateQueries({ queryKey: ['sharedGoals', coupleId] });
      queryClient.invalidateQueries({ queryKey: ['goalContributions', coupleId, goalId] });
    },
  });
} 