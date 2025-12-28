import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import ApiService from '../../services/api';
import PhotoManager from '../../components/photo/PhotoManager';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other'];
const RELIGION_OPTIONS = ['Christianity', 'Islam', 'Judaism', 'Hinduism', 'Buddhism', 'Atheist', 'Agnostic', 'Other', 'Prefer not to say'];
const RELATIONSHIP_OPTIONS = ['Long-term relationship', 'Short-term relationship', 'Friendship', 'Casual dating', 'Marriage', 'Not sure yet'];
const DRINKING_OPTIONS = ['Never', 'Socially', 'Regularly', 'Prefer not to say'];
const SMOKING_OPTIONS = ['Never', 'Socially', 'Regularly', 'Prefer not to say'];

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  const [bio, setBio] = useState(user?.bio || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [religion, setReligion] = useState(user?.religion || '');
  const [relationshipIntent, setRelationshipIntent] = useState(user?.relationship_intent || '');
  const [drinkingHabits, setDrinkingHabits] = useState(user?.drinking_habits || '');
  const [smokingHabits, setSmokingHabits] = useState(user?.smoking_habits || '');
  const [city, setCity] = useState(user?.city || '');
  const [country, setCountry] = useState(user?.country || '');
  const [photos, setPhotos] = useState(user?.user_photos || []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const profileData = {
        bio,
        gender,
        religion,
        relationship_intent: relationshipIntent,
        drinking_habits: drinkingHabits,
        smoking_habits: smokingHabits,
        city,
        country,
      };

      const response = await ApiService.updateProfile(profileData);
      updateUser(response);
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <PhotoManager photos={photos} onPhotosUpdate={setPhotos} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>{bio.length}/500</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          
          <Text style={styles.label}>Gender</Text>
          <View style={styles.optionsGrid}>
            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, gender === option && styles.optionButtonActive]}
                onPress={() => setGender(option)}
              >
                <Text style={[styles.optionText, gender === option && styles.optionTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Religion</Text>
          <View style={styles.optionsGrid}>
            {RELIGION_OPTIONS.slice(0, 6).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, religion === option && styles.optionButtonActive]}
                onPress={() => setReligion(option)}
              >
                <Text style={[styles.optionText, religion === option && styles.optionTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Looking For</Text>
          <View style={styles.optionsGrid}>
            {RELATIONSHIP_OPTIONS.slice(0, 4).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, relationshipIntent === option && styles.optionButtonActive]}
                onPress={() => setRelationshipIntent(option)}
              >
                <Text style={[styles.optionText, relationshipIntent === option && styles.optionTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifestyle</Text>
          
          <Text style={styles.label}>Drinking</Text>
          <View style={styles.optionsGrid}>
            {DRINKING_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, drinkingHabits === option && styles.optionButtonActive]}
                onPress={() => setDrinkingHabits(option)}
              >
                <Text style={[styles.optionText, drinkingHabits === option && styles.optionTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Smoking</Text>
          <View style={styles.optionsGrid}>
            {SMOKING_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, smokingHabits === option && styles.optionButtonActive]}
                onPress={() => setSmokingHabits(option)}
              >
                <Text style={[styles.optionText, smokingHabits === option && styles.optionTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Country"
            value={country}
            onChangeText={setCountry}
          />
          <TextInput
            style={styles.input}
            placeholder="City"
            value={city}
            onChangeText={setCity}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
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
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  saveText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  content: {
    flex: 1,
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
  input: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
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
});
