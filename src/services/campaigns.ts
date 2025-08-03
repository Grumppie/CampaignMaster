import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query,
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Campaign } from '../types';

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
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Campaign[];
  } catch (error) {
    throw error;
  }
};

export const getCampaignById = async (campaignId: string) => {
  try {
    const docRef = doc(db, 'campaigns', campaignId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Campaign;
    }
    return null;
  } catch (error) {
    throw error;
  }
}; 