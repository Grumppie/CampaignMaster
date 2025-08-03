import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { GoogleSignIn } from './components/auth/GoogleSignIn';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { CampaignList } from './pages/CampaignList';
import { CampaignCreate } from './pages/CampaignCreate';
import { CampaignPage } from './pages/CampaignPage';
import './styles/theme.css';
import './styles/animations.css';

// Loading component
const LoadingSpinner: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    background: 'linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%)'
  }}>
    <div className="loading-spinner" style={{
      width: '50px',
      height: '50px',
      border: '4px solid var(--border-color)',
      borderTop: '4px solid var(--secondary-gold)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
  </div>
);

// Admin Modal Component
const AdminModal: React.FC<{ isOpen: boolean; onClose: () => void; onLogin: () => void }> = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes - moved outside conditional
  React.useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === 'halloween77') {
      onLogin();
    } else {
      setError('Invalid admin password');
      setPassword('');
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(5px)'
      }}
      onClick={onClose} // Close when clicking backdrop
    >
      <div 
        style={{
          background: 'var(--card-bg)',
          border: '2px solid var(--secondary-gold)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-xl)',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
        onKeyDown={handleKeyDown}
      >
        <h2 style={{
          color: 'var(--secondary-gold)',
          marginBottom: 'var(--spacing-lg)',
          textAlign: 'center',
          fontSize: '1.5rem'
        }}>
          Admin Login
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{
              display: 'block',
              marginBottom: 'var(--spacing-sm)',
              color: 'var(--light-text)',
              fontWeight: '500'
            }}>
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--border-color)',
                background: 'var(--dark-bg)',
                color: 'var(--light-text)',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              placeholder="Enter admin password"
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          {error && (
            <div style={{
              color: '#ef4444',
              marginBottom: 'var(--spacing-md)',
              textAlign: 'center',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}
          
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            justifyContent: 'center'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: 'var(--spacing-md) var(--spacing-lg)',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--light-text)',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.3s ease'
              }}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: 'var(--spacing-md) var(--spacing-lg)',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--secondary-gold)',
                background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-blue))',
                color: 'var(--light-text)',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                opacity: isLoading ? 0.7 : 1
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  
  // Check for admin login on component mount
  React.useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    if (adminLoggedIn === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, []);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user && !isAdminLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Login page
const LoginPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  
  // Check for existing admin login on component mount - moved to top
  React.useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    if (adminLoggedIn === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, []);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (user || isAdminLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    setIsAdminModalOpen(false);
    // Create a mock admin user object
    const adminUser = {
      uid: 'admin',
      displayName: 'Admin User',
      email: 'admin@campaignmaster.com',
      photoURL: '',
      createdCampaigns: [],
      joinedCampaigns: []
    };
    // Store admin state in localStorage for persistence
    localStorage.setItem('adminLoggedIn', 'true');
    localStorage.setItem('adminUser', JSON.stringify(adminUser));
  };
  
  return (
    <div className="login-page page-transition" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%)',
      padding: 'var(--spacing-xl)',
      position: 'relative'
    }}>
      {/* Admin Button */}
      <button
        onClick={() => setIsAdminModalOpen(true)}
        style={{
          position: 'absolute',
          top: 'var(--spacing-lg)',
          right: 'var(--spacing-lg)',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--secondary-gold)',
          background: 'rgba(26, 11, 46, 0.8)',
          color: 'var(--secondary-gold)',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '500',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(212, 175, 55, 0.2)';
          e.currentTarget.style.borderColor = 'var(--light-text)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(26, 11, 46, 0.8)';
          e.currentTarget.style.borderColor = 'var(--secondary-gold)';
        }}
      >
        Admin
      </button>

      {/* Main Content Box */}
      <div style={{
        background: 'var(--card-bg)',
        border: '2px solid var(--secondary-gold)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-xl)',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Shield Icon */}
        <div style={{
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, var(--gold-gradient-start), var(--gold-gradient-end))',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--spacing-lg)',
          fontSize: '2rem',
          color: 'var(--dark-bg)',
          boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
        }}>
          🛡️
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          fontWeight: '700',
          margin: '0 0 var(--spacing-md)',
          textShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
          letterSpacing: '1px'
        }}>
          D&D ACHIEVEMENTS
        </h1>
        
        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(1rem, 3vw, 1.2rem)',
          margin: '0 0 var(--spacing-xl)',
          color: 'var(--light-text)',
          opacity: 0.9,
          fontWeight: '300',
          letterSpacing: '0.5px'
        }}>
          Track your epic deeds and earn legendary badges
        </p>
        
        {/* Golden Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'center'
        }}>
          <GoogleSignIn />
        </div>
      </div>

      {/* Admin Modal */}
      <AdminModal 
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onLogin={handleAdminLogin}
      />
    </div>
  );
};

// Root component that handles initial loading
const AppContent: React.FC = () => {
  const { loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <>
            <Header />
            <Dashboard />
          </>
        </ProtectedRoute>
      } />
      <Route path="/campaigns" element={
        <ProtectedRoute>
          <>
            <Header />
            <CampaignList />
          </>
        </ProtectedRoute>
      } />
      <Route path="/campaigns/create" element={
        <ProtectedRoute>
          <>
            <Header />
            <CampaignCreate />
          </>
        </ProtectedRoute>
      } />
      <Route path="/campaigns/:campaignId" element={
        <ProtectedRoute>
          <>
            <Header />
            <CampaignPage />
          </>
        </ProtectedRoute>
      } />
      <Route path="/campaigns/:campaignId/join" element={
        <ProtectedRoute>
          <>
            <Header />
            <CampaignPage />
          </>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <AppContent />
      </div>
    </Router>
  );
}

export default App;
