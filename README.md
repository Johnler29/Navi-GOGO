# 🚌 MetroBus Tracker

A comprehensive React Native bus tracking and navigation app with real-time location services, built with Expo and Supabase.

## ✨ Features

### 🚍 Passenger Features
- **Real-time Bus Tracking**: Live location of buses on interactive maps
- **Route Information**: Detailed bus routes with stops and schedules
- **Nearby Buses**: Find buses near your current location
- **PWD Accessibility**: Information about wheelchair-accessible seats
- **Feedback System**: Submit feedback and suggestions
- **Search Functionality**: Search for specific routes and buses

### 🚗 Driver Features
- **Driver Dashboard**: Overview of daily trips and statistics
- **Route Navigation**: Turn-by-turn navigation for drivers
- **Schedule Management**: View and manage work schedules
- **Trip Tracking**: Start/stop trips and track progress
- **Real-time Updates**: Live location sharing with passengers

### 🗺️ Map Features
- **Google Maps Integration**: Interactive maps with real-time data
- **GPS Location**: Accurate user location detection
- **Bus Markers**: Visual representation of bus locations
- **Route Visualization**: Display bus routes on maps
- **Location Services**: Real-time location tracking

### 🔧 Technical Features
- **Supabase Backend**: Real-time database with PostgreSQL
- **Authentication**: User authentication and role management
- **Real-time Updates**: Live data synchronization
- **Offline Support**: Basic functionality without internet
- **Cross-platform**: Works on iOS and Android

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Maps**: Google Maps API
- **Navigation**: React Navigation
- **State Management**: React Context API
- **Authentication**: Supabase Auth

## 📱 Screenshots

### Passenger Mode
- Home Screen with nearby buses
- Bus list with real-time status
- Interactive map with bus locations
- Route search and information

### Driver Mode
- Driver dashboard with statistics
- Route navigation with GPS
- Schedule management
- Trip tracking interface

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Supabase account
- Google Maps API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/metrobus-tracker.git
   cd metrobus-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql`
   - Update `lib/supabase.js` with your credentials

4. **Configure Google Maps**
   - Get a Google Maps API key
   - Follow the setup guide in `GOOGLE_MAPS_SETUP.md`

5. **Start the development server**
   ```bash
   npx expo start
   ```

## 📋 Setup Guides

### Supabase Setup
See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions on:
- Creating a Supabase project
- Setting up the database schema
- Configuring authentication
- Testing the connection

### Google Maps Setup
See [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md) for:
- Getting API keys
- Configuring maps
- Setting up location services

### Android Setup
See [ANDROID_SETUP.md](./ANDROID_SETUP.md) for:
- Building for Android
- Configuring native modules
- Publishing to Google Play

## 🗄️ Database Schema

The app uses the following Supabase tables:

- **buses**: Bus information and current status
- **routes**: Bus routes and paths
- **stops**: Bus stops and locations
- **schedules**: Driver schedules and timings
- **drivers**: Driver information and credentials
- **users**: User accounts and preferences
- **feedback**: User feedback and suggestions
- **bus_tracking**: Real-time bus location data

## 🔧 Configuration

### Environment Variables
Create a `.env` file with:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Supabase Configuration
Update `lib/supabase.js` with your Supabase credentials:
```javascript
const supabaseUrl = 'your_supabase_url';
const supabaseAnonKey = 'your_supabase_anon_key';
```

## 📱 Running the App

### Development
```bash
npx expo start
```

### iOS Simulator
```bash
npx expo start --ios
```

### Android Emulator
```bash
npx expo start --android
```

### Web Browser
```bash
npx expo start --web
```

## 🧪 Testing

### Database Connection
1. Open the app
2. Go to Profile tab
3. Check "Database Status"
4. Test connection if needed

### Location Services
1. Open Map screen
2. Allow location permissions
3. Verify blue dot appears
4. Test "My Location" button

### Real-time Features
1. Submit feedback from Home screen
2. Check Settings → View Submitted Data
3. Verify data appears in Supabase dashboard

## 🚀 Deployment

### Expo Build
```bash
npx expo build:android
npx expo build:ios
```

### EAS Build (Recommended)
```bash
npm install -g @expo/eas-cli
eas build --platform android
eas build --platform ios
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the development platform
- [Supabase](https://supabase.com/) for the backend services
- [React Navigation](https://reactnavigation.org/) for navigation
- [Google Maps](https://developers.google.com/maps) for mapping services

## 📞 Support

If you encounter any issues or have questions:

1. Check the setup guides in the `/docs` folder
2. Review the console logs for error messages
3. Test database connection in Settings
4. Create an issue on GitHub

## 🔄 Updates

### Recent Updates
- ✅ Real-time bus tracking with Supabase
- ✅ Google Maps integration with GPS
- ✅ Driver and passenger modes
- ✅ Database connection testing
- ✅ Location services optimization
- ✅ Bottom navigation implementation

### Planned Features
- 🔄 Push notifications
- 🔄 Offline mode
- 🔄 Multi-language support
- 🔄 Advanced analytics
- 🔄 Payment integration

---

**Built with ❤️ using React Native and Supabase** 