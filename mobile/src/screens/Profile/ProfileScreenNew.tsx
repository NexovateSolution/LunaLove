import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';
import SafeImage from '../../components/common/SafeImage';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/config';
import ApiService from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreenNew() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { wallet } = useWalletStore();

  if (!user) return null;

  const calculateAge = (dateOfBirth: string | null): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(user.date_of_birth);
  const photos = user.user_photos || [];

  const [preferences, setPreferences] = React.useState<any | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await ApiService.getPreferences();
        if (isMounted) {
          setPreferences(data);
        }
      } catch (error) {
        // Silently ignore preference load errors on the profile screen
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const renderValue = (value?: string | number | null) => {
    if (value === null || value === undefined) return 'Not set';
    if (typeof value === 'string' && value.trim() === '') return 'Not set';
    return String(value);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={COLORS.gradientPurplePink}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="share-outline" size={24} color={COLORS.background} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="create-outline" size={18} color={COLORS.primary} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Profile Photo */}
        <View style={styles.photoContainer}>
          <View style={styles.photoWrapper}>
            <SafeImage
              uri={photos[0]?.photo}
              style={styles.profilePhoto}
            />
          </View>
        </View>

        {/* Name and Bio */}
        <View style={styles.nameContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {user.first_name}, {age}
            </Text>
            {user.is_verified && (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.info} />
            )}
          </View>
          {user.bio && (
            <Text style={styles.bio}>{user.bio}</Text>
          )}
        </View>

        {/* Preferences Section */}
        {preferences && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="options" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Preferences</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Interested In</Text>
                <Text style={styles.infoValue}>
                  {(() => {
                    const g = (preferences as any).preferred_gender;
                    if (Array.isArray(g) && g.length) return g.join(', ');
                    if (typeof g === 'string' && g.trim().length) return g;
                    return 'Any';
                  })()}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Age Range</Text>
                <Text style={styles.infoValue}>
                  {`${preferences.preferred_age_min ?? 18} - ${
                    preferences.preferred_age_max ?? 99
                  }`}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Max Distance</Text>
                <Text style={styles.infoValue}>
                  {`${
                    preferences.max_distance_km ??
                    (preferences as any).preferred_distance ??
                    100
                  } km`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* About Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{renderValue(user.gender)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Religion</Text>
              <Text style={styles.infoValue}>{renderValue(user.religion)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Looking for</Text>
              <Text style={styles.infoValue}>{renderValue(user.relationship_intent)}</Text>
            </View>
          </View>
        </View>

        {/* Lifestyle Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Lifestyle</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {renderValue(
                  [user.city, user.country].filter(Boolean).join(', '),
                )}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Drinking</Text>
              <Text style={styles.infoValue}>{renderValue(user.drinking_habits)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Smoking</Text>
              <Text style={styles.infoValue}>{renderValue(user.smoking_habits)}</Text>
            </View>
          </View>
        </View>

        {/* Interests Section */}
        {user.interests && (user.interests as any[]).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star-outline" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Interests</Text>
            </View>
            <View style={styles.interestsContainer}>
              {(user.interests as any[]).map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>
                    {interest.emoji ? `${interest.emoji} ${interest.name}` : interest.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Photo Gallery */}
        {photos.length > 1 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="images-outline" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Photos</Text>
            </View>
            <View style={styles.photoGrid}>
              {photos.slice(1).map((photo, index) => (
                <SafeImage
                  key={index}
                  uri={photo.photo}
                  style={styles.gridPhoto}
                />
              ))}
              {photos.length < 6 && (
                <TouchableOpacity 
                  style={styles.addPhotoButton}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Ionicons name="add" size={32} color={COLORS.textSecondary} />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  editButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  photoContainer: {
    alignItems: 'center',
    marginTop: -60,
  },
  photoWrapper: {
    padding: 4,
    backgroundColor: COLORS.background,
    borderRadius: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  nameContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  name: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bio: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  section: {
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  infoGrid: {
    gap: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  interestTag: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  interestText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  gridPhoto: {
    width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.lg * 2 - SPACING.sm * 2) / 3,
    height: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.lg * 2 - SPACING.sm * 2) / 3,
    borderRadius: BORDER_RADIUS.md,
  },
  addPhotoButton: {
    width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.lg * 2 - SPACING.sm * 2) / 3,
    height: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.lg * 2 - SPACING.sm * 2) / 3,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
