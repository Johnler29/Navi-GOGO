# 🚀 MetroBus Admin Website - Free Hosting Deployment Guide

## 🌟 **Vercel Deployment (RECOMMENDED)**

### **Step 1: Prepare Your Code**
```bash
# Navigate to admin website directory
cd admin-website

# Install dependencies
npm install

# Test the build
npm run build
```

### **Step 2: Push to GitHub**
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial admin website commit"

# Create repository on GitHub and push
git remote add origin https://github.com/yourusername/metrobus-admin.git
git push -u origin main
```

### **Step 3: Deploy on Vercel**
1. **Go to** [vercel.com](https://vercel.com)
2. **Sign up** with GitHub account
3. **Click** "New Project"
4. **Import** your GitHub repository
5. **Select** the `admin-website` folder
6. **Configure** build settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install`
7. **Click** "Deploy"

### **Step 4: Configure Environment Variables**
In Vercel dashboard:
1. **Go to** Project Settings → Environment Variables
2. **Add** your Supabase credentials:
   - `REACT_APP_SUPABASE_URL` = your Supabase URL
   - `REACT_APP_SUPABASE_ANON_KEY` = your Supabase anon key

### **Step 5: Update Supabase Context**
Update `src/contexts/SupabaseContext.js`:
```javascript
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
```

---

## 🌐 **Alternative: Netlify Deployment**

### **Step 1: Build Your Project**
```bash
cd admin-website
npm run build
```

### **Step 2: Deploy to Netlify**
1. **Go to** [netlify.com](https://netlify.com)
2. **Sign up** with GitHub
3. **Click** "New site from Git"
4. **Choose** your repository
5. **Configure** build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
6. **Click** "Deploy site"

### **Step 3: Add Environment Variables**
In Netlify dashboard:
1. **Go to** Site settings → Environment variables
2. **Add** your Supabase credentials

---

## 📱 **Alternative: GitHub Pages**

### **Step 1: Create GitHub Actions Workflow**
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd admin-website
        npm install
        
    - name: Build
      run: |
        cd admin-website
        npm run build
        
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: admin-website/build
```

### **Step 2: Enable GitHub Pages**
1. **Go to** Repository Settings
2. **Scroll to** Pages section
3. **Select** "GitHub Actions" as source
4. **Save** settings

---

## 🔧 **Environment Configuration**

### **Required Environment Variables**
Create `.env` file in `admin-website` directory:
```env
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### **Update SupabaseContext.js**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'your_fallback_url'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your_fallback_key'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

---

## 🎯 **Post-Deployment Checklist**

### **✅ Security**
- [ ] Environment variables are set correctly
- [ ] Supabase RLS policies are configured
- [ ] Admin authentication is working
- [ ] HTTPS is enabled (automatic on all platforms)

### **✅ Functionality**
- [ ] Admin login works
- [ ] Dashboard loads correctly
- [ ] Fleet management functions
- [ ] Driver management works
- [ ] Real-time updates are working

### **✅ Performance**
- [ ] Site loads quickly
- [ ] Images are optimized
- [ ] No console errors
- [ ] Mobile responsive

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Build Fails**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### **Environment Variables Not Working**
- Check variable names start with `REACT_APP_`
- Restart development server after adding variables
- Verify variables are set in hosting platform

#### **Supabase Connection Issues**
- Verify URL and key are correct
- Check Supabase project is active
- Ensure RLS policies allow your domain

#### **Routing Issues (404 on refresh)**
For Vercel/Netlify, add `_redirects` file in `public` folder:
```
/*    /index.html   200
```

---

## 📊 **Platform Comparison**

| Feature | Vercel | Netlify | GitHub Pages |
|---------|--------|---------|--------------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **React Support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Custom Domain** | ✅ Free | ✅ Free | ✅ Free |
| **SSL Certificate** | ✅ Auto | ✅ Auto | ✅ Auto |
| **Bandwidth** | 100GB | 100GB | 1GB |
| **Build Time** | 6000 min | 300 min | 2000 min |
| **Serverless Functions** | ✅ | ✅ | ❌ |

---

## 🎉 **You're All Set!**

Your MetroBus admin website is now live and accessible to your team. Share the URL with your administrators and start managing your bus fleet!

**Next Steps:**
1. Test all admin functions
2. Set up monitoring
3. Configure custom domain (optional)
4. Set up automated backups

**Need Help?** Check the troubleshooting section or refer to the main ADMIN-SETUP-GUIDE.md
