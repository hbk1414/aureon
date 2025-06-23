import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBt1bxhVJy3syOwc1_kr6MWqRPwMPufAUk",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "aureonai"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aureonai",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "aureonai"}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:992983795082:web:d4b13fa56b263e72a5b473",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;