import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout';
import { Dashboard } from './pages/Dashboard';
import { CampaignList } from './pages/CampaignList';
import { CampaignCreate } from './pages/CampaignCreate';
import { CampaignPage } from './pages/CampaignPage';
import { Settings } from './pages/Settings';
import { Achievements } from './pages/Achievements';
import { AudioControls } from './components/audio/AudioControls';
import { ThemeProvider } from './contexts/ThemeContext';
import { AudioProvider } from './contexts/AudioContext';
import './styles/theme.css';
import './App.css';

function App() {
  const { user, loading } = useAuth();

  console.log('App: Current auth state', { user: user?.displayName, loading });

  useEffect(() => {
    console.log('App: User state changed', { user: user?.displayName, loading });
  }, [user, loading]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-text">Loading your adventure...</div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AudioProvider>
        <Router>
          <Routes>
            <Route path="/login" element={
              !user ? <LoginPage /> : <Navigate to="/dashboard" replace />
            } />
            <Route path="/" element={
              !user ? <Navigate to="/login" replace /> : <Navigate to="/dashboard" replace />
            } />
            <Route path="/dashboard" element={
              !user ? <Navigate to="/login" replace /> : (
                <AuthenticatedLayout>
                  <Dashboard />
                </AuthenticatedLayout>
              )
            } />
            <Route path="/campaigns" element={
              !user ? <Navigate to="/login" replace /> : (
                <AuthenticatedLayout>
                  <CampaignList />
                </AuthenticatedLayout>
              )
            } />
            <Route path="/campaigns/create" element={
              !user ? <Navigate to="/login" replace /> : (
                <AuthenticatedLayout>
                  <CampaignCreate />
                </AuthenticatedLayout>
              )
            } />
            <Route path="/campaigns/:id" element={
              !user ? <Navigate to="/login" replace /> : (
                <AuthenticatedLayout>
                  <CampaignPage />
                </AuthenticatedLayout>
              )
            } />
            <Route path="/campaigns/:id/join" element={
              !user ? <Navigate to="/login" replace /> : (
                <AuthenticatedLayout>
                  <CampaignPage />
                </AuthenticatedLayout>
              )
            } />
            <Route path="/settings" element={
              !user ? <Navigate to="/login" replace /> : (
                <AuthenticatedLayout>
                  <Settings />
                </AuthenticatedLayout>
              )
            } />
            <Route path="/achievements" element={
              !user ? <Navigate to="/login" replace /> : (
                <AuthenticatedLayout>
                  <Achievements />
                </AuthenticatedLayout>
              )
            } />
          </Routes>
        </Router>
      </AudioProvider>
    </ThemeProvider>
  );
}

const LoginPage: React.FC = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (user) {
      console.log('User is authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      const { innerWidth, innerHeight } = window;
      
      // Calculate normalized position (-1 to 1)
      const x = (clientX / innerWidth) * 2 - 1;
      const y = (clientY / innerHeight) * 2 - 1;
      
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleAuthSuccess = () => {
    console.log('Authentication successful - redirecting to dashboard');
    navigate('/dashboard', { replace: true });
  };

  const handleSwitchToRegister = () => {
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
  };

  // Calculate subtle transform based on mouse position
  const backgroundTransform = {
    transform: `scaleX(-1) translate(${mousePosition.x * 10}px, ${mousePosition.y * 5}px)`,
  };

  const dragonTransform = {
    transform: `scaleX(-1) translate(${mousePosition.x * 15}px, ${mousePosition.y * 8}px)`,
  };

  const heroTransform = {
    transform: `translate(${mousePosition.x * -5}px, ${mousePosition.y * -3}px)`,
  };

  // Don't render login page if user is already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="login-page">
      <div 
        className="dragon-background"
        style={dragonTransform}
      ></div>
      <div 
        className="background-overlay"
        style={backgroundTransform}
      ></div>
      <div className="login-container">
        <div className="hero-section">
          <div className="hero-content" style={heroTransform}>
            <h1 className="hero-title">
              <span className="title-line">Dungeons & Dragons</span>
              <span className="title-line">Campaign Tracker</span>
            </h1>
            <p className="hero-subtitle">
              Embark on epic adventures. Track your progress. 
              <br />
              <span className="highlight">Forge your legend.</span>
            </p>
            <div className="hero-features">
              <div className="feature">
                <span className="feature-icon">⚔️</span>
                <span>Session Management</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🏆</span>
                <span>Achievement System</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📊</span>
                <span>Global Leaderboards</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="auth-section">
          {showRegister ? (
            <RegisterForm 
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={handleSwitchToLogin}
            />
          ) : (
            <LoginForm 
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={handleSwitchToRegister}
            />
          )}
        </div>
      </div>
      <AudioControls />
    </div>
  );
};

export default App;
