import { collection, query, where, getDocs, orderBy, limit, startAfter, DocumentData, QueryDocumentSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Post } from '../types/Post';

// Convert Firestore document to Post object
const convertToPost = (doc: DocumentData): Post => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userID,
    caption: data.caption,
    imageUrl: data.imageURL,
    timestamp: data.timestamp.toDate(),
    likes: data.likes || 0,
    comments: data.comments || 0,
  };
};

// Fetch posts from users the current user follows
export const fetchFeedPosts = async (
  userId: string,
  lastPost?: QueryDocumentSnapshot,
  pageSize: number = 10
): Promise<{ posts: Post[]; lastDoc: QueryDocumentSnapshot | null }> => {
  try {
    // First, get the user's connections (followers)
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.data();
    
    if (!userData || !userData.connections) {
      return { posts: [], lastDoc: null };
    }
    
    const connections = userData.connections.filter((id: string) => id !== '');
    
    // If user has no connections, return empty array
    if (connections.length === 0) {
      return { posts: [], lastDoc: null };
    }
    
    // Create a query to fetch posts from connections
    let postsQuery = query(
      collection(db, 'posts'),
      where('userId', 'in', connections),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    
    // If we have a last document, start after it
    if (lastPost) {
      postsQuery = query(
        collection(db, 'posts'),
        where('userId', 'in', connections),
        orderBy('createdAt', 'desc'),
        startAfter(lastPost),
        limit(pageSize)
      );
    }
    
    const querySnapshot = await getDocs(postsQuery);
    const posts = querySnapshot.docs.map(convertToPost);
    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
    
    return { posts, lastDoc };
  } catch (error) {
    console.error('Error fetching feed posts:', error);
    return { posts: [], lastDoc: null };
  }
};

// Like a post
export const likePost = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDocSnap = await getDoc(postRef);
    
    if (!postDocSnap.exists()) {
      return false;
    }
    
    const postData = postDocSnap.data();
    const likes = postData?.likes || 0;
    
    await updateDoc(postRef, {
      likes: likes + 1,
      [`likedBy.${userId}`]: true
    });
    
    return true;
  } catch (error) {
    console.error('Error liking post:', error);
    return false;
  }
};

// Unlike a post
export const unlikePost = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDocSnap = await getDoc(postRef);
    
    if (!postDocSnap.exists()) {
      return false;
    }
    
    const postData = postDocSnap.data();
    const likes = postData?.likes || 0;
    
    await updateDoc(postRef, {
      likes: Math.max(0, likes - 1),
      [`likedBy.${userId}`]: false
    });
    
    return true;
  } catch (error) {
    console.error('Error unliking post:', error);
    return false;
  }
}; 