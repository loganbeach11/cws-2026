// src/pages/Analytics2025Page.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { analytics2025Data } from "../data/analytics2025Data";
import "./Analytics2025Page.css";

function Analytics2025Page() {
  const navigate = useNavigate();

  const {
    overview,
    leaderboard,
    gameBreakdown,
    insights,
    scoreDistribution,
    chaosRanking = [],
    userRecaps = [],
  } = analytics2025Data;

  const totalValidPlayers = overview.totalPlayers || 1;

  return (
    <div className="analytics-page">
      <div className="header">
        <h1 className="header-title">📊 2025 Bracket Analytics</h1>
      </div>

      <main className="analytics-shell">
        <section className="analytics-hero">
          <div>
            <p className="analytics-eyebrow">Completed Tournament Breakdown</p>
            <h2>2025 Data Science Dashboard</h2>
            <p>
              A full analysis of picks, scores, upsets, user performance,
              bracket similarity, and game-by-game trends from the completed
              2025 CWS bracket.
            </p>
          </div>

          <button
            type="button"
            className="analytics-back-btn"
            onClick={() => navigate("/tournament2026")}
          >
            Back to 2026 Bracket
          </button>
        </section>

        <section className="analytics-stat-grid">
          <div className="analytics-stat-card">
            <span className="stat-label">Total Players</span>
            <strong>{overview.totalPlayers}</strong>
            <small>Official 2025 leaderboard users</small>
          </div>

          <div className="analytics-stat-card">
            <span className="stat-label">Average Score</span>
            <strong>{overview.averageScore}</strong>
            <small>Mean score across all users</small>
          </div>

          <div className="analytics-stat-card">
            <span className="stat-label">Winning Score</span>
            <strong>{overview.winningScore}</strong>
            <small>Highest final score</small>
          </div>

          <div className="analytics-stat-card">
            <span className="stat-label">Biggest Upset</span>
            <strong>{overview.biggestUpset}</strong>
            <small>Game most users missed</small>
          </div>
        </section>

        <section className="analytics-section">
          <div className="analytics-section-header">
            <h3>📈 Graphs & Visuals</h3>
            <p>
              Visual breakdowns of 2025 scores, game accuracy, and group pick
              trends.
            </p>
          </div>

          <div className="analytics-chart-grid">
            <div className="analytics-chart-card score-distribution-card">
              <h4>Score Distribution</h4>

              <div className="score-histogram">
                {scoreDistribution.map((item) => (
                  <div className="histogram-row" key={item.score}>
                    <span className="histogram-score">{item.score} pts</span>

                    <div className="histogram-bar-track">
                      <div
                        className="histogram-bar"
                        style={{
                          width: `${(item.count / totalValidPlayers) * 100}%`,
                        }}
                      />
                    </div>

                    <span className="histogram-count">
                      {item.count}/{totalValidPlayers} ·{" "}
                      {Math.round((item.count / totalValidPlayers) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-chart-card">
              <h4>Accuracy by Game</h4>
              <p className="analytics-small-note">
                 Missing picks are not included in accuracy percentages.
            </p>
              <div className="mini-data-list">
                {gameBreakdown.map((game) => (
                  <div className="mini-data-row" key={game.game}>
                    <span>{game.game}</span>
                    <strong>
                      {game.percentCorrect}% correct — {game.winner}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-chart-card">
              <h4>Most Popular Pick by Game</h4>

              <div className="mini-data-list">
                {gameBreakdown.map((game) => (
                  <div className="mini-data-row expanded-pick-row" key={`${game.game}-pick`}>
                    <span>{game.game}</span>

                    <div className="pick-popularity-stack">
                      {(game.pickPopularity || []).map((pick) => (
                        <div className="pick-popularity-line" key={`${game.game}-${pick.team}`}>
                          <strong>{pick.team}</strong>
                          <span>
                            {pick.count}/{totalValidPlayers} · {pick.percent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="analytics-section">
          <div className="analytics-section-header">
            <h3>🌪️ Biggest Misses</h3>
            <p>
              Games ranked by how badly the group missed the actual winner.
            </p>
            <p className="analytics-small-note centered-note">
                Missing picks are not included in correct-pick percentages.
             </p>
          </div>

          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Game</th>
                  <th>Winner</th>
                  <th>Correct</th>
                  <th>Most Picked</th>
                  <th>Type</th>
                </tr>
              </thead>

              <tbody>
                {chaosRanking.map((game, index) => (
                  <tr key={`${game.game}-chaos`}>
                    <td>{index + 1}</td>
                    <td>{game.game}</td>
                    <td>{game.winner}</td>
                    <td>{game.percentCorrect}%</td>
                    <td>{game.mostPickedTeam}</td>
                    <td>{game.upsetLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="analytics-section">
          <div className="analytics-section-header">
            <h3>🔥 Fun Insights</h3>
            <p>Quick written takeaways from the 2025 bracket data.</p>
          </div>

          <div className="analytics-insight-grid">
            <div className="analytics-insight-card">
              <h4>Most Predictable Game</h4>
              <p>{insights.mostPredictableGame}</p>
            </div>

            <div className="analytics-insight-card">
              <h4>Most Chaotic Game</h4>
              <p>{insights.mostChaoticGame}</p>
            </div>

            <div className="analytics-insight-card">
              <h4>Most Unique Bracket</h4>
              <p>{insights.mostUniqueBracket}</p>
            </div>

            <div className="analytics-insight-card">
              <h4>Most Similar Brackets</h4>
              <p>{insights.mostSimilarBrackets}</p>
            </div>
          </div>
        </section>

        <section className="analytics-section">
          <div className="analytics-section-header">
            <h3>👤 User Recap Cards</h3>
            <p>
              A quick profile of every official 2025 leaderboard user.
            </p>
          </div>

          <div className="user-recap-grid">
            {userRecaps.map((user) => (
              <div className="user-recap-card" key={user.username}>
                <div className="user-recap-topline">
                  <span className="user-recap-rank">{user.rank}</span>
                  <strong>{user.username}</strong>
                </div>

                <div className="user-recap-stats">
                  <span>Score: <strong>{user.score}</strong></span>
                  <span>Accuracy: <strong>{user.accuracy}</strong></span>
                  <span>Style: <strong>{user.style}</strong></span>
                </div>

                <p>
                  Best pick: <strong>{user.bestPick}</strong>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="analytics-section">
          <div className="analytics-section-header">
            <h3>📋 Tables</h3>
            <p>Detailed game-by-game and user-by-user breakdowns.</p>
          </div>

          <div className="analytics-table-grid">
            <div className="analytics-table-card">
              <h4>Final Leaderboard</h4>

              <div className="analytics-table-wrap">
                <table className="analytics-table leaderboard-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>User</th>
                      <th>Score</th>
                      <th>
                        <span className="desktop-label">Accuracy</span>
                        <span className="mobile-label">Acc.</span>
                        </th>
                    </tr>
                  </thead>

                  <tbody>
                    {leaderboard.map((user) => (
                      <tr key={user.username}>
                        <td>{user.rank}</td>
                        <td>{user.username}</td>
                        <td>{user.score}</td>
                        <td>{user.accuracy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="analytics-table-card">
              <h4>Game Pick Breakdown</h4>
              <p className="analytics-small-note">
                Missing picks are not included in correct-pick percentages.
            </p>
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Game</th>
                      <th>Winner</th>
                      <th>Correct</th>
                      <th>Type</th>
                    </tr>
                  </thead>

                  <tbody>
                    {gameBreakdown.map((game) => (
                      <tr key={game.game}>
                        <td>{game.game}</td>
                        <td>{game.winner}</td>
                        <td>{game.percentCorrect}%</td>
                        <td>{game.upsetLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Analytics2025Page;