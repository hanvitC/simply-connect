import { Redirect } from 'expo-router';

export default function AuthIndex() {
  // Redirect to login screen
  return <Redirect href="/login" />;
} 