import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { signOutUser } from '../../services/auth';
import './Header.css';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Check for admin login on component mount
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    if (adminLoggedIn === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, []);

  const handleSignOut = async () => {
    try {
      if (isAdminLoggedIn) {
        // Handle admin sign out
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUser');
        setIsAdminLoggedIn(false);
      } else {
        // Handle Firebase sign out
        await signOutUser();
      }
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Determine the current user (Firebase user or admin)
  const currentUser = isAdminLoggedIn ? {
    displayName: 'Admin User',
    photoURL: '',
    email: 'admin@campaignmaster.com'
  } : user;

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/dashboard" className="logo">
          <h1>Campaign Master</h1>
        </Link>
        
        <nav className="nav">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/campaigns" className="nav-link">Campaigns</Link>
          <Link to="/campaigns/create" className="nav-link">Create Campaign</Link>
        </nav>
        
        <div className="user-section">
          {currentUser && (
            <>
              <div className="user-info">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName}
                    className="user-avatar"
                  />
                ) : (
                  <div className="user-avatar admin-avatar">
                    {isAdminLoggedIn ? '👑' : '👤'}
                  </div>
                )}
                <span className="user-name">
                  {currentUser.displayName}
                  {isAdminLoggedIn && <span className="admin-badge">Admin</span>}
                </span>
              </div>
              <button onClick={handleSignOut} className="sign-out-btn">
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}; 