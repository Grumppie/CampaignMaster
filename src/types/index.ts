export interface User {
  uid: string;
  username: string; // New unique field
  email: string;
  passwordHash?: string; // Stored securely, optional for backward compatibility
  displayName: string;
  photoURL?: string;
  createdCampaigns: string[];
  joinedCampaigns: string[];
  totalGlobalPoints: number; // Sum of all points across all campaigns
  totalGlobalAchievements: number; // Count of unique achievements earned
  createdAt: Date;
  lastLoginAt: Date;
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
  totalSessions: number; // Count of sessions in this campaign
  lastSessionDate?: Date; // Date of the most recent session
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

// Session management interfaces
export interface SessionPlayer {
  userId: string;
  characterName: string;
  attended: boolean;
  joinedAt?: Date;
  leftAt?: Date;
}

export interface CampaignSession {
  id: string;
  campaignId: string; // Parent campaign
  sessionNumber: number; // Sequential number within the campaign
  sessionDate: Date;
  dmId: string; // Same as campaign dmId
  players: SessionPlayer[];
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  duration?: number; // in minutes
  assignedAchievements: string[]; // Global achievement IDs assigned to this session
  createdAt: Date;
  updatedAt: Date;
}

// Session achievement interfaces
export interface SessionAchievement {
  id: string;
  sessionId: string;
  campaignId: string; // Parent campaign
  globalAchievementId: string;
  assignedBy: string; // DM
  assignedAt: Date;
  isActive: boolean;
}

export interface PlayerSessionAchievement {
  id: string;
  sessionId: string;
  campaignId: string; // Parent campaign
  playerId: string;
  globalAchievementId: string;
  count: number;
  currentLevel: number;
  earnedAt: Date;
  assignedBy: string;
}

// Global user achievement interfaces
export interface UserGlobalAchievement {
  id: string;
  userId: string;
  globalAchievementId: string;
  totalCount: number; // Sum across all campaigns/sessions
  totalPoints: number; // Sum of all points earned
  currentLevel: number;
  firstEarnedAt: Date;
  lastEarnedAt: Date;
  campaignsEarnedIn: string[]; // List of campaign IDs where earned
  sessionsEarnedIn: string[]; // List of session IDs where earned
  lastSessionEarnedIn?: string; // Most recent session where earned
}

// Leaderboard interfaces
export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  totalPoints: number;
  totalAchievements: number;
  uniqueAchievements: number;
  lastUpdated: Date;
  rank: number;
}

export interface LeaderboardSnapshot {
  id: string;
  timestamp: Date;
  entries: LeaderboardEntry[];
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
}

// Theme interfaces
export interface UserTheme {
  id: string;
  userId: string;
  themeName: string;
  themeData: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    fontFamily: string;
    borderRadius: string;
    shadow: string;
  };
  isActive: boolean;
  createdAt: Date;
}

export interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'fantasy' | 'modern' | 'dark' | 'light' | 'custom';
  themeData: UserTheme['themeData'];
  isPublic: boolean;
  createdBy?: string;
}

// Audit log interface
export interface AuditLog {
  id: string;
  userId: string; // Who performed the action
  username: string;
  action: string; // e.g., 'create_campaign', 'award_achievement'
  resourceType: string; // e.g., 'campaign', 'achievement', 'session'
  resourceId: string; // ID of the affected resource
  oldValue?: any; // Previous state
  newValue?: any; // New state
  metadata?: Record<string, any>; // Additional context
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
} 