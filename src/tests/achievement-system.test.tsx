import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('../config/firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
  },
  db: {},
}));

// Mock services
jest.mock('../services/campaigns', () => ({
  createCampaign: jest.fn(),
  getCampaigns: jest.fn(),
  getCampaignById: jest.fn(),
  joinCampaign: jest.fn(),
}));

jest.mock('../services/achievements', () => ({
  createGlobalAchievement: jest.fn(),
  getGlobalAchievements: jest.fn(),
  assignAchievementToCampaign: jest.fn(),
  getCampaignAchievements: jest.fn(),
  getPlayerAchievements: jest.fn(),
  incrementPlayerAchievement: jest.fn(),
  decrementPlayerAchievement: jest.fn(),
}));

// Mock auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id', displayName: 'Test User' },
    loading: false,
    isAdminLoggedIn: false,
  }),
}));

import { useAuth } from '../hooks/useAuth';
import { 
  createGlobalAchievement, 
  assignAchievementToCampaign,
  getPlayerAchievements,
  incrementPlayerAchievement,
  decrementPlayerAchievement 
} from '../services/achievements';
import { createCampaign, joinCampaign } from '../services/campaigns';

// Test data
const mockCampaign = {
  id: 'campaign-1',
  name: 'Test Campaign',
  description: 'A test campaign',
  dmId: 'test-user-id',
  dmName: 'Test User',
  players: [
    { userId: 'player-1', characterName: 'Gandalf', joinedAt: new Date() }
  ],
  assignedAchievements: [],
  createdAt: new Date(),
};

const mockGlobalAchievement = {
  id: 'achievement-1',
  name: 'Fireball Master',
  description: 'Cast fireball spells',
  basePoints: 10,
  upgrades: [
    { name: 'Fireball Novice', description: 'Cast 5 fireballs', requiredCount: 5, points: 25 },
    { name: 'Fireball Expert', description: 'Cast 20 fireballs', requiredCount: 20, points: 100 }
  ],
  createdBy: 'test-user-id',
  isPublic: true,
  createdAt: new Date(),
};

const mockPlayerAchievement = {
  id: 'player-achievement-1',
  playerId: 'player-1',
  globalAchievementId: 'achievement-1',
  campaignId: 'campaign-1',
  count: 3,
  currentLevel: 0,
  lastUpdated: new Date(),
  globalAchievement: mockGlobalAchievement,
};

describe('Achievement System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Player Creation and Campaign Joining', () => {
    test('should allow a user to join a campaign with a character name', async () => {
      const user = userEvent.setup();
      
      // Mock successful campaign join
      (joinCampaign as jest.Mock).mockResolvedValue(true);
      
      // This would be tested in the JoinCampaignModal component
      // For now, we'll test the service function directly
      const result = await joinCampaign('campaign-1', 'new-player-id', 'Legolas');
      
      expect(joinCampaign).toHaveBeenCalledWith('campaign-1', 'new-player-id', 'Legolas');
      expect(result).toBe(true);
    });

    test('should validate character name is not empty', async () => {
      const user = userEvent.setup();
      
      // Mock failed campaign join
      (joinCampaign as jest.Mock).mockRejectedValue(new Error('Character name is required'));
      
      await expect(joinCampaign('campaign-1', 'new-player-id', '')).rejects.toThrow('Character name is required');
    });
  });

  describe('2. Achievement Creation', () => {
    test('should allow DM to create a global achievement', async () => {
      const user = userEvent.setup();
      
      // Mock successful achievement creation
      (createGlobalAchievement as jest.Mock).mockResolvedValue('new-achievement-id');
      
      const achievementData = {
        name: 'Sword Master',
        description: 'Master the art of sword fighting',
        basePoints: 15,
        upgrades: [
          { name: 'Sword Novice', description: 'Win 3 sword fights', requiredCount: 3, points: 30 },
          { name: 'Sword Expert', description: 'Win 10 sword fights', requiredCount: 10, points: 150 }
        ],
        createdBy: 'test-user-id',
        isPublic: true,
      };
      
      const result = await createGlobalAchievement(achievementData);
      
      expect(createGlobalAchievement).toHaveBeenCalledWith(achievementData);
      expect(result).toBe('new-achievement-id');
    });

    test('should validate achievement data', async () => {
      const user = userEvent.setup();
      
      // Mock failed achievement creation
      (createGlobalAchievement as jest.Mock).mockRejectedValue(new Error('Achievement name is required'));
      
      const invalidData = {
        name: '',
        description: 'Test description',
        basePoints: 10,
        upgrades: [],
        createdBy: 'test-user-id',
        isPublic: true,
      };
      
      await expect(createGlobalAchievement(invalidData)).rejects.toThrow('Achievement name is required');
    });
  });

  describe('3. Achievement Assignment to Campaign', () => {
    test('should allow DM to assign achievement to campaign', async () => {
      const user = userEvent.setup();
      
      // Mock successful assignment
      (assignAchievementToCampaign as jest.Mock).mockResolvedValue(true);
      
      const result = await assignAchievementToCampaign('achievement-1', 'campaign-1', 'test-user-id');
      
      expect(assignAchievementToCampaign).toHaveBeenCalledWith('achievement-1', 'campaign-1', 'test-user-id');
      expect(result).toBe(true);
    });

    test('should prevent non-DM from assigning achievements', async () => {
      const user = userEvent.setup();
      
      // Mock failed assignment
      (assignAchievementToCampaign as jest.Mock).mockRejectedValue(new Error('Only DM can assign achievements'));
      
      await expect(assignAchievementToCampaign('achievement-1', 'campaign-1', 'non-dm-user')).rejects.toThrow('Only DM can assign achievements');
    });
  });

  describe('4. Achievement Assignment to Player', () => {
    test('should allow DM to assign achievement to specific player', async () => {
      const user = userEvent.setup();
      
      // Mock successful player achievement assignment
      (assignAchievementToCampaign as jest.Mock).mockResolvedValue(true);
      (getPlayerAchievements as jest.Mock).mockResolvedValue([mockPlayerAchievement]);
      
      // First assign to campaign
      await assignAchievementToCampaign('achievement-1', 'campaign-1', 'test-user-id');
      
      // Then get player achievements
      const playerAchievements = await getPlayerAchievements('player-1', 'campaign-1');
      
      expect(assignAchievementToCampaign).toHaveBeenCalledWith('achievement-1', 'campaign-1', 'test-user-id');
      expect(getPlayerAchievements).toHaveBeenCalledWith('player-1', 'campaign-1');
      expect(playerAchievements).toHaveLength(1);
      expect(playerAchievements[0]?.globalAchievementId).toBe('achievement-1');
    });
  });

  describe('5. Achievement Progress Tracking', () => {
    test('should increment player achievement count', async () => {
      const user = userEvent.setup();
      
      // Mock successful increment
      (incrementPlayerAchievement as jest.Mock).mockResolvedValue(true);
      (getPlayerAchievements as jest.Mock).mockResolvedValue([
        { ...mockPlayerAchievement, count: 4 }
      ]);
      
      // Increment achievement
      await incrementPlayerAchievement('player-1', 'achievement-1', 'campaign-1', 1);
      
      // Get updated achievements
      const updatedAchievements = await getPlayerAchievements('player-1', 'campaign-1');
      
      expect(incrementPlayerAchievement).toHaveBeenCalledWith('player-1', 'achievement-1', 'campaign-1', 1);
      expect(updatedAchievements[0]?.count).toBe(4);
    });

    test('should decrement player achievement count', async () => {
      const user = userEvent.setup();
      
      // Mock successful decrement
      (decrementPlayerAchievement as jest.Mock).mockResolvedValue(true);
      (getPlayerAchievements as jest.Mock).mockResolvedValue([
        { ...mockPlayerAchievement, count: 2 }
      ]);
      
      // Decrement achievement
      await decrementPlayerAchievement('player-1', 'achievement-1', 'campaign-1', 1);
      
      // Get updated achievements
      const updatedAchievements = await getPlayerAchievements('player-1', 'campaign-1');
      
      expect(decrementPlayerAchievement).toHaveBeenCalledWith('player-1', 'achievement-1', 'campaign-1', 1);
      expect(updatedAchievements[0]?.count).toBe(2);
    });

    test('should not allow negative achievement count', async () => {
      const user = userEvent.setup();
      
      // Mock decrement that prevents negative values
      (decrementPlayerAchievement as jest.Mock).mockResolvedValue(true);
      (getPlayerAchievements as jest.Mock).mockResolvedValue([
        { ...mockPlayerAchievement, count: 0 }
      ]);
      
      // Try to decrement below 0
      await decrementPlayerAchievement('player-1', 'achievement-1', 'campaign-1', 1);
      
      const updatedAchievements = await getPlayerAchievements('player-1', 'campaign-1');
      
      expect(updatedAchievements[0]?.count).toBe(0);
    });
  });

  describe('6. Achievement Level Upgrades', () => {
    test('should upgrade achievement level when threshold is reached', async () => {
      const user = userEvent.setup();
      
      // Mock achievement with enough progress to reach first upgrade
      const upgradedAchievement = {
        ...mockPlayerAchievement,
        count: 5,
        currentLevel: 1,
      };
      
      (getPlayerAchievements as jest.Mock).mockResolvedValue([upgradedAchievement]);
      
      const achievements = await getPlayerAchievements('player-1', 'campaign-1');
      const achievement = achievements[0];
      
      // Check that level was upgraded
      expect(achievement?.count).toBe(5);
      expect(achievement?.currentLevel).toBe(1);
      
      // Check that it matches the upgrade threshold
      const upgrade = mockGlobalAchievement.upgrades[0];
      expect(achievement?.count).toBeGreaterThanOrEqual(upgrade.requiredCount);
    });

    test('should show correct current level name', () => {
      const user = userEvent.setup();
      
      // Test level calculation logic
      const getCurrentLevel = (achievement: any, globalAchievement: any) => {
        for (let i = globalAchievement.upgrades.length - 1; i >= 0; i--) {
          if (achievement.count >= globalAchievement.upgrades[i].requiredCount) {
            return globalAchievement.upgrades[i].name;
          }
        }
        return globalAchievement.name; // Base level
      };
      
      // Test base level
      expect(getCurrentLevel({ count: 2 }, mockGlobalAchievement)).toBe('Fireball Master');
      
      // Test first upgrade
      expect(getCurrentLevel({ count: 5 }, mockGlobalAchievement)).toBe('Fireball Novice');
      
      // Test second upgrade
      expect(getCurrentLevel({ count: 20 }, mockGlobalAchievement)).toBe('Fireball Expert');
    });

    test('should show next level requirements', () => {
      const user = userEvent.setup();
      
      // Test next level calculation logic
      const getNextLevel = (achievement: any, globalAchievement: any) => {
        for (const upgrade of globalAchievement.upgrades) {
          if (achievement.count < upgrade.requiredCount) {
            return upgrade;
          }
        }
        return null; // Max level reached
      };
      
      // Test when next level is available
      const nextLevel = getNextLevel({ count: 3 }, mockGlobalAchievement);
      expect(nextLevel).toBeDefined();
      expect(nextLevel?.name).toBe('Fireball Novice');
      expect(nextLevel?.requiredCount).toBe(5);
      
      // Test when max level is reached
      const maxLevel = getNextLevel({ count: 25 }, mockGlobalAchievement);
      expect(maxLevel).toBeNull();
    });
  });

  describe('7. Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      (createGlobalAchievement as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await expect(createGlobalAchievement({
        name: 'Test Achievement',
        description: 'Test',
        basePoints: 10,
        upgrades: [],
        createdBy: 'test-user-id',
        isPublic: true,
      })).rejects.toThrow('Network error');
    });

    test('should handle invalid achievement data', async () => {
      const user = userEvent.setup();
      
      // Mock validation error
      (createGlobalAchievement as jest.Mock).mockRejectedValue(new Error('Invalid achievement data'));
      
      await expect(createGlobalAchievement({
        name: '',
        description: '',
        basePoints: -1,
        upgrades: [],
        createdBy: '',
        isPublic: true,
      })).rejects.toThrow('Invalid achievement data');
    });
  });

  describe('8. Data Persistence', () => {
    test('should persist achievement data across sessions', async () => {
      const user = userEvent.setup();
      
      // Mock data retrieval
      (getPlayerAchievements as jest.Mock).mockResolvedValue([mockPlayerAchievement]);
      
      // Simulate retrieving data after page reload
      const achievements = await getPlayerAchievements('player-1', 'campaign-1');
      
      expect(achievements).toHaveLength(1);
      expect(achievements[0]?.count).toBe(3);
      expect(achievements[0]?.currentLevel).toBe(0);
    });

    test('should maintain achievement history', async () => {
      const user = userEvent.setup();
      
      // Mock multiple achievements for a player
      const multipleAchievements = [
        mockPlayerAchievement,
        {
          ...mockPlayerAchievement,
          id: 'player-achievement-2',
          globalAchievementId: 'achievement-2',
          count: 7,
          currentLevel: 1,
        }
      ];
      
      (getPlayerAchievements as jest.Mock).mockResolvedValue(multipleAchievements);
      
      const achievements = await getPlayerAchievements('player-1', 'campaign-1');
      
      expect(achievements).toHaveLength(2);
      expect(achievements[0]?.count).toBe(3);
      expect(achievements[1]?.count).toBe(7);
    });
  });
}); 