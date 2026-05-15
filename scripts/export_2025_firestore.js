// scripts/export_2025_firestore.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/*
  This script exports 2025 Firestore data into:
  scripts/raw_2025_data/users.json
  scripts/raw_2025_data/userPicks.json
  scripts/raw_2025_data/games.json

  It signs in using your Firebase Auth admin account so Firestore rules allow reads.
*/

// Replace these with the values from your src/firebase.js config
const firebaseConfig = {
    apiKey: "AIzaSyBcqpRxn1HjlLxPXG2UrIMgmlgap1lQ-go",
    authDomain: "cws-2025.firebaseapp.com",
    databaseURL: "https://cws-2025-default-rtdb.firebaseio.com",
    projectId: "cws-2025",
    storageBucket: "cws-2025.firebasestorage.app",
    messagingSenderId: "1064257169035",
    appId: "1:1064257169035:web:3b06805e32a6d227d6968e",
    measurementId: "G-KQWBF1SN4N",
  };

const username = process.env.FIREBASE_EXPORT_USERNAME;
const password = process.env.FIREBASE_EXPORT_PASSWORD;

if (!username || !password) {
  console.error(
    "Missing login info. Run with FIREBASE_EXPORT_USERNAME and FIREBASE_EXPORT_PASSWORD."
  );
  process.exit(1);
}

const email = `${username}@fake.com`;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, "raw_2025_data");

function writeJson(filename, data) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`✅ Wrote ${outputPath}`);
}

async function exportUsers() {
  const snapshot = await getDocs(collection(db, "users"));

  return snapshot.docs.map((userDoc) => ({
    uid: userDoc.id,
    ...(userDoc.data() || {}),
  }));
}

async function exportUserPicks() {
  const snapshot = await getDocs(collection(db, "userPicks"));

  const picksByUser = {};

  snapshot.docs.forEach((pickDoc) => {
    picksByUser[pickDoc.id] = pickDoc.data() || {};
  });

  return picksByUser;
}

async function exportGames() {
  const gamesSnap = await getDoc(doc(db, "tournament", "games"));

  if (!gamesSnap.exists()) {
    throw new Error("Could not find tournament/games document.");
  }

  return gamesSnap.data() || {};
}

async function main() {
  console.log("Signing in...");
  await signInWithEmailAndPassword(auth, email, password);

  console.log("Exporting 2025 users...");
  const users = await exportUsers();

  console.log("Exporting 2025 user picks...");
  const userPicks = await exportUserPicks();

  console.log("Exporting 2025 games...");
  const games = await exportGames();

  writeJson("users.json", users);
  writeJson("userPicks.json", userPicks);
  writeJson("games.json", games);

  console.log("🎉 2025 Firestore export complete.");
}

main().catch((error) => {
  console.error("❌ Export failed:", error);
  process.exit(1);
});