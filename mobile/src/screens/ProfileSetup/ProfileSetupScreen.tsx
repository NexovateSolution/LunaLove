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
  Platform,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker'; // Temporarily disabled - restart Expo with: npx expo start -c
// import * as Location from 'expo-location'; // Temporarily disabled to avoid native module error in Expo Go
import { COLORS, SPACING, FONT_SIZES } from '../../constants/config';
import ApiService from '../../services/api';

interface ProfileSetupScreenProps {
  onFinish: () => void;
}

const TOTAL_STEPS = 8;

// Options data
const GENDER_OPTIONS = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Non-binary', value: 'Non-binary' },
  { label: 'Other', value: 'Other' },
];

const RELIGION_OPTIONS = [
  { label: 'Christianity', value: 'Christianity' },
  { label: 'Islam', value: 'Islam' },
  { label: 'Judaism', value: 'Judaism' },
  { label: 'Hinduism', value: 'Hinduism' },
  { label: 'Buddhism', value: 'Buddhism' },
  { label: 'Atheist', value: 'Atheist' },
  { label: 'Agnostic', value: 'Agnostic' },
  { label: 'Other', value: 'Other' },
  { label: 'Prefer not to say', value: 'Prefer not to say' },
];

const RELATIONSHIP_INTENT_OPTIONS = [
  { label: 'Long-term relationship', value: 'Long-term relationship' },
  { label: 'Short-term relationship', value: 'Short-term relationship' },
  { label: 'Friendship', value: 'Friendship' },
  { label: 'Casual dating', value: 'Casual dating' },
  { label: 'Marriage', value: 'Marriage' },
  { label: 'Not sure yet', value: 'Not sure yet' },
];

const DRINKING_OPTIONS = [
  { label: 'Never', value: 'Never' },
  { label: 'Socially', value: 'Socially' },
  { label: 'Regularly', value: 'Regularly' },
  { label: 'Prefer not to say', value: 'Prefer not to say' },
];

const SMOKING_OPTIONS = [
  { label: 'Never', value: 'Never' },
  { label: 'Socially', value: 'Socially' },
  { label: 'Regularly', value: 'Regularly' },
  { label: 'Prefer not to say', value: 'Prefer not to say' },
];

const INTERESTS = [
  { id: 1, name: 'Travel', emoji: '✈️' },
  { id: 2, name: 'Music', emoji: '🎵' },
  { id: 3, name: 'Movies', emoji: '🎬' },
  { id: 4, name: 'Sports', emoji: '⚽' },
  { id: 5, name: 'Reading', emoji: '📚' },
  { id: 6, name: 'Cooking', emoji: '🍳' },
  { id: 7, name: 'Photography', emoji: '📷' },
  { id: 8, name: 'Art', emoji: '🎨' },
  { id: 9, name: 'Gaming', emoji: '🎮' },
  { id: 10, name: 'Fitness', emoji: '💪' },
  { id: 11, name: 'Dancing', emoji: '💃' },
  { id: 12, name: 'Hiking', emoji: '🥾' },
  { id: 13, name: 'Coffee', emoji: '☕' },
  { id: 14, name: 'Wine', emoji: '🍷' },
  { id: 15, name: 'Pets', emoji: '🐕' },
];

const COUNTRY_OPTIONS = [
  { code: 'ET', label: 'Ethiopia' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'KE', label: 'Kenya' },
  { code: 'NG', label: 'Nigeria' },
  { code: 'ZA', label: 'South Africa' },
  { code: 'IN', label: 'India' },
];

export default function ProfileSetupScreen({ onFinish }: ProfileSetupScreenProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Username & Avatar
  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Step 2: Bio
  const [bio, setBio] = useState('');

  // Step 3: Date of Birth (year-based steppers instead of native date picker)
  const [dateOfBirth, setDateOfBirth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Step 4: Gender
  const [gender, setGender] = useState('');

  // Step 5: Religion & Lifestyle
  const [religion, setReligion] = useState('');
  const [relationshipIntent, setRelationshipIntent] = useState('');
  const [drinkingHabits, setDrinkingHabits] = useState('');
  const [smokingHabits, setSmokingHabits] = useState('');
  const [isReligionModalVisible, setIsReligionModalVisible] = useState(false);

  // Step 6: Location
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [countryCode, setCountryCode] = useState('');
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>([]);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [countryOptions, setCountryOptions] = useState(COUNTRY_OPTIONS);
  const [isCountryLoading, setIsCountryLoading] = useState(false);

  // Step 7: Interests
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);

  // Step 8: Preferences
  const [preferredGender, setPreferredGender] = useState('');
  const [preferredAgeMin, setPreferredAgeMin] = useState(18);
  const [preferredAgeMax, setPreferredAgeMax] = useState(99);
  const [preferredDistance, setPreferredDistance] = useState(50);

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        setIsCountryLoading(true);
        const allCountries = await ApiService.getCountries();
        if (allCountries && allCountries.length) {
          setCountryOptions(allCountries);
        }
      } catch (error: any) {
        console.error(
          '[ProfileSetup] Failed to load countries',
          error?.response?.data || error?.message || error,
        );
        // Fallback to the small built-in COUNTRY_OPTIONS list
      } finally {
        setIsCountryLoading(false);
      }
    };

    loadCountries();
  }, []);

  const requestPermissions = async () => {
    // Temporarily disabled - restart Expo with: npx expo start -c
    // await ImagePicker.requestMediaLibraryPermissionsAsync();
    // await ImagePicker.requestCameraPermissionsAsync();
    // Location permissions temporarily disabled in this build
  };

  const pickImage = async () => {
    Alert.alert(
      'Restart Required',
      'Please restart the Expo server with "npx expo start -c" to enable photo upload.',
      [{ text: 'OK' }]
    );
    // Uncomment after restarting:
    // const result = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //   allowsEditing: true,
    //   aspect: [1, 1],
    //   quality: 0.8,
    // });
    // if (!result.canceled) {
    //   setAvatarUri(result.assets[0].uri);
    // }
  };

  const takePhoto = async () => {
    Alert.alert(
      'Restart Required',
      'Please restart the Expo server with "npx expo start -c" to enable camera.',
      [{ text: 'OK' }]
    );
    // Uncomment after restarting:
    // const result = await ImagePicker.launchCameraAsync({
    //   allowsEditing: true,
    //   aspect: [1, 1],
    //   quality: 0.8,
    // });
    // if (!result.canceled) {
    //   setAvatarUri(result.assets[0].uri);
    // }
  };

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      Alert.alert(
        'Coming Soon',
        'Automatic location detection will be available soon. Please enter your country and city manually.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      // No-op: location is disabled in this build
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const loadCitiesForCountry = async (countryCodeValue: string) => {
    if (!countryCodeValue) return;
    setIsCityLoading(true);
    try {
      const cities = await ApiService.getCities(countryCodeValue);
      setCityOptions(cities);
    } catch (error: any) {
      console.error(
        '[ProfileSetup] Failed to load cities',
        error?.response?.data || error?.message || error,
      );
      Alert.alert('Error', 'Could not load cities for this country. Please try again.');
      setCityOptions([]);
    } finally {
      setIsCityLoading(false);
    }
  };

  const toggleInterest = (id: number) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter(i => i !== id));
    } else if (selectedInterests.length < 5) {
      setSelectedInterests([...selectedInterests, id]);
    } else {
      Alert.alert('Limit Reached', 'You can select up to 5 interests');
    }
  };

  const calculateAge = (dob: Date) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        break;
      case 2:
        if (!username.trim()) {
          Alert.alert('Required', 'Please enter a username');
          return false;
        }
        break;
      case 3:
        if (calculateAge(dateOfBirth) < 18) {
          Alert.alert('Age Requirement', 'You must be at least 18 years old');
          return false;
        }
        break;
      case 4:
        if (!gender) {
          Alert.alert('Required', 'Please select your gender');
          return false;
        }
        break;
      case 6:
        if (!country || !city) {
          Alert.alert('Required', 'Please enter your location');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Prepare profile data
      const profileData = {
        username,
        bio,
        date_of_birth: dateOfBirth.toISOString().split('T')[0],
        gender,
        religion,
        relationship_intent: relationshipIntent,
        drinking_habits: drinkingHabits,
        smoking_habits: smokingHabits,
        country,
        city,
        interests: selectedInterests,
      };

      // Prepare preferences data
      const preferencesData = {
        preferred_gender: preferredGender,
        preferred_age_min: preferredAgeMin,
        preferred_age_max: preferredAgeMax,
        preferred_distance: preferredDistance,
      };

      // Save profile
      await ApiService.updateProfile(profileData);

      // Save preferences
      await ApiService.updatePreferences(preferencesData);

      // Upload avatar if selected
      if (avatarUri) {
        const formData = new FormData();
        formData.append('photo', {
          uri: avatarUri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);
        await ApiService.uploadPhoto(formData);
      }

      // Notify parent that profile setup is complete
      onFinish();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = () => {
    const progressPercent = Math.round((currentStep / TOTAL_STEPS) * 100);
    const steps = Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1);

    return (
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Profile Setup</Text>
        <Text style={styles.progressSubtitle}>Let's create your perfect dating profile</Text>

        <View style={styles.progressRow}>
          <Text style={styles.progressStepText}>
            Step {currentStep} of {TOTAL_STEPS}
          </Text>
          <Text style={styles.progressPercentText}>{progressPercent}% Complete</Text>
        </View>

        <View style={styles.progressDotsRow}>
          {steps.map(step => (
            <View
              key={step}
              style={[
                styles.progressDot,
                step <= currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      case 7:
        return renderStep7();
      case 8:
        return renderStep8();
      default:
        return null;
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Add a Profile Photo</Text>
      <Text style={styles.stepDescription}>This helps people recognize you.</Text>

      <View style={styles.photoRing}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="camera" size={40} color={COLORS.primary} />
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
        <Text style={styles.uploadButtonText}>Upload Photo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Ionicons name="create" size={60} color={COLORS.primary} />
      <Text style={styles.stepTitle}>Username & Bio</Text>
      <Text style={styles.stepDescription}>Choose how you want to be known</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={COLORS.textSecondary}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="I love traveling, coffee, and good conversations..."
        placeholderTextColor={COLORS.textSecondary}
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
        maxLength={500}
      />
      <Text style={styles.charCount}>{bio.length}/500</Text>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Ionicons name="calendar" size={60} color={COLORS.primary} />
      <Text style={styles.stepTitle}>Date of Birth</Text>
      <Text style={styles.stepDescription}>You must be 18 or older</Text>

      <View style={styles.dateSummary}>
        <Text style={styles.dateText}>
          {dateOfBirth.toLocaleDateString()} (Age: {calculateAge(dateOfBirth)})
        </Text>
      </View>

      <View style={styles.stepperRow}>
        <Text style={styles.sliderLabel}>Year of birth</Text>
        <View style={styles.stepperControls}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() =>
              setDateOfBirth((prev) => {
                const today = new Date();
                const minYear = today.getFullYear() - 100;
                const maxYear = today.getFullYear() - 18;
                const newYear = Math.max(minYear, Math.min(prev.getFullYear() - 1, maxYear));
                return new Date(newYear, prev.getMonth(), prev.getDate());
              })
            }
          >
            <Text style={styles.stepperButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{dateOfBirth.getFullYear()}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() =>
              setDateOfBirth((prev) => {
                const today = new Date();
                const minYear = today.getFullYear() - 100;
                const maxYear = today.getFullYear() - 18;
                const newYear = Math.max(minYear, Math.min(prev.getFullYear() + 1, maxYear));
                return new Date(newYear, prev.getMonth(), prev.getDate());
              })
            }
          >
            <Text style={styles.stepperButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Ionicons name="male-female" size={60} color={COLORS.primary} />
      <Text style={styles.stepTitle}>Gender</Text>
      <Text style={styles.stepDescription}>Select your gender</Text>

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
  );

  const renderStep5 = () => (
    <ScrollView
      style={styles.stepScroll}
      contentContainerStyle={styles.stepContainer}
      showsVerticalScrollIndicator={false}
    >
      <Ionicons name="heart" size={60} color={COLORS.primary} style={{ alignSelf: 'center' }} />
      <Text style={styles.stepTitle}>Lifestyle & Preferences</Text>
      <Text style={styles.stepDescription}>Tell us more about you</Text>

      <Text style={styles.label}>Religion</Text>
      <TouchableOpacity
        style={styles.dropdownField}
        onPress={() => setIsReligionModalVisible(true)}
      >
        <Text style={religion ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {religion || 'Select your religion'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Text style={styles.label}>Looking for</Text>
      <View style={styles.optionsGrid}>
        {RELATIONSHIP_INTENT_OPTIONS.slice(0, 4).map((option) => (
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

      <Text style={styles.label}>Drinking</Text>
      <View style={styles.optionsGrid}>
        {DRINKING_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              drinkingHabits === option.value && styles.optionButtonActive,
            ]}
            onPress={() => setDrinkingHabits(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                drinkingHabits === option.value && styles.optionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Smoking</Text>
      <View style={styles.optionsGrid}>
        {SMOKING_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              smokingHabits === option.value && styles.optionButtonActive,
            ]}
            onPress={() => setSmokingHabits(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                smokingHabits === option.value && styles.optionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderStep6 = () => (
    <View style={styles.stepContainer}>
      <Ionicons name="location" size={60} color={COLORS.primary} />
      <Text style={styles.stepTitle}>Location</Text>
      <Text style={styles.stepDescription}>Where are you based?</Text>

      <TouchableOpacity
        style={styles.detectButton}
        onPress={detectLocation}
        disabled={isDetectingLocation}
      >
        {isDetectingLocation ? (
          <ActivityIndicator color={COLORS.background} />
        ) : (
          <>
            <Ionicons name="navigate" size={20} color={COLORS.background} />
            <Text style={styles.detectButtonText}>Detect My Location</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dropdownField}
        onPress={() => setIsCountryModalVisible(true)}
      >
        <Text style={country ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {isCountryLoading && !countryOptions.length
            ? 'Loading countries...'
            : country || 'Select your country'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dropdownField}
        onPress={() => {
          if (!countryCode) {
            Alert.alert('Select Country', 'Please select your country first.');
            return;
          }
          setIsCityModalVisible(true);
          if (!cityOptions.length) {
            loadCitiesForCountry(countryCode);
          }
        }}
      >
        <Text style={city ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {countryCode ? city || 'Select your city' : 'Select country first'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderStep7 = () => (
    <View style={styles.stepContainer}>
      <Ionicons name="star" size={60} color={COLORS.primary} />
      <Text style={styles.stepTitle}>Interests</Text>
      <Text style={styles.stepDescription}>Select up to 5 interests</Text>

      <View style={styles.interestsGrid}>
        {INTERESTS.map((interest) => (
          <TouchableOpacity
            key={interest.id}
            style={[
              styles.interestButton,
              selectedInterests.includes(interest.id) && styles.interestButtonActive,
            ]}
            onPress={() => toggleInterest(interest.id)}
          >
            <Text style={styles.interestEmoji}>{interest.emoji}</Text>
            <Text
              style={[
                styles.interestText,
                selectedInterests.includes(interest.id) && styles.interestTextActive,
              ]}
            >
              {interest.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.selectedCount}>
        {selectedInterests.length}/5 selected
      </Text>
    </View>
  );

  const renderStep8 = () => (
    <ScrollView
      style={styles.stepScroll}
      contentContainerStyle={styles.stepContainer}
      showsVerticalScrollIndicator={false}
    >
      <Ionicons name="options" size={60} color={COLORS.primary} style={{ alignSelf: 'center' }} />
      <Text style={styles.stepTitle}>Discovery Preferences</Text>
      <Text style={styles.stepDescription}>Who would you like to meet?</Text>

      <Text style={styles.label}>Interested in</Text>
      <View style={styles.optionsGrid}>
        {[...GENDER_OPTIONS, { label: 'Everyone', value: 'Everyone' }].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              preferredGender === option.value && styles.optionButtonActive,
            ]}
            onPress={() => setPreferredGender(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                preferredGender === option.value && styles.optionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Age Range</Text>
      <View style={styles.stepperRow}>
        <Text style={styles.sliderLabel}>Min age</Text>
        <View style={styles.stepperControls}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() =>
              setPreferredAgeMin((prev) => Math.max(18, Math.min(prev - 1, preferredAgeMax)))
            }
          >
            <Text style={styles.stepperButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{preferredAgeMin}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() =>
              setPreferredAgeMin((prev) => Math.min(prev + 1, preferredAgeMax))
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
              setPreferredAgeMax((prev) => Math.max(prev - 1, preferredAgeMin))
            }
          >
            <Text style={styles.stepperButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{preferredAgeMax}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() =>
              setPreferredAgeMax((prev) => Math.min(prev + 1, 99))
            }
          >
            <Text style={styles.stepperButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.label}>Distance</Text>
      <View style={styles.stepperRow}>
        <Text style={styles.sliderLabel}>Max distance (km)</Text>
        <View style={styles.stepperControls}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() =>
              setPreferredDistance((prev) => Math.max(1, prev - 1))
            }
          >
            <Text style={styles.stepperButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{preferredDistance}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() =>
              setPreferredDistance((prev) => Math.min(100, prev + 1))
            }
          >
            <Text style={styles.stepperButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <LinearGradient
      // Light background similar to web: soft white to light pink
      colors={['#FFF7FB', '#FFE4F3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {renderProgressBar()}

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepCard}>{renderStep()}</View>
        </ScrollView>

        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, currentStep === 1 && styles.nextButtonFull]}
            onPress={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep === TOTAL_STEPS ? 'Finish' : 'Next'}
                </Text>
                <Ionicons
                  name={currentStep === TOTAL_STEPS ? 'checkmark' : 'arrow-forward'}
                  size={24}
                  color={COLORS.background}
                />
              </>
            )}
          </TouchableOpacity>
        </View>

        <Modal
          visible={isReligionModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsReligionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select your religion</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {RELIGION_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.modalOption}
                    onPress={() => {
                      setReligion(option.value);
                      setIsReligionModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsReligionModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={isCountryModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsCountryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select your country</Text>
              {isCountryLoading && !countryOptions.length ? (
                <ActivityIndicator
                  color={COLORS.primary}
                  style={{ marginVertical: SPACING.lg }}
                />
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {countryOptions.map(option => (
                    <TouchableOpacity
                      key={option.code}
                      style={styles.modalOption}
                      onPress={() => {
                        setCountry(option.label);
                        setCountryCode(option.code);
                        setCity('');
                        setCityOptions([]);
                        setIsCountryModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalOptionText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                  {!isCountryLoading && !countryOptions.length && (
                    <Text style={styles.modalEmptyText}>
                      Unable to load countries. Please try again.
                    </Text>
                  )}
                </ScrollView>
              )}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsCountryModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={isCityModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsCityModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {country ? `Select your city in ${country}` : 'Select your city'}
              </Text>
              {isCityLoading ? (
                <ActivityIndicator
                  color={COLORS.primary}
                  style={{ marginVertical: SPACING.lg }}
                />
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {cityOptions.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.modalOption}
                      onPress={() => {
                        setCity(option.value);
                        setIsCityModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalOptionText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                  {!cityOptions.length && (
                    <Text style={styles.modalEmptyText}>
                      No cities found for this country.
                    </Text>
                  )}
                </ScrollView>
              )}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsCityModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  progressTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'left',
  },
  progressSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  progressStepText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  progressPercentText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  progressDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.backgroundDark,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  stepCard: {
    backgroundColor: COLORS.background,
    borderRadius: 24,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepScroll: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  photoRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 20,
  },
  avatarButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  uploadButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
  },
  uploadButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  dropdownField: {
    width: '100%',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  dropdownPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  dropdownValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    alignSelf: 'flex-end',
  },
  dateSummary: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  optionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
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
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    alignSelf: 'flex-start',
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    marginBottom: SPACING.lg,
  },
  detectButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: '600',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    width: '100%',
  },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  interestButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  interestEmoji: {
    fontSize: 20,
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
  selectedCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.md,
  },
  sliderLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    width: '100%',
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
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 25,
  },
  backButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: COLORS.background,
    borderRadius: 24,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  modalOption: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalOptionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  modalEmptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
  modalCloseButton: {
    marginTop: SPACING.md,
    alignSelf: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  modalCloseButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    fontWeight: '600',
  },
});
