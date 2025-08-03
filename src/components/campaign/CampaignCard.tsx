import React from 'react';
import { Campaign } from '../../types';
import './CampaignCard.css';

interface CampaignCardProps {
  campaign: Campaign;
  onJoin?: (campaign: Campaign) => void;
  currentUserId?: string;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ 
  campaign, 
  onJoin, 
  currentUserId 
}) => {
  const isDM = campaign.dmId === currentUserId;
  const isAlreadyInCampaign = campaign.players.some(player => player.userId === currentUserId);
  
  const getButtonText = () => {
    if (isDM) return 'Manage Campaign';
    if (isAlreadyInCampaign) return 'Enter Campaign';
    return 'Join Campaign';
  };

  const handleButtonClick = () => {
    if (onJoin) {
      onJoin(campaign);
    }
  };

  return (
    <div className="campaign-card hover-lift">
      <div className="campaign-header">
        <h3 className="campaign-title">{campaign.name}</h3>
        {isDM && <span className="dm-badge">DM</span>}
        {isAlreadyInCampaign && !isDM && <span className="player-badge">Player</span>}
      </div>
      
      <p className="campaign-description">{campaign.description}</p>
      
      <div className="campaign-meta">
        <span className="dm-name">DM: {campaign.dmName}</span>
        <span className="player-count">
          {campaign.players.length} players
        </span>
      </div>
      
      {onJoin && (
        <button 
          className={`campaign-btn ${isDM ? 'dm-btn' : isAlreadyInCampaign ? 'enter-btn' : 'join-btn'}`}
          onClick={handleButtonClick}
        >
          {getButtonText()}
        </button>
      )}
    </div>
  );
}; 