import React, { useState } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const isDM = campaign.dmId === currentUserId;
  const isAlreadyInCampaign = campaign.players.some(player => player.userId === currentUserId);
  
  // Check if description is long enough to need truncation
  const descriptionLength = campaign.description.length;
  const needsTruncation = descriptionLength > 150;
  const maxLength = 150;
  
  const getTruncatedDescription = () => {
    if (!needsTruncation) return campaign.description;
    return campaign.description.substring(0, maxLength) + '...';
  };
  
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

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="campaign-card hover-lift">
      <div className="campaign-header">
        <h3 className="campaign-title">{campaign.name}</h3>
        {isDM && <span className="dm-badge">DM</span>}
        {isAlreadyInCampaign && !isDM && <span className="player-badge">Player</span>}
      </div>
      
      <div className="campaign-description-container">
        <p className="campaign-description">
          {isExpanded ? campaign.description : getTruncatedDescription()}
        </p>
        {needsTruncation && (
          <button 
            className="expand-description-btn"
            onClick={toggleExpanded}
          >
            {isExpanded ? 'Read Less' : 'Read More'}
          </button>
        )}
      </div>
      
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