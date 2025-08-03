import React, { useState, useEffect } from 'react';
import { GlobalAchievement, CampaignAchievement, PlayerAchievement } from '../../types';
import { 
  getCampaignAchievements, 
  getGlobalAchievements,
  assignAchievementToCampaign,
  createGlobalAchievement 
} from '../../services/achievements';
import { CreateAchievementModal } from './CreateAchievementModal';
import { AssignAchievementModal } from './AssignAchievementModal';
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
  const [campaignAchievements, setCampaignAchievements] = useState<(CampaignAchievement & { globalAchievement: GlobalAchievement })[]>([]);
  const [availableAchievements, setAvailableAchievements] = useState<GlobalAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch achievements assigned to this campaign
        const assignedAchievements = await getCampaignAchievements(campaignId);
        setCampaignAchievements(assignedAchievements.filter(Boolean) as (CampaignAchievement & { globalAchievement: GlobalAchievement })[]);
        
        // Fetch available global achievements for assignment
        if (currentUserId) {
          const globalAchievements = await getGlobalAchievements(currentUserId);
          setAvailableAchievements(globalAchievements);
        }
      } catch (err) {
        setError('Failed to load achievements');
        console.error('Error fetching achievements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [campaignId, currentUserId]);

  const handleCreateAchievement = async (achievementData: {
    name: string;
    description: string;
    basePoints: number;
    upgrades: { name: string; description: string; requiredCount: number; points: number; }[];
  }) => {
    if (!currentUserId) {
      setError('You must be logged in to create achievements');
      return;
    }

    try {
      setError(null);
      await createGlobalAchievement({
        ...achievementData,
        createdBy: currentUserId,
        isPublic: true
      });
      
      // Refresh available achievements
      const globalAchievements = await getGlobalAchievements(currentUserId);
      setAvailableAchievements(globalAchievements);
      
      setShowCreateModal(false);
    } catch (err) {
      setError('Failed to create achievement');
      console.error('Error creating achievement:', err);
    }
  };

  const handleAssignAchievement = async (globalAchievementId: string) => {
    if (!currentUserId) {
      setError('You must be logged in to assign achievements');
      return;
    }

    try {
      setError(null);
      await assignAchievementToCampaign(globalAchievementId, campaignId, currentUserId);
      
      // Refresh campaign achievements
      const assignedAchievements = await getCampaignAchievements(campaignId);
      setCampaignAchievements(assignedAchievements.filter(Boolean) as (CampaignAchievement & { globalAchievement: GlobalAchievement })[]);
      
      setShowAssignModal(false);
    } catch (err) {
      setError('Failed to assign achievement');
      console.error('Error assigning achievement:', err);
    }
  };

  const handleIncrementAchievement = async (globalAchievementId: string, playerId: string) => {
    // TODO: Implement increment functionality
    console.log('Increment achievement:', globalAchievementId, 'for player:', playerId);
  };

  const handleDecrementAchievement = async (globalAchievementId: string, playerId: string) => {
    // TODO: Implement decrement functionality
    console.log('Decrement achievement:', globalAchievementId, 'for player:', playerId);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading achievements...</p>
      </div>
    );
  }

  return (
    <div className="achievement-manager">
      <div className="achievement-header">
        <h2>Achievements</h2>
        {isDM && (
          <div className="achievement-actions">
            <button 
              className="assign-achievement-btn" 
              onClick={() => setShowAssignModal(true)}
            >
              Assign Achievement
            </button>
            <button 
              className="create-achievement-btn" 
              onClick={() => setShowCreateModal(true)}
            >
              Create Achievement
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      {campaignAchievements.length === 0 ? (
        <div className="empty-achievements">
          <h3>NO ACHIEVEMENTS YET</h3>
          <p>Create your first achievement to start tracking player progress!</p>
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
          {campaignAchievements.map((campaignAchievement) => (
            <AchievementCard
              key={campaignAchievement.id}
              achievement={campaignAchievement.globalAchievement}
              isDM={isDM}
              onIncrement={handleIncrementAchievement}
              onDecrement={handleDecrementAchievement}
            />
          ))}
        </div>
      )}
      
      {showCreateModal && (
        <CreateAchievementModal 
          onCreate={handleCreateAchievement} 
          onClose={() => setShowCreateModal(false)} 
        />
      )}
      
      {showAssignModal && (
        <AssignAchievementModal
          availableAchievements={availableAchievements}
          onAssign={handleAssignAchievement}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
}; 