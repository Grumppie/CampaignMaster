import React from 'react';
import { GlobalAchievement } from '../../types';
import './AchievementCard.css';

interface AchievementCardProps {
  achievement: GlobalAchievement;
  isDM: boolean;
  onIncrement: (achievementId: string, playerId: string) => void;
  onDecrement: (achievementId: string, playerId: string) => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  isDM,
  onIncrement,
  onDecrement
}) => {
  return (
    <div className="achievement-card">
      <div className="achievement-header">
        <h3 className="achievement-title">{achievement.name}</h3>
        <div className="achievement-type">Global Achievement</div>
        <div className="achievement-id">ID: {achievement.id}</div>
      </div>
      
      <p className="achievement-description">{achievement.description}</p>
      
      <div className="achievement-stats">
        <div className="stat">
          <span className="stat-label">Base Points:</span>
          <span className="stat-value">{achievement.basePoints}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Upgrades:</span>
          <span className="stat-value">{achievement.upgrades.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Created:</span>
          <span className="stat-value">{achievement.createdAt.toLocaleDateString()}</span>
        </div>
      </div>

      {achievement.upgrades.length > 0 && (
        <div className="achievement-upgrades">
          <h4>Upgrade Path:</h4>
          <div className="upgrades-list">
            {achievement.upgrades.map((upgrade, index) => (
              <div 
                key={upgrade.id} 
                className="upgrade-item"
              >
                <span className="upgrade-name">{upgrade.name}</span>
                <span className="upgrade-requirement">
                  {upgrade.requiredCount} required
                </span>
                <span className="upgrade-points">+{upgrade.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isDM && (
        <div className="achievement-controls">
          <h4>Player Progress</h4>
          <div className="player-controls">
            {/* TODO: Add player list and individual controls */}
            <p className="no-players">No players assigned to this achievement yet.</p>
          </div>
        </div>
      )}
    </div>
  );
}; 