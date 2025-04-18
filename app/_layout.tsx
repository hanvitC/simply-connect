import { Stack, Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState, useContext } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppUserInfo {
  uid: string; // Firestore document ID
  phoneNumber: string | null;
  isTestUser: boolean;
}

interface AuthContextType {
  firebaseUser: User | null;
  appUser: AppUserInfo | null;
  loading: boolean;
}

// Auth context
const AuthContext = React.createContext<AuthContextType>({
  firebaseUser: null,
  appUser: null,
  loading: true
});

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth provider component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        // First check AsyncStorage for any existing user (test or real)
        const userInfoString = await AsyncStorage.getItem('appUserInfo');
        if (userInfoString && isMounted) {
          const storedInfo = JSON.parse(userInfoString) as AppUserInfo;
          console.log('[AuthProvider] Found stored user info:', storedInfo.uid);
          
          if (storedInfo.isTestUser) {
            console.log('[AuthProvider] Test user detected, skipping Firebase auth');
            setAppUser(storedInfo);
            setLoading(false);
            return;
          }
        }

        // For non-test users or no stored user, set up Firebase listener
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!isMounted) return;
          
          console.log('[AuthProvider] Firebase auth state changed:', user?.uid || 'null');
          setFirebaseUser(user);
          
          if (user) {
            try {
              // Get or create user document
              const userDocRef = doc(db, 'users', user.uid);
              const userDocSnap = await getDoc(userDocRef);
              
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const appUserInfo: AppUserInfo = {
                  uid: user.uid,
                  phoneNumber: userData.phoneNumber || user.phoneNumber,
                  isTestUser: false
                };
                setAppUser(appUserInfo);
                await AsyncStorage.setItem('appUserInfo', JSON.stringify(appUserInfo));
              } else {
                // This shouldn't happen as we create the document during signup,
                // but just in case create a basic user document
                const appUserInfo: AppUserInfo = {
                  uid: user.uid,
                  phoneNumber: user.phoneNumber,
                  isTestUser: false
                };
                setAppUser(appUserInfo);
                await AsyncStorage.setItem('appUserInfo', JSON.stringify(appUserInfo));
                await setDoc(userDocRef, {
                  phoneNumber: user.phoneNumber,
                  createdAt: serverTimestamp(),
                });
              }
            } catch (error) {
              console.error('[AuthProvider] Error setting up user document:', error);
              // Clear auth state on error to force re-auth
              await auth.signOut();
              setAppUser(null);
              await AsyncStorage.removeItem('appUserInfo');
            }
          } else {
            setAppUser(null);
            await AsyncStorage.removeItem('appUserInfo');
          }
          
          setLoading(false);
        });
      } catch (error) {
        console.error('[AuthProvider] Error in auth initialization:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Handle routing based on auth state, but only for initial auth group routing
  useEffect(() => {
    if (loading) {
      console.log('[AuthProvider] Still loading...');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!appUser && !inAuthGroup) {
      console.log('[AuthProvider] No user, redirecting to auth group');
      router.replace('/(auth)/login');
    } else if (appUser && inAuthGroup) {
      console.log('[AuthProvider] User found, redirecting to home');
      router.replace('/(tabs)/home');
    }
  }, [appUser, loading, segments[0]]);

  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, loading }}>
      {loading ? <Splash /> : children}
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}

// Simple splash screen component
function Splash() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2E64E5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
});
