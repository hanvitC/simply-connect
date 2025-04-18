import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string;
  phoneNumber: string;
}

export default function FriendsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
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
        // For test users, set mock friends data
        const mockFriends: Friend[] = [
          {
            id: 'test1',
            firstName: 'Test',
            lastName: 'Friend',
            profilePhotoUrl: '',
            phoneNumber: '+1234567890'
          },
          {
            id: 'test2',
            firstName: 'Sample',
            lastName: 'User',
            profilePhotoUrl: '',
            phoneNumber: '+1987654321'
          }
        ];
        
        setFriends(mockFriends);
        return;
      }
      
      // For real users, continue with Firebase queries
      const user = auth.currentUser;
      if (!user) {
        console.log('No authenticated user found');
        return;
      }
      
      // Find user by phone number
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', user.phoneNumber));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const connections = userData.connections || [];
        
        if (connections.length === 0) {
          console.log('User has no connections');
          setFriends([]);
          return;
        }
        
        // For now, just create mock friends since we don't have real data
        const mockFriends: Friend[] = [
          {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            profilePhotoUrl: '',
            phoneNumber: '+1234567890'
          },
          {
            id: '2',
            firstName: 'Jane',
            lastName: 'Smith',
            profilePhotoUrl: '',
            phoneNumber: '+1987654321'
          },
          {
            id: '3',
            firstName: 'Bob',
            lastName: 'Johnson',
            profilePhotoUrl: '',
            phoneNumber: '+1555555555'
          }
        ];
        
        setFriends(mockFriends);
      } else {
        console.log('User document not found');
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFriends();
    setRefreshing(false);
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity style={styles.friendCard}>
      <View style={styles.avatarContainer}>
        {item.profilePhotoUrl ? (
          <Image source={{ uri: item.profilePhotoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.firstName[0]}{item.lastName[0]}</Text>
          </View>
        )}
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.friendPhone}>{item.phoneNumber}</Text>
      </View>
    </TouchableOpacity>
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
      <Text style={styles.header}>Your Friends</Text>
      {friends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You don't have any friends yet.</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>Find Friends</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 20,
    color: '#333',
  },
  list: {
    paddingHorizontal: 20,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2E64E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  friendPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#2E64E5',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});