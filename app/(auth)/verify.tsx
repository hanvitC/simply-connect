import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Test verification code for development
const TEST_VERIFICATION_CODE = '123456';

// Define the type for a test user
interface TestUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Define the type for the test users object
interface TestUsers {
  [phoneNumber: string]: TestUser;
}

// Test user data with proper typing
const TEST_USERS: TestUsers = {
  '+15555550100': {
    id: 'kYjKxkmyXeUkNLg9k6b2',
    firstName: 'Mary',
    lastName: 'Jones',
    email: 'maryjones@gmail.com'
  },
  '+19290000000': {
    id: 'H0QYE9ziY7z2C1XpuXPw',
    firstName: 'Jenny',
    lastName: 'Wan',
    email: 'jennywan@test.com'
  }
};

export default function VerifyScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { phone, isTestUser } = useLocalSearchParams();

  useEffect(() => {
    if (__DEV__ && isTestUser === 'true') {
      setCode(TEST_VERIFICATION_CODE);
    }
  }, [isTestUser]);

  const handleVerify = async () => {
    try {
      setLoading(true);
      console.log('Starting verification process');
      
      // For test users in development
      if (__DEV__ && isTestUser === 'true' && typeof phone === 'string') {
        if (code !== TEST_VERIFICATION_CODE) {
          throw new Error('Invalid verification code for test user');
        }
        
        const testUserData = TEST_USERS[phone];
        if (!testUserData) {
          throw new Error('Test user not found');
        }

        // Store user info in AsyncStorage
        const userInfo = {
          uid: testUserData.id,
          phoneNumber: phone,
          firstName: testUserData.firstName,
          lastName: testUserData.lastName,
          email: testUserData.email,
          isTestUser: true
        };
        
        await AsyncStorage.setItem('appUserInfo', JSON.stringify(userInfo));
        console.log('Stored test user info:', userInfo);
        
        // Create/update the test user document in Firestore if it doesn't exist
        const userRef = doc(db, 'users', testUserData.id);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            phoneNumber: phone,
            email: testUserData.email,
            firstName: testUserData.firstName,
            lastName: testUserData.lastName,
            profileURL: '',
            connections: [],
            birthday: new Date(),
            isTestUser: true,
            createdAt: serverTimestamp(),
          });
        }
        
        router.replace('/(tabs)/home');
        return;
      }

      // For real users
      try {
        const verificationId = (window as any).verificationId;
        if (!verificationId) {
          throw new Error('Verification session expired. Please try again.');
        }

        const credential = PhoneAuthProvider.credential(verificationId, code);
        const userCredential = await signInWithCredential(auth, credential);
        
        if (userCredential.user) {
          // Create/update user document
          const userRef = doc(db, 'users', userCredential.user.uid);
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            await setDoc(userRef, {
              phoneNumber: phone,
              email: '',
              firstName: '',
              lastName: '',
              profileURL: '',
              connections: [],
              birthday: new Date(),
              createdAt: serverTimestamp(),
            });
          }

          // Store minimal user info - the AuthProvider will handle the rest
          const userInfo = {
            uid: userCredential.user.uid,
            phoneNumber: phone,
            isTestUser: false
          };
          
          await AsyncStorage.setItem('appUserInfo', JSON.stringify(userInfo));
          
          // Clean up verification ID
          delete (window as any).verificationId;
          
          // Navigation will be handled by AuthProvider
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        if (error.code === 'auth/invalid-verification-code') {
          throw new Error('Invalid verification code. Please try again.');
        } else if (error.code === 'auth/code-expired') {
          throw new Error('Verification code has expired. Please request a new one.');
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert('Verification Failed', error.message);
      if (error.message.includes('expired')) {
        router.replace('/(auth)/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verification</Text>
        <Text style={styles.description}>
          We've sent a verification code to {phone}.
          Please enter the code below.
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Enter verification code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleVerify}
          disabled={loading || !code}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    letterSpacing: 2,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2E64E5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#2E64E5',
    fontSize: 14,
  },
});