import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profileURL: string;
  connections: string[];
  birthday: Date;
}

interface Post {
  id: string;
  caption: string;
  imageURL: string;
  timestamp: Date;
  userID: string;
  likes?: number;
  comments?: number;
  userName?: string;
  userProfilePhoto?: string;
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // First check AsyncStorage for test user data
      const userInfoString = await AsyncStorage.getItem('appUserInfo');
      if (!userInfoString) {
        console.log('No user info found in AsyncStorage');
        return;
      }

      const userInfo = JSON.parse(userInfoString);
      console.log('Found user info:', userInfo);
      
      if (userInfo.isTestUser) {
        // For test users, set mock data
        setUserData({
          id: userInfo.uid,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          email: userInfo.email,
          phoneNumber: userInfo.phoneNumber,
          profileURL: '',
          connections: [],
          birthday: new Date(),
        });
        
        // Set mock posts for test users
        setPosts([
          {
            id: '1',
            caption: 'Welcome to Simply Connect!',
            imageURL: '',
            timestamp: new Date(),
            userID: userInfo.uid,
            likes: 0,
            comments: 0,
            userName: `${userInfo.firstName} ${userInfo.lastName}`,
            userProfilePhoto: ''
          }
        ]);
        return;
      }
      
      // For real users, continue with Firebase queries
      const user = auth.currentUser;
      if (!user) {
        console.log('No authenticated user found');
        return;
      }
      
      console.log('Fetching user data for:', user.phoneNumber);
      
      // Find user by phone number
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', user.phoneNumber));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data();
        
        setUserData({
          id: userDoc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          profileURL: data.profileURL || '',
          connections: data.connections || [],
          birthday: data.birthday ? data.birthday.toDate() : new Date(),
        });
        
        // After getting user data, fetch posts
        await fetchPosts(userDoc.id, data.connections || []);
      } else {
        console.log('User document not found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (userId: string, connections: string[]) => {
    try {
      const allUserIds = [userId, ...connections];
      const postsRef = collection(db, 'posts');
      
      // Query posts from the current user and connections
      const q = query(
        postsRef, 
        where('userID', 'in', allUserIds),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedPosts: Post[] = [];
      
      for (const postDoc of querySnapshot.docs) {
        const postData = postDoc.data();
        const postUserId = postData.userID;
        
        // Get user info for this post
        const userRef = doc(db, 'users', postUserId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : null;
        
        fetchedPosts.push({
          id: postDoc.id,
          caption: postData.caption || '',
          imageURL: postData.imageURL || '',
          timestamp: postData.timestamp ? postData.timestamp.toDate() : new Date(),
          userID: postData.userID,
          likes: postData.likes || 0,
          comments: postData.comments || 0,
          userName: userData ? `${userData.firstName} ${userData.lastName}` : 'Unknown User',
          userProfilePhoto: userData ? userData.profileURL : '',
        });
      }
      
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        {item.userProfilePhoto ? (
          <Image source={{ uri: item.userProfilePhoto }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImage} />
        )}
        <Text style={styles.userName}>{item.userName}</Text>
      </View>
      <Text style={styles.postText}>{item.caption}</Text>
      {item.imageURL && (
        <Image 
          source={{ uri: item.imageURL }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.postActions}>
        <Text style={styles.actionText}>💬 {item.comments || 0} comments</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E64E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>
        Welcome, {userData?.firstName ? `${userData.firstName} ${userData.lastName}` : 'User'}
      </Text>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingTop: 60,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    margin: 20,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 15,
  },
  postContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    marginRight: 10,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  postText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#ddd',
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionText: {
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});