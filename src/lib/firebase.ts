import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCJA5ZjZHZE2t2Nhb38OuVdM_BZb-PSwQk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "solo-huellas.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "solo-huellas",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "solo-huellas.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "36509732220",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:36509732220:web:d532c612ad39d373c968f9",
};

// Initialize Firebase only if it hasn't been initialized yet and keys are present
let app;
let db: any;

if (firebaseConfig.apiKey) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
} else {
  console.warn("Firebase no está configurado. Faltan llaves en .env.local");
}

export { db };
