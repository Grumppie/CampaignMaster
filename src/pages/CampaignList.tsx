import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getCampaigns } from '../services/campaigns';
import { Campaign } from '../types';
import { CampaignCard } from '../components/campaign/CampaignCard';
import './CampaignList.css';

export const CampaignList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for admin login on component mount
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    if (adminLoggedIn === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const campaignsData = await getCampaigns();
        setCampaigns(campaignsData);
      } catch (err) {
        setError('Failed to load campaigns');
        console.error('Error fetching campaigns:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const handleJoinCampaign = (campaign: Campaign) => {
    // Check if user is already part of the campaign
    const currentUser = isAdminLoggedIn ? { uid: 'admin' } : user;
    
    if (!currentUser) {
      setError('You must be logged in to join a campaign');
      return;
    }

    // Check if user is the DM
    const isDM = campaign.dmId === currentUser.uid;
    
    // Check if user is already in the campaign
    const isAlreadyInCampaign = campaign.players.some(player => player.userId === currentUser.uid);
    
    if (isDM) {
      // DM should always go directly to campaign page
      navigate(`/campaigns/${campaign.id}`);
    } else if (isAlreadyInCampaign) {
      // User is already in campaign, redirect to campaign page
      navigate(`/campaigns/${campaign.id}`);
    } else {
      // User needs to join, redirect to join page
      navigate(`/campaigns/${campaign.id}/join`);
    }
  };

  if (loading) {
    return (
      <div className="campaign-list page-transition">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="campaign-list page-transition">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-list page-transition">
      <div className="campaign-list-container">
        <div className="campaign-list-header">
          <h1>Available Campaigns</h1>
          <Link to="/campaigns/create" className="create-campaign-btn">
            Create New Campaign
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="empty-state">
            <h3>No campaigns available</h3>
            <p>Be the first to create a campaign!</p>
            <Link to="/campaigns/create" className="btn-primary">
              Create Your First Campaign
            </Link>
          </div>
        ) : (
          <div className="campaigns-grid">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onJoin={() => handleJoinCampaign(campaign)}
                currentUserId={isAdminLoggedIn ? 'admin' : user?.uid}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 