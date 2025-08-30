import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getGlobalAchievements, getPlayerAchievements } from '../services/achievements';
import { AchievementCard } from '../components/achievement/AchievementCard';
import { GlobalAchievement, PlayerAchievement } from '../types';
import './Achievements.css';

export const Achievements: React.FC = () => {
  const { user } = useAuth();
  const [globalAchievements, setGlobalAchievements] = useState<GlobalAchievement[]>([]);
  const [playerAchievements, setPlayerAchievements] = useState<PlayerAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'earned' | 'progress'>('all');

  useEffect(() => {
    const loadAchievements = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        
        // Load global achievements
        const global = await getGlobalAchievements();
        setGlobalAchievements(global);
        
        // Load player achievements (we'll need to get this from all campaigns)
        // For now, we'll show global achievements
        setPlayerAchievements([]);
        
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, [user?.uid]);

  const getFilteredAchievements = () => {
    switch (activeTab) {
      case 'earned':
        return globalAchievements.filter(achievement => 
          playerAchievements.some(pa => pa.globalAchievementId === achievement.id && pa.count > 0)
        );
      case 'progress':
        return globalAchievements.filter(achievement => 
          playerAchievements.some(pa => pa.globalAchievementId === achievement.id)
        );
      default:
        return globalAchievements;
    }
  };

  const getPlayerProgress = (achievementId: string) => {
    const playerAchievement = playerAchievements.find(pa => pa.globalAchievementId === achievementId);
    return playerAchievement || null;
  };

  if (loading) {
    return (
      <div className="achievements-page">
        <div className="loading-container">
          <div className="loading-spinner">Loading achievements...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-page">
      <div className="achievements-header">
        <h1 className="achievements-title">Achievements</h1>
        <p className="achievements-subtitle">
          Track your progress and unlock new achievements
        </p>
      </div>

      <div className="achievements-stats">
        <div className="stat-card">
          <h3>Total Achievements</h3>
          <span className="stat-number">{globalAchievements.length}</span>
        </div>
        <div className="stat-card">
          <h3>Achievements Earned</h3>
          <span className="stat-number">
            {playerAchievements.filter(pa => pa.count > 0).length}
          </span>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <span className="stat-number">
            {playerAchievements.filter(pa => pa.count > 0).length}
          </span>
        </div>
      </div>

      <div className="achievements-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Achievements
        </button>
        <button 
          className={`tab-btn ${activeTab === 'earned' ? 'active' : ''}`}
          onClick={() => setActiveTab('earned')}
        >
          Earned
        </button>
        <button 
          className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          In Progress
        </button>
      </div>

      <div className="achievements-grid">
        {getFilteredAchievements().length === 0 ? (
          <div className="empty-state">
            <h3>No Achievements Found</h3>
            <p>
              {activeTab === 'all' && 'No achievements are available yet.'}
              {activeTab === 'earned' && 'You haven\'t earned any achievements yet.'}
              {activeTab === 'progress' && 'You don\'t have any achievements in progress.'}
            </p>
          </div>
        ) : (
          getFilteredAchievements().map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isDM={false}
              onIncrement={() => {}}
              onDecrement={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
};
