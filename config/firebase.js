import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBbYTryGYwyHk-sNggEPCt9ByYJpVxUyN4",
  authDomain: "simply-connect-ab761.firebaseapp.com",
  projectId: "simply-connect-ab761",
  storageBucket: "simply-connect-ab761.firebasestorage.app",
  messagingSenderId: "417392137692",
  appId: "1:417392137692:web:772a3fb1e45b79dabbab19",
  measurementId: "G-8YNE253XGN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
