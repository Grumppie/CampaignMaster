import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock Firebase and services
jest.mock('../config/firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
  },
  db: {},
}));

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

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id', displayName: 'Test User' },
    loading: false,
    isAdminLoggedIn: false,
  }),
}));

import { MemoryRouter } from 'react-router-dom';
import { AchievementManager } from '../components/achievement/AchievementManager';
import { PlayerAchievementModal } from '../components/campaign/PlayerAchievementModal';
import { CreateAchievementModal } from '../components/achievement/CreateAchievementModal';
import { AssignAchievementModal } from '../components/achievement/AssignAchievementModal';

// Test wrapper with router
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter initialEntries={['/']}>
    {children}
  </MemoryRouter>
);

describe('Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AchievementManager Component', () => {
    test('should render achievement manager with create and assign buttons for DM', () => {
      render(
        <TestWrapper>
          <AchievementManager
            campaignId="campaign-1"
            isDM={true}
            currentUserId="test-user-id"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Achievements')).toBeInTheDocument();
      expect(screen.getByText('Create Achievement')).toBeInTheDocument();
      expect(screen.getByText('Assign Achievement')).toBeInTheDocument();
    });

    test('should not show create/assign buttons for non-DM users', () => {
      render(
        <TestWrapper>
          <AchievementManager
            campaignId="campaign-1"
            isDM={false}
            currentUserId="test-user-id"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Achievements')).toBeInTheDocument();
      expect(screen.queryByText('Create Achievement')).not.toBeInTheDocument();
      expect(screen.queryByText('Assign Achievement')).not.toBeInTheDocument();
    });

    test('should show empty state when no achievements exist', () => {
      render(
        <TestWrapper>
          <AchievementManager
            campaignId="campaign-1"
            isDM={true}
            currentUserId="test-user-id"
          />
        </TestWrapper>
      );

      expect(screen.getByText('NO ACHIEVEMENTS YET')).toBeInTheDocument();
      expect(screen.getByText('Create your first achievement to start tracking player progress!')).toBeInTheDocument();
    });
  });

  describe('CreateAchievementModal Component', () => {
    test('should render create achievement form', () => {
      const mockOnCreate = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <CreateAchievementModal onCreate={mockOnCreate} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByText('Create New Achievement')).toBeInTheDocument();
      expect(screen.getByLabelText('Achievement Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Base Points')).toBeInTheDocument();
      expect(screen.getByText('Add Upgrade Level')).toBeInTheDocument();
    });

    test('should allow adding upgrade levels', async () => {
      const user = userEvent.setup();
      const mockOnCreate = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <CreateAchievementModal onCreate={mockOnCreate} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Add an upgrade level
      await user.click(screen.getByText('Add Upgrade Level'));
      
      // Should show upgrade form fields
      expect(screen.getByLabelText('Upgrade Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Required Count')).toBeInTheDocument();
      expect(screen.getByLabelText('Points')).toBeInTheDocument();
    });

    test('should validate form before submission', async () => {
      const user = userEvent.setup();
      const mockOnCreate = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <CreateAchievementModal onCreate={mockOnCreate} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Try to submit without filling required fields
      await user.click(screen.getByText('Create Achievement'));

      // Should not call onCreate
      expect(mockOnCreate).not.toHaveBeenCalled();
    });
  });

  describe('AssignAchievementModal Component', () => {
    const mockAchievements = [
      {
        id: 'achievement-1',
        name: 'Fireball Master',
        description: 'Cast fireball spells',
        basePoints: 10,
        upgrades: [],
        createdBy: 'test-user-id',
        isPublic: true,
        createdAt: new Date(),
      },
      {
        id: 'achievement-2',
        name: 'Sword Master',
        description: 'Master sword fighting',
        basePoints: 15,
        upgrades: [],
        createdBy: 'test-user-id',
        isPublic: true,
        createdAt: new Date(),
      },
    ];

    test('should render achievement selection dropdown', () => {
      const mockOnAssign = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <AssignAchievementModal
            availableAchievements={mockAchievements}
            onAssign={mockOnAssign}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Assign Achievement to Campaign')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Fireball Master')).toBeInTheDocument();
      expect(screen.getByText('Sword Master')).toBeInTheDocument();
    });

    test('should call onAssign when achievement is selected and assigned', async () => {
      const user = userEvent.setup();
      const mockOnAssign = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <AssignAchievementModal
            availableAchievements={mockAchievements}
            onAssign={mockOnAssign}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      // Select an achievement
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'achievement-1');

      // Click assign button
      await user.click(screen.getByText('Assign'));

      expect(mockOnAssign).toHaveBeenCalledWith('achievement-1');
    });
  });

  describe('PlayerAchievementModal Component', () => {
    const mockPlayer = {
      userId: 'player-1',
      characterName: 'Gandalf',
      joinedAt: new Date(),
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

    test('should render player achievement modal', () => {
      const mockOnClose = jest.fn();
      const mockOnUpdate = jest.fn();

      render(
        <TestWrapper>
          <PlayerAchievementModal
            player={mockPlayer}
            campaignId="campaign-1"
            currentUserId="test-user-id"
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        </TestWrapper>
      );

      expect(screen.getByText("Gandalf's Achievements")).toBeInTheDocument();
      expect(screen.getByText('Assign New Achievement')).toBeInTheDocument();
      expect(screen.getByText('Current Achievements')).toBeInTheDocument();
    });

    test('should show current achievement progress', async () => {
      const mockOnClose = jest.fn();
      const mockOnUpdate = jest.fn();

      // Mock the getPlayerAchievements to return our test data
      const { getPlayerAchievements } = require('../services/achievements');
      (getPlayerAchievements as jest.Mock).mockResolvedValue([mockPlayerAchievement]);

      render(
        <TestWrapper>
          <PlayerAchievementModal
            player={mockPlayer}
            campaignId="campaign-1"
            currentUserId="test-user-id"
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        </TestWrapper>
      );

      // Wait for achievements to load
      await waitFor(() => {
        expect(screen.getByText('Fireball Master')).toBeInTheDocument();
      });

      expect(screen.getByText('Count: 3')).toBeInTheDocument();
      expect(screen.getByText('Next: Fireball Novice at 5')).toBeInTheDocument();
    });

    test('should allow incrementing achievement count', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      const mockOnUpdate = jest.fn();

      const { getPlayerAchievements, incrementPlayerAchievement } = require('../services/achievements');
      (getPlayerAchievements as jest.Mock).mockResolvedValue([mockPlayerAchievement]);
      (incrementPlayerAchievement as jest.Mock).mockResolvedValue(true);

      render(
        <TestWrapper>
          <PlayerAchievementModal
            player={mockPlayer}
            campaignId="campaign-1"
            currentUserId="test-user-id"
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        </TestWrapper>
      );

      // Wait for achievements to load
      await waitFor(() => {
        expect(screen.getByText('Fireball Master')).toBeInTheDocument();
      });

      // Click increment button
      const incrementButton = screen.getByText('+');
      await user.click(incrementButton);

      expect(incrementPlayerAchievement).toHaveBeenCalledWith('player-1', 'achievement-1', 'campaign-1', 1);
    });

    test('should allow decrementing achievement count', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      const mockOnUpdate = jest.fn();

      const { getPlayerAchievements, decrementPlayerAchievement } = require('../services/achievements');
      (getPlayerAchievements as jest.Mock).mockResolvedValue([mockPlayerAchievement]);
      (decrementPlayerAchievement as jest.Mock).mockResolvedValue(true);

      render(
        <TestWrapper>
          <PlayerAchievementModal
            player={mockPlayer}
            campaignId="campaign-1"
            currentUserId="test-user-id"
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        </TestWrapper>
      );

      // Wait for achievements to load
      await waitFor(() => {
        expect(screen.getByText('Fireball Master')).toBeInTheDocument();
      });

      // Click decrement button
      const decrementButton = screen.getByText('-');
      await user.click(decrementButton);

      expect(decrementPlayerAchievement).toHaveBeenCalledWith('player-1', 'achievement-1', 'campaign-1', 1);
    });

    test('should show level upgrade when threshold is reached', async () => {
      const mockOnClose = jest.fn();
      const mockOnUpdate = jest.fn();

      // Mock achievement that has reached upgrade threshold
      const upgradedAchievement = {
        ...mockPlayerAchievement,
        count: 5,
        currentLevel: 1,
      };

      const { getPlayerAchievements } = require('../services/achievements');
      (getPlayerAchievements as jest.Mock).mockResolvedValue([upgradedAchievement]);

      render(
        <TestWrapper>
          <PlayerAchievementModal
            player={mockPlayer}
            campaignId="campaign-1"
            currentUserId="test-user-id"
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        </TestWrapper>
      );

      // Wait for achievements to load
      await waitFor(() => {
        expect(screen.getByText('Fireball Master')).toBeInTheDocument();
      });

      expect(screen.getByText('Current: Fireball Novice')).toBeInTheDocument();
      expect(screen.getByText('Count: 5')).toBeInTheDocument();
      expect(screen.getByText('Next: Fireball Expert at 20')).toBeInTheDocument();
    });
  });
}); 