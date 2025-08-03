# Google Maps Setup Guide for MetroBus Tracker

## Overview
This guide explains how the Google Maps API key has been integrated into your MetroBus Tracker app.

## API Key Configuration

Your Google Maps API key has been configured in the following locations:

### 1. app.json Configuration
The API key is stored in the Expo configuration:
- **Android**: `android.config.googleMaps.apiKey`
- **iOS**: `ios.config.googleMapsApiKey`
- **Extra**: `expo.extra.GOOGLE_MAPS_API_KEY`

### 2. Current API Key
```
AIzaSyAv3CxZGhXEat9i1TcE0Ok6Eu-VU1Nl8wg
```

## Features Implemented

### MapScreen (Passenger View)
- ✅ Interactive Google Maps
- ✅ User location tracking
- ✅ Mock bus markers
- ✅ Location permissions handling
- ✅ Error handling for location access

### DriverMapScreen (Driver View)
- ✅ Route visualization with polylines
- ✅ Driver location tracking
- ✅ Route waypoints
- ✅ Status overlay with route info
- ✅ Navigation button

## Dependencies Added

The following package has been added to support Google Maps:
```json
"react-native-maps": "1.10.0"
```

## How to Run the App

### Prerequisites
1. Make sure you have Expo CLI installed:
   ```bash
   npm install -g @expo/cli
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

1. **For Android:**
   ```bash
   npx expo run:android
   ```

2. **For iOS (requires macOS):**
   ```bash
   npx expo run:ios
   ```

3. **For development with Expo Go:**
   ```bash
   npx expo start
   ```
   Note: Google Maps may not work properly in Expo Go due to native dependencies.

## API Key Security

### Best Practices
1. **Never commit API keys to public repositories**
2. **Use environment variables for production**
3. **Restrict API key usage in Google Cloud Console**
4. **Monitor API usage and set up billing alerts**

### Environment Variables (Recommended for Production)
Create a `.env` file in your project root:
```
GOOGLE_MAPS_API_KEY=AIzaSyAv3CxZGhXEat9i1TcE0Ok6Eu-VU1Nl8wg
```

Then update `app.json` to use environment variables:
```json
{
  "expo": {
    "extra": {
      "GOOGLE_MAPS_API_KEY": process.env.GOOGLE_MAPS_API_KEY
    }
  }
}
```

## Google Cloud Console Setup

### Required APIs
Make sure the following APIs are enabled in your Google Cloud Console:
1. **Maps SDK for Android**
2. **Maps SDK for iOS**
3. **Places API** (for future features)
4. **Directions API** (for navigation features)

### API Key Restrictions
1. **Application restrictions**: Set to Android apps and iOS apps
2. **API restrictions**: Limit to Maps SDK for Android/iOS only
3. **Usage quotas**: Set appropriate limits to prevent unexpected charges

## Troubleshooting

### Common Issues

1. **"Maps not loading"**
   - Verify API key is correct
   - Check that Maps SDK is enabled in Google Cloud Console
   - Ensure you're using the bare workflow (not Expo Go)

2. **"Location permission denied"**
   - The app will show a fallback screen
   - Users can grant permission in device settings

3. **"API key not found"**
   - Check that the key is properly configured in `app.json`
   - Verify the key format starts with "AIzaSy"

### Testing
- Test on both Android and iOS devices
- Verify location permissions work correctly
- Check that maps load without errors
- Test the mock bus markers and route visualization

## Next Steps

### Immediate Improvements
1. **Real Bus Data**: Replace mock data with actual bus tracking API
2. **Route Optimization**: Implement real-time route calculations
3. **Push Notifications**: Add arrival time notifications
4. **Offline Maps**: Implement offline map caching

### Advanced Features
1. **Turn-by-turn Navigation**: Integrate Google Directions API
2. **Bus Stops**: Add bus stop markers and information
3. **Real-time Updates**: Implement WebSocket connections for live data
4. **Route Planning**: Add multi-stop route planning

## Cost Considerations

### Google Maps Pricing (as of 2024)
- **Maps Loads**: $7 per 1,000 loads
- **Directions**: $5 per 1,000 requests
- **Places**: $17 per 1,000 requests

### Free Tier
- 28,500 map loads per month
- 2,800 directions requests per month
- 1,000 places requests per month

## Support

If you encounter issues:
1. Check [Google Maps Platform documentation](https://developers.google.com/maps/documentation)
2. Review [react-native-maps documentation](https://github.com/react-native-maps/react-native-maps)
3. Monitor usage in Google Cloud Console
4. Set up billing alerts to avoid unexpected charges

## Security Notes

⚠️ **Important**: The API key is currently hardcoded in the configuration. For production use:
1. Move to environment variables
2. Implement proper key rotation
3. Add API key restrictions in Google Cloud Console
4. Monitor usage and set up alerts 