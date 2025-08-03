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
  arrayRemove
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { GlobalAchievement, CampaignAchievement, PlayerAchievement, AchievementUpgrade } from '../types';

// Create a new global achievement
export const createGlobalAchievement = async (achievementData: {
  name: string;
  description: string;
  basePoints: number;
  upgrades: Omit<AchievementUpgrade, 'id'>[];
  createdBy: string;
  isPublic?: boolean;
}) => {
  try {
    const upgradesWithIds = achievementData.upgrades.map((upgrade, index) => ({
      ...upgrade,
      id: `upgrade_${Date.now()}_${index}`
    }));

    const docRef = await addDoc(collection(db, 'globalAchievements'), {
      ...achievementData,
      upgrades: upgradesWithIds,
      isPublic: achievementData.isPublic ?? true,
      createdAt: new Date()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating global achievement:', error);
    throw error;
  }
};

// Get all global achievements (public ones or created by the user)
export const getGlobalAchievements = async (userId?: string) => {
  try {
    let q;
    if (userId) {
      // Get public achievements and user's private achievements
      q = query(
        collection(db, 'globalAchievements'),
        where('isPublic', '==', true)
      );
    } else {
      // Get only public achievements
      q = query(
        collection(db, 'globalAchievements'),
        where('isPublic', '==', true)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const achievements: GlobalAchievement[] = [];

    const publicAchievements = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as GlobalAchievement[];
    
    achievements.push(...publicAchievements);

    // Get private achievements created by the user
    if (userId) {
      const privateQuery = query(
        collection(db, 'globalAchievements'),
        where('createdBy', '==', userId),
        where('isPublic', '==', false)
      );
      const privateSnapshot = await getDocs(privateQuery);
      
      const privateAchievements = privateSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as GlobalAchievement[];
      
      achievements.push(...privateAchievements);
    }

    return achievements.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Error fetching global achievements:', error);
    throw error;
  }
};

// Get a specific global achievement
export const getGlobalAchievementById = async (achievementId: string) => {
  try {
    const docRef = doc(db, 'globalAchievements', achievementId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as GlobalAchievement;
    }
    return null;
  } catch (error) {
    console.error('Error fetching global achievement:', error);
    throw error;
  }
};

// Assign an achievement to a campaign
export const assignAchievementToCampaign = async (
  globalAchievementId: string,
  campaignId: string,
  assignedBy: string
) => {
  try {
    // Check if achievement is already assigned to this campaign
    const existingQuery = query(
      collection(db, 'campaignAchievements'),
      where('globalAchievementId', '==', globalAchievementId),
      where('campaignId', '==', campaignId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      throw new Error('Achievement is already assigned to this campaign');
    }

    // Create campaign achievement record
    await addDoc(collection(db, 'campaignAchievements'), {
      globalAchievementId,
      campaignId,
      assignedBy,
      assignedAt: new Date()
    });

    // Add achievement to campaign's assigned achievements
    const campaignRef = doc(db, 'campaigns', campaignId);
    await updateDoc(campaignRef, {
      assignedAchievements: arrayUnion(globalAchievementId)
    });

    return true;
  } catch (error) {
    console.error('Error assigning achievement to campaign:', error);
    throw error;
  }
};

// Assign an achievement directly to a player
export const assignAchievementToPlayer = async (
  globalAchievementId: string,
  playerId: string,
  campaignId: string,
  assignedBy: string
) => {
  try {
    // Check if player already has this achievement
    const existingQuery = query(
      collection(db, 'playerAchievements'),
      where('playerId', '==', playerId),
      where('globalAchievementId', '==', globalAchievementId),
      where('campaignId', '==', campaignId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      throw new Error('Player already has this achievement');
    }

    // Create player achievement record
    await addDoc(collection(db, 'playerAchievements'), {
      playerId,
      globalAchievementId,
      campaignId,
      count: 0,
      currentLevel: 0,
      lastUpdated: new Date(),
      assignedBy,
      assignedAt: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error assigning achievement to player:', error);
    throw error;
  }
};

// Get achievements assigned to a campaign
export const getCampaignAchievements = async (campaignId: string) => {
  try {
    const q = query(
      collection(db, 'campaignAchievements'),
      where('campaignId', '==', campaignId)
    );
    const querySnapshot = await getDocs(q);
    
    const campaignAchievements = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      assignedAt: doc.data().assignedAt?.toDate() || new Date()
    })) as CampaignAchievement[];

    // Get the actual global achievement data for each assigned achievement
    const globalAchievements = await Promise.all(
      campaignAchievements.map(async (ca) => {
        const globalAchievement = await getGlobalAchievementById(ca.globalAchievementId);
        return globalAchievement ? { ...ca, globalAchievement } : null;
      })
    );

    return globalAchievements.filter(Boolean);
  } catch (error) {
    console.error('Error fetching campaign achievements:', error);
    throw error;
  }
};

// Get player's achievement progress
export const getPlayerAchievements = async (playerId: string, campaignId: string) => {
  try {
    const q = query(
      collection(db, 'playerAchievements'),
      where('playerId', '==', playerId),
      where('campaignId', '==', campaignId)
    );
    const querySnapshot = await getDocs(q);
    
    const playerAchievements = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
    })) as PlayerAchievement[];

    // Get the actual global achievement data for each player achievement
    const achievementsWithData = await Promise.all(
      playerAchievements.map(async (pa) => {
        const globalAchievement = await getGlobalAchievementById(pa.globalAchievementId);
        return globalAchievement ? { ...pa, globalAchievement } : null;
      })
    );

    return achievementsWithData.filter(Boolean);
  } catch (error) {
    console.error('Error fetching player achievements:', error);
    throw error;
  }
};

// Increment player achievement progress
export const incrementPlayerAchievement = async (
  playerId: string,
  globalAchievementId: string,
  campaignId: string,
  increment: number = 1
) => {
  try {
    // Check if player achievement exists
    const q = query(
      collection(db, 'playerAchievements'),
      where('playerId', '==', playerId),
      where('globalAchievementId', '==', globalAchievementId),
      where('campaignId', '==', campaignId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Create new player achievement
      await addDoc(collection(db, 'playerAchievements'), {
        playerId,
        globalAchievementId,
        campaignId,
        count: increment,
        currentLevel: 0,
        lastUpdated: new Date()
      });
    } else {
      // Update existing player achievement
      const docRef = doc(db, 'playerAchievements', querySnapshot.docs[0].id);
      const currentData = querySnapshot.docs[0].data();
      const newCount = currentData.count + increment;
      
      // Check for level upgrades
      const globalAchievement = await getGlobalAchievementById(globalAchievementId);
      let newLevel = currentData.currentLevel;
      
      if (globalAchievement) {
        for (let i = globalAchievement.upgrades.length - 1; i >= 0; i--) {
          if (newCount >= globalAchievement.upgrades[i].requiredCount) {
            newLevel = i + 1;
            break;
          }
        }
      }

      await updateDoc(docRef, {
        count: newCount,
        currentLevel: newLevel,
        lastUpdated: new Date()
      });
    }

    return true;
  } catch (error) {
    console.error('Error incrementing player achievement:', error);
    throw error;
  }
};

// Decrement player achievement progress
export const decrementPlayerAchievement = async (
  playerId: string,
  globalAchievementId: string,
  campaignId: string,
  decrement: number = 1
) => {
  try {
    const q = query(
      collection(db, 'playerAchievements'),
      where('playerId', '==', playerId),
      where('globalAchievementId', '==', globalAchievementId),
      where('campaignId', '==', campaignId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docRef = doc(db, 'playerAchievements', querySnapshot.docs[0].id);
      const currentData = querySnapshot.docs[0].data();
      const newCount = Math.max(0, currentData.count - decrement);
      
      // Check for level downgrades
      const globalAchievement = await getGlobalAchievementById(globalAchievementId);
      let newLevel = 0;
      
      if (globalAchievement) {
        for (let i = globalAchievement.upgrades.length - 1; i >= 0; i--) {
          if (newCount >= globalAchievement.upgrades[i].requiredCount) {
            newLevel = i + 1;
            break;
          }
        }
      }

      await updateDoc(docRef, {
        count: newCount,
        currentLevel: newLevel,
        lastUpdated: new Date()
      });
    }

    return true;
  } catch (error) {
    console.error('Error decrementing player achievement:', error);
    throw error;
  }
}; 