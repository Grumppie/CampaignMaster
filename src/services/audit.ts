import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuditLog } from '../types';

export interface AuditEventData {
  userId: string;
  username: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event to the database
 */
export const logAuditEvent = async (eventData: AuditEventData): Promise<string> => {
  try {
    const auditLog: Omit<AuditLog, 'id'> = {
      ...eventData,
      timestamp: new Date()
    };

    const docRef = await addDoc(collection(db, 'auditLogs'), auditLog);
    return docRef.id;
  } catch (error) {
    console.error('Error logging audit event:', error);
    throw error;
  }
};

/**
 * Get audit logs with optional filters
 */
export const getAuditLogs = async (filters?: {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<AuditLog[]> => {
  try {
    let q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));

    if (filters?.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }

    if (filters?.action) {
      q = query(q, where('action', '==', filters.action));
    }

    if (filters?.resourceType) {
      q = query(q, where('resourceType', '==', filters.resourceType));
    }

    if (filters?.resourceId) {
      q = query(q, where('resourceId', '==', filters.resourceId));
    }

    if (filters?.startDate) {
      q = query(q, where('timestamp', '>=', filters.startDate));
    }

    if (filters?.endDate) {
      q = query(q, where('timestamp', '<=', filters.endDate));
    }

    if (filters?.limit) {
      q = query(q, limit(filters.limit));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date()
      };
    }) as AuditLog[];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

/**
 * Get audit history for a specific user
 */
export const getUserAuditHistory = async (userId: string, limit?: number): Promise<AuditLog[]> => {
  return getAuditLogs({ userId, limit });
};

/**
 * Get audit history for a specific resource
 */
export const getResourceAuditHistory = async (
  resourceType: string, 
  resourceId: string, 
  limit?: number
): Promise<AuditLog[]> => {
  return getAuditLogs({ resourceType, resourceId, limit });
};

/**
 * Get recent audit logs (last 100 entries)
 */
export const getRecentAuditLogs = async (): Promise<AuditLog[]> => {
  return getAuditLogs({ limit: 100 });
};

/**
 * Audit action constants for consistency
 */
export const AUDIT_ACTIONS = {
  // Campaign actions
  CREATE_CAMPAIGN: 'create_campaign',
  UPDATE_CAMPAIGN: 'update_campaign',
  DELETE_CAMPAIGN: 'delete_campaign',
  JOIN_CAMPAIGN: 'join_campaign',
  LEAVE_CAMPAIGN: 'leave_campaign',

  // Session actions
  CREATE_SESSION: 'create_session',
  UPDATE_SESSION: 'update_session',
  DELETE_SESSION: 'delete_session',
  START_SESSION: 'start_session',
  END_SESSION: 'end_session',

  // Achievement actions
  CREATE_ACHIEVEMENT: 'create_achievement',
  ASSIGN_ACHIEVEMENT: 'assign_achievement',
  AWARD_ACHIEVEMENT: 'award_achievement',
  UPDATE_ACHIEVEMENT: 'update_achievement',
  DELETE_ACHIEVEMENT: 'delete_achievement',

  // User actions
  CREATE_USER: 'create_user',
  UPDATE_USER: 'update_user',
  UPDATE_USER_STATS: 'update_user_stats',

  // Theme actions
  SAVE_THEME: 'save_theme',
  APPLY_THEME: 'apply_theme',
  DELETE_THEME: 'delete_theme',

  // Leaderboard actions
  UPDATE_LEADERBOARD: 'update_leaderboard',
  GENERATE_LEADERBOARD_SNAPSHOT: 'generate_leaderboard_snapshot',

  // Authentication actions
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  PASSWORD_RESET: 'password_reset',
} as const;

/**
 * Resource type constants
 */
export const RESOURCE_TYPES = {
  CAMPAIGN: 'campaign',
  SESSION: 'session',
  ACHIEVEMENT: 'achievement',
  USER: 'user',
  THEME: 'theme',
  LEADERBOARD: 'leaderboard',
} as const;
