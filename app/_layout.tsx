import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, useSegments } from 'expo-router';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const inAuthGroup = segments[0] === 'login' || segments[0] === 'verify';

      if (!user && !inAuthGroup) {
        // Redirect to login if not authenticated
        router.replace('/login');
      } else if (user && inAuthGroup) {
        // Redirect to home if authenticated and trying to access auth screens
        router.replace('/home');
      }
    });

    return unsubscribe;
  }, [segments]);

  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen 
        name="verify" 
        options={{ 
          headerShown: false,
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen 
        name="home" 
        options={{ 
          title: 'Home',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="post" 
        options={{ 
          title: 'Post Details',
          headerShown: true 
        }} 
      />
    </Stack>
  );
}
