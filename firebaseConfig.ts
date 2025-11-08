
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC2MejNNlmLfYWzVDu-YqexSyaSxI6qBm0",
  authDomain: "gemini-vibeathon.firebaseapp.com",
  projectId: "gemini-vibeathon",
  storageBucket: "gemini-vibeathon.firebasestorage.app",
  messagingSenderId: "1037445186151",
  appId: "1:1037445186151:web:4728938f6357c8045e8ac2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
