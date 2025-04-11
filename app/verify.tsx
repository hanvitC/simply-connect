import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styles from '../styles/verifyStyles';

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
      
      // For test numbers, verify directly
      if (isTest === 'true') {
        console.log('Using test verification');
        const testOTPCode = (window as any).testOTPCode;
        console.log('Test OTP Code:', testOTPCode);
        
        if (code === testOTPCode) {
          console.log('Test verification successful');
          
          // For test users, we need to create a mock user object
          const mockUser = {
            uid: phone.replace(/[^a-zA-Z0-9]/g, ''), // Create a clean ID from phone number
            phoneNumber: phone
          };
          
          // Set the mock user in auth state
          (window as any).mockUser = mockUser;
          
          // Check if user exists in Firestore
          const userRef = doc(db, 'users', mockUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            console.log('Creating new test user in Firestore');
            // Create new user with the same structure as existing users
            await setDoc(userRef, {
              phoneNumber: phone,
              email: '',
              firstName: '',
              lastName: '',
              profilePhotoUrl: '',
              connections: [''],
            });
          } else {
            console.log('User already exists in Firestore');
          }

          // Ensure auth state is updated before redirecting
          console.log('Waiting for auth state to update...');
          setTimeout(() => {
            console.log('Redirecting to home screen');
            router.replace('/home');
          }, 1000);
          
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

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', uid);
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
      } else {
        console.log('User already exists in Firestore');
      }

      // Ensure auth state is updated before redirecting
      console.log('Waiting for auth state to update...');
      setTimeout(() => {
        console.log('Redirecting to home screen');
        router.replace('/home');
      }, 1000);
      
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
