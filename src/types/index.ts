export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdCampaigns: string[];
  joinedCampaigns: string[];
}

export interface CampaignPlayer {
  userId: string;
  characterName: string;
  joinedAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  dmId: string;
  dmName: string;
  createdAt: Date;
  isActive: boolean;
  players: CampaignPlayer[];
  achievements: string[];
}

export interface Character {
  id: string;
  name: string;
  playerId: string;
  campaignId: string;
  joinedAt: Date;
}

export interface AchievementUpgrade {
  id: string;
  name: string;
  description: string;
  requiredCount: number;
  points: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  campaignId: string;
  basePoints: number;
  currentLevel: number;
  upgrades: AchievementUpgrade[];
  createdAt: Date;
}

export interface PlayerAchievement {
  id: string;
  playerId: string;
  achievementId: string;
  campaignId: string;
  count: number;
  currentLevel: number;
  lastUpdated: Date;
} 