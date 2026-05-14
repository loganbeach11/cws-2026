// src/context/Tournament2026Context.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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

  const [pickToast, setPickToast] = useState(null);
  const pickToastTimerRef = useRef(null);

  const [tiebreakerSettings, setTiebreakerSettings] = useState({
    active: false,
    testMode: true,
    predictionOpen: false,
    eligibleUsernames: ["loganbeach13", "log"],
    eligibleUserIds: [],
    actualTotalRuns: null,
    bonusAmount: 0.5,
    bonusWinnerUid: "",
    bonusWinnerUsername: "",
  });

  const [tiebreakerPredictions, setTiebreakerPredictions] = useState({});

  /*
    MANUAL TIEBREAKER ADJUSTMENTS

    Keep this as an emergency fallback only.
    The built-in tiebreaker below is now the preferred way.
  */
  const tiebreakerAdjustments = {
    // "USER_FIREBASE_UID_OR_USERNAME": 0.5,
  };

  const getManualTiebreakerAdjustment = (uid, username) => {
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

  const showPickToast = (message) => {
    if (pickToastTimerRef.current) {
      clearTimeout(pickToastTimerRef.current);
    }

    setPickToast({
      message,
      id: Date.now(),
    });

    pickToastTimerRef.current = setTimeout(() => {
      setPickToast(null);
    }, 1500);
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

  const userIsTiebreakerEligible = (uid, username, settings) => {
    const eligibleUserIds = Array.isArray(settings?.eligibleUserIds)
      ? settings.eligibleUserIds
      : [];

    const eligibleUsernames = Array.isArray(settings?.eligibleUsernames)
      ? settings.eligibleUsernames.map((name) => normalizePick(name))
      : [];

    return (
      eligibleUserIds.includes(uid) ||
      eligibleUsernames.includes(normalizePick(username))
    );
  };

  const actualRunsAreEntered = (value) => {
    return value !== null && value !== undefined && value !== "";
  };

  const getBuiltInTiebreakerWinner = ({
    settings,
    predictionsByUser,
    usersSnapshot,
    cwsPicksByUser,
    gamesData,
  }) => {
    if (!settings?.active) return null;

    if (!actualRunsAreEntered(settings.actualTotalRuns)) {
      return null;
    }

    const actualTotalRuns = Number(settings.actualTotalRuns);

    if (!Number.isFinite(actualTotalRuns)) return null;

    const finalGame = gamesData?.["15"];
    const finalWinner = finalGame?.winner;

    // Do not calculate the bonus until the final game is locked.
    if (finalGame?.locked !== true) {
      return null;
    }

    if (!finalWinner || normalizePick(finalWinner) === "tbd") {
      return null;
    }

    const eligibleCorrectUsers = [];

    usersSnapshot.docs.forEach((userDoc) => {
      const uid = userDoc.id;
      const userData = userDoc.data() || {};
      const username = userData.username || uid;

      const isEligible = userIsTiebreakerEligible(uid, username, settings);
      if (!isEligible) return;

      const predictionData = predictionsByUser[uid] || {};
      const predictedRuns = Number(predictionData.predictedRuns);

      if (!Number.isFinite(predictedRuns)) return;

      const userFinalPick = cwsPicksByUser[uid]?.["15"];

      const pickedFinalWinner =
        normalizePick(userFinalPick) === normalizePick(finalWinner);

      if (!pickedFinalWinner) return;

      eligibleCorrectUsers.push({
        uid,
        username,
        predictedRuns,
        difference: Math.abs(predictedRuns - actualTotalRuns),
      });
    });

    if (eligibleCorrectUsers.length === 0) {
      return null;
    }

    eligibleCorrectUsers.sort((a, b) => a.difference - b.difference);

    const bestDifference = eligibleCorrectUsers[0].difference;
    const usersWithBestDifference = eligibleCorrectUsers.filter(
      (item) => item.difference === bestDifference
    );

    /*
      If two eligible users are exactly tied on the tiebreaker prediction,
      do not auto-award the 0.5 yet.
    */
    if (usersWithBestDifference.length > 1) {
      return null;
    }

    return eligibleCorrectUsers[0];
  };

  const maybeUpdateTiebreakerWinnerFields = async (
    currentSettings,
    builtInTiebreakerWinner
  ) => {
    if (!currentSettings?.active) return;

    const newBonusWinnerUid = builtInTiebreakerWinner?.uid || "";
    const newBonusWinnerUsername = builtInTiebreakerWinner?.username || "";

    const oldBonusWinnerUid = currentSettings.bonusWinnerUid || "";
    const oldBonusWinnerUsername = currentSettings.bonusWinnerUsername || "";

    if (
      newBonusWinnerUid === oldBonusWinnerUid &&
      newBonusWinnerUsername === oldBonusWinnerUsername
    ) {
      return;
    }

    await setDoc(
      doc(db, "tiebreaker2026", "settings"),
      {
        bonusWinnerUid: newBonusWinnerUid,
        bonusWinnerUsername: newBonusWinnerUsername,
        lastCalculatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
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
    - tiebreaker2026/settings
    - tiebreakerPicks2026

    Then it writes the correct total to users2026/{uid}.score.
  */
  const recalculateAndSaveAllUserScores = async () => {
    try {
      const gamesSnap = await getDoc(doc(db, "tournament2026", "games"));
      const regionalsSnap = await getDoc(doc(db, "regionals2026", "regions"));
      const superRegionalsSnap = await getDoc(
        doc(db, "superRegionals2026", "regions")
      );
      const tiebreakerSettingsSnap = await getDoc(
        doc(db, "tiebreaker2026", "settings")
      );

      const gamesData = gamesSnap.exists() ? gamesSnap.data() || {} : {};
      const regionalsData = regionalsSnap.exists()
        ? regionalsSnap.data() || {}
        : {};
      const superRegionalsData = superRegionalsSnap.exists()
        ? superRegionalsSnap.data() || {}
        : {};

      const currentTiebreakerSettings = tiebreakerSettingsSnap.exists()
        ? tiebreakerSettingsSnap.data() || {}
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
      const tiebreakerPredictionsSnapshot = await getDocs(
        collection(db, "tiebreakerPicks2026")
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

      const predictionsByUser = {};
      tiebreakerPredictionsSnapshot.forEach((predictionDoc) => {
        predictionsByUser[predictionDoc.id] = predictionDoc.data() || {};
      });

      const builtInTiebreakerWinner = getBuiltInTiebreakerWinner({
        settings: currentTiebreakerSettings,
        predictionsByUser,
        usersSnapshot,
        cwsPicksByUser,
        gamesData,
      });

      const builtInBonusAmount = Number(
        currentTiebreakerSettings.bonusAmount ?? 0.5
      );

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

        const manualAdjustment = getManualTiebreakerAdjustment(uid, username);

        const builtInTiebreakerAdjustment =
          builtInTiebreakerWinner?.uid === uid &&
          Number.isFinite(builtInBonusAmount)
            ? builtInBonusAmount
            : 0;

        const totalScore =
          cwsScore +
          regionalScore +
          superRegionalScore +
          manualAdjustment +
          builtInTiebreakerAdjustment;

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

      await maybeUpdateTiebreakerWinnerFields(
        currentTiebreakerSettings,
        builtInTiebreakerWinner
      );
    } catch (error) {
      console.error("Failed to recalculate 2026 scores:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (pickToastTimerRef.current) {
        clearTimeout(pickToastTimerRef.current);
      }
    };
  }, []);

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

  // Subscribe to 2026 tiebreaker settings
  useEffect(() => {
    const settingsRef = doc(db, "tiebreaker2026", "settings");

    const unsubscribe = onSnapshot(
      settingsRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() || {};

          setTiebreakerSettings({
            active: data.active === true,
            testMode: data.testMode !== false,
            predictionOpen: data.predictionOpen === true,
            eligibleUsernames: Array.isArray(data.eligibleUsernames)
              ? data.eligibleUsernames
              : ["loganbeach13", "log"],
            eligibleUserIds: Array.isArray(data.eligibleUserIds)
              ? data.eligibleUserIds
              : [],
            actualTotalRuns:
              data.actualTotalRuns === undefined ? null : data.actualTotalRuns,
            bonusAmount: Number(data.bonusAmount ?? 0.5),
            bonusWinnerUid: data.bonusWinnerUid || "",
            bonusWinnerUsername: data.bonusWinnerUsername || "",
          });

          recalculateAndSaveAllUserScores();
        } else {
          const defaultSettings = {
            active: false,
            testMode: true,
            predictionOpen: false,
            eligibleUsernames: ["loganbeach13", "log"],
            eligibleUserIds: [],
            actualTotalRuns: null,
            bonusAmount: 0.5,
            bonusWinnerUid: "",
            bonusWinnerUsername: "",
            updatedAt: new Date().toISOString(),
          };

          await setDoc(settingsRef, defaultSettings, { merge: true });
          setTiebreakerSettings(defaultSettings);
        }
      },
      (error) => {
        console.error("2026 tiebreaker settings snapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to 2026 tiebreaker predictions
  useEffect(() => {
    const predictionsRef = collection(db, "tiebreakerPicks2026");

    const unsubscribe = onSnapshot(
      predictionsRef,
      (snapshot) => {
        const predictions = {};

        snapshot.forEach((predictionDoc) => {
          predictions[predictionDoc.id] = predictionDoc.data() || {};
        });

        setTiebreakerPredictions(predictions);
        recalculateAndSaveAllUserScores();
      },
      (error) => {
        console.error("2026 tiebreaker predictions snapshot error:", error);
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
                firebaseUser.displayName ||
                firebaseUser.email ||
                firebaseUser.uid,
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

      showPickToast("Pick removed");
    } else {
      await setDoc(userDocRef, { [gameId]: teamName }, { merge: true });

      showPickToast("✅ Pick saved");
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

      showPickToast("Pick removed");
    } else {
      await setDoc(userDocRef, { [regionalId]: teamName }, { merge: true });

      showPickToast("✅ Pick saved");
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

      showPickToast("Pick removed");
    } else {
      await setDoc(userDocRef, { [regionId]: teamName }, { merge: true });

      showPickToast("✅ Pick saved");
    }

    await recalculateAndSaveAllUserScores();
  };

  const saveTiebreakerPrediction = async (userId, username, predictedRuns) => {
    const predictionNumber = Number(predictedRuns);

    if (!Number.isFinite(predictionNumber) || predictionNumber < 0) {
      throw new Error("Prediction must be a valid number.");
    }

    const gamesSnap = await getDoc(doc(db, "tournament2026", "games"));
    const gamesData = gamesSnap.exists() ? gamesSnap.data() || {} : {};
    const finalGameLocked = gamesData?.["15"]?.locked === true;

    if (finalGameLocked) {
      throw new Error("Tiebreaker predictions are locked.");
    }

    const settingsSnap = await getDoc(doc(db, "tiebreaker2026", "settings"));
    const settingsData = settingsSnap.exists() ? settingsSnap.data() || {} : {};

    if (!settingsData.active || !settingsData.predictionOpen) {
      throw new Error("Tiebreaker predictions are not currently open.");
    }

    const isEligible = userIsTiebreakerEligible(userId, username, settingsData);

    if (!isEligible) {
      throw new Error("You are not eligible for the tiebreaker.");
    }

    const predictionRef = doc(db, "tiebreakerPicks2026", userId);

    await setDoc(
      predictionRef,
      {
        username: username || userId,
        predictedRuns: predictionNumber,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    showPickToast("✅ Tiebreaker saved");

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

  const currentUserDataForTiebreaker = user
    ? {
        uid: user.uid,
        prediction: tiebreakerPredictions?.[user.uid] || null,
      }
    : null;

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
        tiebreakerSettings,
        tiebreakerPredictions,
        currentUserDataForTiebreaker,
        saveTiebreakerPrediction,

        userIsTiebreakerEligible,

        pickToast,
      }}
    >
      {children}
    </Tournament2026Context.Provider>
  );
};

export const useTournament2026 = () => useContext(Tournament2026Context);