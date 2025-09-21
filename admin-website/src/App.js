import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SupabaseProvider } from './contexts/SupabaseContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FleetManagement from './pages/FleetManagement';
import RouteManagement from './pages/RouteManagement';
import DriverManagement from './pages/DriverManagement';
import ScheduleManagement from './pages/ScheduleManagement';
import UserManagement from './pages/UserManagement';
import PingNotifications from './pages/PingNotifications';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <SupabaseProvider>
      <Router>
        <AuthProvider>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="fleet" element={<FleetManagement />} />
                <Route path="routes" element={<RouteManagement />} />
                <Route path="drivers" element={<DriverManagement />} />
                <Route path="schedules" element={<ScheduleManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="pings" element={<PingNotifications />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </SupabaseProvider>
  );
}

export default App;
