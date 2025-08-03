import React, { useState, useEffect } from 'react';
import { Achievement, AchievementUpgrade } from '../../types';
import { CreateAchievementModal } from './CreateAchievementModal';
import { AchievementCard } from './AchievementCard';
import './AchievementManager.css';

interface AchievementManagerProps {
  campaignId: string;
  isDM: boolean;
  currentUserId?: string;
}

export const AchievementManager: React.FC<AchievementManagerProps> = ({
  campaignId,
  isDM,
  currentUserId
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        // TODO: Implement fetchAchievements service
        // const achievementsData = await getAchievements(campaignId);
        // setAchievements(achievementsData);
        setAchievements([]); // Placeholder
      } catch (err) {
        setError('Failed to load achievements');
        console.error('Error fetching achievements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [campaignId]);

  const handleCreateAchievement = async (achievementData: {
    name: string;
    description: string;
    basePoints: number;
    upgrades: AchievementUpgrade[];
  }) => {
    try {
      // TODO: Implement createAchievement service
      console.log('Creating achievement:', achievementData);
      setShowCreateModal(false);
      // Refresh achievements
      // const achievementsData = await getAchievements(campaignId);
      // setAchievements(achievementsData);
    } catch (err) {
      console.error('Error creating achievement:', err);
    }
  };

  const handleIncrementAchievement = async (achievementId: string, playerId: string) => {
    try {
      // TODO: Implement incrementAchievement service
      console.log('Incrementing achievement:', achievementId, 'for player:', playerId);
    } catch (err) {
      console.error('Error incrementing achievement:', err);
    }
  };

  const handleDecrementAchievement = async (achievementId: string, playerId: string) => {
    try {
      // TODO: Implement decrementAchievement service
      console.log('Decrementing achievement:', achievementId, 'for player:', playerId);
    } catch (err) {
      console.error('Error decrementing achievement:', err);
    }
  };

  if (loading) {
    return (
      <div className="achievement-manager">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="achievement-manager">
      <div className="achievement-header">
        <h2>Achievements</h2>
        {isDM && (
          <button
            className="create-achievement-btn"
            onClick={() => setShowCreateModal(true)}
          >
            Create Achievement
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {achievements.length === 0 ? (
        <div className="empty-achievements">
          <h3>No achievements yet</h3>
          <p>
            {isDM 
              ? 'Create your first achievement to start tracking player progress!'
              : 'The DM hasn\'t created any achievements yet.'
            }
          </p>
          {isDM && (
            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create First Achievement
            </button>
          )}
        </div>
      ) : (
        <div className="achievements-grid">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isDM={isDM}
              onIncrement={handleIncrementAchievement}
              onDecrement={handleDecrementAchievement}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateAchievementModal
          campaignId={campaignId}
          onCreate={handleCreateAchievement}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}; 