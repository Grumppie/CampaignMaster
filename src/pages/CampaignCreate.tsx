import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createCampaign } from '../services/campaigns';
import './CampaignCreate.css';

export const CampaignCreate: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for admin login on component mount
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    if (adminLoggedIn === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // Check for either Firebase user or admin login
    if (!user && !isAdminLoggedIn) {
      setError('You must be logged in to create a campaign');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Determine user info based on login type
      const currentUser = isAdminLoggedIn ? {
        uid: 'admin',
        displayName: 'Admin User'
      } : user!;
      
      const campaignData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        dmId: currentUser.uid,
        dmName: currentUser.displayName,
        isActive: true,
        players: [],
        achievements: []
      };

      const campaignId = await createCampaign(campaignData);
      navigate(`/campaigns/${campaignId}`);
    } catch (err) {
      setError('Failed to create campaign. Please try again.');
      console.error('Error creating campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="campaign-create page-transition">
      <div className="campaign-create-container">
        <div className="campaign-create-header">
          <h1>Create New Campaign</h1>
          <p>Begin your DnD adventure as a Dungeon Master</p>
          {(user || isAdminLoggedIn) && (
            <div style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid var(--secondary-gold)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              marginTop: 'var(--spacing-sm)',
              fontSize: '0.9rem',
              color: 'var(--secondary-gold)'
            }}>
              {isAdminLoggedIn ? 'Creating campaign as Admin User' : `Creating campaign as ${user?.displayName}`}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="campaign-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Campaign Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter campaign name..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Campaign Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your campaign world, setting, and story..."
              rows={5}
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/campaigns')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 