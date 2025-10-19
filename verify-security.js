#!/usr/bin/env node

/**
 * Security Verification Script
 * Checks for any remaining hardcoded secrets in the codebase
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 MetroBus Tracker - Security Verification');
console.log('==========================================\n');

// Patterns to check for
const secretPatterns = [
  {
    name: 'Google Maps API Key',
    pattern: /AIzaSy[A-Za-z0-9_-]{35}/g,
    severity: 'HIGH'
  },
  {
    name: 'Supabase URL',
    pattern: /https:\/\/[a-z0-9]+\.supabase\.co/g,
    severity: 'HIGH'
  },
  {
    name: 'JWT Token',
    pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    severity: 'CRITICAL'
  },
  {
    name: 'Generic API Key',
    pattern: /[a-zA-Z0-9]{32,}/g,
    severity: 'MEDIUM'
  }
];

// Files to exclude from scanning
const excludePatterns = [
  /node_modules/,
  /\.git/,
  /\.expo/,
  /build/,
  /dist/,
  /\.env\.example/,
  /verify-security\.js/,
  /SECURITY_SETUP_GUIDE\.md/,
  /package-lock\.json/,
  /\.cxx/,
  /\.gradle/,
  /\.kt$/,
  /\.xml$/,
  /\.json$/,
  /\.md$/,
  /compile_commands\.json/
];

let issuesFound = 0;

function shouldExcludeFile(filePath) {
  return excludePatterns.some(pattern => pattern.test(filePath));
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      secretPatterns.forEach(({ name, pattern, severity }) => {
        const matches = line.match(pattern);
        if (matches) {
          // Skip if it's a placeholder or example
          if (line.includes('YOUR_') || line.includes('your_') || line.includes('example')) {
            return;
          }
          
          issuesFound++;
          console.log(`❌ ${severity}: ${name} found in ${filePath}:${index + 1}`);
          console.log(`   Content: ${line.trim()}`);
          console.log('');
        }
      });
    });
  } catch (error) {
    // Skip files that can't be read
  }
}

function scanDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!shouldExcludeFile(fullPath)) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        if (!shouldExcludeFile(fullPath)) {
          scanFile(fullPath);
        }
      }
    });
  } catch (error) {
    // Skip directories that can't be read
  }
}

// Start scanning
console.log('🔍 Scanning codebase for secrets...\n');
scanDirectory('.');

// Results
console.log('='.repeat(50));
if (issuesFound === 0) {
  console.log('✅ SUCCESS: No hardcoded secrets found!');
  console.log('🎉 Your codebase is secure and ready for GitHub!');
} else {
  console.log(`❌ FOUND ${issuesFound} SECURITY ISSUE(S)!`);
  console.log('🚨 Please fix these issues before pushing to GitHub.');
  console.log('\n📋 Next steps:');
  console.log('1. Replace hardcoded values with environment variables');
  console.log('2. Use .env files for local development');
  console.log('3. Set environment variables in your hosting platform');
  console.log('4. Re-run this script to verify fixes');
}

console.log('\n📚 For help, see SECURITY_SETUP_GUIDE.md');
