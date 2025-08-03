# MetroBus Tracker 🚌

A real-time bus tracking mobile application built with React Native and Expo. Passengers can track buses, view routes, and get live updates on bus locations and arrival times.

## Features ✨

### 🗺️ Live Map Tracking
- Real-time bus location tracking on interactive maps
- User location detection and display
- Bus markers with detailed information and PWD seat indicators
- Play/pause tracking controls
- Center on user location functionality

### 📋 Bus List
- View all available buses with status indicators
- Filter buses by status (Active, etc.)
- **PWD seat availability tracking and filtering**
- Real-time bus information (speed, passengers, ETA)
- Pull-to-refresh functionality
- Quick navigation to map view

### 🛣️ Route Planning
- Search routes by origin and destination
- Popular destinations quick selection
- Detailed route information with stops
- Route duration, frequency, and fare information
- Interactive route tracking

### 🎨 Modern UI/UX
- Beautiful gradient design
- Intuitive navigation
- Responsive layout
- Status indicators and badges
- **Accessibility features with PWD seat indicators**
- Smooth animations and transitions

## Screenshots 📱

The app includes four main screens:
1. **Home Screen** - Main dashboard with quick access to features
2. **Live Map** - Real-time bus tracking with interactive map
3. **Bus List** - Comprehensive list of all available buses
4. **Route Screen** - Route planning and search functionality

## Installation & Setup 🚀

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS) or Android Emulator (for Android)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd MetroBusTracker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm start
```

### 4. Run on Device/Simulator
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

## Dependencies 📦

### Core Dependencies
- `expo` - React Native development platform
- `@rnmapbox/maps` - Map component for React Native using Mapbox
- `expo-location` - Location services
- `@react-navigation/native` - Navigation library
- `expo-linear-gradient` - Gradient backgrounds
- `@expo/vector-icons` - Icon library

### Development Dependencies
- `@babel/core` - JavaScript compiler

## Project Structure 📁

```
MetroBusTracker/
├── App.js                 # Main app component with navigation
├── screens/               # Screen components
│   ├── HomeScreen.js      # Main dashboard
│   ├── MapScreen.js       # Live map with bus tracking
│   ├── BusListScreen.js   # Bus list and filtering
│   └── RouteScreen.js     # Route planning and search
├── assets/                # App assets (icons, images)
├── package.json           # Dependencies and scripts
└── README.md             # Project documentation
```

## Usage Guide 📖

### Getting Started
1. Open the app and grant location permissions
2. Navigate through the home screen to access different features
3. Use the map to track buses in real-time
4. Search for routes or browse available buses

### Tracking Buses
1. Go to the "Live Map" screen
2. Enable tracking with the play button
3. Tap on bus markers to see detailed information
4. Use the locate button to center on your position

### Finding Routes
1. Navigate to "My Route" screen
2. Enter your origin and destination
3. Browse available routes or use popular destinations
4. Tap on a route to see stops and details
5. Use "Track This Route" to view on map

### Viewing Bus List
1. Go to "Available Buses" screen
2. Use filters to show specific bus statuses (including PWD seats filter)
3. Pull down to refresh bus data
4. Tap on a bus to view it on the map
5. Check PWD seat availability for each bus

## Configuration ⚙️

### Location Permissions
The app requires location permissions to:
- Show user location on the map
- Calculate distances to bus stops
- Provide accurate tracking information

### Map Configuration
- Currently uses Mapbox (requires access token for production)
- **Set your Mapbox access token in `app.json` under `expo.extra.MAPBOX_ACCESS_TOKEN`**
- Mock data is used for demonstration purposes
- Real implementation would connect to bus tracking APIs
- See `MAPBOX_SETUP.md` for detailed setup instructions
- **Do NOT commit your real Mapbox token to public repositories**

## Mock Data 🎭

The app currently uses mock data for demonstration:
- 5 sample bus routes
- Real-time location simulation
- Bus status and passenger information
- Route schedules and stops

## Future Enhancements 🚀

### Planned Features
- [x] **PWD seat availability tracking**
- [ ] Real-time API integration
- [ ] Push notifications for bus arrivals
- [ ] Offline mode support
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Bus capacity alerts
- [ ] Route optimization
- [ ] Payment integration

### Technical Improvements
- [ ] Backend API development
- [ ] Database integration
- [ ] Real-time WebSocket connections
- [ ] Performance optimization
- [ ] Unit and integration tests

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support 💬

If you have any questions or need help:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Acknowledgments 🙏

- Expo team for the amazing development platform
- React Native community for excellent libraries
- Google Maps for mapping services
- All contributors and testers

---

**Made with ❤️ for better public transportation experience** 

## Migration Note

This project previously used Google Maps via `react-native-maps`. It now uses Mapbox via `@rnmapbox/maps` for all mapping features. 