import React, { useState, useMemo, useEffect } from "react";
import { FiSliders, FiX } from "react-icons/fi";
import Select from "react-select";
import countryList from "react-select-country-list";
import { religionOptions, genderOptions } from "../constants/appConstants";

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
  const geoNamesUsername = "nexovate"; // Your GeoNames username

  const countryOptions = useMemo(() => countryList().getData(), []);
  
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 w-full max-w-md shadow-2xl ring-1 ring-black/5 transform transition-all duration-300 ease-out scale-95 group-hover:scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-fuchsia-700 flex items-center">
            <FiSliders className="mr-3" /> Discovery Filters
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-fuchsia-700">
            <FiX size={24} />
          </button>
        </div>

        {/* Filters Form */}
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          {/* Age Range */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Age Range: {localFilters.ageMin} - {localFilters.ageMax}</label>
            <div className="flex items-center gap-3">
              <span>{localFilters.ageMin}</span>
              <input
                type="range"
                min="18"
                max="99"
                value={localFilters.ageMin}
                onChange={e => handleChange("ageMin", parseInt(e.target.value))}
                className="w-full h-2 bg-fuchsia-200 rounded-lg appearance-none cursor-pointer accent-fuchsia-600"
              />
            </div>
            <div className="flex items-center gap-3 mt-2">
            <span>{localFilters.ageMax}</span>
              <input
                type="range"
                min="18"
                max="99"
                value={localFilters.ageMax}
                onChange={e => handleChange("ageMax", parseInt(e.target.value))}
                className="w-full h-2 bg-fuchsia-200 rounded-lg appearance-none cursor-pointer accent-fuchsia-600"
              />
            </div>
          </div>

          {/* Country */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Country</label>
            <Select
              options={countryOptions}
              value={countryOptions.find(opt => opt.label === localFilters.country)}
              onChange={opt => handleChange("country", opt ? opt.label : "")}
              className="w-full"
              isClearable
              placeholder="Select a country"
              formatOptionLabel={(option) => (
                <div className="flex items-center gap-2">
                  <span>{countryFlagEmoji(option.value)}</span>
                  <span>{option.label}</span>
                </div>
              )}
            />
          </div>

          {/* City */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">City</label>
            <Select
              options={cityOptions}
              value={cityOptions.find(opt => opt.value === localFilters.city)}
              onChange={opt => handleChange("city", opt ? opt.value : "")}
              className="w-full"
              isClearable
              placeholder={
                isLoadingCities ? "Loading cities..." :
                selectedCountryCode ? `Select city in ${localFilters.country}` :
                "Select a country first"
              }
              isDisabled={!selectedCountryCode || isLoadingCities || cityOptions.length <= 1}
              isLoading={isLoadingCities}
              noOptionsMessage={() => 
                isLoadingCities ? "Loading..." :
                selectedCountryCode ? `No cities found for ${localFilters.country}` :
                "Please select a country first"
              }
            />
             <div className="text-xs text-gray-500 mt-1">
              {!isLoadingCities && selectedCountryCode && cityOptions.length > 1 ? 
                `${cityOptions.length - 1} cities available for ${localFilters.country}` : 
                !isLoadingCities && selectedCountryCode ? "No cities listed for this country." : ""}
            </div>
          </div>

          {/* Gender */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Gender</label>
            <Select
              options={genderOptions.map(opt => (
                opt.value === "" ? opt : { ...opt, label: `${opt.label.split(' ')[0]} ${opt.label.split(' ').slice(1).join(' ')}` }
              ))}
              value={genderOptions.find(opt => opt.value === localFilters.gender) || { value: "", label: "Any" }}
              onChange={opt => handleChange("gender", opt ? opt.value : "")}
              className="w-full"
            />
          </div>

          {/* Religion */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Religion</label>
            <Select
              options={religionOptions.map(opt => (
                opt.value === "" ? opt : { ...opt, label: `${opt.label.split(' ')[0]} ${opt.label.split(' ').slice(1).join(' ')}` }
              ))}
              value={religionOptions.find(opt => opt.value === localFilters.religion) || { value: "", label: "Any" }}
              onChange={opt => handleChange("religion", opt ? opt.value : "")}
              className="w-full"
            />
          </div>

          {/* Interests */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Interests (select up to 5)</label>
            <Select
              isMulti
              options={interestsList.map(interest => ({ value: interest.name, label: `${interest.emoji} ${interest.name}` }))}
              value={localFilters.interests.map(interest => {
                const found = interestsList.find(i => i.name === interest);
                return found ? { value: found.name, label: `${found.emoji} ${found.name}` } : null;
              }).filter(Boolean)}
              onChange={selectedOptions => {
                if (selectedOptions.length <= 5) {
                  handleChange("interests", selectedOptions.map(opt => opt.value));
                }
              }}
              className="w-full"
              placeholder="Select interests..."
            />
          </div>

          {/* Apply Filters Button */}
          <button
            onClick={handleApply}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-opacity-50"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}