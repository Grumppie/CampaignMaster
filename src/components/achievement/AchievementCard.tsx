import React from 'react';
import { Achievement } from '../../types';
import './AchievementCard.css';

interface AchievementCardProps {
  achievement: Achievement;
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
  const getCurrentLevelInfo = () => {
    if (achievement.currentLevel === 0) {
      return {
        name: achievement.name,
        description: achievement.description,
        points: achievement.basePoints
      };
    }
    
    const currentUpgrade = achievement.upgrades.find(
      upgrade => upgrade.requiredCount === achievement.currentLevel
    );
    
    return currentUpgrade || {
      name: achievement.name,
      description: achievement.description,
      points: achievement.basePoints
    };
  };

  const currentLevel = getCurrentLevelInfo();

  return (
    <div className="achievement-card">
      <div className="achievement-header">
        <h3 className="achievement-title">{currentLevel.name}</h3>
        <div className="achievement-level">
          Level {achievement.currentLevel}
        </div>
      </div>
      
      <p className="achievement-description">{currentLevel.description}</p>
      
      <div className="achievement-stats">
        <div className="stat">
          <span className="stat-label">Points:</span>
          <span className="stat-value">{currentLevel.points}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Progress:</span>
          <span className="stat-value">{achievement.currentLevel}</span>
        </div>
      </div>

      {achievement.upgrades.length > 0 && (
        <div className="achievement-upgrades">
          <h4>Upgrade Path:</h4>
          <div className="upgrades-list">
            {achievement.upgrades.map((upgrade, index) => (
              <div 
                key={upgrade.id} 
                className={`upgrade-item ${achievement.currentLevel >= upgrade.requiredCount ? 'completed' : ''}`}
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