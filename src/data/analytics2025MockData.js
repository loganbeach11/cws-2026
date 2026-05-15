// src/data/analytics2025MockData.js

/*
  Important analytics rule:
  Only include users who counted on the official 2025 leaderboard.
  Exclude admin/test/new accounts that should not be part of 2025 results.
*/

export const analytics2025MockData = {
    overview: {
      totalPlayers: 8,
      totalGames: 15,
      averageScore: 8.4,
      winningScore: 12.5,
      biggestUpset: "Game 8",
    },
  
    leaderboard: [
      { rank: 1, username: "Brandon_Beach_FTW", score: 12.5, accuracy: "83%" },
      { rank: 2, username: "ExampleUser2", score: 11, accuracy: "73%" },
      { rank: 3, username: "ExampleUser3", score: 10, accuracy: "67%" },
      { rank: 4, username: "ExampleUser4", score: 9, accuracy: "60%" },
    ],
  
    gameBreakdown: [
      {
        game: "Game 1",
        winner: "Coastal Carolina",
        percentCorrect: 75,
        mostPickedTeam: "Coastal Carolina",
        upsetLevel: "Expected",
      },
      {
        game: "Game 2",
        winner: "Arizona",
        percentCorrect: 62,
        mostPickedTeam: "Arizona",
        upsetLevel: "Expected",
      },
      {
        game: "Game 8",
        winner: "Underdog Team",
        percentCorrect: 18,
        mostPickedTeam: "Favorite Team",
        upsetLevel: "Chaos",
      },
    ],
  
    insights: {
      mostPredictableGame:
        "Game 1 was the most predictable game, with 75% of leaderboard users picking the winner.",
      mostChaoticGame:
        "Game 8 was the biggest upset, with only 18% of leaderboard users picking correctly.",
      mostUniqueBracket:
        "Coming soon — this will identify the user whose picks differed most from the group.",
      mostSimilarBrackets:
        "Coming soon — this will identify the two users with the most similar picks.",
    },
  };