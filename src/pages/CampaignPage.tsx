import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getCampaignById, joinCampaign } from '../services/campaigns';
import { Campaign, CampaignPlayer } from '../types';
import { JoinCampaignModal } from '../components/campaign/JoinCampaignModal';
import { PlayerAchievementModal } from '../components/campaign/PlayerAchievementModal';
import { AchievementManager } from '../components/achievement/AchievementManager';
import './CampaignPage.css';

export const CampaignPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<CampaignPlayer | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'players'>('overview');

  // Check for admin login on component mount
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    if (adminLoggedIn === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) return;
      
      try {
        setLoading(true);
        const campaignData = await getCampaignById(campaignId);
        setCampaign(campaignData);
        
        // Check if user should see join modal
        if (user && campaignData) {
          const isInCampaign = campaignData.players.some(player => player.userId === user.uid);
          const isDM = campaignData.dmId === user.uid;
          const isOnJoinRoute = location.pathname.includes('/join');
          
          // Show join modal if user is on join route and not in campaign and not DM
          if (isOnJoinRoute && !isInCampaign && !isDM) {
            setShowJoinModal(true);
          } else if (!isInCampaign && !isDM && !isOnJoinRoute) {
            // If user is not in campaign and not on join route, redirect to join
            navigate(`/campaigns/${campaignId}/join`);
          }
        }
      } catch (err) {
        setError('Failed to load campaign');
        console.error('Error fetching campaign:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId, user, location.pathname, navigate]);

  const handleJoinCampaign = async (characterName: string) => {
    if (!campaignId) return;
    
    const currentUser = isAdminLoggedIn ? { uid: 'admin' } : user;
    if (!currentUser) {
      setError('You must be logged in to join a campaign');
      return;
    }

    try {
      setError(null); // Clear any previous errors
      await joinCampaign(campaignId, currentUser.uid, characterName);
      setShowJoinModal(false);
      
      // Show success message briefly
      const successMessage = `Successfully joined ${campaign?.name} as ${characterName}!`;
      console.log(successMessage);
      
      // Refresh campaign data to show the new player
      const updatedCampaign = await getCampaignById(campaignId);
      if (updatedCampaign) {
        setCampaign(updatedCampaign);
      }
      
      // Redirect to main campaign page after joining
      navigate(`/campaigns/${campaignId}`);
    } catch (err) {
      console.error('Error joining campaign:', err);
      setError('Failed to join campaign. Please try again.');
      // Don't close modal on error so user can try again
    }
  };

  const handleViewPlayerAchievements = (player: CampaignPlayer) => {
    setSelectedPlayer(player);
    setShowPlayerModal(true);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
    setSelectedPlayer(null);
  };

  const handlePlayerUpdate = () => {
    // Refresh campaign data when player achievements are updated
    if (campaignId) {
      fetchCampaign();
    }
  };

  const fetchCampaign = async () => {
    if (!campaignId) return;
    
    try {
      setLoading(true);
      const campaignData = await getCampaignById(campaignId);
      setCampaign(campaignData);
      
      // Check if user should see join modal
      if (user && campaignData) {
        const isInCampaign = campaignData.players.some(player => player.userId === user.uid);
        const isDM = campaignData.dmId === user.uid;
        const isOnJoinRoute = location.pathname.includes('/join');
        
        // Show join modal if user is on join route and not in campaign and not DM
        if (isOnJoinRoute && !isInCampaign && !isDM) {
          setShowJoinModal(true);
        } else if (!isInCampaign && !isDM && !isOnJoinRoute) {
          // If user is not in campaign and not on join route, redirect to join
          navigate(`/campaigns/${campaignId}/join`);
        }
      }
    } catch (err) {
      setError('Failed to load campaign');
      console.error('Error fetching campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentUser = isAdminLoggedIn ? { uid: 'admin', displayName: 'Admin User' } : user;
  const isDM = campaign?.dmId === currentUser?.uid;
  const isPlayer = campaign?.players.some(player => player.userId === currentUser?.uid);

  if (loading) {
    return (
      <div className="campaign-page page-transition">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="campaign-page page-transition">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || 'Campaign not found'}</p>
          <button onClick={() => navigate('/campaigns')}>Back to Campaigns</button>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-page page-transition">
      <div className="campaign-page-container">
        {/* Campaign Header */}
        <div className="campaign-header">
          <div className="campaign-title-section">
            <h1>{campaign?.name}</h1>
            <p className="campaign-description">{campaign?.description}</p>
            <div className="campaign-meta">
              <span className="dm-info">DM: {campaign?.dmName}</span>
              <span className="player-count">{campaign?.players?.length || 0} players</span>
              {isDM && <span className="dm-badge">You are the DM</span>}
              {isPlayer && !isDM && <span className="player-badge">You are a player</span>}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="campaign-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => setActiveTab('players')}
          >
            Players ({campaign?.players?.length || 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <h2>Campaign Overview</h2>
              <div className="overview-grid">
                <div className="overview-card">
                  <h3>Recent Activity</h3>
                  <p>No recent activity</p>
                </div>
                <div className="overview-card">
                  <h3>Campaign Stats</h3>
                  <p>Players: {campaign?.players?.length || 0}</p>
                  <p>Achievements: {campaign?.assignedAchievements?.length || 0}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'players' && (
            <div className="players-tab">
              <div className="players-header">
                <h2>Campaign Players</h2>
              </div>
              
              {error && (
                <div className="error-message">{error}</div>
              )}
              
              <div className="players-list">
                {campaign?.players?.map((player: CampaignPlayer) => (
                  <div key={player.userId} className="player-card">
                    <div className="player-info">
                      <span className="player-name">{player.characterName}</span>
                      <span className="join-date">
                        Joined: {new Date(player.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="player-actions">
                      {isDM && (
                        <button className="player-action-btn" onClick={() => handleViewPlayerAchievements(player)}>
                          View Progress
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(!campaign?.players || campaign.players.length === 0) && (
                  <p className="no-players">No players have joined yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="achievements-tab">
              <AchievementManager 
                campaignId={campaign?.id || ''}
                isDM={isDM}
                currentUserId={currentUser?.uid}
              />
            </div>
          )}
        </div>
      </div>

      {/* Join Campaign Modal */}
      {showJoinModal && campaign && (
        <JoinCampaignModal
          campaign={campaign}
          onJoin={handleJoinCampaign}
          onClose={() => setShowJoinModal(false)}
        />
      )}
      
      {/* Player Achievement Modal */}
      {showPlayerModal && selectedPlayer && (
        <PlayerAchievementModal
          player={selectedPlayer}
          campaignId={campaignId || ''}
          currentUserId={currentUser?.uid || ''}
          onClose={handleClosePlayerModal}
          onUpdate={handlePlayerUpdate}
        />
      )}
    </div>
  );
}; 