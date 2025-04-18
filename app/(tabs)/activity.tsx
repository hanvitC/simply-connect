import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { auth, db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';

interface ActivityItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  userId: string;
  userName: string;
  postId?: string;
  postText?: string;
  timestamp: Date;
  read: boolean;
}

export default function ActivityScreen() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // In a real app, you would fetch activities from Firestore
      // For now, we'll just create mock data
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'like',
          userId: 'user1',
          userName: 'John Doe',
          postId: 'post1',
          postText: 'This is a sample post',
          timestamp: new Date(),
          read: false,
        },
        {
          id: '2',
          type: 'comment',
          userId: 'user2',
          userName: 'Jane Smith',
          postId: 'post2',
          postText: 'Another sample post',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          read: false,
        },
        {
          id: '3',
          type: 'follow',
          userId: 'user3',
          userName: 'Bob Johnson',
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          read: true,
        },
        {
          id: '4',
          type: 'mention',
          userId: 'user4',
          userName: 'Alice Brown',
          postId: 'post3',
          postText: 'Hey @you check this out',
          timestamp: new Date(Date.now() - 172800000), // 2 days ago
          read: true,
        },
      ];
      
      setActivities(mockActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Ionicons name="heart" size={24} color="#FF3B30" />;
      case 'comment':
        return <Ionicons name="chatbubble" size={24} color="#007AFF" />;
      case 'follow':
        return <Ionicons name="person-add" size={24} color="#34C759" />;
      case 'mention':
        return <Ionicons name="at" size={24} color="#FF9500" />;
      default:
        return <Ionicons name="notifications" size={24} color="#2E64E5" />;
    }
  };

  const getActivityText = (item: ActivityItem) => {
    switch (item.type) {
      case 'like':
        return `${item.userName} liked your post`;
      case 'comment':
        return `${item.userName} commented on your post`;
      case 'follow':
        return `${item.userName} started following you`;
      case 'mention':
        return `${item.userName} mentioned you in a post`;
      default:
        return 'New activity';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d`;
    }
    
    return date.toLocaleDateString();
  };

  const renderActivityItem = ({ item }: { item: ActivityItem }) => (
    <TouchableOpacity style={[styles.activityItem, !item.read && styles.unreadItem]}>
      <View style={styles.iconContainer}>
        {getActivityIcon(item.type)}
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>{getActivityText(item)}</Text>
        {item.postText && (
          <Text style={styles.postText} numberOfLines={1}>
            "{item.postText}"
          </Text>
        )}
        <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
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
      <Text style={styles.header}>Activity</Text>
      {activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: '#f0f8ff',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  postText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E64E5',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
}); 