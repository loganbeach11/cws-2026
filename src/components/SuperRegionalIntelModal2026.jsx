import React from "react";
import "./RegionalIntelModal2026.css";

function SuperRegionalIntelModal2026({ isOpen, onClose, superRegionalIntel }) {
  if (!isOpen || !superRegionalIntel) return null;

  const teams = superRegionalIntel.teams || [];

  const displayValue = (value) => {
    return value !== null && value !== undefined && value !== "" ? value : "—";
  };

  const displayValueWithRank = (value, rank) => {
    if (value === null || value === undefined || value === "") return "—";
    return rank ? `${value} (#${rank})` : value;
  };

  const rows = [
    {
      label: "Record",
      getValue: (team) => displayValue(team.record),
    },
    {
      label: "Conference",
      getValue: (team) => displayValue(team.conference),
    },
    {
      label: "Conf. Record",
      getValue: (team) => displayValue(team.conferenceRecord),
    },
    {
      label: "RPI",
      getValue: (team) => displayValue(team.rpi),
    },
    {
      label: "SOS Rank",
      getValue: (team) => displayValue(team.sosRank),
    },
    {
      label: "Batting Avg",
      getValue: (team) =>
        displayValueWithRank(team.battingAvg, team.battingAvgRank),
    },
    {
      label: "Home Runs",
      getValue: (team) =>
        displayValueWithRank(team.homeRuns, team.homeRunsRank),
    },
    {
      label: "ERA",
      getValue: (team) => displayValueWithRank(team.era, team.eraRank),
    },
    {
      label: "Fielding %",
      getValue: (team) =>
        displayValueWithRank(team.fieldingPct, team.fieldingPctRank),
    },
  ];

  return (
    <div className="regional-intel-overlay" onClick={onClose}>
      <div
        className="regional-intel-modal super-regional-intel-modal"
        onClick={(event) => event.stopPropagation()}
        >
        <div className="regional-intel-header">
          <div>
            <p className="regional-intel-eyebrow">Matchup Intel</p>
            <h2>{superRegionalIntel.superRegionalName || "Super Regional"}</h2>
          </div>

          <button className="regional-intel-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="regional-intel-subtitle">
          Compare each team’s resume and key stats before making your Super
          Regional pick.
        </div>

        <div className="regional-intel-table-wrap">
        <table className="regional-intel-table super-regional-intel-table">
            <thead>
              <tr>
                <th className="stat-label-col">Stats</th>

                {teams.map((team, index) => (
                  <th key={`${team.team}-${index}`}>
                    <div className="team-intel-header super-intel-header">
                      <span>{team.team || "TBD"}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="stat-label-col">{row.label}</td>

                  {teams.map((team, index) => (
                    <td key={`${team.team}-${row.label}-${index}`}>
                      {row.getValue(team)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="regional-intel-note">
          NCAA stat ranks are national team-stat rankings. Stats are imported
          from NCAA and WarrenNolan sources.
        </p>
      </div>
    </div>
  );
}

export default SuperRegionalIntelModal2026;