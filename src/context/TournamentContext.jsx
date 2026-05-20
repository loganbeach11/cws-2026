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
  collection,
  getDocs,
} from "firebase/firestore";

const TournamentContext = createContext();

export const TournamentProvider = ({ children, viewUserId = null }) => {
  const [games, setGames] = useState({});
  const [gamesLoaded, setGamesLoaded] = useState(false);

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [userPicks, setUserPicks] = useState({});
  const [userPicksLoaded, setUserPicksLoaded] = useState(false);

  const saveUserPick = async (userId, gameId, teamName) => {
    const userDocRef = doc(db, "userPicks", userId);

    if (teamName === null) {
      await updateDoc(userDocRef, { [gameId]: deleteField() }).catch(
        async () => {
          // If missing, ensure the doc exists so later updates don't fail silently
          await setDoc(userDocRef, {});
        }
      );
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
      ...(i === 15 && { champion: "TBD" }),
    };
  }

  // Track logged-in user first.
  // This prevents Firestore listeners from starting before Auth is ready
  // on a brand-new device/browser.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setAuthReady(true);
      console.log("Auth user set:", firebaseUser?.uid || "no user");
    });

    return () => unsubscribe();
  }, []);

 // Load/seed games (2025)
useEffect(() => {
  if (!authReady || !user) {
    setGamesLoaded(false);
    return;
  }
  let unsubscribe = null;
  let cancelled = false;

  const gamesDocRef = doc(db, "tournament", "games");

  const loadGames = async () => {
    try {
      setGamesLoaded(false);

      // First do a one-time fetch so the past bracket does not get stuck
      // waiting on the first snapshot on a new browser/device.
      const docSnap = await getDoc(gamesDocRef);

      if (cancelled) return;

      if (docSnap.exists()) {
        setGames(docSnap.data() || {});
        setGamesLoaded(true);
      } else {
        await setDoc(gamesDocRef, defaultGames);
        if (cancelled) return;

        setGames(defaultGames);
        setGamesLoaded(true);
      }

      // Then attach the live listener after the first successful load.
      unsubscribe = onSnapshot(
        gamesDocRef,
        (snap) => {
          if (snap.exists()) {
            setGames(snap.data() || {});
          }
        },
        (error) => {
          console.error("2025 games snapshot error:", error);
        }
      );
    } catch (error) {
      console.error("2025 games initial load error:", error);
      if (!cancelled) {
        setGames({});
        setGamesLoaded(true);
      }
    }
  };

  loadGames();

  return () => {
    cancelled = true;
    if (unsubscribe) unsubscribe();
  };
}, [authReady, user?.uid]);

  // Load this user's picks, or Brandon's picks if viewUserId is passed.
// Load this user's picks, or Brandon's picks if viewUserId is passed.
useEffect(() => {
  if (!authReady || !user) {
    setUserPicks({});
    setUserPicksLoaded(false);
    return;
  }

  const uidToUse = viewUserId ?? user?.uid;

  if (!uidToUse) {
    setUserPicks({});
    setUserPicksLoaded(false);
    return;
  }

  let unsubscribe = null;
  let cancelled = false;

  const userDocRef = doc(db, "userPicks", uidToUse);

  const loadUserPicks = async () => {
    try {
      setUserPicksLoaded(false);

      // First do a one-time fetch so first-time browser loads work.
      const docSnap = await getDoc(userDocRef);

      if (cancelled) return;

      setUserPicks(docSnap.exists() ? docSnap.data() : {});
      setUserPicksLoaded(true);

      // Then attach the live listener.
      unsubscribe = onSnapshot(
        userDocRef,
        (snap) => {
          setUserPicks(snap.exists() ? snap.data() : {});
          setUserPicksLoaded(true);
        },
        (err) => {
          console.error("userPicks onSnapshot error:", err);
          setUserPicks({});
          setUserPicksLoaded(true);
        }
      );
    } catch (error) {
      console.error("userPicks initial load error:", error);

      if (!cancelled) {
        setUserPicks({});
        setUserPicksLoaded(true);
      }
    }
  };

  loadUserPicks();

  return () => {
    cancelled = true;
    if (unsubscribe) unsubscribe();
  };
}, [authReady, viewUserId, user?.uid]);

  // Admin/general update to a specific game field(s)
  const updateGame = async (id, updatedData) => {
    const gamesDocRef = doc(db, "tournament", "games");

    await setDoc(
      gamesDocRef,
      {
        [id]: {
          ...games[id],
          ...updatedData,
        },
      },
      { merge: true }
    );
  };

  // Batch: recompute & persist everyone’s scores (runs when games change)
  useEffect(() => {
    const updateAllUserScores = async () => {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const picksSnapshot = await getDocs(collection(db, "userPicks"));

      const picksByUid = {};

      picksSnapshot.forEach((d) => {
        picksByUid[d.id] = d.data() || {};
      });

      for (const userDoc of usersSnapshot.docs) {
        const uid = userDoc.id;
        const udata = userDoc.data() || {};
        const username = (udata.username || uid).toString().trim();

        let raw = 0;
        const userPicksForUser = picksByUid[uid] || {};

        Object.entries(userPicksForUser).forEach(([gid, pick]) => {
          const g = games[gid];
          if (g?.winner && pick === g.winner) raw += 1;
        });

        const adjusted = raw;

        if (udata.score !== adjusted) {
          const userRef = doc(db, "users", uid);

          try {
            await updateDoc(userRef, { score: adjusted });
          } catch {
            await setDoc(
              userRef,
              { username, score: adjusted },
              { merge: true }
            );
          }
        }
      }
    };

    if (authReady && gamesLoaded && Object.keys(games).length > 0) {
      updateAllUserScores();
    }
  }, [authReady, games, gamesLoaded]);

  // Keep this user’s score synced
  useEffect(() => {
    if (
      !authReady ||
      !user ||
      !gamesLoaded ||
      !games ||
      Object.keys(games).length === 0
    ) {
      return;
    }

    if (user.email === "loganbeach11@fake.com") return;

    const syncMyScore = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const current = userSnap.exists() ? userSnap.data() : {};
      const username = current.username || user.uid;

      let raw = 0;

      Object.entries(userPicks || {}).forEach(([gid, pick]) => {
        const g = games[gid];
        if (g?.winner && pick === g.winner) raw += 1;
      });

      const adjusted = raw;

      if (current.score !== adjusted) {
        await setDoc(userRef, { username, score: adjusted }, { merge: true });
      }
    };

    syncMyScore();
  }, [authReady, games, gamesLoaded, userPicks, user]);

  return (
    <TournamentContext.Provider
      value={{
        games,
        gamesLoaded,
        userPicksLoaded,
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