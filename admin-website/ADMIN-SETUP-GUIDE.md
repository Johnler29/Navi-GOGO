# 🌐 MetroBus Admin Website Setup Guide

## **📋 What You Can Do in the Admin Website**

### **👨‍💼 Driver Management**
- ✅ **Add new drivers** with contact info and license numbers
- ✅ **Assign drivers to specific buses** for Phase 5 security
- ✅ **View all driver assignments** and current status
- ✅ **Remove driver-bus assignments** when needed
- ✅ **Search and filter drivers** by name, email, or license
- ✅ **Set admin privileges** for certain drivers

### **🚌 Fleet Management**
- ✅ **Add new buses** to your fleet
- ✅ **Edit bus information** (name, route, capacity)
- ✅ **Change bus status** (Active, Inactive, Maintenance)
- ✅ **Update tracking status** (Moving, Stopped, At Stop)
- ✅ **View real-time bus locations** on the map
- ✅ **Assign drivers to buses** directly
- ✅ **Delete buses** from the fleet
- ✅ **Search and filter buses** by various criteria

### **📊 Dashboard & Analytics**
- ✅ **Real-time system overview** with key metrics
- ✅ **Live bus tracking** on interactive maps
- ✅ **Performance analytics** and statistics
- ✅ **System health monitoring**

## **🚀 Quick Start Guide**

### **Step 1: Navigate to Admin Website**
```bash
cd admin-website
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Configure Supabase**
1. **Open** `src/contexts/SupabaseContext.js`
2. **Update** your Supabase URL and API key:
```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
```

### **Step 4: Start the Admin Website**
```bash
npm start
```

### **Step 5: Open in Browser**
- **URL:** `http://localhost:3000`
- **Login:** Use your admin credentials

## **🔧 Advanced Setup**

### **Option 1: Use the Start Script**
```bash
# From the main project directory
node admin-website/start-admin.js
```

### **Option 2: Manual Setup**
```bash
cd admin-website
npm install
npm start
```

## **📱 How to Use the Admin Website**

### **1. Driver Management**
1. **Go to** "Driver Management" in the sidebar
2. **Click** "Add Driver" to create new drivers
3. **Fill in** driver details (name, email, phone, license)
4. **Click** "Assign Driver" to assign drivers to buses
5. **Select** driver and bus from dropdowns
6. **View** all assignments in the table below

### **2. Fleet Management**
1. **Go to** "Fleet Management" in the sidebar
2. **Click** "Add Bus" to create new buses
3. **Fill in** bus details (number, name, route, capacity)
4. **Use** the search and filter options to find specific buses
5. **Click** the three dots (⋮) to edit or delete buses
6. **Change** bus status using the dropdown menus

### **3. Real-time Monitoring**
1. **Go to** "Dashboard" to see system overview
2. **View** live bus locations on the map
3. **Monitor** system performance and metrics
4. **Check** driver assignments and bus status

## **🔒 Phase 5 Security Integration**

The admin website is fully integrated with your Phase 5 security features:

### **Driver-Bus Assignment Validation**
- ✅ **Only assigned drivers** can update bus locations
- ✅ **Assignment validation** happens in real-time
- ✅ **Audit logging** tracks all assignment changes
- ✅ **Security events** are logged and monitored

### **Location Security Checks**
- ✅ **Location accuracy validation** (rejects low accuracy)
- ✅ **Speed change validation** (detects unrealistic changes)
- ✅ **Fake location detection** (circular patterns, impossible jumps)
- ✅ **Rate limiting** prevents spam updates

## **📊 Available Features**

### **Dashboard**
- Real-time system metrics
- Live bus tracking map
- Performance charts
- System health indicators

### **Fleet Management**
- Bus CRUD operations
- Real-time location tracking
- Status management
- Driver assignments
- Search and filtering

### **Driver Management**
- Driver CRUD operations
- License management
- Bus assignments
- Performance tracking
- Admin privileges

### **Route Management**
- Route creation and editing
- Stop management
- Performance analysis

### **Reports & Analytics**
- Daily/Weekly/Monthly reports
- Route performance analysis
- Driver performance reports
- System usage statistics

## **🛠️ Troubleshooting**

### **Common Issues**

#### **1. "Cannot connect to Supabase"**
- **Check** your Supabase URL and API key
- **Verify** your internet connection
- **Ensure** Supabase project is active

#### **2. "Dependencies not found"**
```bash
cd admin-website
rm -rf node_modules package-lock.json
npm install
```

#### **3. "Port 3000 already in use"**
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use a different port
PORT=3001 npm start
```

#### **4. "Admin features not working"**
- **Check** if you're logged in as an admin user
- **Verify** the `is_admin` flag is set to `true` in your driver record
- **Ensure** Phase 5 security features are deployed

### **Getting Help**

1. **Check** the browser console for errors
2. **Verify** your Supabase configuration
3. **Ensure** all Phase 5 SQL scripts are deployed
4. **Check** the network tab for failed API calls

## **🎯 Next Steps**

1. **Set up** your admin account with `is_admin = true`
2. **Create** test drivers and buses
3. **Assign** drivers to buses
4. **Test** the Phase 5 security features
5. **Monitor** the system through the dashboard

## **✨ Pro Tips**

- **Use** the search and filter features to quickly find specific drivers or buses
- **Monitor** the dashboard for real-time system status
- **Check** the audit logs to see security events
- **Use** the grid view in Fleet Management for a visual overview
- **Set up** proper driver-bus assignments for Phase 5 security

**Your admin website is now ready to manage your entire MetroBus system!** 🚌🛡️✨
