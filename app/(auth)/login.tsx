import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, firebaseConfig } from '../../config/firebase';
import { PhoneAuthProvider } from 'firebase/auth';
import RecaptchaVerifier from '../../components/RecaptchaVerifier';
import type { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';

const TEST_PHONE_NUMBERS = {
  ALWAYS_SUCCESS: '+16505551234',  // Firebase's test number that always succeeds
  ALWAYS_FAIL: '+16505550123'      // Firebase's test number that always fails
};

// Add test user constants
const TEST_USERS = {
  MARY: {
    phoneNumber: '+15555550100',
    id: 'kYjKxkmyXeUkNLg9k6b2',
    firstName: 'Mary',
    lastName: 'Jones',
    email: 'maryjones@gmail.com'
  },
  JENNY: {
    phoneNumber: '+19290000000',
    id: 'H0QYE9ziY7z2C1XpuXPw',
    firstName: 'Jenny',
    lastName: 'Wan',
    email: 'jennywan@test.com'
  }
};

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const router = useRouter();

  const handleSendVerificationCode = async () => {
    try {
      setLoading(true);
      
      if (!phoneNumber) {
        Alert.alert('Error', 'Please enter a phone number');
        return;
      }

      // Clean up any existing verification ID
      delete (window as any).verificationId;

      // Check if this is a test user phone number
      const isTestUser = Object.values(TEST_USERS).some(user => user.phoneNumber === phoneNumber);
      
      if (__DEV__ && isTestUser) {
        console.log('Using test user flow for:', phoneNumber);
        // For test users, we'll skip actual Firebase verification
        router.push({
          pathname: "/verify",
          params: { 
            phone: phoneNumber,
            isTestUser: 'true'
          }
        });
        return;
      }

      // For real users, continue with Firebase phone auth
      if (!recaptchaVerifier.current) {
        throw new Error('reCAPTCHA verification failed. Please try again.');
      }

      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current
      );
      
      // Store verification ID in a way that's accessible to the verify screen
      (window as any).verificationId = verificationId;
      
      router.push({
        pathname: "/verify",
        params: { phone: phoneNumber }
      });
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      if (error.code === 'auth/invalid-phone-number') {
        Alert.alert('Error', 'Please enter a valid phone number in international format (e.g. +1234567890).');
      } else if (error.code === 'auth/missing-phone-number') {
        Alert.alert('Error', 'Please enter a phone number.');
      } else if (error.code === 'auth/quota-exceeded') {
        Alert.alert('Error', 'Too many attempts. Please try again later.');
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert('Error', 'Too many requests. Please try again later.');
      } else if (error.code === 'auth/captcha-check-failed') {
        Alert.alert('Error', 'CAPTCHA verification failed. Please try again.');
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert('Error', 'Network error. Please check your connection and try again.');
      } else {
        Alert.alert('Error', 'Failed to send verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <RecaptchaVerifier
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
      />
      
      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
        
        {__DEV__ && (
          <View style={styles.devInfoContainer}>
            <Text style={styles.devInfo}>Development Mode: Test Users</Text>
            <TouchableOpacity 
              style={styles.testButton}
              onPress={() => setPhoneNumber(TEST_USERS.MARY.phoneNumber)}
            >
              <Text style={styles.testButtonText}>Login as Mary Jones</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.testButton}
              onPress={() => setPhoneNumber(TEST_USERS.JENNY.phoneNumber)}
            >
              <Text style={styles.testButtonText}>Login as Jenny Wan</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 234 567 8900"
            placeholderTextColor="#999"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.button, !phoneNumber && styles.buttonDisabled]}
          onPress={handleSendVerificationCode}
          disabled={loading || !phoneNumber}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Send Verification Code</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.info}>
          We'll send you a verification code to confirm your phone number.
        </Text>
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
  formContainer: {
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#2E64E5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  devInfoContainer: {
    marginBottom: 20,
  },
  devInfo: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: '#2E64E5',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});