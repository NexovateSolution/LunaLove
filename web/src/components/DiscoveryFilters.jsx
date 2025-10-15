import React, { useState, useMemo, useEffect } from "react";
import { FiSliders, FiX, FiHeart, FiMapPin, FiUser, FiGlobe } from "react-icons/fi";
import Select from "react-select";
import countryList from "react-select-country-list";
import { religionOptions, genderOptions } from "../constants/appConstants";
import apiClient from '../api';

// City emoji mapping by first letter (for visual enhancement)
const cityEmojiMap = {
  'a': '🏙️', 'b': '🌆', 'c': '🌃', 'd': '🏬', 'e': '🏰',
  'f': '🌉', 'g': '🏢', 'h': '🏘️', 'i': '🏛️', 'j': '🏯',
  'k': '🏭', 'l': '🌁', 'm': '🌆', 'n': '🌇', 'o': '🏠',
  'p': '🏟️', 'q': '🏜️', 'r': '🏦', 's': '🌄', 't': '🏗️',
  'u': '🏫', 'v': '🏡', 'w': '🌉', 'x': '🌌', 'y': '🏪',
  'z': '🏥'
};

// Get emoji for city based on first letter or fallback to 🏙️
function getCityEmoji(cityName) {
  if (!cityName) return '🏙️';
  const firstLetter = cityName.charAt(0).toLowerCase();
  return cityEmojiMap[firstLetter] || '🏙️';
}

// Central cache object for API responses to avoid unnecessary requests
const citiesCache = {};

// Fetch cities from GeoNames API
// IMPORTANT: Ensure your GeoNames account (username specified below) is active and enabled for web services.
async function fetchCitiesForCountry(countryCode, username) {
  if (!countryCode || !username) {
    console.warn("Country code or GeoNames username is missing.");
    return [{ value: "", label: "Any city" }];
  }

  // Return from cache if available
  if (citiesCache[countryCode]) {
    console.log(`Using cached cities for ${countryCode}:`, citiesCache[countryCode]);
    return citiesCache[countryCode];
  }
  
  try {
    console.log(`Fetching cities for country code: ${countryCode} using username: ${username}`);
    // Using HTTP endpoint to potentially avoid CORS issues in development
    const response = await fetch(
      `http://api.geonames.org/searchJSON?country=${countryCode}&featureClass=P&maxRows=50&orderby=population&username=${username}`
    );
    
    if (!response.ok) {
      // Log the full error response for better debugging
      const errorText = await response.text();
      console.error(`GeoNames API Error (${response.status}): ${errorText}`);
      throw new Error(`Failed to fetch cities: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('GeoNames API Response:', data);
    
    if (data.status) { // GeoNames sometimes returns error messages in a 'status' field
      console.error(`GeoNames API returned an error: ${data.status.message} (Value: ${data.status.value})`);
      throw new Error(`GeoNames API error: ${data.status.message}`);
    }

    if (!data.geonames || !Array.isArray(data.geonames) || data.geonames.length === 0) {
      console.warn(`No cities found by GeoNames for country code: ${countryCode}`);
      citiesCache[countryCode] = [{ value: "", label: "Any city" }]; // Cache empty result
      return citiesCache[countryCode];
    }
    
    const cities = data.geonames.map(city => ({
      value: city.name.toLowerCase().replace(/\s+/g, '-'), // Create a URL-friendly value
      label: `${getCityEmoji(city.name)} ${city.name}`,
      originalName: city.name
    }));
    
    const formattedCities = [{ value: "", label: "Any city" }, ...cities];
    citiesCache[countryCode] = formattedCities; // Save to cache
    return formattedCities;

  } catch (error) {
    console.error(`Error in fetchCitiesForCountry for ${countryCode}:`, error);
    // Do not alert, just log and return a default
    return [{ value: "", label: "Any city (Error loading)" }];
  }
}

export default function DiscoveryFilters({ open, onClose, filters, onChange, interestsList = [] }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [cityOptions, setCityOptions] = useState([{ value: "", label: "Any city" }]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [availableInterests, setAvailableInterests] = useState([]);
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);
  const geoNamesUsername = "nexovate"; // Your GeoNames username

  const countryOptions = useMemo(() => countryList().getData(), []);
  
  // Fetch interests from backend
  useEffect(() => {
    const fetchInterests = async () => {
      if (availableInterests.length > 0) return; // Already loaded
      
      setIsLoadingInterests(true);
      try {
        const response = await apiClient.get('/interests/');
        console.log('Fetched interests:', response.data);
        setAvailableInterests(response.data || []);
      } catch (error) {
        console.error('Failed to fetch interests:', error);
        setAvailableInterests([]);
      } finally {
        setIsLoadingInterests(false);
      }
    };
    
    if (open) {
      fetchInterests();
    }
  }, [open, availableInterests.length]);
  
  useEffect(() => {
    if (localFilters.country) {
      const countryOption = countryOptions.find(opt => opt.label === localFilters.country);
      const code = countryOption?.value || "";
      setSelectedCountryCode(code);
      if (!code) { // If country is cleared, reset cities
        setCityOptions([{ value: "", label: "Any city" }]);
        handleChange("city", "");
      }
    } else {
      setSelectedCountryCode("");
      setCityOptions([{ value: "", label: "Any city" }]);
      handleChange("city", "");
    }
  }, [localFilters.country, countryOptions]);

  useEffect(() => {
    if (selectedCountryCode) {
      setIsLoadingCities(true);
      fetchCitiesForCountry(selectedCountryCode, geoNamesUsername)
        .then(cities => {
          setCityOptions(cities);
        })
        .catch(error => {
          console.error("Failed to set city options:", error);
          setCityOptions([{ value: "", label: "Any city (Error)" }]);
        })
        .finally(() => {
          setIsLoadingCities(false);
        });
    } else {
      setCityOptions([{ value: "", label: "Any city" }]);
    }
    // Reset city selection when country or country code changes
    if (localFilters.city !== "") { // Only reset if a city was previously selected
        handleChange("city", "");
    }
  }, [selectedCountryCode, geoNamesUsername]);

  const handleChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onChange(localFilters);
    onClose();
  };

  const countryFlagEmoji = (countryCode) => {
    if (!countryCode) return "";
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-slate-700 transform transition-all duration-300 ease-out">
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white">
              <FiSliders size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Discovery Filters</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <FiX size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Filters Form */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Age Range */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FiHeart className="text-pink-500" size={16} />
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Age Range: {localFilters.ageMin} - {localFilters.ageMax}
              </label>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500 w-6">{localFilters.ageMin}</span>
                <input
                  type="range"
                  min="18"
                  max="99"
                  value={localFilters.ageMin}
                  onChange={e => handleChange("ageMin", parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gradient-to-r from-pink-200 to-purple-200 dark:from-pink-800 dark:to-purple-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <span className="text-xs text-gray-400">Min</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500 w-6">{localFilters.ageMax}</span>
                <input
                  type="range"
                  min="18"
                  max="99"
                  value={localFilters.ageMax}
                  onChange={e => handleChange("ageMax", parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gradient-to-r from-pink-200 to-purple-200 dark:from-pink-800 dark:to-purple-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <span className="text-xs text-gray-400">Max</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FiMapPin className="text-blue-500" size={16} />
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location</label>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Country</label>
                <Select
                  options={countryOptions}
                  value={countryOptions.find(opt => opt.label === localFilters.country)}
                  onChange={opt => handleChange("country", opt ? opt.label : "")}
                  className="w-full"
                  isClearable
                  placeholder="Any country"
                  formatOptionLabel={(option) => (
                    <div className="flex items-center gap-2">
                      <span>{countryFlagEmoji(option.value)}</span>
                      <span>{option.label}</span>
                    </div>
                  )}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '12px',
                      borderColor: '#e2e8f0',
                      '&:hover': { borderColor: '#cbd5e1' }
                    })
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">City</label>
                <Select
                  options={cityOptions}
                  value={cityOptions.find(opt => opt.value === localFilters.city)}
                  onChange={opt => handleChange("city", opt ? opt.value : "")}
                  className="w-full"
                  isClearable
                  placeholder={
                    isLoadingCities ? "Loading cities..." :
                    selectedCountryCode ? "Any city" :
                    "Select country first"
                  }
                  isDisabled={!selectedCountryCode || isLoadingCities || cityOptions.length <= 1}
                  isLoading={isLoadingCities}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '12px',
                      borderColor: '#e2e8f0',
                      '&:hover': { borderColor: '#cbd5e1' }
                    })
                  }}
                />
                {!isLoadingCities && selectedCountryCode && cityOptions.length > 1 && (
                  <div className="text-xs text-gray-400 mt-1">
                    {cityOptions.length - 1} cities available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FiUser className="text-green-500" size={16} />
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Preferences</label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Gender</label>
                <Select
                  options={genderOptions}
                  value={genderOptions.find(opt => opt.value === localFilters.gender) || { value: "", label: "Any" }}
                  onChange={opt => handleChange("gender", opt ? opt.value : "")}
                  className="w-full"
                  placeholder="Any"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '12px',
                      borderColor: '#e2e8f0',
                      '&:hover': { borderColor: '#cbd5e1' }
                    })
                  }}
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Religion</label>
                <Select
                  options={religionOptions}
                  value={religionOptions.find(opt => opt.value === localFilters.religion) || { value: "", label: "Any" }}
                  onChange={opt => handleChange("religion", opt ? opt.value : "")}
                  className="w-full"
                  placeholder="Any"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '12px',
                      borderColor: '#e2e8f0',
                      '&:hover': { borderColor: '#cbd5e1' }
                    })
                  }}
                />
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FiGlobe className="text-purple-500" size={16} />
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Interests {localFilters.interests?.length > 0 && `(${localFilters.interests.length}/5)`}
              </label>
            </div>
            <Select
              isMulti
              options={availableInterests.map(interest => ({ 
                value: interest.name, 
                label: `${interest.emoji || '🎯'} ${interest.name}` 
              }))}
              value={localFilters.interests?.map(interest => {
                const found = availableInterests.find(i => i.name === interest);
                return found ? { 
                  value: found.name, 
                  label: `${found.emoji || '🎯'} ${found.name}` 
                } : null;
              }).filter(Boolean) || []}
              onChange={selectedOptions => {
                if (selectedOptions && selectedOptions.length <= 5) {
                  handleChange("interests", selectedOptions.map(opt => opt.value));
                }
              }}
              className="w-full"
              placeholder={isLoadingInterests ? "Loading interests..." : "Select up to 5 interests..."}
              isLoading={isLoadingInterests}
              isDisabled={isLoadingInterests}
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: '12px',
                  borderColor: '#e2e8f0',
                  '&:hover': { borderColor: '#cbd5e1' }
                })
              }}
            />
            {availableInterests.length === 0 && !isLoadingInterests && (
              <div className="text-xs text-gray-400">No interests available</div>
            )}
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-6 pt-4 border-t border-gray-100 dark:border-slate-700">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}