import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, useSegments } from 'expo-router';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const [isSplashScreen, setIsSplashScreen] = useState(true);

  // Handle splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashScreen(false);
    }, 3000); // 3 seconds to ensure splash screen is shown

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Skip authentication checks during splash screen
    if (isSplashScreen) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Check for mock user in test mode
      const mockUser = (window as any).mockUser;
      const isAuthenticated = user || mockUser;
      
      const inAuthGroup = segments[0] === 'login' || segments[0] === 'verify';

      if (!isAuthenticated && !inAuthGroup) {
        // Redirect to login if not authenticated
        router.replace('/login');
      } else if (isAuthenticated && inAuthGroup) {
        // Redirect to home if authenticated and trying to access auth screens
        router.replace('/home');
      }
    });

    return unsubscribe;
  }, [segments, isSplashScreen]);

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          gestureEnabled: false 
        }} 
      />
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
