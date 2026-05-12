// src/context/Tournament2026Context.jsx
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

const Tournament2026Context = createContext();

export const Tournament2026Provider = ({ children }) => {
  const [games, setGames] = useState({});
  const [user, setUser] = useState(null);
  const [userPicks, setUserPicks] = useState({});
  const [lockStatus, setLockStatus] = useState({});
  const [tournamentComplete, setTournamentComplete] = useState(false);

  /*
    MANUAL TIEBREAKER ADJUSTMENTS

    If the tournament ends in a tie, put the winner here and give them 0.5.

    Best option: use their Firebase UID because it never changes.
    Example:
    const tiebreakerAdjustments = {
      "abc123FirebaseUid": 0.5,
    };

    Backup option: use their username exactly as it appears in Firestore.
    Example:
    const tiebreakerAdjustments = {
      "Brandon_Beach_FTW": 0.5,
    };

    Leave this empty until you actually need it.
  */
  const tiebreakerAdjustments = {
    // "USER_FIREBASE_UID_OR_USERNAME": 0.5,
  };

  const getTiebreakerAdjustment = (uid, username) => {
    return tiebreakerAdjustments[uid] || tiebreakerAdjustments[username] || 0;
  };

  const defaultGames = {};
  for (let i = 1; i <= 15; i++) {
    defaultGames[String(i)] = {
      team1: "TBD",
      team2: "TBD",
      winner: "",
      locked: false,
      ...(i === 15 && { champion: "TBD" }),
    };
  }

  // Subscribe to 2026 games doc; seed if missing or empty
  useEffect(() => {
    const gamesDocRef = doc(db, "tournament2026", "games");

    const unsubscribe = onSnapshot(
      gamesDocRef,
      async (docSnap) => {
        const data = docSnap.exists() ? docSnap.data() || {} : null;
        const isMissingOrEmpty = !data || Object.keys(data).length === 0;

        if (isMissingOrEmpty) {
          try {
            await setDoc(gamesDocRef, defaultGames);
            setGames(defaultGames);
          } catch (e) {
            console.error("Failed to seed 2026 games:", e);
            setGames({});
          }
        } else {
          setGames(data);
        }
      },
      (err) => {
        console.error("2026 games snapshot error:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to 2026 tournament complete setting
  useEffect(() => {
    const configRef = doc(db, "config", "tournament2026");

    const unsubscribe = onSnapshot(
      configRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          setTournamentComplete(docSnap.data().complete === true);
        } else {
          await setDoc(configRef, { complete: false }, { merge: true });
          setTournamentComplete(false);
        }
      },
      (err) => {
        console.error("2026 tournament config snapshot error:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateTournamentComplete = async (complete) => {
    const configRef = doc(db, "config", "tournament2026");
    await setDoc(configRef, { complete }, { merge: true });
  };

  // Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to this user's 2026 picks
  useEffect(() => {
    if (!user) {
      setUserPicks({});
      return;
    }

    const userDocRef = doc(db, "userPicks2026", user.uid);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      setUserPicks(docSnap.exists() ? docSnap.data() : {});
    });

    return () => unsubscribe();
  }, [user]);

  const saveUserPick = async (userId, gameId, teamName) => {
    const userDocRef = doc(db, "userPicks2026", userId);

    if (teamName === null) {
      await updateDoc(userDocRef, { [gameId]: deleteField() }).catch(
        async () => {
          // If doc doesn't exist yet, nothing to delete — ensure doc exists to avoid future errors
          await setDoc(userDocRef, {});
        }
      );
    } else {
      await setDoc(userDocRef, { [gameId]: teamName }, { merge: true });
    }
  };

  // Admin/general update to a specific game field(s) in 2026 doc
  const updateGame = async (id, updatedData) => {
    const gamesDocRef = doc(db, "tournament2026", "games");

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

  const calculateRawScore = (picks) => {
    let rawScore = 0;

    Object.entries(picks || {}).forEach(([gameId, pick]) => {
      const game = games[gameId];

      if (game?.winner && game.winner === pick) {
        rawScore += 1;
      }
    });

    return rawScore;
  };

  const calculateAdjustedScore = (uid, username, picks) => {
    const rawScore = calculateRawScore(picks);
    const adjustment = getTiebreakerAdjustment(uid, username);

    return rawScore + adjustment;
  };

  // Recalculate & persist 2026 scores
  useEffect(() => {
    const updateAllUserScores = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users2026"));
        const picksSnapshot = await getDocs(collection(db, "userPicks2026"));

        const picksData = {};
        picksSnapshot.forEach((d) => {
          picksData[d.id] = d.data();
        });

        for (const userDoc of usersSnapshot.docs) {
          const uid = userDoc.id;
          const current = userDoc.data();
          const currentUsername = current.username || uid;
          const currentUserPicks = picksData[uid] || {};

          const adjustedScore = calculateAdjustedScore(
            uid,
            currentUsername,
            currentUserPicks
          );

          const userRef = doc(db, "users2026", uid);

          if (current.score !== adjustedScore) {
            try {
              await updateDoc(userRef, {
                username: currentUsername,
                score: adjustedScore,
              });
            } catch {
              await setDoc(
                userRef,
                {
                  username: currentUsername,
                  score: adjustedScore,
                },
                { merge: true }
              );
            }
          }
        }
      } catch (e) {
        console.error("Failed to update all 2026 user scores:", e);
      }
    };

    if (Object.keys(games).length > 0) {
      updateAllUserScores();
    }
  }, [games]);

  // Keep this user's 2026 score updated on their doc
  useEffect(() => {
    const syncMyScore = async () => {
      if (!user || !games || Object.keys(games).length === 0) return;

      try {
        const userRef = doc(db, "users2026", user.uid);
        const userSnap = await getDoc(userRef);
        const currentData = userSnap.exists() ? userSnap.data() : {};

        const currentUsername =
          currentData.username || user.displayName || user.email || user.uid;

        const adjustedScore = calculateAdjustedScore(
          user.uid,
          currentUsername,
          userPicks
        );

        if (currentData.score !== adjustedScore) {
          await setDoc(
            userRef,
            {
              username: currentUsername,
              score: adjustedScore,
            },
            { merge: true }
          );
        }
      } catch (e) {
        console.error("Failed to sync current 2026 user score:", e);
      }
    };

    syncMyScore();
  }, [games, userPicks, user]);

  return (
    <Tournament2026Context.Provider
      value={{
        games,
        setGames,
        updateGame,

        user,
        currentUser: user,
        setUser,

        saveUserPick,
        userPicks,

        lockStatus,
        setLockStatus,

        tournamentComplete,
        setTournamentComplete,
        updateTournamentComplete,

        tiebreakerAdjustments,
      }}
    >
      {children}
    </Tournament2026Context.Provider>
  );
};

export const useTournament2026 = () => useContext(Tournament2026Context);