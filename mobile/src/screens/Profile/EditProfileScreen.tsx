import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// import * as ImagePicker from 'expo-image-picker'; // Temporarily disabled - restart Expo with: npx expo start -c
import { useAuthStore } from '../../store/authStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';
import ApiService from '../../services/api';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [education, setEducation] = useState(user?.education || '');
  const [height, setHeight] = useState(user?.height?.toString() || '');
  const [religion, setReligion] = useState(user?.religion || '');
  const [relationshipIntent, setRelationshipIntent] = useState(user?.relationship_intent || '');
  const [drinkingHabits, setDrinkingHabits] = useState(user?.drinking_habits || '');
  const [smokingHabits, setSmokingHabits] = useState(user?.smoking_habits || '');
  const [country, setCountry] = useState(user?.country || '');
  const [city, setCity] = useState(user?.city || '');

  // Match preferences (mirrors ProfileSetupScreen step 8)
  const [preferredGender, setPreferredGender] = useState('');
  const [preferredAgeMin, setPreferredAgeMin] = useState('18');
  const [preferredAgeMax, setPreferredAgeMax] = useState('99');
  const [preferredDistance, setPreferredDistance] = useState('50');

  useEffect(() => {
    // In this build we don't have a dedicated endpoint to read preferences,
    // so we keep defaults. If preferences are later exposed on the user
    // object, they can be initialized here from user.* fields.
  }, []);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    setLoading(true);
    try {
      const updates = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim() || user?.username,
        bio: bio.trim() || null,
        occupation: occupation.trim() || null,
        education: education.trim() || null,
        height: height ? parseInt(height) : null,
        religion: religion || null,
        relationship_intent: relationshipIntent || null,
        drinking_habits: drinkingHabits || null,
        smoking_habits: smokingHabits || null,
        country: country || null,
        city: city || null,
      };

      await ApiService.updateProfile(updates);
      await updateUser(updates);

      // Save basic match preferences using the same endpoint as onboarding
      const preferences = {
        preferred_gender: preferredGender || null,
        preferred_age_min: preferredAgeMin ? parseInt(preferredAgeMin) : 18,
        preferred_age_max: preferredAgeMax ? parseInt(preferredAgeMax) : 99,
        preferred_distance: preferredDistance ? parseInt(preferredDistance) : 50,
      };

      await ApiService.updatePreferences(preferences);
      
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePhoto = async () => {
    // Temporarily disabled until Expo server is restarted with: npx expo start -c
    Alert.alert(
      'Restart Required',
      'Please restart the Expo server with "npx expo start -c" to enable photo selection.',
      [{ text: 'OK' }]
    );
    
    // Uncomment after restarting Expo:
    // const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    // if (status !== 'granted') {
    //   Alert.alert('Permission Required', 'Please grant camera roll permissions to change your photo');
    //   return;
    // }
    // const result = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //   allowsEditing: true,
    //   aspect: [1, 1],
    //   quality: 0.8,
    // });
    // if (!result.canceled && result.assets[0]) {
    //   // TODO: Upload photo to server
    //   Alert.alert('Photo Selected', 'Photo upload will be implemented');
    // }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          {user?.user_photos && user.user_photos.length > 0 ? (
            <Image
              source={{ uri: user.user_photos[0].photo }}
              style={styles.profilePhoto}
            />
          ) : (
            <View style={[styles.profilePhoto, styles.placeholderPhoto]}>
              <Ionicons name="person" size={60} color={COLORS.textSecondary} />
            </View>
          )}
          <TouchableOpacity style={styles.changePhotoButton} onPress={handleChangePhoto}>
            <Ionicons name="camera" size={20} color={COLORS.background} />
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor={COLORS.gray400}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Your public username"
              placeholderTextColor={COLORS.gray400}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor={COLORS.gray400}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor={COLORS.gray400}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{bio.length}/500</Text>
          </View>
        </View>

        {/* Professional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Occupation</Text>
            <TextInput
              style={styles.input}
              value={occupation}
              onChangeText={setOccupation}
              placeholder="What do you do?"
              placeholderTextColor={COLORS.gray400}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Education</Text>
            <TextInput
              style={styles.input}
              value={education}
              onChangeText={setEducation}
              placeholder="Your education level"
              placeholderTextColor={COLORS.gray400}
            />
          </View>
        </View>

        {/* Physical Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="Enter height in cm"
              placeholderTextColor={COLORS.gray400}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Lifestyle & Beliefs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifestyle & Beliefs</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Religion</Text>
            <View style={styles.pickerContainer}>
              <TextInput
                style={styles.input}
                value={religion}
                onChangeText={setReligion}
                placeholder="Select religion"
                placeholderTextColor={COLORS.gray400}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Relationship Intent</Text>
            <View style={styles.pickerContainer}>
              <TextInput
                style={styles.input}
                value={relationshipIntent}
                onChangeText={setRelationshipIntent}
                placeholder="What are you looking for?"
                placeholderTextColor={COLORS.gray400}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Drinking Habits</Text>
            <View style={styles.pickerContainer}>
              <TextInput
                style={styles.input}
                value={drinkingHabits}
                onChangeText={setDrinkingHabits}
                placeholder="Select drinking habits"
                placeholderTextColor={COLORS.gray400}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Smoking Habits</Text>
            <View style={styles.pickerContainer}>
              <TextInput
                style={styles.input}
                value={smokingHabits}
                onChangeText={setSmokingHabits}
                placeholder="Select smoking habits"
                placeholderTextColor={COLORS.gray400}
              />
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              style={styles.input}
              value={country}
              onChangeText={setCountry}
              placeholder="Country"
              placeholderTextColor={COLORS.gray400}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor={COLORS.gray400}
            />
          </View>
        </View>

        {/* Match Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match Preferences</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Gender</Text>
            <TextInput
              style={styles.input}
              value={preferredGender}
              onChangeText={setPreferredGender}
              placeholder="e.g. Male, Female, Any"
              placeholderTextColor={COLORS.gray400}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}> 
              <Text style={styles.label}>Min Age</Text>
              <TextInput
                style={styles.input}
                value={preferredAgeMin}
                onChangeText={setPreferredAgeMin}
                placeholder="18"
                placeholderTextColor={COLORS.gray400}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}> 
              <Text style={styles.label}>Max Age</Text>
              <TextInput
                style={styles.input}
                value={preferredAgeMax}
                onChangeText={setPreferredAgeMax}
                placeholder="99"
                placeholderTextColor={COLORS.gray400}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Max Distance (km)</Text>
            <TextInput
              style={styles.input}
              value={preferredDistance}
              onChangeText={setPreferredDistance}
              placeholder="50"
              placeholderTextColor={COLORS.gray400}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.saveButtonLarge}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  saveButton: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.background,
  },
  placeholderPhoto: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: '35%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  saveButtonLarge: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
});
