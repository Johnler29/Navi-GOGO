// Simple script to start the admin website
const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting MetroBus Admin Website...\n');

// Check if we're in the admin-website directory
const adminDir = path.join(__dirname, 'admin-website');
const packageJsonPath = path.join(adminDir, 'package.json');

// Check if package.json exists
const fs = require('fs');
if (!fs.existsSync(packageJsonPath)) {
  console.log('❌ package.json not found in admin-website directory');
  console.log('📁 Please make sure you\'re in the correct directory');
  process.exit(1);
}

// Change to admin-website directory and start
process.chdir(adminDir);

console.log('📦 Installing dependencies...');
exec('npm install', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error installing dependencies:', error);
    return;
  }
  
  console.log('✅ Dependencies installed successfully!');
  console.log('🌐 Starting development server...\n');
  
  // Start the development server
  exec('npm start', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error starting server:', error);
      return;
    }
    
    console.log(stdout);
  });
});
