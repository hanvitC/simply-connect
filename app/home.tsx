import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
        
        // Get the user ID (either from Firebase auth or mock user)
        const userId = effectiveUser.uid || effectiveUser.phoneNumber?.replace(/[^a-zA-Z0-9]/g, '');
        
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            setUserData(data);
            
            // Fetch posts for the feed
            const { posts: feedPosts } = await fetchFeedPosts(userId);
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
      // Get the user ID (either from Firebase auth or mock user)
      const userId = user.uid || user.phoneNumber?.replace(/[^a-zA-Z0-9]/g, '');
      const { posts: feedPosts } = await fetchFeedPosts(userId);
      setPosts(feedPosts);
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear mock user if in test mode
      if ((window as any).mockUser) {
        (window as any).mockUser = null;
      }
      
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
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
