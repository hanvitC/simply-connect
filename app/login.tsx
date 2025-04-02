import { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../config/firebase';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import styles from '../styles/loginStyles';


export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const router = useRouter();

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Please enter a valid phone number');
      return;
    }

    try {
      const phoneNumber = phone.startsWith('+') ? phone : `+1${phone}`; // or use +44 etc.
      const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => {
          console.log('reCAPTCHA verified:', response);
        },
      });

      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);

      // Pass confirmation object to verify screen
      router.push({ pathname: '/verify', params: { phone: phoneNumber } });

      // Optionally store confirmation in global state or async storage
    } catch (error: any) {
      console.error(error);
      Alert.alert('Failed to send OTP', error.message);
    }
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
      />
      <TouchableOpacity style={styles.button} onPress={handleSendOTP}>
        <Text style={styles.buttonText}>Send OTP</Text>
      </TouchableOpacity>

      {/* Hidden recaptcha */}
      <View id="recaptcha-container" />
    </View>
  );
}
