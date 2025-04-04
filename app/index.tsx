import { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import styles from '../styles/splashStyles';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current; // start transparent

  useEffect(() => {
    // Fade in the title
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000, // 1 second fade
      useNativeDriver: true,
    }).start();

    // Navigate to login after 2.5 seconds
    const timeout = setTimeout(() => {
      router.replace('/login');
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
        Simply Connect
      </Animated.Text>
    </View>
  );
}
