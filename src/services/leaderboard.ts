import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  LeaderboardEntry, 
  LeaderboardSnapshot,
  User 
} from '../types';
import { logAuditEvent, AUDIT_ACTIONS, RESOURCE_TYPES } from './audit';
import { aggregateUserStats } from './globalAchievements';

/**
 * Update leaderboard entry for a user
 */
export const updateLeaderboardEntry = async (
  userId: string,
  username: string,
  displayName: string
): Promise<void> => {
  try {
    // Get user stats
    const stats = await aggregateUserStats(userId);
    
    // Create leaderboard entry
    const entry: Omit<LeaderboardEntry, 'id' | 'rank'> = {
      userId,
      username,
      displayName,
      totalPoints: stats.totalPoints,
      totalAchievements: stats.totalAchievements,
      uniqueAchievements: stats.uniqueAchievements,
      lastUpdated: new Date()
    };

    // Update the entry in the all-time leaderboard
    const entryRef = doc(db, 'leaderboard', 'all-time', 'entries', userId);
    await setDoc(entryRef, entry, { merge: true });

    // Log audit event
    await logAuditEvent({
      userId,
      username,
      action: AUDIT_ACTIONS.UPDATE_LEADERBOARD,
      resourceType: RESOURCE_TYPES.LEADERBOARD,
      resourceId: userId,
      newValue: entry,
      metadata: { period: 'all-time' }
    });
  } catch (error) {
    console.error('Error updating leaderboard entry:', error);
    throw error;
  }
};

/**
 * Get leaderboard entries for a specific period
 */
export const getLeaderboard = async (
  period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time',
  limitCount: number = 50
): Promise<LeaderboardEntry[]> => {
  try {
    const q = query(
      collection(db, 'leaderboard', period, 'entries'),
      orderBy('totalPoints', 'desc'),
      orderBy('uniqueAchievements', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        rank: index + 1,
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      };
    }) as LeaderboardEntry[];

    return entries;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

/**
 * Get user's rank in the leaderboard
 */
export const getUserRank = async (
  userId: string,
  period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time'
): Promise<number | null> => {
  try {
    // Get all entries to find user's rank
    const entries = await getLeaderboard(period, 1000); // Get all entries
    const userEntry = entries.find(entry => entry.userId === userId);
    
    return userEntry ? userEntry.rank : null;
  } catch (error) {
    console.error('Error getting user rank:', error);
    throw error;
  }
};

/**
 * Generate leaderboard snapshot for a specific period
 */
export const generateLeaderboardSnapshot = async (
  period: 'daily' | 'weekly' | 'monthly' | 'all-time',
  username: string
): Promise<string> => {
  try {
    const entries = await getLeaderboard(period, 1000);
    
    const snapshot: Omit<LeaderboardSnapshot, 'id'> = {
      timestamp: new Date(),
      entries,
      period
    };

    const docRef = await addDoc(collection(db, 'leaderboardSnapshots'), snapshot);

    // Log audit event
    await logAuditEvent({
      userId: 'system',
      username,
      action: AUDIT_ACTIONS.GENERATE_LEADERBOARD_SNAPSHOT,
      resourceType: RESOURCE_TYPES.LEADERBOARD,
      resourceId: docRef.id,
      newValue: { period, entryCount: entries.length },
      metadata: { period }
    });

    return docRef.id;
  } catch (error) {
    console.error('Error generating leaderboard snapshot:', error);
    throw error;
  }
};

/**
 * Update all leaderboard entries (for periodic updates)
 */
export const updateAllLeaderboardEntries = async (): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Get all users
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    
    const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
      const user = userDoc.data() as User;
      
      try {
        // Get user stats
        const stats = await aggregateUserStats(user.uid);
        
        // Create leaderboard entry
        const entry: Omit<LeaderboardEntry, 'id' | 'rank'> = {
          userId: user.uid,
          username: user.username,
          displayName: user.displayName,
          totalPoints: stats.totalPoints,
          totalAchievements: stats.totalAchievements,
          uniqueAchievements: stats.uniqueAchievements,
          lastUpdated: new Date()
        };

        // Update the entry
        const entryRef = doc(db, 'leaderboard', 'all-time', 'entries', user.uid);
        batch.set(entryRef, entry, { merge: true });
        
        return { userId: user.uid, success: true };
      } catch (error) {
        console.error(`Error updating leaderboard for user ${user.uid}:`, error);
        return { userId: user.uid, success: false, error };
      }
    });

    const results = await Promise.all(updatePromises);
    await batch.commit();

    // Log audit event
    await logAuditEvent({
      userId: 'system',
      username: 'system',
      action: AUDIT_ACTIONS.UPDATE_LEADERBOARD,
      resourceType: RESOURCE_TYPES.LEADERBOARD,
      resourceId: 'all-time',
      newValue: { 
        updatedEntries: results.filter(r => r.success).length,
        totalEntries: results.length 
      },
      metadata: { period: 'all-time' }
    });

    console.log(`Updated ${results.filter(r => r.success).length} leaderboard entries`);
  } catch (error) {
    console.error('Error updating all leaderboard entries:', error);
    throw error;
  }
};

/**
 * Get leaderboard snapshots for a specific period
 */
export const getLeaderboardSnapshots = async (
  period: 'daily' | 'weekly' | 'monthly' | 'all-time',
  limitCount: number = 10
): Promise<LeaderboardSnapshot[]> => {
  try {
    const q = query(
      collection(db, 'leaderboardSnapshots'),
      where('period', '==', period),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
        entries: data.entries?.map((entry: any) => ({
          ...entry,
          lastUpdated: entry.lastUpdated?.toDate() || new Date()
        })) || []
      };
    }) as LeaderboardSnapshot[];
  } catch (error) {
    console.error('Error fetching leaderboard snapshots:', error);
    throw error;
  }
};

/**
 * Get top players for a specific period
 */
export const getTopPlayers = async (
  period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time',
  count: number = 10
): Promise<LeaderboardEntry[]> => {
  try {
    return await getLeaderboard(period, count);
  } catch (error) {
    console.error('Error fetching top players:', error);
    throw error;
  }
};

/**
 * Get leaderboard statistics
 */
export const getLeaderboardStats = async (
  period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time'
): Promise<{
  totalPlayers: number;
  averagePoints: number;
  highestPoints: number;
  totalAchievements: number;
}> => {
  try {
    const entries = await getLeaderboard(period, 1000);
    
    if (entries.length === 0) {
      return {
        totalPlayers: 0,
        averagePoints: 0,
        highestPoints: 0,
        totalAchievements: 0
      };
    }

    const totalPoints = entries.reduce((sum, entry) => sum + entry.totalPoints, 0);
    const totalAchievements = entries.reduce((sum, entry) => sum + entry.totalAchievements, 0);
    const highestPoints = Math.max(...entries.map(entry => entry.totalPoints));

    return {
      totalPlayers: entries.length,
      averagePoints: Math.round(totalPoints / entries.length),
      highestPoints,
      totalAchievements
    };
  } catch (error) {
    console.error('Error getting leaderboard stats:', error);
    throw error;
  }
};

/**
 * Compare two users' leaderboard positions
 */
export const compareUsers = async (
  userId1: string,
  userId2: string,
  period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time'
): Promise<{
  user1: LeaderboardEntry | null;
  user2: LeaderboardEntry | null;
  comparison: {
    pointsDifference: number;
    achievementsDifference: number;
    rankDifference: number;
  };
}> => {
  try {
    const entries = await getLeaderboard(period, 1000);
    
    const user1Entry = entries.find(entry => entry.userId === userId1) || null;
    const user2Entry = entries.find(entry => entry.userId === userId2) || null;

    if (!user1Entry || !user2Entry) {
      return {
        user1: user1Entry,
        user2: user2Entry,
        comparison: {
          pointsDifference: 0,
          achievementsDifference: 0,
          rankDifference: 0
        }
      };
    }

    return {
      user1: user1Entry,
      user2: user2Entry,
      comparison: {
        pointsDifference: user1Entry.totalPoints - user2Entry.totalPoints,
        achievementsDifference: user1Entry.uniqueAchievements - user2Entry.uniqueAchievements,
        rankDifference: user2Entry.rank - user1Entry.rank // Positive means user1 is higher ranked
      }
    };
  } catch (error) {
    console.error('Error comparing users:', error);
    throw error;
  }
};
