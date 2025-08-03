import React, { useState, useEffect } from 'react';
import { CampaignPlayer, GlobalAchievement, PlayerAchievement } from '../../types';
import { 
  getGlobalAchievements, 
  assignAchievementToCampaign,
  incrementPlayerAchievement,
  decrementPlayerAchievement,
  getPlayerAchievements
} from '../../services/achievements';
import './PlayerAchievementModal.css';

interface PlayerAchievementModalProps {
  player: CampaignPlayer;
  campaignId: string;
  currentUserId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const PlayerAchievementModal: React.FC<PlayerAchievementModalProps> = ({
  player,
  campaignId,
  currentUserId,
  onClose,
  onUpdate
}) => {
  const [availableAchievements, setAvailableAchievements] = useState<GlobalAchievement[]>([]);
  const [playerAchievements, setPlayerAchievements] = useState<(PlayerAchievement & { globalAchievement: GlobalAchievement })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch available global achievements
        const globalAchievements = await getGlobalAchievements(currentUserId);
        setAvailableAchievements(globalAchievements);
        
        // Fetch player's current achievements
        const achievements = await getPlayerAchievements(player.userId, campaignId);
        setPlayerAchievements(achievements.filter(Boolean) as (PlayerAchievement & { globalAchievement: GlobalAchievement })[]);
      } catch (err) {
        setError('Failed to load achievements');
        console.error('Error fetching achievements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [player.userId, campaignId, currentUserId]);

  const handleAssignAchievement = async () => {
    if (!selectedAchievement) {
      setError('Please select an achievement to assign');
      return;
    }

    try {
      setError(null);
      await assignAchievementToCampaign(selectedAchievement, campaignId, currentUserId);
      
      // Refresh player achievements
      const achievements = await getPlayerAchievements(player.userId, campaignId);
      setPlayerAchievements(achievements.filter(Boolean) as (PlayerAchievement & { globalAchievement: GlobalAchievement })[]);
      
      setSelectedAchievement('');
      onUpdate();
    } catch (err) {
      setError('Failed to assign achievement');
      console.error('Error assigning achievement:', err);
    }
  };

  const handleIncrementAchievement = async (globalAchievementId: string) => {
    try {
      setError(null);
      await incrementPlayerAchievement(player.userId, globalAchievementId, campaignId, 1);
      
      // Refresh player achievements
      const achievements = await getPlayerAchievements(player.userId, campaignId);
      setPlayerAchievements(achievements.filter(Boolean) as (PlayerAchievement & { globalAchievement: GlobalAchievement })[]);
      
      onUpdate();
    } catch (err) {
      setError('Failed to increment achievement');
      console.error('Error incrementing achievement:', err);
    }
  };

  const handleDecrementAchievement = async (globalAchievementId: string) => {
    try {
      setError(null);
      await decrementPlayerAchievement(player.userId, globalAchievementId, campaignId, 1);
      
      // Refresh player achievements
      const achievements = await getPlayerAchievements(player.userId, campaignId);
      setPlayerAchievements(achievements.filter(Boolean) as (PlayerAchievement & { globalAchievement: GlobalAchievement })[]);
      
      onUpdate();
    } catch (err) {
      setError('Failed to decrement achievement');
      console.error('Error decrementing achievement:', err);
    }
  };

  const getAchievementDisplayName = (globalAchievementId: string) => {
    const achievement = availableAchievements.find(a => a.id === globalAchievementId);
    return achievement?.name || 'Unknown Achievement';
  };

  const getCurrentLevel = (achievement: PlayerAchievement) => {
    const globalAchievement = availableAchievements.find(a => a.id === achievement.globalAchievementId);
    if (!globalAchievement) return 'Unknown';
    
    // Find the current level based on count
    for (let i = globalAchievement.upgrades.length - 1; i >= 0; i--) {
      if (achievement.count >= globalAchievement.upgrades[i].requiredCount) {
        return globalAchievement.upgrades[i].name;
      }
    }
    return globalAchievement.name; // Base level
  };

  const getNextLevel = (achievement: PlayerAchievement) => {
    const globalAchievement = availableAchievements.find(a => a.id === achievement.globalAchievementId);
    if (!globalAchievement) return null;
    
    // Find the next level
    for (const upgrade of globalAchievement.upgrades) {
      if (achievement.count < upgrade.requiredCount) {
        return upgrade;
      }
    }
    return null; // Max level reached
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading-spinner"></div>
          <p>Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{player.characterName}'s Achievements</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <div className="modal-body">
          {/* Assign New Achievement */}
          <div className="assign-section">
            <h3>Assign New Achievement</h3>
            <div className="assign-controls">
              <select 
                value={selectedAchievement}
                onChange={(e) => setSelectedAchievement(e.target.value)}
                className="achievement-select"
              >
                <option value="">Select an achievement...</option>
                {availableAchievements.map((achievement) => (
                  <option key={achievement.id} value={achievement.id}>
                    {achievement.name}
                  </option>
                ))}
              </select>
              <button 
                className="assign-btn"
                onClick={handleAssignAchievement}
                disabled={!selectedAchievement}
              >
                Assign
              </button>
            </div>
          </div>

          {/* Current Achievements */}
          <div className="current-achievements">
            <h3>Current Achievements</h3>
            {playerAchievements.length === 0 ? (
              <p className="no-achievements">No achievements assigned yet.</p>
            ) : (
              <div className="achievements-list">
                {playerAchievements.map((achievement) => {
                  const nextLevel = getNextLevel(achievement);
                  return (
                    <div key={achievement.id} className="player-achievement-card">
                      <div className="achievement-info">
                        <h4>{getAchievementDisplayName(achievement.globalAchievementId)}</h4>
                        <p className="current-level">Current: {getCurrentLevel(achievement)}</p>
                        <p className="achievement-count">Count: {achievement.count}</p>
                        {nextLevel && (
                          <p className="next-level">
                            Next: {nextLevel.name} at {nextLevel.requiredCount}
                          </p>
                        )}
                      </div>
                      <div className="achievement-controls">
                        <button 
                          className="control-btn decrement"
                          onClick={() => handleDecrementAchievement(achievement.globalAchievementId)}
                        >
                          -
                        </button>
                        <span className="count-display">{achievement.count}</span>
                        <button 
                          className="control-btn increment"
                          onClick={() => handleIncrementAchievement(achievement.globalAchievementId)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 