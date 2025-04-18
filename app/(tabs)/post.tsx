import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert, ScrollView } from 'react-native';
import { auth, db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';

export default function PostScreen() {
  const [caption, setText] = useState('');
  const [imageURL, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!caption.trim() && !imageURL.trim()) {
      Alert.alert('Error', 'Please enter some text or add an image for your post.');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a post.');
        return;
      }

      // Create a new post document
      const postsRef = collection(db, 'posts');
      await addDoc(postsRef, {
        userID: user.uid,
        caption: caption.trim(),
        imageURL: imageURL.trim() || null,
        timestamp: serverTimestamp(),
        comments: 0,
      });

      // Reset form
      setText('');
      setImageUrl('');
      
      Alert.alert('Success', 'Your post has been created!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    // In a real app, you would integrate with image picker
    // For now, we'll just use a placeholder URL
    setImageUrl('https://via.placeholder.com/300');
    Alert.alert('Image Added', 'In a real app, this would open an image picker.');
  };

  const handleRemoveImage = () => {
    setImageUrl('');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Create a Post</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="What's on your mind?"
          multiline
          value={caption}
          onChangeText={setText}
          maxLength={500}
        />
        
        {imageURL ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageURL }} style={styles.imagePreview} />
            <TouchableOpacity 
              style={styles.removeImageButton} 
              onPress={handleRemoveImage}
            >
              <AntDesign name="closecircle" size={24} color="#ff4d4d" />
            </TouchableOpacity>
          </View>
        ) : null}
        
        <Text style={styles.characterCount}>
          {caption.length}/500 characters
        </Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.mediaButton} 
          onPress={handleAddImage}
        >
          <MaterialIcons name="add-photo-alternate" size={24} color="#2E64E5" />
          <Text style={styles.mediaButtonText}>Add Image</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.postButton, (!caption.trim() && !imageURL) && styles.postButtonDisabled]} 
        onPress={handlePost}
        disabled={loading || (!caption.trim() && !imageURL)}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.postButtonText}>Post</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  textInput: {
    minHeight: 100,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#888',
    marginTop: 10,
  },
  imagePreviewContainer: {
    marginTop: 15,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  mediaButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#2E64E5',
  },
  postButton: {
    backgroundColor: '#2E64E5',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#91aade',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});