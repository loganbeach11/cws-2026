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
  const [regionals, setRegionals] = useState({});
  const [superRegionals, setSuperRegionals] = useState({});

  const [user, setUser] = useState(null);

  const [userPicks, setUserPicks] = useState({});
  const [regionalPicks, setRegionalPicks] = useState({});
  const [superRegionalPicks, setSuperRegionalPicks] = useState({});

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

  const defaultRegionals = {};
  for (let i = 1; i <= 16; i++) {
    defaultRegionals[String(i)] = {
      name: "TBD Regional",
      team1: "TBD",
      team2: "TBD",
      team3: "TBD",
      team4: "TBD",
      winner: "",
      locked: false,
    };
  }

  const defaultSuperRegionals = {};
  for (let i = 1; i <= 8; i++) {
    defaultSuperRegionals[String(i)] = {
      name: "TBD Super Regional",
      team1: "TBD",
      team2: "TBD",
      winner: "",
      locked: false,
    };
  }

  const normalizePick = (value) => {
    return (value || "").toString().trim().toLowerCase();
  };

  const calculateCwsScoreFromData = (picks, gamesData) => {
    let score = 0;

    Object.entries(picks || {}).forEach(([gameId, pick]) => {
      const game = gamesData?.[gameId];

      if (game?.winner && normalizePick(game.winner) === normalizePick(pick)) {
        score += 1;
      }
    });

    return score;
  };

  const calculateRegionalScoreFromData = (picks, regionalsData) => {
    let score = 0;

    Object.entries(picks || {}).forEach(([regionalId, pick]) => {
      const regional = regionalsData?.[regionalId];

      if (
        regional?.winner &&
        normalizePick(regional.winner) === normalizePick(pick)
      ) {
        score += 1;
      }
    });

    return score;
  };

  const calculateSuperRegionalScoreFromData = (picks, superRegionalsData) => {
    let score = 0;

    Object.entries(picks || {}).forEach(([regionId, pick]) => {
      const region = superRegionalsData?.[regionId];

      if (
        region?.winner &&
        normalizePick(region.winner) === normalizePick(pick)
      ) {
        score += 1;
      }
    });

    return score;
  };

  /*
    ONE source of truth for 2026 scoring.

    It directly reads current Firestore state:
    - tournament2026/games
    - regionals2026/regions
    - superRegionals2026/regions
    - users2026
    - userPicks2026
    - regionalPicks2026
    - superRegionalPicks2026

    Then it writes the correct total to users2026/{uid}.score.
  */
  const recalculateAndSaveAllUserScores = async () => {
    try {
      const gamesSnap = await getDoc(doc(db, "tournament2026", "games"));
      const regionalsSnap = await getDoc(doc(db, "regionals2026", "regions"));
      const superRegionalsSnap = await getDoc(
        doc(db, "superRegionals2026", "regions")
      );

      const gamesData = gamesSnap.exists() ? gamesSnap.data() || {} : {};
      const regionalsData = regionalsSnap.exists()
        ? regionalsSnap.data() || {}
        : {};
      const superRegionalsData = superRegionalsSnap.exists()
        ? superRegionalsSnap.data() || {}
        : {};

      if (
        Object.keys(gamesData).length === 0 ||
        Object.keys(regionalsData).length === 0 ||
        Object.keys(superRegionalsData).length === 0
      ) {
        return;
      }

      const usersSnapshot = await getDocs(collection(db, "users2026"));
      const cwsPicksSnapshot = await getDocs(collection(db, "userPicks2026"));
      const regionalPicksSnapshot = await getDocs(
        collection(db, "regionalPicks2026")
      );
      const superRegionalPicksSnapshot = await getDocs(
        collection(db, "superRegionalPicks2026")
      );

      const cwsPicksByUser = {};
      cwsPicksSnapshot.forEach((pickDoc) => {
        cwsPicksByUser[pickDoc.id] = pickDoc.data() || {};
      });

      const regionalPicksByUser = {};
      regionalPicksSnapshot.forEach((pickDoc) => {
        regionalPicksByUser[pickDoc.id] = pickDoc.data() || {};
      });

      const superRegionalPicksByUser = {};
      superRegionalPicksSnapshot.forEach((pickDoc) => {
        superRegionalPicksByUser[pickDoc.id] = pickDoc.data() || {};
      });

      const updates = usersSnapshot.docs.map(async (userDoc) => {
        const uid = userDoc.id;
        const userData = userDoc.data() || {};
        const username = userData.username || uid;

        const cwsPicks = cwsPicksByUser[uid] || {};
        const regPicks = regionalPicksByUser[uid] || {};
        const srPicks = superRegionalPicksByUser[uid] || {};

        const cwsScore = calculateCwsScoreFromData(cwsPicks, gamesData);
        const regionalScore = calculateRegionalScoreFromData(
          regPicks,
          regionalsData
        );
        const superRegionalScore = calculateSuperRegionalScoreFromData(
          srPicks,
          superRegionalsData
        );
        const adjustment = getTiebreakerAdjustment(uid, username);

        const totalScore =
          cwsScore + regionalScore + superRegionalScore + adjustment;

        const currentScore = Number(userData.score ?? 0);

        if (currentScore !== totalScore) {
          await setDoc(
            doc(db, "users2026", uid),
            {
              username,
              score: totalScore,
            },
            { merge: true }
          );
        }
      });

      await Promise.all(updates);
    } catch (error) {
      console.error("Failed to recalculate 2026 scores:", error);
    }
  };

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
          } catch (error) {
            console.error("Failed to seed 2026 games:", error);
            setGames({});
          }
        } else {
          setGames(data);
          recalculateAndSaveAllUserScores();
        }
      },
      (error) => {
        console.error("2026 games snapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to 2026 Regionals doc; seed if missing or empty
  useEffect(() => {
    const regionalsDocRef = doc(db, "regionals2026", "regions");

    const unsubscribe = onSnapshot(
      regionalsDocRef,
      async (docSnap) => {
        const data = docSnap.exists() ? docSnap.data() || {} : null;
        const isMissingOrEmpty = !data || Object.keys(data).length === 0;

        if (isMissingOrEmpty) {
          try {
            await setDoc(regionalsDocRef, defaultRegionals);
            setRegionals(defaultRegionals);
          } catch (error) {
            console.error("Failed to seed 2026 Regionals:", error);
            setRegionals({});
          }
        } else {
          setRegionals(data);
          recalculateAndSaveAllUserScores();
        }
      },
      (error) => {
        console.error("2026 Regionals snapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to 2026 Super Regionals doc; seed if missing or empty
  useEffect(() => {
    const superRegionalsDocRef = doc(db, "superRegionals2026", "regions");

    const unsubscribe = onSnapshot(
      superRegionalsDocRef,
      async (docSnap) => {
        const data = docSnap.exists() ? docSnap.data() || {} : null;
        const isMissingOrEmpty = !data || Object.keys(data).length === 0;

        if (isMissingOrEmpty) {
          try {
            await setDoc(superRegionalsDocRef, defaultSuperRegionals);
            setSuperRegionals(defaultSuperRegionals);
          } catch (error) {
            console.error("Failed to seed 2026 Super Regionals:", error);
            setSuperRegionals({});
          }
        } else {
          setSuperRegionals(data);
          recalculateAndSaveAllUserScores();
        }
      },
      (error) => {
        console.error("2026 Super Regionals snapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Recalculate when regular CWS picks change
  useEffect(() => {
    const picksCollectionRef = collection(db, "userPicks2026");

    const unsubscribe = onSnapshot(
      picksCollectionRef,
      () => {
        recalculateAndSaveAllUserScores();
      },
      (error) => {
        console.error("2026 userPicks2026 snapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Recalculate when Regional picks change
  useEffect(() => {
    const picksCollectionRef = collection(db, "regionalPicks2026");

    const unsubscribe = onSnapshot(
      picksCollectionRef,
      () => {
        recalculateAndSaveAllUserScores();
      },
      (error) => {
        console.error("2026 regionalPicks2026 snapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Recalculate when Super Regional picks change
  useEffect(() => {
    const picksCollectionRef = collection(db, "superRegionalPicks2026");

    const unsubscribe = onSnapshot(
      picksCollectionRef,
      () => {
        recalculateAndSaveAllUserScores();
      },
      (error) => {
        console.error("2026 superRegionalPicks2026 snapshot error:", error);
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
      (error) => {
        console.error("2026 tournament config snapshot error:", error);
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser || null);

      if (firebaseUser) {
        const user2026Ref = doc(db, "users2026", firebaseUser.uid);
        const user2026Snap = await getDoc(user2026Ref);

        if (!user2026Snap.exists()) {
          await setDoc(
            user2026Ref,
            {
              username:
                firebaseUser.displayName || firebaseUser.email || firebaseUser.uid,
              score: 0,
            },
            { merge: true }
          );
        }

        recalculateAndSaveAllUserScores();
      }
    });

    return () => unsubscribe();
  }, []);

  // Keep this user's local CWS picks synced for UI highlighting
  useEffect(() => {
    if (!user) {
      setUserPicks({});
      return;
    }

    const userDocRef = doc(db, "userPicks2026", user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        setUserPicks(docSnap.exists() ? docSnap.data() : {});
      },
      (error) => {
        console.error("2026 user picks snapshot error:", error);
        setUserPicks({});
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Keep this user's local Regional picks synced for UI highlighting
  useEffect(() => {
    if (!user) {
      setRegionalPicks({});
      return;
    }

    const regionalPicksRef = doc(db, "regionalPicks2026", user.uid);

    const unsubscribe = onSnapshot(
      regionalPicksRef,
      (docSnap) => {
        setRegionalPicks(docSnap.exists() ? docSnap.data() : {});
      },
      (error) => {
        console.error("2026 Regional picks snapshot error:", error);
        setRegionalPicks({});
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Keep this user's local Super Regional picks synced for UI highlighting
  useEffect(() => {
    if (!user) {
      setSuperRegionalPicks({});
      return;
    }

    const superRegionalPicksRef = doc(db, "superRegionalPicks2026", user.uid);

    const unsubscribe = onSnapshot(
      superRegionalPicksRef,
      (docSnap) => {
        setSuperRegionalPicks(docSnap.exists() ? docSnap.data() : {});
      },
      (error) => {
        console.error("2026 Super Regional picks snapshot error:", error);
        setSuperRegionalPicks({});
      }
    );

    return () => unsubscribe();
  }, [user]);

  const saveUserPick = async (userId, gameId, teamName) => {
    const userDocRef = doc(db, "userPicks2026", userId);

    if (teamName === null) {
      await updateDoc(userDocRef, { [gameId]: deleteField() }).catch(
        async () => {
          await setDoc(userDocRef, {});
        }
      );
    } else {
      await setDoc(userDocRef, { [gameId]: teamName }, { merge: true });
    }

    await recalculateAndSaveAllUserScores();
  };

  const saveRegionalPick = async (userId, regionalId, teamName) => {
    const userDocRef = doc(db, "regionalPicks2026", userId);

    if (teamName === null) {
      await updateDoc(userDocRef, { [regionalId]: deleteField() }).catch(
        async () => {
          await setDoc(userDocRef, {});
        }
      );
    } else {
      await setDoc(userDocRef, { [regionalId]: teamName }, { merge: true });
    }

    await recalculateAndSaveAllUserScores();
  };

  const saveSuperRegionalPick = async (userId, regionId, teamName) => {
    const userDocRef = doc(db, "superRegionalPicks2026", userId);

    if (teamName === null) {
      await updateDoc(userDocRef, { [regionId]: deleteField() }).catch(
        async () => {
          await setDoc(userDocRef, {});
        }
      );
    } else {
      await setDoc(userDocRef, { [regionId]: teamName }, { merge: true });
    }

    await recalculateAndSaveAllUserScores();
  };

  // Admin/general update to a specific CWS game field(s) in 2026 doc
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

    await recalculateAndSaveAllUserScores();
  };

  // Admin/general update to a specific Regional field(s) in 2026 doc
  const updateRegional = async (id, updatedData) => {
    const regionalsDocRef = doc(db, "regionals2026", "regions");

    await setDoc(
      regionalsDocRef,
      {
        [id]: {
          ...regionals[id],
          ...updatedData,
        },
      },
      { merge: true }
    );

    await recalculateAndSaveAllUserScores();
  };

  // Admin/general update to a specific Super Regional field(s) in 2026 doc
  const updateSuperRegional = async (id, updatedData) => {
    const superRegionalsDocRef = doc(db, "superRegionals2026", "regions");

    await setDoc(
      superRegionalsDocRef,
      {
        [id]: {
          ...superRegionals[id],
          ...updatedData,
        },
      },
      { merge: true }
    );

    await recalculateAndSaveAllUserScores();
  };

  return (
    <Tournament2026Context.Provider
      value={{
        games,
        setGames,
        updateGame,

        regionals,
        setRegionals,
        updateRegional,

        superRegionals,
        setSuperRegionals,
        updateSuperRegional,

        user,
        currentUser: user,
        setUser,

        saveUserPick,
        userPicks,

        saveRegionalPick,
        regionalPicks,

        saveSuperRegionalPick,
        superRegionalPicks,

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