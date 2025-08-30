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
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  SessionAchievement, 
  PlayerSessionAchievement, 
  CampaignSession,
  GlobalAchievement 
} from '../types';
import { logAuditEvent, AUDIT_ACTIONS, RESOURCE_TYPES } from './audit';

/**
 * Assign achievement to a specific session
 */
export const assignAchievementToSession = async (
  sessionId: string, 
  globalAchievementId: string,
  userId: string,
  username: string
): Promise<string> => {
  try {
    // Verify session exists
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      throw new Error('Session not found');
    }

    const session = sessionSnap.data() as CampaignSession;

    // Verify global achievement exists
    const achievementRef = doc(db, 'globalAchievements', globalAchievementId);
    const achievementSnap = await getDoc(achievementRef);
    
    if (!achievementSnap.exists()) {
      throw new Error('Global achievement not found');
    }

    // Create session achievement
    const sessionAchievement: Omit<SessionAchievement, 'id'> = {
      sessionId,
      campaignId: session.campaignId,
      globalAchievementId,
      assignedBy: userId,
      assignedAt: new Date(),
      isActive: true
    };

    const docRef = await addDoc(collection(db, 'sessionAchievements'), sessionAchievement);

    // Update session's assigned achievements
    await updateDoc(sessionRef, {
      assignedAchievements: arrayUnion(globalAchievementId)
    });

    // Log audit event
    await logAuditEvent({
      userId,
      username,
      action: AUDIT_ACTIONS.ASSIGN_ACHIEVEMENT,
      resourceType: RESOURCE_TYPES.ACHIEVEMENT,
      resourceId: docRef.id,
      newValue: sessionAchievement,
      metadata: { sessionId, globalAchievementId }
    });

    return docRef.id;
  } catch (error) {
    console.error('Error assigning achievement to session:', error);
    throw error;
  }
};

/**
 * Get achievements assigned to a session
 */
export const getSessionAchievements = async (sessionId: string): Promise<(SessionAchievement & { globalAchievement: GlobalAchievement })[]> => {
  try {
    const q = query(
      collection(db, 'sessionAchievements'),
      where('sessionId', '==', sessionId),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const sessionAchievements = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        assignedAt: data.assignedAt?.toDate() || new Date()
      };
    }) as SessionAchievement[];

    // Fetch global achievement data for each session achievement
    const achievementsWithGlobal = await Promise.all(
      sessionAchievements.map(async (sessionAchievement) => {
        const globalAchievementRef = doc(db, 'globalAchievements', sessionAchievement.globalAchievementId);
        const globalAchievementSnap = await getDoc(globalAchievementRef);
        
        if (globalAchievementSnap.exists()) {
          const globalData = globalAchievementSnap.data();
          const globalAchievement: GlobalAchievement = {
            id: globalAchievementSnap.id,
            ...globalData,
            createdAt: globalData.createdAt?.toDate() || new Date()
          } as GlobalAchievement;
          
          return {
            ...sessionAchievement,
            globalAchievement
          };
        }
        
        return null;
      })
    );

    return achievementsWithGlobal.filter(Boolean) as (SessionAchievement & { globalAchievement: GlobalAchievement })[];
  } catch (error) {
    console.error('Error fetching session achievements:', error);
    throw error;
  }
};

/**
 * Award achievement to player in session
 */
export const awardPlayerSessionAchievement = async (
  sessionId: string, 
  playerId: string, 
  globalAchievementId: string, 
  count: number,
  userId: string,
  username: string
): Promise<string> => {
  try {
    // Verify session exists
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      throw new Error('Session not found');
    }

    const session = sessionSnap.data() as CampaignSession;

    // Verify global achievement exists
    const achievementRef = doc(db, 'globalAchievements', globalAchievementId);
    const achievementSnap = await getDoc(achievementRef);
    
    if (!achievementSnap.exists()) {
      throw new Error('Global achievement not found');
    }

    const globalAchievement = achievementSnap.data() as GlobalAchievement;

    // Calculate current level based on count
    let currentLevel = 0;
    for (let i = globalAchievement.upgrades.length - 1; i >= 0; i--) {
      if (count >= globalAchievement.upgrades[i].requiredCount) {
        currentLevel = i + 1;
        break;
      }
    }

    // Create or update player session achievement
    const playerSessionAchievement: Omit<PlayerSessionAchievement, 'id'> = {
      sessionId,
      campaignId: session.campaignId,
      playerId,
      globalAchievementId,
      count,
      currentLevel,
      earnedAt: new Date(),
      assignedBy: userId
    };

    const docRef = await addDoc(collection(db, 'playerSessionAchievements'), playerSessionAchievement);

    // Log audit event
    await logAuditEvent({
      userId,
      username,
      action: AUDIT_ACTIONS.AWARD_ACHIEVEMENT,
      resourceType: RESOURCE_TYPES.ACHIEVEMENT,
      resourceId: docRef.id,
      newValue: playerSessionAchievement,
      metadata: { 
        sessionId, 
        playerId, 
        globalAchievementId, 
        count, 
        currentLevel 
      }
    });

    return docRef.id;
  } catch (error) {
    console.error('Error awarding player session achievement:', error);
    throw error;
  }
};

/**
 * Get player's progress in a specific session
 */
export const getPlayerSessionProgress = async (
  sessionId: string, 
  playerId: string
): Promise<(PlayerSessionAchievement & { globalAchievement: GlobalAchievement })[]> => {
  try {
    const q = query(
      collection(db, 'playerSessionAchievements'),
      where('sessionId', '==', sessionId),
      where('playerId', '==', playerId)
    );
    
    const querySnapshot = await getDocs(q);
    const playerAchievements = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        earnedAt: data.earnedAt?.toDate() || new Date()
      };
    }) as PlayerSessionAchievement[];

    // Fetch global achievement data for each player achievement
    const achievementsWithGlobal = await Promise.all(
      playerAchievements.map(async (playerAchievement) => {
        const globalAchievementRef = doc(db, 'globalAchievements', playerAchievement.globalAchievementId);
        const globalAchievementSnap = await getDoc(globalAchievementRef);
        
        if (globalAchievementSnap.exists()) {
          const globalData = globalAchievementSnap.data();
          const globalAchievement: GlobalAchievement = {
            id: globalAchievementSnap.id,
            ...globalData,
            createdAt: globalData.createdAt?.toDate() || new Date()
          } as GlobalAchievement;
          
          return {
            ...playerAchievement,
            globalAchievement
          };
        }
        
        return null;
      })
    );

    return achievementsWithGlobal.filter(Boolean) as (PlayerSessionAchievement & { globalAchievement: GlobalAchievement })[];
  } catch (error) {
    console.error('Error fetching player session progress:', error);
    throw error;
  }
};

/**
 * Get all session achievements across a campaign
 */
export const getCampaignSessionAchievements = async (campaignId: string): Promise<(PlayerSessionAchievement & { globalAchievement: GlobalAchievement })[]> => {
  try {
    const q = query(
      collection(db, 'playerSessionAchievements'),
      where('campaignId', '==', campaignId),
      orderBy('earnedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const campaignAchievements = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        earnedAt: data.earnedAt?.toDate() || new Date()
      };
    }) as PlayerSessionAchievement[];

    // Fetch global achievement data for each campaign achievement
    const achievementsWithGlobal = await Promise.all(
      campaignAchievements.map(async (campaignAchievement) => {
        const globalAchievementRef = doc(db, 'globalAchievements', campaignAchievement.globalAchievementId);
        const globalAchievementSnap = await getDoc(globalAchievementRef);
        
        if (globalAchievementSnap.exists()) {
          const globalData = globalAchievementSnap.data();
          const globalAchievement: GlobalAchievement = {
            id: globalAchievementSnap.id,
            ...globalData,
            createdAt: globalData.createdAt?.toDate() || new Date()
          } as GlobalAchievement;
          
          return {
            ...campaignAchievement,
            globalAchievement
          };
        }
        
        return null;
      })
    );

    return achievementsWithGlobal.filter(Boolean) as (PlayerSessionAchievement & { globalAchievement: GlobalAchievement })[];
  } catch (error) {
    console.error('Error fetching campaign session achievements:', error);
    throw error;
  }
};

/**
 * Update player session achievement count
 */
export const updatePlayerSessionAchievement = async (
  achievementId: string,
  newCount: number,
  userId: string,
  username: string
): Promise<void> => {
  try {
    const achievementRef = doc(db, 'playerSessionAchievements', achievementId);
    const achievementSnap = await getDoc(achievementRef);
    
    if (!achievementSnap.exists()) {
      throw new Error('Player session achievement not found');
    }

    const oldData = achievementSnap.data() as PlayerSessionAchievement;

    // Get global achievement to calculate new level
    const globalAchievementRef = doc(db, 'globalAchievements', oldData.globalAchievementId);
    const globalAchievementSnap = await getDoc(globalAchievementRef);
    
    if (!globalAchievementSnap.exists()) {
      throw new Error('Global achievement not found');
    }

    const globalAchievement = globalAchievementSnap.data() as GlobalAchievement;

    // Calculate new level based on count
    let newLevel = 0;
    for (let i = globalAchievement.upgrades.length - 1; i >= 0; i--) {
      if (newCount >= globalAchievement.upgrades[i].requiredCount) {
        newLevel = i + 1;
        break;
      }
    }

    await updateDoc(achievementRef, {
      count: newCount,
      currentLevel: newLevel,
      earnedAt: new Date()
    });

    // Log audit event
    await logAuditEvent({
      userId,
      username,
      action: AUDIT_ACTIONS.UPDATE_ACHIEVEMENT,
      resourceType: RESOURCE_TYPES.ACHIEVEMENT,
      resourceId: achievementId,
      oldValue: { count: oldData.count, currentLevel: oldData.currentLevel },
      newValue: { count: newCount, currentLevel: newLevel },
      metadata: { 
        sessionId: oldData.sessionId, 
        playerId: oldData.playerId, 
        globalAchievementId: oldData.globalAchievementId 
      }
    });
  } catch (error) {
    console.error('Error updating player session achievement:', error);
    throw error;
  }
};
