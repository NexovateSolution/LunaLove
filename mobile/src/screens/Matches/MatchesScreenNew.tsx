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
import { LinearGradient } from 'expo-linear-gradient';
import { useMyMatches, usePeopleILike, usePeopleWhoLikeMe, useRemoveLike } from '../../hooks/useMatches';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/config';
import { Match, Like } from '../../types';
import SafeImage from '../../components/common/SafeImage';

type TabType = 'i_like' | 'who_likes_me' | 'my_matches';

export default function MatchesScreenNew() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('i_like');

  const { data: myMatches = [], isLoading: matchesLoading } = useMyMatches();
  const { data: peopleILike = [], isLoading: iLikeLoading } = usePeopleILike();
  const { data: peopleWhoLikeMe = [], isLoading: whoLikesMeLoading } = usePeopleWhoLikeMe();
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

  const calculateAge = (dateOfBirth: string | null): string => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const renderPeopleILike = ({ item }: { item: Like }) => {
    const likedUser = item.liked;
    if (!likedUser) return null;

    const age = calculateAge(likedUser.date_of_birth);

    return (
      <View style={styles.likeCard}>
        <SafeImage
          uri={likedUser.user_photos?.[0]?.photo}
          style={styles.likePhoto}
        />
        <View style={styles.likeInfo}>
          <Text style={styles.likeName}>
            {likedUser.first_name}
            {age && `, ${age}`}
          </Text>
          {likedUser.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.likeLocation}>{likedUser.city}</Text>
            </View>
          )}
          <Text style={styles.likeStatus}>Hola papi</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveLike(item.id)}
        >
          <Ionicons name="close" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderWhoLikesMe = ({ item }: { item: Like }) => {
    const likerUser = item.liker;
    if (!likerUser) return null;

    return (
      <TouchableOpacity style={styles.likeCard} onPress={handleUpgradePress}>
        <View style={styles.blurredContainer}>
          <SafeImage
            uri={likerUser.user_photos?.[0]?.photo}
            style={styles.likePhoto}
            blurRadius={20}
          />
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={32} color={COLORS.background} />
          </View>
        </View>
        <View style={styles.likeInfo}>
          <Text style={styles.likeName}>Someone likes you!</Text>
          <Text style={styles.likeLocation}>Upgrade to see who</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMyMatch = ({ item }: { item: Match }) => {
    const otherUser = item.liker?.id === user?.id ? item.liked : item.liker;
    if (!otherUser) return null;

    return (
      <View style={styles.matchCard}>
        <SafeImage
          uri={otherUser.user_photos?.[0]?.photo}
          style={styles.matchPhoto}
        />
        <View style={styles.matchOverlay}>
          <View style={styles.matchBadge}>
            <Ionicons name="heart" size={16} color={COLORS.background} />
            <Text style={styles.matchBadgeText}>Mutual Match</Text>
          </View>
        </View>
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>{otherUser.first_name}</Text>
          <Text style={styles.matchStatus}>Hola papi</Text>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleMatchPress(item)}
          >
            <LinearGradient
              colors={COLORS.gradientPurplePink}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.chatButtonGradient}
            >
              <Ionicons name="chatbubble" size={16} color={COLORS.background} />
              <Text style={styles.chatButtonText}>Chat</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    const isLoading = activeTab === 'i_like' ? iLikeLoading : 
                      activeTab === 'who_likes_me' ? whoLikesMeLoading : 
                      matchesLoading;

    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    const data = activeTab === 'i_like' ? peopleILike :
                 activeTab === 'who_likes_me' ? peopleWhoLikeMe :
                 myMatches;

    if (!data || data.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="heart-outline" size={60} color={COLORS.gray300} />
          <Text style={styles.emptyText}>
            {activeTab === 'i_like' ? 'No likes yet' :
             activeTab === 'who_likes_me' ? 'No one has liked you yet' :
             'No matches yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'i_like' ? "Start swiping to find people you like!" :
             activeTab === 'who_likes_me' ? "Keep swiping to get more likes!" :
             "Keep swiping to find your perfect match!"}
          </Text>
        </View>
      );
    }

    if (activeTab === 'my_matches') {
      return (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>My Matches</Text>
          <Text style={styles.sectionSubtitle}>
            {myMatches.length} mutual {myMatches.length === 1 ? 'match' : 'matches'}. Start chatting!
          </Text>
          <FlatList
            data={myMatches}
            renderItem={renderMyMatch}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </View>
      );
    }

    return (
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'i_like' ? 'People I Like' : 'Who Likes Me'}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {activeTab === 'i_like' 
            ? `${peopleILike.length} ${peopleILike.length === 1 ? 'person' : 'people'} you've liked. You can remove likes if you change your mind.`
            : `${peopleWhoLikeMe.length} ${peopleWhoLikeMe.length === 1 ? 'person has' : 'people have'} liked you!`
          }
        </Text>
        <FlatList
          data={data}
          renderItem={activeTab === 'i_like' ? renderPeopleILike : renderWhoLikesMe}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.gradientPurplePink}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="heart-circle" size={36} color={COLORS.background} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Matches</Text>
            <Text style={styles.headerSubtitle}>Discover your connections</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'i_like' && styles.tabActive]}
          onPress={() => setActiveTab('i_like')}
        >
          <View style={styles.tabContent}>
            <Ionicons 
              name="heart" 
              size={20} 
              color={activeTab === 'i_like' ? COLORS.background : COLORS.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'i_like' && styles.tabTextActive]}>
              People I Like
            </Text>
            {peopleILike.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{peopleILike.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'who_likes_me' && styles.tabActive]}
          onPress={() => setActiveTab('who_likes_me')}
        >
          <View style={styles.tabContent}>
            <Ionicons 
              name="people" 
              size={20} 
              color={activeTab === 'who_likes_me' ? COLORS.background : COLORS.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'who_likes_me' && styles.tabTextActive]}>
              Who Likes Me
            </Text>
            {peopleWhoLikeMe.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{peopleWhoLikeMe.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'my_matches' && styles.tabActive]}
          onPress={() => setActiveTab('my_matches')}
        >
          <View style={styles.tabContent}>
            <Ionicons 
              name="star" 
              size={20} 
              color={activeTab === 'my_matches' ? COLORS.background : COLORS.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'my_matches' && styles.tabTextActive]}>
              My Matches
            </Text>
            {myMatches.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{myMatches.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    opacity: 0.9,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    shadowOpacity: 0.2,
    elevation: 4,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.background,
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  listContainer: {
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  likeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  likePhoto: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
  },
  likeInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  likeName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xs,
  },
  likeLocation: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  likeStatus: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurredContainer: {
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: BORDER_RADIUS.md,
  },
  matchCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  matchPhoto: {
    width: '100%',
    height: 200,
  },
  matchOverlay: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.pink,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  matchBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.background,
  },
  matchInfo: {
    padding: SPACING.md,
  },
  matchName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  matchStatus: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  chatButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  chatButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  chatButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
});
