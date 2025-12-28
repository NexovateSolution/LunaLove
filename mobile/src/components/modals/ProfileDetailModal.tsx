import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProfileDetailModalProps {
  visible: boolean;
  onClose: () => void;
  profile: {
    id: string;
    name: string;
    age?: number;
    photos?: string[];
    bio?: string;
    city?: string;
    country?: string;
    distance?: number;
    interests?: string[];
    religion?: string;
    relationship_intent?: string;
    drinking_habits?: string;
    smoking_habits?: string;
    height?: string;
    education?: string;
    occupation?: string;
  };
  onLike?: () => void;
  onDislike?: () => void;
}

export default function ProfileDetailModal({
  visible,
  onClose,
  profile,
  onLike,
  onDislike,
}: ProfileDetailModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photos = profile.photos && profile.photos.length > 0 ? profile.photos : ['/avatar.png'];

  const handlePhotoScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPhotoIndex(index);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="chevron-down" size={32} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Photo Carousel */}
          <View style={styles.photoSection}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handlePhotoScroll}
              scrollEventThrottle={16}
            >
              {photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {/* Photo Indicators */}
            {photos.length > 1 && (
              <View style={styles.photoIndicators}>
                {photos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentPhotoIndex && styles.activeIndicator,
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Age Badge */}
            {profile.age && (
              <View style={styles.ageBadge}>
                <Text style={styles.ageBadgeText}>{profile.age} years old</Text>
              </View>
            )}

            {/* Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.photoGradient}
            >
              <Text style={styles.photoName}>{profile.name}</Text>
              {(profile.city || profile.distance) && (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color={COLORS.background} />
                  <Text style={styles.locationText}>
                    {profile.city && profile.country
                      ? `${profile.city}, ${profile.country}`
                      : profile.city || profile.country || ''}
                    {profile.distance ? ` • ${profile.distance} km away` : ''}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Bio Section */}
          {profile.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.interestsContainer}>
                {profile.interests.map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            
            {profile.religion && (
              <View style={styles.detailRow}>
                <Ionicons name="book-outline" size={20} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Religion</Text>
                <Text style={styles.detailValue}>{profile.religion}</Text>
              </View>
            )}

            {profile.relationship_intent && (
              <View style={styles.detailRow}>
                <Ionicons name="heart-outline" size={20} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Looking for</Text>
                <Text style={styles.detailValue}>{profile.relationship_intent}</Text>
              </View>
            )}

            {profile.height && (
              <View style={styles.detailRow}>
                <Ionicons name="resize-outline" size={20} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Height</Text>
                <Text style={styles.detailValue}>{profile.height}</Text>
              </View>
            )}

            {profile.education && (
              <View style={styles.detailRow}>
                <Ionicons name="school-outline" size={20} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Education</Text>
                <Text style={styles.detailValue}>{profile.education}</Text>
              </View>
            )}

            {profile.occupation && (
              <View style={styles.detailRow}>
                <Ionicons name="briefcase-outline" size={20} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Occupation</Text>
                <Text style={styles.detailValue}>{profile.occupation}</Text>
              </View>
            )}

            {profile.drinking_habits && (
              <View style={styles.detailRow}>
                <Ionicons name="wine-outline" size={20} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Drinking</Text>
                <Text style={styles.detailValue}>{profile.drinking_habits}</Text>
              </View>
            )}

            {profile.smoking_habits && (
              <View style={styles.detailRow}>
                <Ionicons name="cloud-outline" size={20} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Smoking</Text>
                <Text style={styles.detailValue}>{profile.smoking_habits}</Text>
              </View>
            )}
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Action Buttons */}
        {(onLike || onDislike) && (
          <View style={styles.actionButtons}>
            {onDislike && (
              <TouchableOpacity
                style={[styles.actionButton, styles.dislikeButton]}
                onPress={onDislike}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={32} color={COLORS.red} />
              </TouchableOpacity>
            )}
            {onLike && (
              <TouchableOpacity
                style={[styles.actionButton, styles.likeButton]}
                onPress={onLike}
                activeOpacity={0.7}
              >
                <Ionicons name="heart" size={32} color={COLORS.green} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoSection: {
    position: 'relative',
  },
  photo: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
    backgroundColor: COLORS.backgroundDark,
  },
  photoIndicators: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    gap: 4,
  },
  indicator: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeIndicator: {
    backgroundColor: COLORS.background,
  },
  ageBadge: {
    position: 'absolute',
    top: SPACING.lg + 20,
    left: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  ageBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.background,
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
  },
  photoName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.background,
    marginBottom: SPACING.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  locationText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    opacity: 0.9,
  },
  section: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  bioText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  interestTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  interestText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  detailLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  actionButtons: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  dislikeButton: {
    borderWidth: 2,
    borderColor: COLORS.red,
  },
  likeButton: {
    borderWidth: 2,
    borderColor: COLORS.green,
  },
});
