import { useState, useEffect } from 'react';
import { onAuthStateChange, getUserProfile } from '../services/auth';
import { User } from '../types';

export interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: Setting up auth listener');
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      console.log('useAuth: Auth state changed', firebaseUser ? 'User logged in' : 'No user');
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore
          const userProfile = await getUserProfile(firebaseUser.uid);
          if (userProfile) {
            setUser(userProfile);
          } else {
            // Fallback to basic user data if profile not found
            setUser({
              uid: firebaseUser.uid,
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
              displayName: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              totalGlobalPoints: 0,
              totalGlobalAchievements: 0,
              createdAt: new Date(),
              lastLoginAt: new Date(),
              createdCampaigns: [],
              joinedCampaigns: []
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to basic user data
          setUser({
            uid: firebaseUser.uid,
            username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
            displayName: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            totalGlobalPoints: 0,
            totalGlobalAchievements: 0,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            createdCampaigns: [],
            joinedCampaigns: []
          });
        }
        setIsAdmin(false); // Reset admin state when Firebase user logs in
      } else {
        setUser(null);
        setIsAdmin(false); // Reset admin state when user logs out
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Function to set admin login state (called from LoginPage)
  // const setAdminLogin = (adminState: boolean) => {
  //   setIsAdmin(adminState);
  //   if (adminState) {
  //     setUser({
  //       uid: 'admin',
  //       displayName: 'Admin User',
  //       email: 'admin@campaignmaster.com',
  //       photoURL: '',
  //       createdCampaigns: [],
  //       joinedCampaigns: []
  //     });
  //   } else {
  //     setUser(null);
  //   }
  // };

  console.log('useAuth: Current state', { user: user?.displayName, isAdmin, loading });
  
  // Expose setAdminLogin through a custom event or context if needed
  // For now, we'll handle admin state in the LoginPage component
  return { user, isAdmin, loading };
}; 