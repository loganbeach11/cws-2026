import React, { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { useTournament2026 } from "../context/Tournament2026Context";
import "./AccountDropdown2026.css";

function AccountDropdown2026({ usernameDisplay = "", userScore = 0 }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const {
    user,
    games,
    regionals,
    superRegionals,
    userPicks,
    regionalPicks,
    superRegionalPicks,
  } = useTournament2026();

  const [isOpen, setIsOpen] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [newUsername, setNewUsername] = useState(usernameDisplay || "");
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    setNewUsername(usernameDisplay || "");
  }, [usernameDisplay]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const normalizeDisplay = (value) => {
    return (value || "").toString().trim();
  };

  const handleSaveUsername = async () => {
    const cleanedUsername = normalizeDisplay(newUsername);

    if (!user || !cleanedUsername) {
      return;
    }

    setSavingUsername(true);

    try {
      await setDoc(
        doc(db, "users2026", user.uid),
        {
          username: cleanedUsername,
        },
        { merge: true }
      );

      // Optional but helpful so older 2025/history views stay consistent too.
      await setDoc(
        doc(db, "users", user.uid),
        {
          username: cleanedUsername,
        },
        { merge: true }
      );

      setShowUsernameModal(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update username:", error);
      alert("Could not update username. Try again.");
    } finally {
      setSavingUsername(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
      alert("Could not log out. Try again.");
    }
  };

  const getPickLabel = (pick) => {
    const cleaned = normalizeDisplay(pick);
    return cleaned || "No pick";
  };

  const getSortedEntries = (items) => {
    return Object.entries(items || {}).sort(
      ([idA], [idB]) => Number(idA) - Number(idB)
    );
  };

  const renderRegionalSnapshot = () => {
    const entries = getSortedEntries(regionals);

    return entries.map(([regionalId, regional]) => (
      <div className="snapshot-row" key={`regional-${regionalId}`}>
        <span>{regional?.name || `Regional ${regionalId}`}</span>
        <strong>{getPickLabel(regionalPicks?.[regionalId])}</strong>
      </div>
    ));
  };

  const renderSuperRegionalSnapshot = () => {
    const entries = getSortedEntries(superRegionals);

    return entries.map(([regionId, region]) => (
      <div className="snapshot-row" key={`super-${regionId}`}>
        <span>{region?.name || `Super Regional ${regionId}`}</span>
        <strong>{getPickLabel(superRegionalPicks?.[regionId])}</strong>
      </div>
    ));
  };

  const renderCwsSnapshot = () => {
    const entries = getSortedEntries(games);

    return entries.map(([gameId, game]) => (
      <div className="snapshot-row" key={`game-${gameId}`}>
        <span>Game {gameId}</span>
        <strong>{getPickLabel(userPicks?.[gameId])}</strong>
      </div>
    ));
  };

  if (!user) return null;

  return (
    <>
      <div className="account-dropdown-wrap" ref={dropdownRef}>
        <button
          type="button"
          className="account-dropdown-trigger"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span>{usernameDisplay || user.email || "My Account"}</span>
          <span>·</span>
          <span>
            {userScore} {userScore === 1 ? "pt" : "pts"}
          </span>
          <span className="account-dropdown-arrow">{isOpen ? "▴" : "▾"}</span>
        </button>

        {isOpen && (
          <div className="account-dropdown-menu">
            <div className="account-dropdown-header">
              <span>My Account</span>
              <strong>{usernameDisplay || user.email}</strong>
            </div>

            <button
              type="button"
              className="account-dropdown-item"
              onClick={() => {
                setNewUsername("");
                setShowUsernameModal(true);
                setIsOpen(false);
              }}
            >
              ✏️ Change Username
            </button>

            <button
              type="button"
              className="account-dropdown-item"
              onClick={() => {
                setShowSnapshotModal(true);
                setIsOpen(false);
              }}
            >
              📋 My Bracket Snapshot
            </button>

            <button
              type="button"
              className="account-dropdown-item logout-item"
              onClick={handleLogout}
            >
              ⏻ Logout
            </button>
          </div>
        )}
      </div>

      {showUsernameModal && (
        <div
          className="account-modal-overlay"
          onClick={() => setShowUsernameModal(false)}
        >
          <div
            className="account-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="account-modal-header">
              <h3>Change Username</h3>
              <button
                type="button"
                className="account-modal-close"
                onClick={() => setShowUsernameModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="account-modal-note">
              What would you like your new display username to be?
            </p>

            <input
              className="account-username-input"
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              placeholder="New username"
              maxLength={28}
            />

            <p className="account-modal-small-note">
              Please still use your current login information when signing in.
              This only changes your visible display name on the site.
            </p>

            <div className="account-modal-actions">
              <button
                type="button"
                className="account-cancel-button"
                onClick={() => setShowUsernameModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="account-save-button"
                disabled={savingUsername || !normalizeDisplay(newUsername)}
                onClick={handleSaveUsername}
              >
                {savingUsername ? "Saving..." : "Save Username"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSnapshotModal && (
        <div
          className="account-modal-overlay"
          onClick={() => setShowSnapshotModal(false)}
        >
          <div
            className="account-modal snapshot-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="account-modal-header">
              <h3>My Bracket Snapshot</h3>
              <button
                type="button"
                className="account-modal-close"
                onClick={() => setShowSnapshotModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="snapshot-section">
              <h4>Regionals</h4>
              {renderRegionalSnapshot()}
            </div>

            <div className="snapshot-section">
              <h4>Super Regionals</h4>
              {renderSuperRegionalSnapshot()}
            </div>

            <div className="snapshot-section">
              <h4>Omaha / CWS Games</h4>
              {renderCwsSnapshot()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AccountDropdown2026;