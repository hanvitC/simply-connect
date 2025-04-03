import { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../config/firebase';
import { signInWithPhoneNumber } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import styles from '../styles/loginStyles';

interface TestPhoneNumber {
  phone: string;
  otp: string;
}

// Firebase's official test phone number
const FIREBASE_TEST_PHONE = '+15555550100';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [testPhone, setTestPhone] = useState<TestPhoneNumber | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch test phone number from Firestore
    const fetchTestPhone = async () => {
      try {
        const testPhoneDoc = await getDoc(doc(db, 'testConfig', 'phone'));
        if (testPhoneDoc.exists()) {
          setTestPhone(testPhoneDoc.data() as TestPhoneNumber);
        }
      } catch (error) {
        console.error('Error fetching test phone:', error);
      }
    };

    fetchTestPhone();
  }, []);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting OTP send process');
      console.log('Phone number:', phone);

      const phoneNumber = phone.startsWith('+') ? phone : `+1${phone}`;
      console.log('Formatted phone number:', phoneNumber);
      
      // Check if this is a test phone number
      if (phoneNumber === FIREBASE_TEST_PHONE) {
        console.log('Using Firebase test phone number');
        // For test numbers, store the test OTP code (123456 is Firebase's test code)
        (window as any).testOTPCode = '123456';
        router.push({ pathname: '/verify', params: { phone: phoneNumber, isTest: 'true' } });
        return;
      }

      // For real numbers, send OTP
      console.log('Calling signInWithPhoneNumber');
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber);
      console.log('OTP sent successfully:', confirmation);
      
      // Store confirmation result globally
      (window as any).confirmationResult = confirmation;

      // Pass phone number to verify screen
      router.push({ pathname: '/verify', params: { phone: phoneNumber } });
    } catch (error: any) {
      console.error('Detailed OTP Error:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        fullError: error
      });
      
      if (error.code === 'auth/invalid-phone-number') {
        Alert.alert('Invalid Phone Number', 'Please enter a valid phone number.');
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert('Too Many Attempts', 'Please try again later.');
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else if (error.code === 'auth/argument-error') {
        Alert.alert('Invalid Format', 'Please enter a valid phone number with country code (e.g., +15555550100)');
      } else {
        Alert.alert('Failed to send OTP', `Error: ${error.message}\nCode: ${error.code}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseTestNumber = () => {
    setPhone(FIREBASE_TEST_PHONE);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Simply Connect</Text>
      <TextInput
        placeholder="Enter your phone number"
        placeholderTextColor="#888"
        style={styles.input}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        editable={!loading}
      />
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSendOTP}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send OTP'}
        </Text>
      </TouchableOpacity>

      {/* Development info */}
      <View style={styles.devInfoContainer}>
        <Text style={styles.devInfo}>
          For testing, use Firebase's test number:{'\n'}
          {FIREBASE_TEST_PHONE}
        </Text>
        <TouchableOpacity 
          style={[styles.testButton, loading && styles.buttonDisabled]} 
          onPress={handleUseTestNumber}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>Use Test Number</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
