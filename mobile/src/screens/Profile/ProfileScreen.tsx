import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';
import ProfileStatsCards from '../../components/profile/ProfileStatsCards';
import PhotoGallery from '../../components/profile/PhotoGallery';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useAuthStore();
  const { wallet } = useWalletStore();

  if (!user) return null;

  const handlePhotosReorder = (photos: any[]) => {
    // TODO: Implement photo reorder API call
    console.log('Reorder photos:', photos);
  };

  const handlePhotoAdd = (uri: string) => {
    // TODO: Implement photo upload API call
    console.log('Add photo:', uri);
  };

  const handlePhotoDelete = (photoId: string) => {
    // TODO: Implement photo delete API call
    console.log('Delete photo:', photoId);
  };

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Photo */}
        <View style={styles.photoSection}>
          {user.user_photos && user.user_photos.length > 0 ? (
            <Image
              source={{ uri: user.user_photos[0].photo }}
              style={styles.profilePhoto}
            />
          ) : (
            <View style={[styles.profilePhoto, styles.placeholderPhoto]}>
              <Ionicons name="person" size={80} color={COLORS.textSecondary} />
            </View>
          )}
          
          {user.is_premium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={16} color={COLORS.warning} />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </View>

        {/* Basic Info */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>
            {user.first_name || user.username}, {calculateAge(user.date_of_birth)}
          </Text>
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </View>

        {/* Stats Cards */}
        <ProfileStatsCards
          profileCompleteness={user.profile_completeness_score || 0}
          profileViews={user.profile_views || 0}
          likesReceived={user.likes_received || 0}
          matchesCount={user.matches_count || 0}
        />

        {/* Photo Gallery */}
        {user.user_photos && (
          <PhotoGallery
            photos={user.user_photos}
            onPhotosReorder={handlePhotosReorder}
            onPhotoAdd={handlePhotoAdd}
            onPhotoDelete={handlePhotoDelete}
            maxPhotos={6}
          />
        )}

        {/* Details */}
        <View style={styles.detailsContainer}>
          <DetailItem icon="location" label="Location" value={`${user.city}, ${user.country}`} />
          <DetailItem icon="heart" label="Looking for" value={user.relationship_intent} />
          <DetailItem icon="book" label="Religion" value={user.religion} />
          <DetailItem icon="wine" label="Drinking" value={user.drinking_habits} />
          <DetailItem icon="leaf" label="Smoking" value={user.smoking_habits} />
        </View>

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <View style={styles.interestsSection}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
              {user.interests.map((interest) => (
                <View key={interest.id} style={styles.interestTag}>
                  <Text style={styles.interestText}>
                    {interest.emoji} {interest.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}


        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Purchase', { type: 'subscription' })}
          >
            <Ionicons name="star" size={24} color={COLORS.warning} />
            <Text style={styles.actionButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('BuyCoins')}
          >
            <Ionicons name="diamond" size={24} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Buy Coins</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      disabled={!onPress}
    >
      <Ionicons name={icon} size={32} color={COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailItem}>
      <Ionicons name={icon} size={20} color={COLORS.textSecondary} />
      <View style={styles.detailInfo}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
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
  photoSection: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  profilePhoto: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.background,
  },
  placeholderPhoto: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    marginTop: SPACING.sm,
    gap: 4,
  },
  premiumText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.warning,
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  name: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  bio: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.lg,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  interestsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  interestTag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  interestText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  actionsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  secondaryButton: {
    backgroundColor: COLORS.background,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
});
