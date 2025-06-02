import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebase";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteField,
  onSnapshot,
} from "firebase/firestore";

const TournamentContext = createContext();

export const TournamentProvider = ({ children }) => {
  const [games, setGames] = useState({});
  const [user, setUser] = useState(null);
  const [userPicks, setUserPicks] = useState({});

  const saveUserPick = async (userId, gameId, teamName) => {
    const userDocRef = doc(db, "userPicks", userId);

    if (teamName === null) {
      await updateDoc(userDocRef, {
        [gameId]: deleteField(),
      });
    } else {
await setDoc(userDocRef, { [gameId]: teamName }, { merge: true });
    }
  };

  const defaultGames = {};
  for (let i = 1; i <= 15; i++) {
    defaultGames[String(i)] = {
      team1: "",
      team2: "",
      winner: "",
      locked: false,
    };
  }

  useEffect(() => {
    const gamesRef = doc(db, "tournament", "games");

    const unsub = onSnapshot(gamesRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const cleaned = {};
        let changed = false;

	 for (const [id, game] of Object.entries(data)) {
          const { picked, team1, team2 } = game;
          const pickedName = game[picked];
          if (picked && pickedName === "TBD") {
            cleaned[id] = { ...game, picked: null };
            changed = true;
          } else {
            cleaned[id] = game;
          }
        }

        setGames(cleaned);
        if (changed) await setDoc(gamesRef, cleaned);
      } else {
        setGames(defaultGames);
        await setDoc(gamesRef, defaultGames);
      }
    });
     return () => unsub();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      console.log("Auth user set:", firebaseUser?.uid || "no user");
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, "userPicks", user.uid);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserPicks(docSnap.data());
      } else {
        setUserPicks({});
      }
    });

     return () => unsubscribe();
  }, [user]);

  const updateGame = async (id, updatedData) => {
    const gameRef = doc(db, "tournament", "games");
    const currentData = (await getDoc(gameRef)).data() || defaultGames;

    const newGames = {
      ...currentData,
      [id]: {
        ...currentData[id],
        ...updatedData,
      },
    };

    await setDoc(gameRef, newGames);
  };

    useEffect(() => {
  const updateAllUserScores = async () => {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const picksSnapshot = await getDocs(collection(db, "userPicks"));

    const picksData = {};
    picksSnapshot.forEach((doc) => {
      picksData[doc.id] = doc.data();
    });

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userPicks = picksData[uid] || {};
      let score = 0;

      Object.entries(userPicks).forEach(([gameId, pick]) => {
        const game = games[gameId];
        if (game?.winner && game.winner === pick) {
          score += 1;
        }
      });
	 const userRef = doc(db, "users", uid);
      const current = userDoc.data();
      if (current.score !== score) {
        await setDoc(userRef, { username: current.username || uid, score }, { merge: true });
      }
    }
  };

  if (Object.keys(games).length > 0) {
    updateAllUserScores();
  }
}, [games]);
    
  useEffect(() => {
    if (!user || !games || Object.keys(games).length === 0 || Object.keys(userPicks).length === 0) return;
    if (user.email === "loganbeach11@fake.com") return;

    const calculateScore = async () => {
      let score = 0;

      Object.entries(userPicks).forEach(([gameId, pick]) => {
        const game = games[gameId];
        if (game && game.winner && pick === game.winner) {
          score += 1;
        }
      });
const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const currentData = userSnap.exists() ? userSnap.data() : {};
      const currentUsername = currentData.username || user.uid;

      if (currentData.score !== score) {
        await setDoc(userRef, { username: currentUsername, score }, { merge: true });
      }
    };

    calculateScore();
  }, [games, userPicks, user]);

  return (
    <TournamentContext.Provider
      value={{
        games,
        updateGame,
        user,
        setUser,
        saveUserPick,
        userPicks,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};
export const useTournament = () => useContext(TournamentContext);
