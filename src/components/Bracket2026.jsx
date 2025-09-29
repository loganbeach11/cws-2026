// src/components/Bracket2026.jsx
import Game2026 from "./Game2026";
import "./Bracket.css";
import { useTournament2026 } from "../context/Tournament2026Context";

function Bracket2026({ isAdmin }) {
  const { games, updateGame } = useTournament2026();

  return (
    <div className="bracket-container">
      <div className="bracket-grid">
        {/* Column 1 */}
        <div className="bracket-column" style={{ marginLeft: "40px" }}>
          <div className="game-wrapper">
            <div className="game-label">Game 1 - Jun 13 1:00 pm</div>
            <Game2026 gameId={1} isAdmin={isAdmin} />
            <div className="horizontal-line" />
            <div className="vertical-line line-between">
              <div className="horizontal-connector center" />
            </div>
          </div>
	    <div style={{ height: "60px" }} />
          <div className="game-wrapper">
            <div className="game-label">Game 2 - Jun 13 6:00 pm</div>
            <Game2026 gameId={2} isAdmin={isAdmin} />
            <div className="horizontal-line" />
          </div>

          <div style={{ height: "60px" }} />
          <div className="game-wrapper">
            <div className="game-label">Game 5 - Jun 15 1:00 pm</div>
            <Game2026 gameId={5} isAdmin={isAdmin} />
            <div className="horizontal-line" />
            <div className="vertical-line line-upward">
              <div className="horizontal-connector bottom" />
            </div>
          </div>

          <div style={{ height: "60px" }} />
          <div className="game-wrapper">
            <div className="game-label">Game 3 - Jun 14 1:00 pm</div>
              <Game2026 gameId={3} isAdmin={isAdmin} />
	      <div className="horizontal-line" />
            <div className="vertical-line line-between">
              <div className="horizontal-connector center" />
            </div>
          </div>

          <div style={{ height: "60px" }} />
          <div className="game-wrapper">
            <div className="game-label">Game 4 - Jun 14 6:00 pm</div>
            <Game2026 gameId={4} isAdmin={isAdmin} />
            <div className="horizontal-line" />
          </div>

          <div style={{ height: "60px" }} />
          <div className="game-wrapper">
            <div className="game-label">Game 7 - Jun 16 - 1:00 pm</div>
            <Game2026 gameId={7} isAdmin={isAdmin} />
            <div className="horizontal-line" />
            <div className="vertical-line line-upward">
              <div className="horizontal-connector bottom" />
            </div>
          </div>
	    </div>

        {/* Column 2 */}
        <div className="bracket-column">
          <div style={{ height: "95px" }} />
          <div className="game-wrapper">
            <div className="game-label">Game 6 - Jun 15 6:00 pm</div>
            <Game2026 gameId={6} isAdmin={isAdmin} />
            <div className="horizontal-line" />
            <div className="vertical-line line-between-col2a">
              <div className="horizontal-connector center" />
            </div>
          </div>

          <div style={{ height: "60px" }} />
          <div className="game-wrapper">
            <div className="game-label">Game 9 - Jun 17 1:00 pm</div>
            <Game2026 gameId={9} isAdmin={isAdmin} />
            <div className="horizontal-line" />
          </div>
	    <div style={{ height: "250px" }} />
          <div className="game-wrapper">
            <div className="game-label">Game 8 - Jun 16 6:00 pm</div>
            <Game2026 gameId={8} isAdmin={isAdmin} />
            <div className="horizontal-line" />
            <div className="vertical-line line-between-col2b">
              <div className="horizontal-connector center" />
            </div>
          </div>

          <div style={{ height: "60px" }} />
          <div className="game-wrapper">
            <div className="game-label">Game 10 - Jun 17 6:00 pm</div>
            <Game2026 gameId={10} isAdmin={isAdmin} />
            <div className="horizontal-line" />
          </div>
        </div>

        {/* Column 3 */}
        <div className="bracket-column">
          <div style={{ height: "185px" }} />
            <div className="game-wrapper">
		<div className="game-label">Game 11 - Jun 18 1:00 pm</div>
            <Game2026 gameId={11} isAdmin={isAdmin} />
            <div className="horizontal-line" />
            <div className="vertical-line line-downward-col3">
              <div className="horizontal-connector top" />
            </div>
          </div>

          <div style={{ height: "440px" }} />
          <div className="game-wrapper">
            <div className="game-label">Game 12 - Jun 18 6:00 pm</div>
            <Game2026 gameId={12} isAdmin={isAdmin} />
            <div className="horizontal-line" />
            <div className="vertical-line line-upward-col3">
              <div className="horizontal-connector bottom" />
            </div>
          </div>
        </div>

        {/* Column 4 (If Necessary) */}
        <div className="bracket-column">
          <div style={{ height: "250px" }} />
            <div className="game-wrapper">
		<div className="game-label">If necessary - Jun 19 TBD</div>
            <Game2026 gameId={13} isAdmin={isAdmin} />
            <div className="horizontal-line" />
            <div className="vertical-line line-between-col4">
              <div className="horizontal-connector center" />
            </div>
            <div className="bracket-label"></div>
          </div>

          <div style={{ height: "315px" }} />
          <div className="game-wrapper">
            <div className="game-label">If necessary - Jun 19 TBD</div>
            <Game2026 gameId={14} isAdmin={isAdmin} />
            <div className="horizontal-line" />
            <div className="bracket-label"></div>
          </div>
        </div>

        {/* Final column: Game 15 */}
        <div className="bracket-column final-column">
          <div style={{ height: "470px" }} />
          <div className="champion-wrapper">
            <div className="game-label">MCWS Final - Jun 21 6:00 pm</div>
              <Game2026 gameId="15" isAdmin={isAdmin} />
	      <div className="champion-line" />
            {isAdmin ? (
              <input
                type="text"
                className="champion-input"
                value={games["15"]?.champion ?? ""}
                onChange={(e) => updateGame("15", { champion: e.target.value })}
              />
            ) : (
              games["15"]?.champion &&
              games["15"].champion !== "TBD" && (
                <div className="champion-display">{games["15"].champion}</div>
              )
            )}
            <div className="champion-banner">🏆 NATIONAL CHAMPION</div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Bracket2026;
