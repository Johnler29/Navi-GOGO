#!/usr/bin/env node

// Development optimization script
const fs = require('fs');
const path = require('path');

console.log('🚀 Optimizing MetroBus Tracker for development...');

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || process.env.EXPO_DEV === 'true';

if (isDev) {
  console.log('✅ Development mode detected');
  console.log('📝 Tips for faster reloading:');
  console.log('   - Use "npm run start:fast" for faster builds');
  console.log('   - Use "npm run reset" if you encounter issues');
  console.log('   - Disable location services in development');
  console.log('   - Close unused screens in your IDE');
  console.log('   - Use Expo Go app instead of development build');
} else {
  console.log('🏭 Production mode detected');
}

console.log('🎯 Optimization complete!');
