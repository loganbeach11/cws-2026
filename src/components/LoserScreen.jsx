import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./LoserScreen.css";

export default function LoserScreen() {
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const audio = new Audio("/sad.mp3");
    audio.play().catch((e) => console.log("Autoplay blocked:", e));
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  // Stop audio if user navigates away from /loser
  useEffect(() => {
    if (location.pathname !== "/loser") {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [location]);

  return (
    <div className="loser-screen no-scroll">
      <div className="loser-content" style={{ marginTop: "-50px" }}>
        <h2 className="loser-text">😢 YOU LOSE! 😢</h2>
        <button className="view-bracket-btn" onClick={() => navigate("/tournament")}>
          View Bracket
        </button>
	  <p className="loser-taunt">
              Congrats on your spectacular ability to lose like a pro! Don’t worry, even a broken clock is right twice a day — but you? Not so much. All jokes aside, thank you very much for playing and good luck next year!
      </p>
      </div>
    </div>
  );
}
