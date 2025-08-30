import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query,
  where,
  orderBy,
  updateDoc,
  arrayUnion,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  UserGlobalAchievement, 
  PlayerSessionAchievement,
  User,
  GlobalAchievement 
} from '../types';
import { logAuditEvent, AUDIT_ACTIONS, RESOURCE_TYPES } from './audit';

/**
 * Update global achievement totals when session achievement is awarded
 */
export const updateUserGlobalAchievement = async (
  userId: string, 
  globalAchievementId: string, 
  sessionData: {
    sessionId: string;
    campaignId: string;
    count: number;
    points: number;
  },
  username: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Check if user global achievement exists
    const userGlobalAchievementRef = doc(db, 'users', userId, 'globalAchievements', globalAchievementId);
    const userGlobalAchievementSnap = await getDoc(userGlobalAchievementRef);

    if (userGlobalAchievementSnap.exists()) {
      // Update existing global achievement
      const existingData = userGlobalAchievementSnap.data() as UserGlobalAchievement;
      
      const updatedData: Partial<UserGlobalAchievement> = {
        totalCount: existingData.totalCount + sessionData.count,
        totalPoints: existingData.totalPoints + sessionData.points,
        lastEarnedAt: new Date(),
        lastSessionEarnedIn: sessionData.sessionId
      };

      // Add to arrays if not already present
      if (!existingData.campaignsEarnedIn.includes(sessionData.campaignId)) {
        updatedData.campaignsEarnedIn = arrayUnion(sessionData.campaignId) as any;
      }
      if (!existingData.sessionsEarnedIn.includes(sessionData.sessionId)) {
        updatedData.sessionsEarnedIn = arrayUnion(sessionData.sessionId) as any;
      }

      batch.update(userGlobalAchievementRef, updatedData);
    } else {
      // Create new global achievement
      const newGlobalAchievement: Omit<UserGlobalAchievement, 'id'> = {
        userId,
        globalAchievementId,
        totalCount: sessionData.count,
        totalPoints: sessionData.points,
        currentLevel: 0, // Will be calculated below
        firstEarnedAt: new Date(),
        lastEarnedAt: new Date(),
        campaignsEarnedIn: [sessionData.campaignId],
        sessionsEarnedIn: [sessionData.sessionId],
        lastSessionEarnedIn: sessionData.sessionId
      };

      batch.set(userGlobalAchievementRef, newGlobalAchievement);
    }

    // Update user's global statistics
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
      totalGlobalPoints: increment(sessionData.points),
      totalGlobalAchievements: increment(1) // This will be recalculated properly later
    });

    await batch.commit();

    // Log audit event
    await logAuditEvent({
      userId,
      username,
      action: AUDIT_ACTIONS.UPDATE_USER_STATS,
      resourceType: RESOURCE_TYPES.ACHIEVEMENT,
      resourceId: globalAchievementId,
      newValue: { 
        sessionData, 
        globalAchievementId,
        pointsAdded: sessionData.points 
      },
      metadata: { 
        sessionId: sessionData.sessionId, 
        campaignId: sessionData.campaignId 
      }
    });
  } catch (error) {
    console.error('Error updating user global achievement:', error);
    throw error;
  }
};

/**
 * Get all global achievements for a user
 */
export const getUserGlobalAchievements = async (userId: string): Promise<(UserGlobalAchievement & { globalAchievement: GlobalAchievement })[]> => {
  try {
    const q = query(
      collection(db, 'users', userId, 'globalAchievements'),
      orderBy('lastEarnedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const userGlobalAchievements = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        firstEarnedAt: data.firstEarnedAt?.toDate() || new Date(),
        lastEarnedAt: data.lastEarnedAt?.toDate() || new Date()
      };
    }) as UserGlobalAchievement[];

    // Fetch global achievement data for each user global achievement
    const achievementsWithGlobal = await Promise.all(
      userGlobalAchievements.map(async (userGlobalAchievement) => {
        const globalAchievementRef = doc(db, 'globalAchievements', userGlobalAchievement.globalAchievementId);
        const globalAchievementSnap = await getDoc(globalAchievementRef);
        
        if (globalAchievementSnap.exists()) {
          const globalData = globalAchievementSnap.data();
          const globalAchievement: GlobalAchievement = {
            id: globalAchievementSnap.id,
            ...globalData,
            createdAt: globalData.createdAt?.toDate() || new Date()
          } as GlobalAchievement;
          
          return {
            ...userGlobalAchievement,
            globalAchievement
          };
        }
        
        return null;
      })
    );

    return achievementsWithGlobal.filter(Boolean) as (UserGlobalAchievement & { globalAchievement: GlobalAchievement })[];
  } catch (error) {
    console.error('Error fetching user global achievements:', error);
    throw error;
  }
};

/**
 * Calculate total points for a user across all campaigns
 */
export const calculateUserTotalPoints = async (userId: string): Promise<number> => {
  try {
    const userGlobalAchievements = await getUserGlobalAchievements(userId);
    return userGlobalAchievements.reduce((total, achievement) => total + achievement.totalPoints, 0);
  } catch (error) {
    console.error('Error calculating user total points:', error);
    throw error;
  }
};

/**
 * Get detailed history of achievement earnings for a user
 */
export const getUserAchievementHistory = async (userId: string): Promise<PlayerSessionAchievement[]> => {
  try {
    const q = query(
      collection(db, 'playerSessionAchievements'),
      where('playerId', '==', userId),
      orderBy('earnedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        earnedAt: data.earnedAt?.toDate() || new Date()
      };
    }) as PlayerSessionAchievement[];
  } catch (error) {
    console.error('Error fetching user achievement history:', error);
    throw error;
  }
};

/**
 * Aggregate user statistics across all campaigns
 */
export const aggregateUserStats = async (userId: string): Promise<{
  totalPoints: number;
  totalAchievements: number;
  uniqueAchievements: number;
  campaignsPlayed: number;
  sessionsPlayed: number;
}> => {
  try {
    const userGlobalAchievements = await getUserGlobalAchievements(userId);
    const achievementHistory = await getUserAchievementHistory(userId);

    const totalPoints = userGlobalAchievements.reduce((total, achievement) => total + achievement.totalPoints, 0);
    const totalAchievements = achievementHistory.length;
    const uniqueAchievements = userGlobalAchievements.length;
    
    // Get unique campaigns and sessions
    const campaignsPlayed = new Set(achievementHistory.map(a => a.campaignId)).size;
    const sessionsPlayed = new Set(achievementHistory.map(a => a.sessionId)).size;

    return {
      totalPoints,
      totalAchievements,
      uniqueAchievements,
      campaignsPlayed,
      sessionsPlayed
    };
  } catch (error) {
    console.error('Error aggregating user stats:', error);
    throw error;
  }
};

/**
 * Update user's global statistics in the user document
 */
export const updateUserGlobalStats = async (
  userId: string,
  username: string
): Promise<void> => {
  try {
    const stats = await aggregateUserStats(userId);
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      totalGlobalPoints: stats.totalPoints,
      totalGlobalAchievements: stats.uniqueAchievements
    });

    // Log audit event
    await logAuditEvent({
      userId,
      username,
      action: AUDIT_ACTIONS.UPDATE_USER_STATS,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: userId,
      newValue: stats,
      metadata: { userId }
    });
  } catch (error) {
    console.error('Error updating user global stats:', error);
    throw error;
  }
};

/**
 * Get user's achievement progress for a specific global achievement
 */
export const getUserAchievementProgress = async (
  userId: string,
  globalAchievementId: string
): Promise<UserGlobalAchievement | null> => {
  try {
    const userGlobalAchievementRef = doc(db, 'users', userId, 'globalAchievements', globalAchievementId);
    const userGlobalAchievementSnap = await getDoc(userGlobalAchievementRef);
    
    if (userGlobalAchievementSnap.exists()) {
      const data = userGlobalAchievementSnap.data();
      return {
        id: userGlobalAchievementSnap.id,
        ...data,
        firstEarnedAt: data.firstEarnedAt?.toDate() || new Date(),
        lastEarnedAt: data.lastEarnedAt?.toDate() || new Date()
      } as UserGlobalAchievement;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user achievement progress:', error);
    throw error;
  }
};

/**
 * Recalculate all user global achievements (for data migration or fixes)
 */
export const recalculateUserGlobalAchievements = async (
  userId: string,
  username: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Get all user's session achievements
    const achievementHistory = await getUserAchievementHistory(userId);
    
    // Group by global achievement ID
    const achievementGroups = achievementHistory.reduce((groups, achievement) => {
      if (!groups[achievement.globalAchievementId]) {
        groups[achievement.globalAchievementId] = [];
      }
      groups[achievement.globalAchievementId].push(achievement);
      return groups;
    }, {} as Record<string, PlayerSessionAchievement[]>);

    // Recalculate each global achievement
    for (const [globalAchievementId, achievements] of Object.entries(achievementGroups)) {
      const totalCount = achievements.reduce((sum, a) => sum + a.count, 0);
      const totalPoints = achievements.reduce((sum, a) => {
        // Calculate points based on level
        const globalAchievementRef = doc(db, 'globalAchievements', globalAchievementId);
        // This would need to be fetched to calculate points properly
        return sum + a.count; // Simplified for now
      }, 0);
      
      const campaignsEarnedIn = Array.from(new Set(achievements.map(a => a.campaignId)));
      const sessionsEarnedIn = Array.from(new Set(achievements.map(a => a.sessionId)));
      const firstEarnedAt = new Date(Math.min(...achievements.map(a => a.earnedAt.getTime())));
      const lastEarnedAt = new Date(Math.max(...achievements.map(a => a.earnedAt.getTime())));

      const userGlobalAchievementRef = doc(db, 'users', userId, 'globalAchievements', globalAchievementId);
      
      batch.set(userGlobalAchievementRef, {
        userId,
        globalAchievementId,
        totalCount,
        totalPoints,
        currentLevel: 0, // Would need to be calculated based on global achievement upgrades
        firstEarnedAt,
        lastEarnedAt,
        campaignsEarnedIn,
        sessionsEarnedIn,
        lastSessionEarnedIn: sessionsEarnedIn[sessionsEarnedIn.length - 1]
      }, { merge: true });
    }

    await batch.commit();

    // Update user's global stats
    await updateUserGlobalStats(userId, username);

    // Log audit event
    await logAuditEvent({
      userId,
      username,
      action: AUDIT_ACTIONS.UPDATE_USER_STATS,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: userId,
      newValue: { recalculated: true },
      metadata: { userId, achievementCount: Object.keys(achievementGroups).length }
    });
  } catch (error) {
    console.error('Error recalculating user global achievements:', error);
    throw error;
  }
};
