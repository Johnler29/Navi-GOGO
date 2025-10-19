# 🚌 MetroBus Admin Website

A comprehensive admin dashboard for managing your MetroBus fleet, drivers, routes, and real-time tracking.

## ✨ Features

- **📊 Real-time Dashboard** - Live system overview and metrics
- **🚌 Fleet Management** - Add, edit, and manage buses
- **👨‍💼 Driver Management** - Driver accounts and assignments
- **🗺️ Route Management** - Create and manage bus routes
- **📅 Schedule Management** - Bus schedules and timetables
- **👥 User Management** - Manage system users
- **🔔 Ping Notifications** - Real-time alerts and notifications
- **📈 Reports & Analytics** - Performance insights and reports
- **⚙️ Settings** - System configuration and preferences

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd admin-website
npm install
```

### 2. Configure Supabase
The admin website will automatically detect if Supabase is not configured and show a setup screen.

1. **Get your Supabase credentials** from [supabase.com/dashboard](https://supabase.com/dashboard)
2. **Enter them in the setup screen** that appears automatically
3. **Download the .env.local file** and place it in the admin-website directory
4. **Restart the development server**

### 3. Start the Application
```bash
npm start
```

The admin website will be available at `http://localhost:3000`

## 🔧 Manual Configuration

If you prefer to configure manually, create a `.env.local` file:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn
- Supabase account and project
- Database tables set up (see main project SQL scripts)

## 🛠️ Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Project Structure

```
admin-website/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   ├── contexts/          # React contexts (Auth, Supabase)
│   ├── pages/             # Page components
│   ├── utils/             # Utility functions
│   └── App.js             # Main app component
├── package.json
└── README.md
```

## 🎯 Key Components

### Dashboard
- Real-time system metrics
- Live bus tracking map
- Performance charts
- System health indicators

### Fleet Management
- Bus CRUD operations
- Real-time location tracking
- Status management
- Driver assignments

### Driver Management
- Driver account creation
- License management
- Bus assignments
- Performance tracking

### Settings
- Database configuration
- Notification preferences
- Security settings
- General system preferences

## 🔒 Security Features

- **Authentication** - Secure admin login
- **Authorization** - Role-based access control
- **Data Validation** - Input sanitization and validation
- **Audit Logging** - Track all admin actions
- **Real-time Security** - Location validation and fraud detection

## 📱 Responsive Design

The admin website is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## 🚨 Troubleshooting

### Common Issues

**"Invalid supabaseUrl" Error**
- Check your Supabase URL format
- Ensure it starts with `https://`
- Verify no extra spaces or characters

**"Connection Failed" Error**
- Verify your API key is correct
- Check Supabase project is active
- Ensure database tables are set up

**Environment Variables Not Loading**
- File must be named `.env.local`
- Restart server after creating file
- Variables must start with `REACT_APP_`

## 📚 Documentation

- [Setup Guide](SETUP.md) - Detailed setup instructions
- [Admin Setup Guide](ADMIN-SETUP-GUIDE.md) - Admin-specific setup
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the MetroBus Tracker system. See main project for license details.

## 🆘 Support

For support and questions:
1. Check the troubleshooting section
2. Review the setup guides
3. Check browser console for errors
4. Verify Supabase configuration

---

**Built with ❤️ for efficient bus fleet management** 🚌✨
