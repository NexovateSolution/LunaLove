import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';

interface DiscoveryFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export interface FilterState {
  minAge: number;
  maxAge: number;
  maxDistance: number;
  gender: string;
  interests: string[];
  relationshipIntent: string;
  showOnlyVerified: boolean;
}

const GENDER_OPTIONS = [
  { label: 'Everyone', value: '' },
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Non-binary', value: 'Non-binary' },
];

const RELATIONSHIP_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Long-term', value: 'Long-term relationship' },
  { label: 'Short-term', value: 'Short-term relationship' },
  { label: 'Friendship', value: 'Friendship' },
  { label: 'Casual', value: 'Casual dating' },
  { label: 'Marriage', value: 'Marriage' },
];

const INTEREST_OPTIONS = [
  { id: 'travel', name: 'Travel', emoji: '✈️' },
  { id: 'music', name: 'Music', emoji: '🎵' },
  { id: 'movies', name: 'Movies', emoji: '🎬' },
  { id: 'sports', name: 'Sports', emoji: '⚽' },
  { id: 'reading', name: 'Reading', emoji: '📚' },
  { id: 'cooking', name: 'Cooking', emoji: '🍳' },
  { id: 'photography', name: 'Photography', emoji: '📷' },
  { id: 'art', name: 'Art', emoji: '🎨' },
  { id: 'gaming', name: 'Gaming', emoji: '🎮' },
  { id: 'fitness', name: 'Fitness', emoji: '💪' },
];

export default function DiscoveryFiltersModal({
  visible,
  onClose,
  onApply,
  initialFilters,
}: DiscoveryFiltersModalProps) {
  const [minAge, setMinAge] = useState(initialFilters?.minAge || 18);
  const [maxAge, setMaxAge] = useState(initialFilters?.maxAge || 99);
  const [maxDistance, setMaxDistance] = useState(initialFilters?.maxDistance || 50);
  const [gender, setGender] = useState(initialFilters?.gender || '');
  const [interests, setInterests] = useState<string[]>(initialFilters?.interests || []);
  const [relationshipIntent, setRelationshipIntent] = useState(
    initialFilters?.relationshipIntent || ''
  );
  const [showOnlyVerified, setShowOnlyVerified] = useState(
    initialFilters?.showOnlyVerified || false
  );

  const toggleInterest = (id: string) => {
    if (interests.includes(id)) {
      setInterests(interests.filter((i) => i !== id));
    } else {
      setInterests([...interests, id]);
    }
  };

  const handleReset = () => {
    setMinAge(18);
    setMaxAge(99);
    setMaxDistance(50);
    setGender('');
    setInterests([]);
    setRelationshipIntent('');
    setShowOnlyVerified(false);
  };

  const handleApply = () => {
    onApply({
      minAge,
      maxAge,
      maxDistance,
      gender,
      interests,
      relationshipIntent,
      showOnlyVerified,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discovery Filters</Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Age Range */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Age Range</Text>
            </View>
            <View style={styles.rangeDisplay}>
              <Text style={styles.rangeText}>{minAge}</Text>
              <Text style={styles.rangeSeparator}>-</Text>
              <Text style={styles.rangeText}>{maxAge}</Text>
            </View>
            <View style={styles.stepperRow}>
              <Text style={styles.sliderLabel}>Min age</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() =>
                    setMinAge((prev) => Math.max(18, Math.min(prev - 1, maxAge)))
                  }
                >
                  <Text style={styles.stepperButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{minAge}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() =>
                    setMinAge((prev) => Math.min(prev + 1, maxAge))
                  }
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.stepperRow}>
              <Text style={styles.sliderLabel}>Max age</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() =>
                    setMaxAge((prev) => Math.max(prev - 1, minAge))
                  }
                >
                  <Text style={styles.stepperButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{maxAge}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() =>
                    setMaxAge((prev) => Math.min(prev + 1, 99))
                  }
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Maximum Distance</Text>
            </View>
            <Text style={styles.distanceValue}>
              {maxDistance >= 100 ? '100+ km' : `${maxDistance} km`}
            </Text>
            <View style={styles.stepperRow}>
              <Text style={styles.sliderLabel}>Distance</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() =>
                    setMaxDistance((prev) => Math.max(1, prev - 1))
                  }
                >
                  <Text style={styles.stepperButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{maxDistance}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() =>
                    setMaxDistance((prev) => Math.min(100, prev + 1))
                  }
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Gender */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="male-female" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Show Me</Text>
            </View>
            <View style={styles.optionsGrid}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    gender === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setGender(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      gender === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Relationship Intent */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Looking For</Text>
            </View>
            <View style={styles.optionsGrid}>
              {RELATIONSHIP_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    relationshipIntent === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setRelationshipIntent(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      relationshipIntent === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Interests */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Interests</Text>
            </View>
            <View style={styles.interestsGrid}>
              {INTEREST_OPTIONS.map((interest) => (
                <TouchableOpacity
                  key={interest.id}
                  style={[
                    styles.interestButton,
                    interests.includes(interest.id) && styles.interestButtonActive,
                  ]}
                  onPress={() => toggleInterest(interest.id)}
                >
                  <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                  <Text
                    style={[
                      styles.interestText,
                      interests.includes(interest.id) && styles.interestTextActive,
                    ]}
                  >
                    {interest.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Verified Only */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                <View>
                  <Text style={styles.switchTitle}>Verified Profiles Only</Text>
                  <Text style={styles.switchDescription}>
                    Only show profiles with verified badges
                  </Text>
                </View>
              </View>
              <Switch
                value={showOnlyVerified}
                onValueChange={setShowOnlyVerified}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.background}
              />
            </View>
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <LinearGradient
              colors={['#7209B7', '#F72585']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.applyButtonGradient}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  resetButton: {
    padding: SPACING.xs,
  },
  resetText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  section: {
    marginTop: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  rangeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  rangeText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  rangeSeparator: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
  },
  sliderContainer: {
    marginBottom: SPACING.md,
  },
  sliderLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepperButtonText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    fontWeight: '600',
  },
  stepperValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 32,
    textAlign: 'center',
  },
  distanceValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  optionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionTextActive: {
    color: COLORS.background,
    fontWeight: '600',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  interestButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  interestEmoji: {
    fontSize: 18,
  },
  interestText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  interestTextActive: {
    color: COLORS.background,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  switchTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  switchDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  applyButton: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.background,
  },
});
