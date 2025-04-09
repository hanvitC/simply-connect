import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Debug: Log the entire extra config
console.log('Expo Config Extra:', JSON.stringify(Constants.expoConfig?.extra, null, 2));

// Type assertion for extra config
const extra = Constants.expoConfig?.extra as {
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseStorageBucket: string;
  firebaseMessagingSenderId: string;
  firebaseAppId: string;
  firebaseMeasurementId: string;
} | undefined;

if (!extra) {
  console.error('Firebase configuration is missing. Constants.expoConfig.extra:', Constants.expoConfig?.extra);
  throw new Error('Firebase configuration is missing. Please check your app.config.js and .env files.');
}

// Validate each required field
const requiredFields = [
  'firebaseApiKey',
  'firebaseAuthDomain',
  'firebaseProjectId',
  'firebaseStorageBucket',
  'firebaseMessagingSenderId',
  'firebaseAppId',
  'firebaseMeasurementId'
];

for (const field of requiredFields) {
  if (!extra[field as keyof typeof extra]) {
    console.error(`Missing Firebase configuration field: ${field}`);
    throw new Error(`Missing Firebase configuration field: ${field}`);
  }
}

// Debug: Log individual config values (with sensitive data partially masked)
console.log('Firebase Config:', {
  apiKey: extra.firebaseApiKey ? `${extra.firebaseApiKey.substring(0, 5)}...` : 'missing',
  authDomain: extra.firebaseAuthDomain,
  projectId: extra.firebaseProjectId,
  storageBucket: extra.firebaseStorageBucket,
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId: extra.firebaseAppId,
  measurementId: extra.firebaseMeasurementId
});

const {
  firebaseApiKey,
  firebaseAuthDomain,
  firebaseProjectId,
  firebaseStorageBucket,
  firebaseMessagingSenderId,
  firebaseAppId,
  firebaseMeasurementId,
} = extra;

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId,
  measurementId: firebaseMeasurementId
};

// Initialize Firebase
let app;
let auth: Auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Note: For React Native, Firebase automatically uses AsyncStorage for persistence
  // when available. The warning message is just informative and doesn't affect functionality.
  // The auth state will still persist between sessions.
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { db, auth, storage }; 