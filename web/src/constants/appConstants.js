// c:/Users/Hp/Downloads/V-S CODE/Shebalove1/web/src/constants/appConstants.js

export const availableInterests = [
    { name: "Photography", emoji: "📷" },
    { name: "Traveling", emoji: "✈️" },
    { name: "Cooking", emoji: "🍳" },
    { name: "Reading", emoji: "📚" },
    { name: "Gaming", emoji: "🎮" },
    { name: "Hiking", emoji: "🥾" },
    { name: "Movies", emoji: "🎬" },
    { name: "Music", emoji: "🎵" },
    { name: "Sports", emoji: "⚽" },
    { name: "Art", emoji: "🎨" },
    { name: "Yoga", emoji: "🧘" },
    { name: "Dancing", emoji: "💃" },
    { name: "Writing", emoji: "✍️" },
    { name: "Coding", emoji: "💻" },
    { name: "Volunteering", emoji: "🤝" },
    { name: "Gardening", emoji: "🌱" },
    { name: "Fashion", emoji: "👗" },
    { name: "Fitness", emoji: "💪" },
    { name: "Foodie", emoji: "🍔" },
    { name: "Pets", emoji: "🐾" },
    { name: "Coffee", emoji: "☕" },
    { name: "Technology", emoji: "💻" }
  ];
  
  export const religionOptions = [
    { value: "", label: "Any" }, // For filters
    { value: "Christianity", label: "✝️ Christian" },         // Corrected: Christian -> Christianity
    { value: "Islam", label: "☪️ Muslim" },                // Corrected: Muslim -> Islam
    { value: "Hinduism", label: "🕉️ Hindu" },               // Corrected: Hindu -> Hinduism
    { value: "Buddhism", label: "☸️ Buddhist" },             // Corrected: Buddhist -> Buddhism
    { value: "Judaism", label: "✡️ Jewish" },              // Corrected: Jewish -> Judaism
    { value: "Spiritual but not religious", label: "✨ Spiritual" }, // Corrected: Spiritual -> Spiritual but not religious
    { value: "Agnostic", label: "🤔 Agnostic" },
    { value: "Atheist", label: "🤷 Atheist" },
    { value: "Other", label: "❓ Other" }, // For profile setup
    { value: "Prefer not to say", label: "🤫 Prefer not to say" } // For profile setup
  ];
  
  export const genderOptions = [
    { value: "", label: "Any" }, // For filters
    { value: "Male", label: "🧑 Male" },
    { value: "Female", label: "👩 Female" },
    { value: "Non-binary", label: "🧑‍🤝‍🧑 Non-binary" }, // Added for inclusivity
    { value: "Other", label: "❓ Other" }, // For profile setup
    { value: "Prefer not to say", label: "🤫 Prefer not to say" } // For profile setup
  ];
  
  
  export const relationshipIntentOptions = [
  { value: "", label: "Any" }, // For filters
  { value: "Long-term relationship", label: "💖 Long-term relationship" },
  { value: "Short-term relationship", label: "🎉 Short-term fun" }, 
  { value: "Friendship", label: "👋 New friends" }, 
  { value: "Casual dating", label: "🥂 Casual dating" },
  // Backend expects "I'm not sure yet"; keep label for UX but send valid value
  { value: "I'm not sure yet", label: "🤔 Figuring it out" }, 
  { value: "Prefer not to say", label: "🤫 Prefer not to say" }
];
  
  export const drinkingHabitOptions = [
    { value: "Socially", label: "🍻 Socially" },
    { value: "Yes", label: "🍾 Frequently" },        // Corrected: Frequently -> Yes
    { value: "Occasionally", label: "🍷 Rarely" },      // Corrected: Rarely -> Occasionally
    { value: "No", label: "🚫 Never" },               // Corrected: Never -> No
    { value: "Prefer not to say", label: "🤫 Prefer not to say" }
  ];
  
  export const smokingHabitOptions = [
    { value: "Socially", label: "🚬 Socially" },
    { value: "Yes", label: "💨 Frequently" },                       // Corrected: Frequently -> Yes
    { value: "Occasionally", label: "🤏 Rarely" },                     // Corrected: Rarely -> Occasionally
    { value: "No", label: "🚭 No" },      // Corrected: Never (including vaping) -> No
    { value: "Yes", label: "🌬️ Vape/E-cigarettes only" },        // Corrected: Vape/E-cigarettes only -> Yes
    { value: "Prefer not to say", label: "🤫 Prefer not to say" }
  ];