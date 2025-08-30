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
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CampaignSession, SessionPlayer, Campaign } from '../types';
import { logAuditEvent, AUDIT_ACTIONS, RESOURCE_TYPES } from './audit';

export interface CreateSessionData {
  campaignId: string;
  sessionDate: Date;
  dmId: string;
  notes?: string;
  duration?: number;
}

/**
 * Create a new session within a campaign
 */
export const createCampaignSession = async (
  campaignId: string, 
  sessionData: CreateSessionData,
  userId: string,
  username: string
): Promise<string> => {
  try {
    // Get the campaign to determine session number
    const campaignRef = doc(db, 'campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);
    
    if (!campaignSnap.exists()) {
      throw new Error('Campaign not found');
    }

    const campaign = campaignSnap.data() as Campaign;
    const sessionNumber = (campaign.totalSessions || 0) + 1;

    // Create the session
    const session: Omit<CampaignSession, 'id'> = {
      campaignId,
      sessionNumber,
      sessionDate: sessionData.sessionDate,
      dmId: sessionData.dmId,
      players: [],
      status: 'scheduled',
      notes: sessionData.notes,
      duration: sessionData.duration,
      assignedAchievements: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'sessions'), session);

    // Update campaign session count
    await updateDoc(campaignRef, {
      totalSessions: increment(1),
      lastSessionDate: sessionData.sessionDate
    });

    // Log audit event
    await logAuditEvent({
      userId,
      username,
      action: AUDIT_ACTIONS.CREATE_SESSION,
      resourceType: RESOURCE_TYPES.SESSION,
      resourceId: docRef.id,
      newValue: session,
      metadata: { campaignId, sessionNumber }
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

/**
 * Get all sessions for a specific campaign
 */
export const getCampaignSessions = async (campaignId: string): Promise<CampaignSession[]> => {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('campaignId', '==', campaignId),
      orderBy('sessionNumber', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        sessionDate: data.sessionDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    }) as CampaignSession[];
  } catch (error) {
    console.error('Error fetching campaign sessions:', error);
    throw error;
  }
};

/**
 * Get a specific session by ID
 */
export const getSessionById = async (sessionId: string): Promise<CampaignSession | null> => {
  try {
    const docRef = doc(db, 'sessions', sessionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        sessionDate: data.sessionDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as CampaignSession;
    }
    return null;
  } catch (error) {
    console.error('Error fetching session:', error);
    throw error;
  }
};

/**
 * Update session status
 */
export const updateSessionStatus = async (
  sessionId: string, 
  status: CampaignSession['status'],
  userId: string,
  username: string
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      throw new Error('Session not found');
    }

    const oldData = sessionSnap.data();
    
    await updateDoc(sessionRef, {
      status,
      updatedAt: new Date()
    });

    // Log audit event
    await logAuditEvent({
      userId,
      username,
      action: AUDIT_ACTIONS.UPDATE_SESSION,
      resourceType: RESOURCE_TYPES.SESSION,
      resourceId: sessionId,
      oldValue: { status: oldData.status },
      newValue: { status },
      metadata: { sessionId }
    });
  } catch (error) {
    console.error('Error updating session status:', error);
    throw error;
  }
};

/**
 * Add player to a session
 */
export const addPlayerToSession = async (
  sessionId: string, 
  playerData: Omit<SessionPlayer, 'joinedAt'>,
  userId: string,
  username: string
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      throw new Error('Session not found');
    }

    const session = sessionSnap.data() as CampaignSession;
    const newPlayer: SessionPlayer = {
      ...playerData,
      joinedAt: new Date()
    };

    // Check if player already exists
    const existingPlayerIndex = session.players.findIndex(p => p.userId === playerData.userId);
    
    if (existingPlayerIndex >= 0) {
      // Update existing player
      const updatedPlayers = [...session.players];
      updatedPlayers[existingPlayerIndex] = newPlayer;
      
      await updateDoc(sessionRef, {
        players: updatedPlayers,
        updatedAt: new Date()
      });
    } else {
      // Add new player
      await updateDoc(sessionRef, {
        players: arrayUnion(newPlayer),
        updatedAt: new Date()
      });
    }

    // Log audit event
    await logAuditEvent({
      userId,
      username,
      action: AUDIT_ACTIONS.UPDATE_SESSION,
      resourceType: RESOURCE_TYPES.SESSION,
      resourceId: sessionId,
      newValue: { playerAdded: newPlayer },
      metadata: { sessionId, playerId: playerData.userId }
    });
  } catch (error) {
    console.error('Error adding player to session:', error);
    throw error;
  }
};

/**
 * Remove player from session
 */
export const removePlayerFromSession = async (
  sessionId: string, 
  playerId: string,
  userId: string,
  username: string
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      throw new Error('Session not found');
    }

    const session = sessionSnap.data() as CampaignSession;
    const updatedPlayers = session.players.filter(p => p.userId !== playerId);

    await updateDoc(sessionRef, {
      players: updatedPlayers,
      updatedAt: new Date()
    });

    // Log audit event
    await logAuditEvent({
      userId,
      username,
      action: AUDIT_ACTIONS.UPDATE_SESSION,
      resourceType: RESOURCE_TYPES.SESSION,
      resourceId: sessionId,
      oldValue: { playerRemoved: session.players.find(p => p.userId === playerId) },
      metadata: { sessionId, playerId }
    });
  } catch (error) {
    console.error('Error removing player from session:', error);
    throw error;
  }
};

/**
 * Update session details
 */
export const updateSession = async (
  sessionId: string,
  updates: Partial<Pick<CampaignSession, 'notes' | 'duration' | 'sessionDate'>>,
  userId: string,
  username: string
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      throw new Error('Session not found');
    }

    const oldData = sessionSnap.data();
    
    await updateDoc(sessionRef, {
      ...updates,
      updatedAt: new Date()
    });

    // Log audit event
    await logAuditEvent({
      userId,
      username,
      action: AUDIT_ACTIONS.UPDATE_SESSION,
      resourceType: RESOURCE_TYPES.SESSION,
      resourceId: sessionId,
      oldValue: oldData,
      newValue: updates,
      metadata: { sessionId }
    });
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

/**
 * Delete a session
 */
export const deleteSession = async (
  sessionId: string,
  userId: string,
  username: string
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      throw new Error('Session not found');
    }

    const session = sessionSnap.data() as CampaignSession;

    // Delete the session
    await deleteDoc(sessionRef);

    // Update campaign session count
    const campaignRef = doc(db, 'campaigns', session.campaignId);
    await updateDoc(campaignRef, {
      totalSessions: increment(-1)
    });

    // Log audit event
    await logAuditEvent({
      userId,
      username,
      action: AUDIT_ACTIONS.DELETE_SESSION,
      resourceType: RESOURCE_TYPES.SESSION,
      resourceId: sessionId,
      oldValue: session,
      metadata: { campaignId: session.campaignId }
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};
