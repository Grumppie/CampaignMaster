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
  assignedAchievements: string[]; // Global achievement IDs assigned to this campaign
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

// Global achievement template
export interface GlobalAchievement {
  id: string;
  name: string;
  description: string;
  basePoints: number;
  upgrades: AchievementUpgrade[];
  createdBy: string; // User ID who created it
  createdAt: Date;
  isPublic: boolean; // Whether other campaigns can use this achievement
}

// Achievement assigned to a specific campaign
export interface CampaignAchievement {
  id: string;
  globalAchievementId: string;
  campaignId: string;
  assignedBy: string; // DM who assigned it
  assignedAt: Date;
}

// Player's progress on an achievement in a specific campaign
export interface PlayerAchievement {
  id: string;
  playerId: string;
  globalAchievementId: string;
  campaignId: string;
  count: number;
  currentLevel: number;
  lastUpdated: Date;
  assignedBy?: string; // DM who assigned it to the player
  assignedAt?: Date; // When it was assigned to the player
} 