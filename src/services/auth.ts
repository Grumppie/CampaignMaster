import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  deleteUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

const googleProvider = new GoogleAuthProvider();

// Google OAuth Authentication
export const signInWithGoogle = async (): Promise<{ user: any; isNewUser: boolean; email: string }> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const { user } = result;
    
    // Check if user exists in our Firestore database
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      // User exists, return user data
      const userData = userDoc.data() as User;
      return { 
        user: userData, 
        isNewUser: false, 
        email: user.email || '' 
      };
    } else {
      // User doesn't exist in our database, they need to complete registration
      return { 
        user: null, 
        isNewUser: true, 
        email: user.email || '' 
      };
    }
  } catch (error) {
    throw error;
  }
};

// Username/Password Registration
export const registerWithEmailAndPassword = async (
  username: string,
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  try {
    // Check if username is already taken
    const usernameQuery = query(
      collection(db, 'users'),
      where('username', '==', username)
    );
    const usernameSnapshot = await getDocs(usernameQuery);
    
    if (!usernameSnapshot.empty) {
      throw new Error('Username already taken');
    }

    // Check if email is already registered
    const emailQuery = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    const emailSnapshot = await getDocs(emailQuery);
    
    if (!emailSnapshot.empty) {
      throw new Error('Email already registered');
    }

    // Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update Firebase profile
    await updateProfile(firebaseUser, {
      displayName: displayName
    });

    // Create user document in Firestore
    const userData: Omit<User, 'id'> = {
      uid: firebaseUser.uid,
      username,
      displayName,
      email,
      photoURL: '',
      totalGlobalPoints: 0,
      totalGlobalAchievements: 0,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      createdCampaigns: [],
      joinedCampaigns: []
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    return userData as User;
  } catch (error) {
    throw error;
  }
};

// Unified Login (supports both username and email)
export const signInWithUsernameOrEmail = async (
  identifier: string,
  password: string
): Promise<User> => {
  try {
    let email: string;
    
    // Check if identifier is an email
    if (identifier.includes('@')) {
      email = identifier;
    } else {
      // Find user by username
      const usernameQuery = query(
        collection(db, 'users'),
        where('username', '==', identifier)
      );
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (usernameSnapshot.empty) {
        throw new Error('User not found');
      }

      const userDoc = usernameSnapshot.docs[0];
      const userData = userDoc.data() as User;
      email = userData.email;
    }

    // Sign in with Firebase using email and password
    const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data() as User;

    // Update last login time
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      lastLoginAt: new Date()
    });

    return {
      ...userData,
      lastLoginAt: new Date()
    } as User;
  } catch (error) {
    throw error;
  }
};

// Legacy function for backward compatibility
export const signInWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<User> => {
  return signInWithUsernameOrEmail(email, password);
};

// Password Reset
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

// Update User Profile
export const updateUserProfile = async (
  userId: string,
  updates: {
    displayName?: string;
    email?: string;
    photoURL?: string;
  }
): Promise<void> => {
  try {
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser || firebaseUser.uid !== userId) {
      throw new Error('Unauthorized');
    }

    // Update Firebase profile
    if (updates.displayName || updates.photoURL) {
      await updateProfile(firebaseUser, {
        displayName: updates.displayName,
        photoURL: updates.photoURL
      });
    }

    // Update Firestore user document
    const userRef = doc(db, 'users', userId);
    const updateData: any = {};
    
    if (updates.displayName) updateData.displayName = updates.displayName;
    if (updates.photoURL) updateData.photoURL = updates.photoURL;
    
    await updateDoc(userRef, updateData);

    // Update email if provided
    if (updates.email && updates.email !== firebaseUser.email) {
      await updateEmail(firebaseUser, updates.email);
      await updateDoc(userRef, { email: updates.email });
    }
  } catch (error) {
    throw error;
  }
};

// Change Password
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser || !firebaseUser.email) {
      throw new Error('No authenticated user');
    }

    // Re-authenticate user before changing password
    await firebaseSignInWithEmailAndPassword(auth, firebaseUser.email, currentPassword);
    
    // Change password
    await updatePassword(firebaseUser, newPassword);
  } catch (error) {
    throw error;
  }
};

// Delete User Account
export const deleteUserAccount = async (password: string): Promise<void> => {
  try {
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser || !firebaseUser.email) {
      throw new Error('No authenticated user');
    }

    // Re-authenticate user before deletion
    await firebaseSignInWithEmailAndPassword(auth, firebaseUser.email, password);
    
    // Delete user document from Firestore
    await deleteDoc(doc(db, 'users', firebaseUser.uid));
    
    // Delete Firebase user
    await deleteUser(firebaseUser);
  } catch (error) {
    throw error;
  }
};

// Get User Profile
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    return {
      ...userData,
      createdAt: userData.createdAt?.toDate() || new Date(),
      lastLoginAt: userData.lastLoginAt?.toDate() || new Date()
    } as User;
  } catch (error) {
    throw error;
  }
};

// Check if username is available
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  try {
    const usernameQuery = query(
      collection(db, 'users'),
      where('username', '==', username)
    );
    const usernameSnapshot = await getDocs(usernameQuery);
    return usernameSnapshot.empty;
  } catch (error) {
    throw error;
  }
};

// Check if email is available
export const isEmailAvailable = async (email: string): Promise<boolean> => {
  try {
    const emailQuery = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    const emailSnapshot = await getDocs(emailQuery);
    return emailSnapshot.empty;
  } catch (error) {
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Complete Google user registration
export const completeGoogleRegistration = async (
  username: string,
  displayName: string
): Promise<User> => {
  try {
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser || !firebaseUser.email) {
      throw new Error('No authenticated Google user');
    }

    // Check if username is already taken
    const usernameQuery = query(
      collection(db, 'users'),
      where('username', '==', username)
    );
    const usernameSnapshot = await getDocs(usernameQuery);
    
    if (!usernameSnapshot.empty) {
      throw new Error('Username already taken');
    }

    // Create user document in Firestore
    const userData: Omit<User, 'id'> = {
      uid: firebaseUser.uid,
      username,
      displayName,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL || '',
      totalGlobalPoints: 0,
      totalGlobalAchievements: 0,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      createdCampaigns: [],
      joinedCampaigns: []
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    return userData as User;
  } catch (error) {
    throw error;
  }
}; 