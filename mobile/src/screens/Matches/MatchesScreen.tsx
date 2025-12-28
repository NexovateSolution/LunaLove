import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMyMatches, usePeopleILike, usePeopleWhoLikeMe, useRemoveLike } from '../../hooks/useMatches';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';
import { Match, Like } from '../../types';
import SafeImage from '../../components/common/SafeImage';

type TabType = 'matches' | 'i_like' | 'who_likes_me';

export default function MatchesScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('matches');

  const { data: myMatches, isLoading: matchesLoading } = useMyMatches();
  const { data: peopleILike, isLoading: iLikeLoading } = usePeopleILike();
  const { data: peopleWhoLikeMe, isLoading: whoLikesMeLoading } = usePeopleWhoLikeMe();
  const removeLikeMutation = useRemoveLike();

  const handleRemoveLike = (likeId: string) => {
    Alert.alert(
      'Remove Like',
      'Are you sure you want to remove this like?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeLikeMutation.mutateAsync(likeId);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove like');
            }
          },
        },
      ]
    );
  };

  const handleMatchPress = (match: Match) => {
    navigation.navigate('Chat', { match });
  };

  const handleUpgradePress = () => {
    navigation.navigate('Purchase', { type: 'subscription' });
  };

  const renderMatchItem = ({ item }: { item: Match }) => {
    const otherUser = item.liker?.id === user?.id ? item.liked : item.liker;
    const unreadCount = item.unread_count || 0;

    if (!otherUser) return null;

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => handleMatchPress(item)}
      >
        <SafeImage
          uri={otherUser.user_photos?.[0]?.photo}
          style={styles.matchPhoto}
        />
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
        <View style={styles.matchInfo}>
          <Text style={styles.matchName} numberOfLines={1}>
            {otherUser.first_name}
          </Text>
          {item.last_message && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.last_message.content}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderLikeItem = ({ item }: { item: Like }) => {
    const likedUser = item.liked;

    if (!likedUser) return null;

    return (
      <View style={styles.likeCard}>
        <SafeImage
          uri={likedUser.user_photos?.[0]?.photo}
          style={styles.likePhoto}
        />
        <View style={styles.likeInfo}>
          <Text style={styles.likeName}>
            {likedUser.first_name}, {calculateAge(likedUser.date_of_birth)}
          </Text>
          {likedUser.city && (
            <Text style={styles.likeLocation}>{likedUser.city}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveLike(item.id)}
        >
          <Ionicons name="close-circle" size={28} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderWhoLikesMeItem = ({ item }: { item: Like }) => {
    const likerUser = item.liker;

    if (!likerUser) return null;

    return (
      <TouchableOpacity style={styles.likeCard}>
        <View style={styles.blurredPhotoContainer}>
          <SafeImage
            uri={likerUser.user_photos?.[0]?.photo}
            style={[styles.likePhoto, styles.blurredPhoto]}
            blurRadius={20}
          />
          <Ionicons name="lock-closed" size={32} color={COLORS.background} style={styles.lockIcon} />
        </View>
        <View style={styles.likeInfo}>
          <Text style={styles.likeName}>Someone likes you!</Text>
          <Text style={styles.likeLocation}>Upgrade to see who</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLockedState = () => (
    <View style={styles.lockedContainer}>
      <View style={styles.lockedIconContainer}>
        <Ionicons name="lock-closed" size={60} color={COLORS.primary} />
      </View>
      <Text style={styles.lockedTitle}>Unlock "Who Likes Me"</Text>
      <Text style={styles.lockedSubtitle}>
        See everyone who's already liked you with Likes Reveal
      </Text>
      <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradePress}>
        <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = (message: string) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={60} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  const renderContent = () => {
    if (activeTab === 'matches') {
      if (matchesLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        );
      }

      if (!myMatches || myMatches.length === 0) {
        return renderEmptyState('No matches yet. Keep swiping!');
      }

      return (
        <FlatList
          data={myMatches}
          renderItem={renderMatchItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (activeTab === 'i_like') {
      if (iLikeLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        );
      }

      if (!peopleILike || peopleILike.length === 0) {
        return renderEmptyState('You haven\'t liked anyone yet');
      }

      return (
        <FlatList
          data={peopleILike}
          renderItem={renderLikeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (activeTab === 'who_likes_me') {
      if (!user?.can_see_likes) {
        return renderLockedState();
      }

      if (whoLikesMeLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        );
      }

      if (!peopleWhoLikeMe || peopleWhoLikeMe.length === 0) {
        return renderEmptyState('No one has liked you yet');
      }

      return (
        <FlatList
          data={peopleWhoLikeMe}
          renderItem={renderWhoLikesMeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
          onPress={() => setActiveTab('matches')}
        >
          <Text style={[styles.tabText, activeTab === 'matches' && styles.activeTabText]}>
            My Matches
          </Text>
          {myMatches && myMatches.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{myMatches.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'i_like' && styles.activeTab]}
          onPress={() => setActiveTab('i_like')}
        >
          <Text style={[styles.tabText, activeTab === 'i_like' && styles.activeTabText]}>
            I Like
          </Text>
          {peopleILike && peopleILike.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{peopleILike.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'who_likes_me' && styles.activeTab]}
          onPress={() => setActiveTab('who_likes_me')}
        >
          <View style={styles.tabWithIcon}>
            <Text style={[styles.tabText, activeTab === 'who_likes_me' && styles.activeTabText]}>
              Likes Me
            </Text>
            {!user?.can_see_likes && (
              <Ionicons name="lock-closed" size={14} color={COLORS.primary} style={styles.lockIconSmall} />
            )}
          </View>
          {peopleWhoLikeMe && peopleWhoLikeMe.length > 0 && user?.can_see_likes && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{peopleWhoLikeMe.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}
    </SafeAreaView>
  );
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tabWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockIconSmall: {
    marginLeft: 2,
  },
  tabBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  tabBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.md,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  matchPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.backgroundDark,
  },
  unreadBadge: {
    position: 'absolute',
    top: 10,
    left: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  unreadText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  matchInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  matchName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  likeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  likePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.backgroundDark,
  },
  blurredPhotoContainer: {
    position: 'relative',
  },
  blurredPhoto: {
    opacity: 0.6,
  },
  lockIcon: {
    position: 'absolute',
    top: 14,
    left: 14,
  },
  likeInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  likeName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  likeLocation: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  lockedIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  lockedTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  lockedSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  upgradeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
});
