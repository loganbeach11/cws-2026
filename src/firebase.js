// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcqpRxn1HjlLxPXG2UrIMgmlgap1lQ-go",
  authDomain: "cws-2025.firebaseapp.com",
  databaseURL: "https://cws-2025-default-rtdb.firebaseio.com",
  projectId: "cws-2025",
  storageBucket: "cws-2025.firebasestorage.app",
  messagingSenderId: "1064257169035",
  appId: "1:1064257169035:web:3b06805e32a6d227d6968e",
  measurementId: "G-KQWBF1SN4N"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
