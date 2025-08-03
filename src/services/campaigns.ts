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
  arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Campaign, CampaignPlayer } from '../types';

export const createCampaign = async (campaignData: Omit<Campaign, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'campaigns'), {
      ...campaignData,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const getCampaigns = async () => {
  try {
    const q = query(
      collection(db, 'campaigns'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        players: data.players?.map((player: any) => ({
          ...player,
          joinedAt: player.joinedAt?.toDate() || new Date()
        })) || []
      };
    }) as Campaign[];
  } catch (error) {
    throw error;
  }
};

export const getCampaignById = async (campaignId: string) => {
  try {
    const docRef = doc(db, 'campaigns', campaignId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        players: data.players?.map((player: any) => ({
          ...player,
          joinedAt: player.joinedAt?.toDate() || new Date()
        })) || []
      } as Campaign;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const joinCampaign = async (campaignId: string, userId: string, characterName: string) => {
  try {
    const campaignRef = doc(db, 'campaigns', campaignId);
    
    // Create the new player object
    const newPlayer: CampaignPlayer = {
      userId,
      characterName,
      joinedAt: new Date()
    };
    
    // Add the player to the campaign's players array
    await updateDoc(campaignRef, {
      players: arrayUnion(newPlayer)
    });
    
    return true;
  } catch (error) {
    console.error('Error joining campaign:', error);
    throw error;
  }
}; 