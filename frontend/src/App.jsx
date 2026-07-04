import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bot,
  History as HistoryIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  PenLine,
  Sprout,
  User,
  X,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import HabitLogger from './pages/HabitLogger';
import History from './pages/History';
import Suggestions from './pages/Suggestions';
import Profile from './pages/Profile';
import './App.css';

function AppContent() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/log', label: 'Log Habits', icon: PenLine },
    { to: '/history', label: 'History', icon: HistoryIcon },
    { to: '/suggestions', label: 'AI Insights', icon: Bot },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className={`app-container ${currentUser ? 'with-sidebar' : 'auth-layout'}`}>
      {currentUser && (
        <>
          <button
            className="sidebar-toggle"
            type="button"
            aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setIsSidebarOpen((open) => !open)}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-brand">
              <span className="sidebar-logo">
                <Sprout size={22} />
              </span>
              <span>EcoTrack</span>
            </div>

            <nav className="sidebar-nav" aria-label="Main navigation">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={19} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="sidebar-footer">
              <div className="sidebar-user">
                <span>
                  <User size={16} aria-hidden="true" />
                </span>
                <div>
                  <strong>
                    {currentUser?.displayName ||
                      currentUser?.email?.split('@')[0] ||
                      'Eco Tracker'}
                  </strong>
                  <small>{currentUser?.email}</small>
                </div>
              </div>
              <button type="button" onClick={handleLogout} className="sidebar-link sidebar-logout">
                <LogOut size={19} aria-hidden="true" />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          <button
            className={`sidebar-scrim ${isSidebarOpen ? 'visible' : ''}`}
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsSidebarOpen(false)}
          />
        </>
      )}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/log" element={<ProtectedRoute><HabitLogger /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/suggestions" element={<ProtectedRoute><Suggestions /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
