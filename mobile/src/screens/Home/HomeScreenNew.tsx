import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import SwipeCardNew from '../../components/cards/SwipeCardNew';
import FloatingActionButtons from '../../components/home/FloatingActionButtons';
import DiscoveryFiltersModal from '../../components/modals/DiscoveryFiltersModal';
import MatchCelebrationModal from '../../components/modals/MatchCelebrationModal';
import ProfileDetailModal from '../../components/modals/ProfileDetailModal';
import { usePotentialMatches, useSwipe, useRewindSwipe } from '../../hooks/usePotentialMatches';
import { useAuthStore } from '../../store/authStore';
import { useMatchStore } from '../../store/matchStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/config';
import { PotentialMatch } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreenNew() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { addMatch } = useMatchStore();
  const {
    data: profiles,
    isLoading,
    error,
    refetch,
  } = usePotentialMatches();
  const swipeMutation = useSwipe();
  const rewindMutation = useRewindSwipe();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<PotentialMatch | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PotentialMatch | null>(null);

  const handleSwipe = async (profile: PotentialMatch, direction: 'like' | 'dislike') => {
    try {
      const result = await swipeMutation.mutateAsync({
        profile_id: profile.id,
        swipe_type: direction,
      });

      setCurrentIndex(prev => prev + 1);

      if (result.mutual_match && result.match_data) {
        setMatchedProfile(profile);
        setShowMatchModal(true);
        addMatch(result.match_data);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to process swipe');
    }
  };

  const handleRewind = async () => {
    if (currentIndex === 0) return;
    try {
      const result = await rewindMutation.mutateAsync();
      if (result?.success) {
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : 0));
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to rewind last swipe');
    }
  };

  const handleProfileInfo = () => {
    if (!currentProfile) return;
    setSelectedProfile(currentProfile);
    setShowProfileDetail(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="warning-outline" size={80} color={COLORS.error} />
          <Text style={styles.emptyTitle}>Could not load profiles</Text>
          <Text style={styles.emptySubtitle}>
            Please check your connection and try again.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setCurrentIndex(0);
              refetch();
            }}
          >
            <Ionicons name="refresh" size={20} color={COLORS.background} />
            <Text style={styles.refreshButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
        <DiscoveryFiltersModal
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          onApply={() => {
            setShowFilters(false);
            setCurrentIndex(0);
            refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="people-outline" size={80} color={COLORS.gray300} />
          <Text style={styles.emptyTitle}>No More Profiles</Text>
          <Text style={styles.emptySubtitle}>
            Check back later for new matches!
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setCurrentIndex(0);
              refetch();
            }}
          >
            <Ionicons name="refresh" size={20} color={COLORS.background} />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        <DiscoveryFiltersModal
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          onApply={() => {
            setShowFilters(false);
            refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  const canRewind = currentIndex > 0;
  const canSuperLike = !!user?.is_premium;
  const canBoost = !!user?.has_boost;

  if (!currentProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          <Text style={styles.emptyTitle}>You've Seen Everyone!</Text>
          <Text style={styles.emptySubtitle}>
            Come back later for more profiles
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setCurrentIndex(0);
              refetch();
            }}
          >
            <Ionicons name="refresh" size={20} color={COLORS.background} />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.profileCount}>{profiles.length - currentIndex}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Cards Container */}
      <View style={styles.cardsContainer}>
        {nextProfile && (
          <SwipeCardNew
            profile={nextProfile}
            onSwipeLeft={() => {}}
            onSwipeRight={() => {}}
            isTop={false}
          />
        )}
        <SwipeCardNew
          profile={currentProfile}
          onSwipeLeft={() => handleSwipe(currentProfile, 'dislike')}
          onSwipeRight={() => handleSwipe(currentProfile, 'like')}
          onInfoPress={handleProfileInfo}
          isTop={true}
        />
      </View>

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        onRewind={handleRewind}
        onDislike={() => handleSwipe(currentProfile, 'dislike')}
        onLike={() => handleSwipe(currentProfile, 'like')}
        onSuperLike={() => handleSwipe(currentProfile, 'like')}
        onBoost={() => navigation.navigate('Premium' as never)}
        canRewind={canRewind}
        canSuperLike={canSuperLike}
        canBoost={canBoost}
        showSuperLike={false}
        showBoost={false}
      />

      {/* Modals */}
      <DiscoveryFiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={() => {
          setShowFilters(false);
          refetch();
        }}
      />

      {matchedProfile && (
        <MatchCelebrationModal
          visible={showMatchModal}
          onClose={() => setShowMatchModal(false)}
          onSendMessage={() => {
            setShowMatchModal(false);
            navigation.navigate('Matches');
          }}
          matchedUser={{
            name: matchedProfile.first_name || 'Someone',
            photo: matchedProfile.user_photos?.[0]?.photo,
          }}
          currentUserPhoto={user?.user_photos?.[0]?.photo}
        />
      )}

      {selectedProfile && (
        <ProfileDetailModal
          visible={showProfileDetail}
          onClose={() => setShowProfileDetail(false)}
          profile={{
            id: selectedProfile.id,
            name: selectedProfile.first_name,
            age: selectedProfile.age,
            photos: (selectedProfile.user_photos || []).map((p) => p.photo),
            bio: selectedProfile.bio,
            city: selectedProfile.city,
            country: selectedProfile.country,
            distance: (selectedProfile as any).distance_km,
            interests: (selectedProfile.interests || []).map((i) =>
              i.emoji ? `${i.emoji} ${i.name}` : i.name
            ),
            religion: (selectedProfile as any).religion,
            relationship_intent: selectedProfile.relationship_intent,
            drinking_habits: (selectedProfile as any).drinking_habits,
            smoking_habits: (selectedProfile as any).smoking_habits,
            height: (selectedProfile as any).height,
            education: (selectedProfile as any).education,
            occupation: (selectedProfile as any).occupation,
          }}
          onLike={() => {
            setShowProfileDetail(false);
            handleSwipe(selectedProfile, 'like');
          }}
          onDislike={() => {
            setShowProfileDetail(false);
            handleSwipe(selectedProfile, 'dislike');
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profileCount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.primary,
  },
  filterButton: {
    padding: SPACING.sm,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xl,
  },
  refreshButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xl,
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dislikeButton: {
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  likeButton: {
    borderWidth: 2,
    borderColor: COLORS.pink,
  },
});
