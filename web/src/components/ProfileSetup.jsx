import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  FiCamera, FiUser, FiType, FiSmile, FiChevronDown, FiMapPin, FiChevronRight, FiChevronLeft, FiCheckCircle, FiHeart,
  FiAlertTriangle, FiCalendar, FiEdit2, FiUsers, FiCoffee, FiMoon, FiGlobe, FiFilter, FiTarget, FiMaximize, FiLoader
} from "react-icons/fi";
import Select from "react-select";
import countryList from "react-select-country-list";
import {
  religionOptions as appReligionOptions,
  genderOptions as appGenderOptions,
  relationshipIntentOptions as appRelationshipIntentOptions,
  drinkingHabitOptions as appDrinkingHabitOptions,
  smokingHabitOptions as appSmokingHabitOptions
} from "../constants/appConstants";

const GEONAMES_USERNAME = "nexovate"; 

// Filter out 'Any' and 'Prefer not to say' for user's own selection where appropriate
const userGenderOptions = appGenderOptions.filter(opt => opt.value !== "" && opt.value !== "Prefer not to say");
const userReligionOptions = appReligionOptions.filter(opt => opt.value !== "");
const userRelationshipIntentOptions = appRelationshipIntentOptions.filter(opt => opt.value !== "");

// Options for preferences can include 'Any'
const prefGenderOptions = appGenderOptions;
const prefReligionOptions = appReligionOptions;

// Helper function to calculate age
const calculateAge = (dobString) => {
  if (!dobString) return "";
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const MAX_SELECTED_INTERESTS = 5; // Define the maximum number of interests

export default function ProfileSetup({ currentUser, authToken, onFinish }) { 
  const [step, setStep] = useState(0);
  const totalSteps = 8; 

  // --- Profile Fields State ---
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [bio, setBio] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [profileGender, setProfileGender] = useState(null); 
  const [userReligion, setUserReligion] = useState(null);
  const [userRelationshipIntent, setUserRelationshipIntent] = useState(null);
  const [userDrinkingHabits, setUserDrinkingHabits] = useState(null); 
  const [userSmokingHabits, setUserSmokingHabits] = useState(null); 
  
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [citySearchInput, setCitySearchInput] = useState("");
  const [locationLatitude, setLocationLatitude] = useState(null);
  const [locationLongitude, setLocationLongitude] = useState(null);

  const [apiInterests, setApiInterests] = useState([]); 
  const [selectedInterests, setSelectedInterests] = useState([]); 
  const [interestsLoading, setInterestsLoading] = useState(false);

  const [preferredGender, setPreferredGender] = useState(prefGenderOptions.find(o => o.value === "")); 
  const [preferredAgeMin, setPreferredAgeMin] = useState(18);
  const [preferredAgeMax, setPreferredAgeMax] = useState(99);
  const [preferredReligion, setPreferredReligion] = useState(prefReligionOptions.find(o => o.value === ""));
  const [preferredDistance, setPreferredDistance] = useState(50); 

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [exactAddress, setExactAddress] = useState("");
  const [isDetectingExactAddress, setIsDetectingExactAddress] = useState(false);
  const [exactAddressError, setExactAddressError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formErrors, setFormErrors] = useState({}); // State for form errors

  const fileRef = useRef();
  const cityCache = useRef({});

  const commonInputClass = "w-full p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-primary focus:outline-none transition";

  const countryOptions = useMemo(() => countryList().getData(), []);

  // Define basic select styles to fix the undefined selectStyles reference
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: '#d1d5db',
      borderRadius: '0.5rem',
      minHeight: '42px',
      backgroundColor: 'var(--input-bg)',
      color: 'var(--text-color)',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#9333ea' // primary color hover
      }
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'var(--input-bg)',
      zIndex: 9999, // Ensure dropdown appears above other elements
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      maxMenuHeight: 220, // Make the dropdown scrollable
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? 'rgba(147, 51, 234, 0.1)' : 'var(--input-bg)',
      color: 'var(--text-color)',
      cursor: 'pointer',
      ':active': {
        backgroundColor: 'rgba(147, 51, 234, 0.2)'
      }
    }),
    input: (provided) => ({
      ...provided,
      color: 'var(--text-color)'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--text-color)'
    })
  };

  const loadCities = async (countryCode) => {
    setCityLoading(true);
    setCities([]);
    try {
      // This now calls our own backend, which will safely fetch from GeoNames
      const response = await fetch(`/api/cities?country=${countryCode}`);
      const data = await response.json();

      if (response.ok) {
        setCities(data);
      } else {
        console.error("Error fetching cities from backend:", data.error || 'Unknown error');
        setCities([]);
        alert(`Could not load cities: ${data.error || 'Please try again later.'}`);
      }
    } catch (error) {
      console.error("Failed to fetch cities:", error);
      alert("An error occurred while loading cities. Please check your connection and try again.");
      setCities([]);
    } finally {
      setCityLoading(false);
    }
  };

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setSelectedCity(null); // Reset city selection
    if (country && country.value) {
      loadCities(country.value);
    } else {
      setCities([]);
    }
  };

  // Function to handle country selection and load cities
  // const handleCountryChange = (country) => {
  //   console.log("Country selected:", country);
  //   setSelectedCountry(country);
  //   setSelectedCity(null);
    
  //   if (country) {
  //     setCityLoading(true);
      
  //     // Short timeout just for visual feedback that something is happening
  //     setTimeout(() => {
  //       // Get cities for the selected country or provide default cities
  //       const cities = citiesByCountry[country.value] || citiesByCountry.DEFAULT;
  //       console.log("Loading cities for", country.value, ":", cities);
  //       setCities(cities);
  //       setCityLoading(false);
  //     }, 300);
  //   } else {
  //     setCities([]);
  //   }
  // };

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || "");
      setBio(currentUser.bio || "");
      setDateOfBirth(currentUser.date_of_birth || "");
      const currentGenderOption = userGenderOptions.find(opt => opt.value === currentUser.gender);
      setProfileGender(currentGenderOption || null);

      const religionOption = userReligionOptions.find(opt => opt.value === currentUser.religion);
      setUserReligion(religionOption || null);

      const relationshipIntentOption = userRelationshipIntentOptions.find(opt => opt.value === currentUser.relationship_intent);
      setUserRelationshipIntent(relationshipIntentOption || null);

      const drinkingHabitsOption = appDrinkingHabitOptions.find(opt => opt.value === currentUser.drinks_alcohol);
      setUserDrinkingHabits(drinkingHabitsOption || null);

      const smokingHabitsOption = appSmokingHabitOptions.find(opt => opt.value === currentUser.smokes);
      setUserSmokingHabits(smokingHabitsOption || null);

      if (currentUser.interests && currentUser.interests.length > 0) {
        setSelectedInterests(currentUser.interests.map(i => i.id));
      }

      // Initialize preferences
      if (currentUser.preferences) {
        const prefGenderOpt = prefGenderOptions.find(o => o.value === currentUser.preferences.gender);
        setPreferredGender(prefGenderOpt || prefGenderOptions.find(o => o.value === "")); // Default to 'Any' or empty if not found
        setPreferredAgeMin(currentUser.preferences.age_min || 18);
        setPreferredAgeMax(currentUser.preferences.age_max || 99);
        const prefReligionOpt = prefReligionOptions.find(o => o.value === currentUser.preferences.religion);
        setPreferredReligion(prefReligionOpt || prefReligionOptions.find(o => o.value === "")); // Default to 'Any' or empty
        setPreferredDistance(currentUser.preferences.max_distance || 50);
      }

      // Initialize location if available
      if (currentUser.country) {
        const country = { value: currentUser.country, label: currentUser.country };
        setSelectedCountry(country);
        handleCountryChange(country); // Load cities for the country
      }
      if (currentUser.city) {
        setSelectedCity({ value: currentUser.city, label: currentUser.city });
      }
    }
    fetchInterests();
  }, [currentUser]);

  const fetchInterests = async () => {
    setInterestsLoading(true);
    try {
      const response = await fetch('/api/interests/');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setApiInterests(data); // Keep the raw API response with emojis
        } else {
          console.error("Interests API did not return an array:", data);
          setApiInterests([]);
        }
      } else {
        console.error("Failed to fetch interests");
        setApiInterests([]);
      }
    } catch (error) {
      console.error("Error fetching interests:", error);
      setApiInterests([]);
    } finally {
      setInterestsLoading(false);
    }
  };

  const displayName = `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim();

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || "");
      setBio(currentUser.bio || "");
      setDateOfBirth(currentUser.date_of_birth || "");
      const currentGenderOption = userGenderOptions.find(opt => opt.value === currentUser.gender);
      setProfileGender(currentGenderOption || null);

      const religionOption = userReligionOptions.find(opt => opt.value === currentUser.religion);
      setUserReligion(religionOption || null);

      const relationshipIntentOption = userRelationshipIntentOptions.find(opt => opt.value === currentUser.relationship_intent);
      setUserRelationshipIntent(relationshipIntentOption || null);

      const drinkingHabitsOption = appDrinkingHabitOptions.find(opt => opt.value === currentUser.drinks_alcohol);
      setUserDrinkingHabits(drinkingHabitsOption || null);

      const smokingHabitsOption = appSmokingHabitOptions.find(opt => opt.value === currentUser.smokes);
      setUserSmokingHabits(smokingHabitsOption || null);

      if (currentUser.interests && currentUser.interests.length > 0) {
        setSelectedInterests(currentUser.interests.map(i => i.id));
      }

      // Initialize preferences
      if (currentUser.preferences) {
        const prefGenderOpt = prefGenderOptions.find(o => o.value === currentUser.preferences.gender);
        setPreferredGender(prefGenderOpt || prefGenderOptions.find(o => o.value === "")); // Default to 'Any' or empty if not found
        setPreferredAgeMin(currentUser.preferences.age_min || 18);
        setPreferredAgeMax(currentUser.preferences.age_max || 99);
        const prefReligionOpt = prefReligionOptions.find(o => o.value === currentUser.preferences.religion);
        setPreferredReligion(prefReligionOpt || prefReligionOptions.find(o => o.value === "")); // Default to 'Any' or empty
        setPreferredDistance(currentUser.preferences.max_distance || 50);
      }

      // Initialize location if available
      if (currentUser.country) {
        const country = { value: currentUser.country, label: currentUser.country };
        setSelectedCountry(country);
        handleCountryChange(country); // Load cities for the country
      }
      if (currentUser.city) {
        setSelectedCity({ value: currentUser.city, label: currentUser.city });
      }
    }
    fetchInterests();
  }, [currentUser]);

  const validateStep = (currentStep) => {
    const newErrors = {};
    let isValid = true;

    if (currentStep === 0) {
      if (!avatar && !currentUser?.profile_photo_url) { // Check if new avatar uploaded or existing one present
        newErrors.avatar = "Profile photo is required.";
        isValid = false;
      }
    }

    if (currentStep === 1) { // Bio & Username step
      if (!username.trim()) {
        newErrors.username = "Username is required.";
        isValid = false;
      }
      if (!bio.trim()) {
        newErrors.bio = "Bio is required.";
        isValid = false;
      }
    }

    if (currentStep === 2) { // My Basics step
      if (!profileGender) { 
        newErrors.profileGender = "Gender is required.";
        isValid = false;
      }
      if (!dateOfBirth) {
        newErrors.dateOfBirth = "Date of birth is required.";
        isValid = false;
      }
      if (!userReligion) {
        newErrors.userReligion = "Religion is required.";
        isValid = false;
      }
    }

    if (currentStep === 3) { // My Habits
      if (!userDrinkingHabits) {
        newErrors.userDrinkingHabits = "Drinking habits are required.";
        isValid = false;
      }
      if (!userSmokingHabits) {
        newErrors.userSmokingHabits = "Smoking habits are required.";
        isValid = false;
      }
    }
    
    // Location (Step 4) is handled by HTML5 'required' for country/city Selects

    if (currentStep === 5) {
      if (selectedInterests.length === 0) {
        newErrors.selectedInterests = "Please select at least one interest.";
        isValid = false;
      }
    }

    if (currentStep === 6) { // Match Preferences 1
      // if (!preferredGender || preferredGender.value === "") { // Assuming empty string value for 'Any' or placeholder
      //   newErrors.preferredGender = "Preferred gender is required.";
      //   isValid = false;
      // }
      if (!preferredAgeMin || parseInt(preferredAgeMin) < 18) {
        newErrors.preferredAgeMin = "Minimum preferred age must be at least 18.";
        isValid = false;
      }
      if (!preferredAgeMax || parseInt(preferredAgeMax) > 99) {
        newErrors.preferredAgeMax = "Maximum preferred age cannot exceed 99.";
        isValid = false;
      }
      if (parseInt(preferredAgeMax) < parseInt(preferredAgeMin)) {
        newErrors.preferredAgeMax = "Maximum preferred age cannot be less than minimum.";
        isValid = false;
      }
    }

    if (currentStep === 7) { // Match Preferences 2
      // Preferred Religion might be optional if 'Any' is a valid choice and doesn't need explicit selection
      // If it must be explicitly chosen (not the default 'Any'), then validate:
      // if (!preferredReligion || preferredReligion.value === "") {
      //   newErrors.preferredReligion = "Preferred religion is required.";
      //   isValid = false;
      // }
      if (!preferredDistance || parseInt(preferredDistance) <= 0) {
        newErrors.preferredDistance = "Maximum distance must be a positive value.";
        isValid = false;
      }
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const prevStep = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  const nextStep = (e) => {
    e.preventDefault();
    if (validateStep(step)) {
      if (step < totalSteps - 1) {
        setStep(step + 1);
      } else {
        handleFinish();
      }
    }
  };

  const handleFinish = async () => {
    // Final validation before submitting
    if (!validateStep(step)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    const profilePayload = {
      bio,
      date_of_birth: dateOfBirth,
      gender: profileGender?.value,
      religion: userReligion?.value,
      relationship_intent: userRelationshipIntent?.value,
      drinking_habits: userDrinkingHabits?.value,
      smoking_habits: userSmokingHabits?.value,
      country: selectedCountry?.value,
      city: selectedCity?.value,
      location_latitude: locationLatitude,
      location_longitude: locationLongitude,
      interests: selectedInterests.map(i => i.value), // Ensure we send the values
    };

    const preferencesPayload = {
      preferred_gender: preferredGender?.value,
      preferred_age_min: preferredAgeMin,
      preferred_age_max: preferredAgeMax,
      preferred_religion: preferredReligion?.value,
      preferred_distance: preferredDistance,
    };

    try {
      // Await the onFinish prop. App.jsx will handle navigation on success
      // or show an alert on failure.
      await onFinish(profilePayload, preferencesPayload);
    } catch (error) {
      // The error is already alerted by App.jsx, but we can log it here too.
      console.error("An error occurred during profile submission:", error);
      setSubmitError(error.message || "Failed to save profile. Please try again.");
    } finally {
      // This is crucial to re-enable the button if the submission fails.
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0: // Photo Upload
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Add a Profile Photo</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">This helps people recognize you.</p>
            <div className="flex flex-col items-center mb-4">
              <img
                src={avatar || "/default-avatar.png"} 
                alt="Profile Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-fuchsia-500 shadow-lg bg-gray-200 dark:bg-gray-700"
              />
              <button
                type="button"
                onClick={() => fileRef.current && fileRef.current.click()}
                className="mt-4 px-4 py-2.5 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-lg font-semibold text-sm transition"
              >
                Upload Photo
              </button>
              <input type="file" ref={fileRef} onChange={handlePhoto} accept="image/*" className="hidden" />
              {formErrors.avatar && <p className="text-sm text-red-500 mt-2">{formErrors.avatar}</p>}
            </div>
          </div>
        );

      case 1: // Username and Bio
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Tell Us About Yourself</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your name is <span className="font-semibold text-primary">{displayName}</span>.
            </p>
            
            <div className="w-full text-left mb-4">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Username</label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 mt-1 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-transparent focus:border-primary focus:outline-none transition"
                placeholder="e.g., jane_doe_123"
              />
              {formErrors.username && <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>}
            </div>

            <div className="w-full text-left">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-3 mt-1 bg-gray-100 dark:bg-gray-800 rounded-lg h-28 resize-none border-2 border-transparent focus:border-primary focus:outline-none transition"
                placeholder="Write a little about yourself..."
              />
              {formErrors.bio && <p className="text-red-500 text-sm mt-1">{formErrors.bio}</p>}
            </div>
          </div>
        );

      case 2: // My Basics
        return (
          <>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">The Basics</h2>
            <div className="space-y-6">
              <div className="w-full text-left">
                <label className="font-semibold text-gray-700 dark:text-gray-300">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full p-3 mt-1 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-transparent focus:border-primary focus:outline-none transition"
                />
                {formErrors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{formErrors.dateOfBirth}</p>}
              </div>
              <div className="w-full text-left">
                <label className="font-semibold text-gray-700 dark:text-gray-300">I am a...</label>
                <Select options={userGenderOptions} value={profileGender} onChange={setProfileGender} placeholder="Select your gender" />
                {formErrors.profileGender && <p className="text-red-500 text-sm mt-1">{formErrors.profileGender}</p>}
              </div>
              <div className="w-full text-left">
                <label className="font-semibold text-gray-700 dark:text-gray-300">Religion</label>
                <Select options={userReligionOptions} value={userReligion} onChange={setUserReligion} placeholder="Select your religion" />
                {formErrors.userReligion && <p className="text-red-500 text-sm mt-1">{formErrors.userReligion}</p>}
              </div>
            </div>
          </>
        );

      case 3: // My Habits
        return (
          <>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">My Habits</h2>
            <div className="space-y-6">
              <div className="w-full text-left">
                <label className="font-semibold text-gray-700 dark:text-gray-300">Drinking Habits</label>
                <Select options={appDrinkingHabitOptions} value={userDrinkingHabits} onChange={setUserDrinkingHabits} placeholder="Select..." />
                {formErrors.userDrinkingHabits && <p className="text-red-500 text-sm mt-1">{formErrors.userDrinkingHabits}</p>}
              </div>
              <div className="w-full text-left">
                <label className="font-semibold text-gray-700 dark:text-gray-300">Smoking Habits</label>
                <Select options={appSmokingHabitOptions} value={userSmokingHabits} onChange={setUserSmokingHabits} placeholder="Select..." />
                {formErrors.userSmokingHabits && <p className="text-red-500 text-sm mt-1">{formErrors.userSmokingHabits}</p>}
              </div>
            </div>
          </>
        );

      case 4: 
        return renderLocationStep();

      case 5: // My Interests
        return (
          <>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">My Interests</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Select a few things you love. It'll help you match with people who love them too.</p>
            {interestsLoading ? (
              <p>Loading interests...</p>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                {apiInterests.map((interest) => (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => selectInterest(interest.id)}
                    disabled={!selectedInterests.includes(interest.id) && selectedInterests.length >= 5}
                    className={`py-2 px-4 rounded-full border transition-colors ${
                      selectedInterests.includes(interest.id)
                        ? 'bg-primary text-white border-primary'
                        : selectedInterests.length >= 5
                        ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-primary'
                    }`}
                  >
                    <span>{interest.emoji} {interest.name}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedInterests.length >= 5 && (
              <p className="text-amber-500 text-sm mt-2">Maximum of 5 interests reached.</p>
            )}
            {selectedInterests.length === 0 && formErrors.selectedInterests && (
              <p className="text-red-500 text-sm mt-2">{formErrors.selectedInterests}</p>
            )}
          </>
        );

      case 6: // Relationship Goals
        return (
          <>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Relationship Goals</h2>
            <div className="space-y-6">
              <div className="w-full text-left">
                <label className="font-semibold text-gray-700 dark:text-gray-300">I'm looking for...</label>
                <Select options={userRelationshipIntentOptions} value={userRelationshipIntent} onChange={setUserRelationshipIntent} placeholder="Select your intent" />
                {formErrors.userRelationshipIntent && <p className="text-red-500 text-sm mt-1">{formErrors.userRelationshipIntent}</p>}
              </div>
            </div>
          </>
        );

      case 7: // Preferences
        return (
          <>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">My Ideal Match</h2>
            <div className="space-y-6">
              <div className="w-full text-left">
                <label className="font-semibold text-gray-700 dark:text-gray-300">Preferred Gender</label>
                <Select options={prefGenderOptions} value={preferredGender} onChange={setPreferredGender} placeholder="Select preferred gender" />
                {formErrors.preferredGender && <p className="text-red-500 text-sm mt-1">{formErrors.preferredGender}</p>}
              </div>
              <div className="w-full text-left">
                <label className="font-semibold text-gray-700 dark:text-gray-300">Preferred Age Range</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={preferredAgeMin} onChange={e => setPreferredAgeMin(Math.max(18, parseInt(e.target.value)))} className={`${commonInputClass} w-1/2`} min="18" />
                  <span className="text-gray-500">to</span>
                  <input type="number" value={preferredAgeMax} onChange={e => setPreferredAgeMax(Math.min(99, parseInt(e.target.value)))} className={`${commonInputClass} w-1/2`} max="99" />
                </div>
                {formErrors.preferredAgeMin && <p className="text-red-500 text-sm mt-1">{formErrors.preferredAgeMin}</p>}
                {formErrors.preferredAgeMax && !formErrors.preferredAgeMin && <p className="text-red-500 text-sm mt-1">{formErrors.preferredAgeMax}</p>}
              </div>
              <div className="w-full text-left">
                <label className="font-semibold text-gray-700 dark:text-gray-300">Preferred Religion</label>
                <Select options={prefReligionOptions} value={preferredReligion} onChange={setPreferredReligion} placeholder="Select preferred religion" />
                {formErrors.preferredReligion && <p className="text-red-500 text-sm mt-1">{formErrors.preferredReligion}</p>}
              </div>
              <div className="w-full text-left">
                <label className="font-semibold text-gray-700 dark:text-gray-300">Maximum Distance</label>
                <input type="range" min="5" max="500" step="5" value={preferredDistance} onChange={e => setPreferredDistance(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-600" />
                {formErrors.preferredDistance && <p className="text-red-500 text-sm mt-1">{formErrors.preferredDistance}</p>}
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setExactAddressError("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingLocation(true);
    setExactAddressError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationLatitude(latitude);
        setLocationLongitude(longitude);

        try {
          const response = await fetch(
            `http://api.geonames.org/findNearestAddressJSON?lat=${latitude}&lng=${longitude}&username=${GEONAMES_USERNAME}`
          );
          if (!response.ok) throw new Error("Failed to fetch address.");
          
          const data = await response.json();
          console.log("GeoNames API Response:", data); // Add this for debugging

          if (data.address) {
            const { streetNumber, street, placename, adminName1, postalcode } = data.address;
            const address = [streetNumber, street, placename, adminName1, postalcode].filter(Boolean).join(', ');
            setExactAddress(address);

            if (data.address.countryCode) {
              const country = countryOptions.find(c => c.value === data.address.countryCode);
              if (country) {
                handleCountryChange(country);
              }
            }
          } else {
            setExactAddressError("Could not find a valid address for your location.");
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setExactAddressError("Could not determine address from your location.");
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        let message;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "You denied the request for Geolocation.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message = "The request to get user location timed out.";
            break;
          default:
            message = "An unknown error occurred.";
            break;
        }
        setExactAddressError(message);
        setIsDetectingLocation(false);
      }
    );
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) setAvatar(URL.createObjectURL(file));
  };

  const selectInterest = (interestId) => {
    // Check if the interest is already selected
    const isSelected = selectedInterests.includes(interestId);
    
    if (isSelected) {
      // If interest is already selected, remove it
      setSelectedInterests(selectedInterests.filter(id => id !== interestId));
    } else {
      // If not selected and we have less than 5 interests, add it
      if (selectedInterests.length < 5) {
        setSelectedInterests([...selectedInterests, interestId]);
      }
      // If we already have 5 interests, do nothing
    }
  };

  const renderLocationStep = () => {
    return (
      <>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Your Location</h2>
        <div className="space-y-6 w-full" style={{ maxWidth: "400px", margin: "0 auto" }}>
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country</label>
            <Select 
              options={countryOptions}
              value={selectedCountry}
              onChange={handleCountryChange}
              placeholder="Select your country"
              menuPortalTarget={document.body} 
              maxMenuHeight={220}
              styles={{
                ...selectStyles,
                menuPortal: base => ({ ...base, zIndex: 9999 }),
                menu: (provided) => ({
                  ...provided,
                  backgroundColor: 'var(--input-bg)',
                })
              }}
              className="w-full"
            />
          </div>
          
          {selectedCountry && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
              <Select
                options={cities}
                value={selectedCity}
                onChange={setSelectedCity}
                isLoading={cityLoading}
                isDisabled={!selectedCountry || cityLoading}
                placeholder={cityLoading ? "Loading cities..." : "Select your city"}
                noOptionsMessage={() => "No cities found"}
                menuPortalTarget={document.body}
                maxMenuHeight={220}
                styles={{
                  ...selectStyles,
                  menuPortal: base => ({ ...base, zIndex: 9999 }),
                  menu: (provided) => ({
                    ...provided,
                    zIndex: 9999,
                    backgroundColor: 'var(--input-bg)',
                  })
                }}
                className="w-full"
              />
            </div>
          )}
          
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exact Location (Optional)</label>
            <div className="flex w-full">
              <input 
                type="text" 
                value={exactAddress}
                onChange={(e) => setExactAddress(e.target.value)}
                placeholder="E.g., Downtown, 123 Main St"
                className="flex-1 p-2.5 bg-gray-100 dark:bg-gray-800 rounded-l-lg border border-gray-300 dark:border-gray-600 focus:border-primary focus:outline-none transition"
              />
              <button 
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="w-24 flex items-center justify-center px-4 py-2.5 text-white bg-primary rounded-r-lg hover:bg-primary-dark transition-colors disabled:bg-primary-light disabled:cursor-not-allowed"
              >
                {isDetectingLocation ? <><FiLoader className="animate-spin"/> Detecting...</> : "Detect"}
              </button>
            </div>
            {exactAddressError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{exactAddressError}</p>}
          </div>
        </div>
      </>
    );
  };

  const ProgressBar = ({ currentStep, totalSteps }) => (
    <div className="flex items-center justify-center gap-2 mb-4">
      {[...Array(totalSteps).keys()].map((i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i <= currentStep ? 'bg-primary w-8' : 'bg-gray-300 dark:bg-gray-600 w-4'
          }`}
        />
      ))}
    </div>
  );

  return (
    <form
      onSubmit={nextStep}
      className="flex flex-col items-center pt-8 pb-28 px-4 min-h-screen font-sans bg-gradient-to-br from-pink-100 via-fuchsia-100 to-purple-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-200"
    >
      <h1 className="text-3xl font-bold text-fuchsia-600 dark:text-fuchsia-400 mb-2">Profile Setup</h1>
      <ProgressBar currentStep={step} totalSteps={totalSteps} />

      <div className="w-full max-w-md md:max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-14rem)]">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 shadow-top z-50">
        <div className="w-full max-w-md md:max-w-4xl mx-auto flex justify-between items-center">
          {step > 0 ? (
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-semibold shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <FiChevronLeft /> Back
            </button>
          ) : <span className="w-[90px]"></span> /* Placeholder to balance layout */}
          <button
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-fuchsia-600 text-white font-bold shadow-lg hover:bg-fuchsia-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <><FiLoader className="animate-spin"/> Saving...</> : (step < totalSteps - 1 ? (<>Next <FiChevronRight /></>) : "Finish")}
          </button>
        </div>
        {Object.keys(formErrors).length > 0 && (
            <p className="text-red-500 text-sm mt-2 text-center font-semibold">
                Please correct the errors above before continuing.
            </p>
        )}
        {submitError && <p className="text-red-500 text-sm mt-4 text-center">{submitError}</p>}
      </div>
    </form>
  );
}