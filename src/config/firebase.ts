import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Debug: Check if environment variables are loading
console.log('Firebase Config Debug:', {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? '✅ Loaded' : '❌ Missing',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '✅ Loaded' : '❌ Missing',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✅ Loaded' : '❌ Missing',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? '✅ Loaded' : '❌ Missing',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? '✅ Loaded' : '❌ Missing',
  appId: process.env.REACT_APP_FIREBASE_APP_ID ? '✅ Loaded' : '❌ Missing'
});

// Temporary hardcoded config for testing
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 