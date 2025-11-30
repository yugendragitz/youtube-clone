// youtube/src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase config for your project (use the values from your Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyCeBZepMcqUN7Gmrph1eXgvCvbl6dO0x8Q",
  authDomain: "clone-9caba.firebaseapp.com",
  projectId: "clone-9caba",
  storageBucket: "clone-9caba.firebasestorage.app",
  messagingSenderId: "521022390386",
  appId: "1:521022390386:web:29289c4de25f07ceb802eb",
  measurementId: "G-TBKBDN7VX6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
