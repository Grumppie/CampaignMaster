import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Check for admin login on component mount
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    if (adminLoggedIn === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, []);

  // Determine the current user (Firebase user or admin)
  const currentUser = isAdminLoggedIn ? {
    displayName: 'Admin User'
  } : user;

  return (
    <div className="dashboard page-transition">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Welcome, {currentUser?.displayName}!</h1>
          <p>Ready to embark on your next adventure?</p>
          {isAdminLoggedIn && (
            <div style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid var(--secondary-gold)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              marginTop: 'var(--spacing-sm)',
              fontSize: '0.9rem',
              color: 'var(--secondary-gold)',
              display: 'inline-block'
            }}>
              👑 Admin Mode
            </div>
          )}
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card hover-lift">
            <h3>My Campaigns</h3>
            <p>Manage your campaigns as DM</p>
            <Link to="/campaigns" className="card-action">
              View Campaigns
            </Link>
          </div>

          <div className="dashboard-card hover-lift">
            <h3>Create Campaign</h3>
            <p>Start a new DnD adventure</p>
            <Link to="/campaigns/create" className="card-action">
              Create New
            </Link>
          </div>

          <div className="dashboard-card hover-lift">
            <h3>Join Campaign</h3>
            <p>Find and join existing campaigns</p>
            <Link to="/campaigns" className="card-action">
              Browse Campaigns
            </Link>
          </div>

          <div className="dashboard-card hover-lift">
            <h3>Achievements</h3>
            <p>Track your character achievements</p>
            <Link to="/achievements" className="card-action">
              View Achievements
            </Link>
          </div>
        </div>

        <div className="quick-stats">
          <div className="stat-card">
            <h4>Campaigns Created</h4>
            <span className="stat-number">0</span>
          </div>
          <div className="stat-card">
            <h4>Campaigns Joined</h4>
            <span className="stat-number">0</span>
          </div>
          <div className="stat-card">
            <h4>Achievements Earned</h4>
            <span className="stat-number">0</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 