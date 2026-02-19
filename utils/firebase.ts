import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration using environment variables with local fallbacks for development/production stability
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCaRyYnYbTm7mW-iVU5l1KRXVYOepF47fE',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'poker-a8c02.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'poker-a8c02',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'poker-a8c02.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '299655782711',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:299655782711:web:6c4b868fb675d06ffc7ab2',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-3W5F3KHZ83'
};

// Check if config is partially missing (though fallbacks handle most cases)
export const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
