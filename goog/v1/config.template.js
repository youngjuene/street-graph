// Urban Navigation Graph Interface - API Configuration Template
//
// SETUP INSTRUCTIONS:
// 1. Copy this file: cp config.template.js config.js
// 2. Edit config.js and replace 'YOUR_API_KEY_HERE' with your actual API key
// 3. Never commit config.js to git (it's already in .gitignore)
//
// Get your Google Maps API key from: https://console.cloud.google.com/
// Required APIs: Places API (New), Geocoding API

const API_CONFIG = {
    GOOGLE_API_KEY: 'YOUR_API_KEY_HERE'
};

// Export for use in index.html
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
}
