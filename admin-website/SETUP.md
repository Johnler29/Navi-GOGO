# 🚀 MetroBus Admin Website - Quick Setup Guide

## ⚡ Quick Start

The admin website will automatically detect if Supabase is not configured and show a setup screen. Follow these steps:

### 1. **Get Your Supabase Credentials**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy your **Project URL** and **anon public** key

### 2. **Configure the Admin Website**
1. The setup screen will appear automatically
2. Enter your Supabase URL and API key
3. Click **"Validate Connection"** to test
4. Click **"Download .env.local"** to get the configuration file
5. Place the `.env.local` file in the `admin-website` directory
6. Restart the development server

### 3. **Start the Admin Website**
```bash
cd admin-website
npm install
npm start
```

## 🔧 Manual Configuration

If you prefer to set up manually:

### Create Environment File
Create a `.env.local` file in the `admin-website` directory:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

### Example Configuration
```env
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🎯 What You'll See

Once configured, you'll have access to:

- **Dashboard**: Real-time system overview
- **Fleet Management**: Manage buses and routes
- **Driver Management**: Add and manage drivers
- **Settings**: Configure system preferences
- **Reports**: View analytics and reports

## 🛠️ Troubleshooting

### "Invalid supabaseUrl" Error
- Make sure your URL starts with `https://`
- Check that you copied the full URL from Supabase dashboard
- Ensure there are no extra spaces or characters

### "Connection Failed" Error
- Verify your API key is correct
- Check that your Supabase project is active
- Ensure your database tables are set up (run the SQL scripts)

### Environment Variables Not Loading
- Make sure the file is named `.env.local` (not `.env`)
- Restart the development server after creating the file
- Check that variable names start with `REACT_APP_`

## 📚 Next Steps

1. **Set up your database**: Run the SQL scripts in the `sql/` directory
2. **Create admin users**: Use the admin setup scripts
3. **Test the features**: Try adding drivers and buses
4. **Configure settings**: Set up notifications and preferences

## 🆘 Need Help?

- Check the browser console for detailed error messages
- Verify your Supabase project is active and accessible
- Ensure all required database tables exist
- Check the main project documentation for database setup

---

**Your MetroBus admin website is ready to manage your fleet!** 🚌✨
