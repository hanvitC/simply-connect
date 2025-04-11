import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import styles from '../styles/verifyStyles';
import { onAuthStateChanged } from 'firebase/auth';

export default function VerifyScreen() {
  const router = useRouter();
  const { phone, isTest } = useLocalSearchParams<{ phone: string; isTest?: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Verify Screen Mounted');
    console.log('Phone:', phone);
    console.log('Is Test:', isTest);
    
    if (!phone) {
      console.log('No phone number provided');
      return;
    }

    // For test numbers, auto-fill the code
    if (isTest === 'true') {
      console.log('Using test mode');
      const testOTPCode = (window as any).testOTPCode;
      console.log('Test OTP Code:', testOTPCode);
      if (testOTPCode) {
        setCode(testOTPCode);
      }
    }
  }, [phone, isTest]);

  const handleVerify = async () => {
    try {
      setLoading(true);
      console.log('Starting verification process');
      console.log('Current code:', code);
      console.log('Phone number:', phone);
      
      // For test numbers, verify directly
      if (isTest === 'true') {
        console.log('Using test verification');
        const testOTPCode = (window as any).testOTPCode;
        console.log('Test OTP Code:', testOTPCode);
        
        if (code === testOTPCode) {
          console.log('Test verification successful');
          
          // Search for existing user document by phone number
          console.log('Searching for existing user document by phone number:', phone);
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('phoneNumber', '==', phone));
          const querySnapshot = await getDocs(q);

          let userRef;
          if (!querySnapshot.empty) {
            // User exists, use the existing document ID
            const existingDoc = querySnapshot.docs[0];
            userRef = doc(db, 'users', existingDoc.id);
            console.log('Found existing user document:', {
              id: existingDoc.id,
              data: existingDoc.data()
            });
          } else {
            // User doesn't exist, create new document
            const newUserId = phone.replace(/[^a-zA-Z0-9]/g, ''); // Create a clean ID from phone number
            userRef = doc(db, 'users', newUserId);
            console.log('No existing user found, creating new document with ID:', newUserId);
          }

          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            console.log('Creating new user in Firestore');
            await setDoc(userRef, {
              phoneNumber: phone,
              email: '',
              firstName: '',
              lastName: '',
              profilePhotoUrl: '',
              connections: [''],
            });
            console.log('New user created in Firestore');
          } else {
            console.log('User already exists in Firestore');
            console.log('Existing user data:', userSnap.data());
          }

          // For test mode, we can directly set the auth state
          const testUser = {
            uid: userRef.id,
            phoneNumber: phone,
            email: '',
            displayName: '',
            photoURL: '',
            emailVerified: true,
            isAnonymous: false,
            metadata: {
              creationTime: new Date().toISOString(),
              lastSignInTime: new Date().toISOString()
            },
            // Add necessary Firebase auth methods
            getIdToken: async () => 'test-token',
            _stopProactiveRefresh: () => {},
            _startProactiveRefresh: () => {},
            delete: async () => {},
            getIdTokenResult: async () => ({ token: 'test-token' }),
            reload: async () => {},
            toJSON: () => ({ uid: userRef.id, phoneNumber: phone })
          };
          
          // Set the test user in auth state
          (auth as any).currentUser = testUser;
          console.log('Test user set in auth state');

          // Wait for auth state to actually change
          await new Promise<void>((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
              if (user) {
                console.log('Test auth state updated, user authenticated');
                unsubscribe();
                resolve();
              }
            });
          });

          console.log('Redirecting to home screen');
          router.replace('/home');
          return;
        } else {
          throw new Error('Invalid test OTP code');
        }
      }

      // For real numbers, verify with Firebase
      const confirmation = (window as any).confirmationResult;
      if (!confirmation) {
        console.log('No confirmation available');
        Alert.alert('Confirmation not ready', 'Please try sending OTP again');
        router.back();
        return;
      }

      console.log('Confirming OTP with Firebase');
      const result = await confirmation.confirm(code);
      console.log('Verification successful:', result);
      
      const { uid, phoneNumber } = result.user;
      console.log('User details:', { uid, phoneNumber });

      // Search for existing user document by phone number
      console.log('Searching for existing user document by phone number:', phoneNumber);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
      const querySnapshot = await getDocs(q);

      let userRef;
      if (!querySnapshot.empty) {
        // User exists, use the existing document ID
        const existingDoc = querySnapshot.docs[0];
        userRef = doc(db, 'users', existingDoc.id);
        console.log('Found existing user document:', {
          id: existingDoc.id,
          data: existingDoc.data()
        });
      } else {
        // User doesn't exist, create new document with the auth UID
        userRef = doc(db, 'users', uid);
        console.log('No existing user found, creating new document with auth UID:', uid);
      }

      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        console.log('Creating new user in Firestore');
        await setDoc(userRef, {
          phoneNumber,
          email: '',
          firstName: '',
          lastName: '',
          profilePhotoUrl: '',
          connections: [''],
        });
        console.log('New user created in Firestore');
      } else {
        console.log('User already exists in Firestore');
        console.log('Existing user data:', userSnap.data());
      }

      // Wait for auth state to actually change
      await new Promise<void>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            console.log('Auth state updated, user authenticated');
            unsubscribe();
            resolve();
          }
        });
      });

      console.log('Redirecting to home screen');
      router.replace('/home');
      
    } catch (error: any) {
      console.error('Detailed verification error:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        fullError: error
      });
      
      if (error.code === 'auth/invalid-verification-code') {
        Alert.alert('Invalid Code', 'Please enter the correct verification code.');
      } else if (error.code === 'auth/code-expired') {
        Alert.alert('Code Expired', 'Please request a new code.');
      } else if (error.code === 'auth/argument-error') {
        Alert.alert('Invalid Format', 'Please enter a valid verification code.');
      } else {
        Alert.alert('Verification Failed', `Error: ${error.message}\nCode: ${error.code}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter the 6-digit code</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        editable={!loading}
      />
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleVerify}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Processing...' : 'Verify'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
