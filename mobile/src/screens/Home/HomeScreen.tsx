import React, { useState, useEffect, useRef } from 'react';
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
import SwipeCard from '../../components/cards/SwipeCard';
import DiscoveryFiltersModal, { FilterState } from '../../components/modals/DiscoveryFiltersModal';
import FloatingActionButtons from '../../components/home/FloatingActionButtons';
import MatchCelebrationModal from '../../components/modals/MatchCelebrationModal';
import ProfileDetailModal from '../../components/modals/ProfileDetailModal';
import { usePotentialMatches, useSwipe } from '../../hooks/usePotentialMatches';
import { useAuthStore } from '../../store/authStore';
import { useMatchStore } from '../../store/matchStore';
import { COLORS, SPACING, FONT_SIZES, AD_CONFIG } from '../../constants/config';
import { PotentialMatch } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { addMatch } = useMatchStore();
  const { data: profiles, isLoading, refetch } = usePotentialMatches();
  const swipeMutation = useSwipe();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<PotentialMatch | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PotentialMatch | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    minAge: 18,
    maxAge: 99,
    maxDistance: 50,
    gender: '',
    interests: [],
    relationshipIntent: '',
    showOnlyVerified: false,
  });

  const shouldShowAd = !user?.ad_free && swipeCount > 0 && swipeCount % AD_CONFIG.SWIPES_BETWEEN_ADS === 0;

  useEffect(() => {
    if (shouldShowAd) {
      setShowAd(true);
      // Auto-close ad after duration
      const timer = setTimeout(() => {
        setShowAd(false);
      }, AD_CONFIG.AD_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [swipeCount, shouldShowAd]);

  const handleSwipe = async (profile: PotentialMatch, direction: 'like' | 'dislike') => {
    try {
      const result = await swipeMutation.mutateAsync({
        profile_id: profile.id,
        swipe_type: direction,
      });

      setSwipeCount(prev => prev + 1);
      setCurrentIndex(prev => prev + 1);

      if (result.mutual_match && result.match_data) {
        // Show match celebration
        setMatchedProfile(profile);
        setShowMatchModal(true);
        addMatch(result.match_data);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to process swipe');
    }
  };

  const handleRewind = () => {
    if (!user?.is_premium) {
      Alert.alert(
        'Premium Feature',
        'Rewind is a premium feature. Upgrade to undo your last swipe!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Purchase', { type: 'subscription' }) },
        ]
      );
      return;
    }

    // Implement rewind logic
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleBoost = () => {
    if (!user?.has_boost) {
      Alert.alert(
        'Boost Your Profile',
        'Be one of the top profiles in your area for 30 minutes!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get Boost', onPress: () => navigation.navigate('Purchase', { type: 'subscription' }) },
        ]
      );
      return;
    }

    Alert.alert('Boost Active', 'Your profile is already boosted!');
  };

  const handleSuperLike = () => {
    if (!user?.is_premium) {
      Alert.alert(
        'Premium Feature',
        'Super Like is a premium feature. Stand out and get noticed!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Purchase', { type: 'subscription' }) },
        ]
      );
      return;
    }
    // Implement super like logic
    handleSwipe(currentProfile, 'like');
  };

  const handleProfileTap = () => {
    setSelectedProfile(currentProfile);
    setShowProfileDetail(true);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Finding matches...</Text>
      </View>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="people-outline" size={80} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No More Profiles</Text>
          <Text style={styles.emptySubtitle}>
            Check back later for new matches!
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={() => refetch()}>
            <Ionicons name="refresh" size={24} color={COLORS.background} />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  if (!currentProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          <Text style={styles.emptyTitle}>You've Seen Everyone!</Text>
          <Text style={styles.emptySubtitle}>
            Come back later for more profiles
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBoost}>
          <Ionicons 
            name="flash" 
            size={28} 
            color={user?.has_boost ? COLORS.warning : COLORS.textSecondary} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={28} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Cards */}
      <View style={styles.cardsContainer}>
        {nextProfile && (
          <SwipeCard
            profile={nextProfile}
            onSwipeLeft={() => {}}
            onSwipeRight={() => {}}
            isTop={false}
          />
        )}
        <SwipeCard
          profile={currentProfile}
          onSwipeLeft={() => handleSwipe(currentProfile, 'dislike')}
          onSwipeRight={() => handleSwipe(currentProfile, 'like')}
          onPress={handleProfileTap}
          isTop={true}
        />
      </View>

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        onRewind={handleRewind}
        onDislike={() => handleSwipe(currentProfile, 'dislike')}
        onLike={() => handleSwipe(currentProfile, 'like')}
        onSuperLike={handleSuperLike}
        onBoost={handleBoost}
        canRewind={user?.is_premium || false}
        canSuperLike={user?.is_premium || false}
        canBoost={user?.has_boost || false}
      />

      {/* Ad Modal */}
      <Modal
        visible={showAd}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAd(false)}
      >
        <View style={styles.adOverlay}>
          <View style={styles.adContainer}>
            <Text style={styles.adTitle}>Advertisement</Text>
            <Text style={styles.adText}>
              Remove ads with our Ad-Free subscription!
            </Text>
            <TouchableOpacity
              style={styles.adButton}
              onPress={() => {
                setShowAd(false);
                navigation.navigate('Purchase', { type: 'subscription' });
              }}
            >
              <Text style={styles.adButtonText}>Go Ad-Free</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adCloseButton}
              onPress={() => setShowAd(false)}
            >
              <Text style={styles.adCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Match Celebration Modal */}
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
            photo: matchedProfile.photos?.[0],
          }}
          currentUserPhoto={user?.photos?.[0]}
        />
      )}

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <ProfileDetailModal
          visible={showProfileDetail}
          onClose={() => setShowProfileDetail(false)}
          profile={selectedProfile}
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

      {/* Filters Modal */}
      <DiscoveryFiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          refetch();
        }}
        initialFilters={filters}
      />
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
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
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
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewindButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  dislikeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  likeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  superLikeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  refreshButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  adOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adContainer: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  adTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  adText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  adButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    marginBottom: SPACING.md,
  },
  adButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  adCloseButton: {
    padding: SPACING.sm,
  },
  adCloseText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  matchOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchContainer: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  matchTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  matchText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  matchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    marginBottom: SPACING.md,
  },
  matchButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  matchCloseButton: {
    padding: SPACING.sm,
  },
  matchCloseText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
