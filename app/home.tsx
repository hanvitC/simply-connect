import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Post } from '../types/Post';
import { fetchFeedPosts } from '../services/postService';
import PostCard from '../components/PostCard';

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profilePhotoUrl: string;
  connections: string[];
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      // Check for mock user in test mode
      const mockUser = (window as any).mockUser;
      const effectiveUser = currentUser || mockUser;
      
      if (effectiveUser) {
        setUser(effectiveUser);
        
        try {
          // First, try to find the user document by phone number
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('phoneNumber', '==', effectiveUser.phoneNumber));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            // User exists, use the existing document
            const userDoc = querySnapshot.docs[0];
            const data = userDoc.data() as UserData;
            setUserData(data);
            
            // Fetch posts for the feed using the document ID
            const { posts: feedPosts } = await fetchFeedPosts(userDoc.id);
            setPosts(feedPosts);
          } else {
            console.error('User document not found');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // If no user, redirect to login
        router.replace('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRefresh = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      // Find the user document by phone number
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', user.phoneNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const { posts: feedPosts } = await fetchFeedPosts(userDoc.id);
        setPosts(feedPosts);
      }
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      console.log('Attempting to sign out');
      
      // Check if we're in test mode
      const isTest = (window as any).isTest === 'true';
      
      if (isTest) {
        // For test users, just clear the auth state
        console.log('Clearing test user auth state');
        (auth as any).currentUser = null;
        // Trigger auth state change
        auth.onAuthStateChanged(() => {});
      } else {
        // For real users, use Firebase signOut
        console.log('Signing out with Firebase');
        await signOut(auth);
      }
      
      console.log('Sign out successful');
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Logout Failed', 'There was an error signing out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    // Implement like functionality
    console.log('Like post:', postId);
  };

  const handleComment = (postId: string) => {
    // Implement comment functionality
    console.log('Comment on post:', postId);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const displayName = userData 
    ? `${userData.firstName} ${userData.lastName}`.trim() 
    : user?.phoneNumber || 'User';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {displayName}
        </Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={handleLike}
            onComment={handleComment}
          />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.postList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 16,
  },
  postList: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
