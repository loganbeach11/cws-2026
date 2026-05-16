# scripts/analyze_2025.py

import json
from pathlib import Path
from statistics import mean

PROJECT_ROOT = Path(__file__).resolve().parents[1]

RAW_DATA_DIR = PROJECT_ROOT / "scripts" / "raw_2025_data"
OUTPUT_FILE = PROJECT_ROOT / "src" / "data" / "analytics2025Data.js"

EXCLUDED_USERNAMES = {
    "loganbeach11",
    "loganbeach11@fake.com",
    "lo",
    "log",
}

EXCLUDED_UIDS = {
    "bf5dgOYciTR4pfgAZ3nTFvQUPFs1",
}

TIEBREAKER_BONUSES = {
    "brandon_beach_ftw": 0.5,
}

def normalize(value):
    return str(value or "").strip().lower()


def load_json(filename):
    path = RAW_DATA_DIR / filename

    if not path.exists():
        raise FileNotFoundError(f"Missing raw data file: {path}")

    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def is_valid_2025_leaderboard_user(user):
    uid = user.get("uid", "")
    username = user.get("username", "")
    score = float(user.get("score", 0) or 0)

    if uid in EXCLUDED_UIDS:
        return False

    if normalize(username) in {normalize(name) for name in EXCLUDED_USERNAMES}:
        return False

    # Important:
    # This excludes new accounts that were created after 2025
    # and have 0 points on the 2025 leaderboard.
    if score <= 0:
        return False

    return True


def calculate_user_accuracy(user_score, total_locked_games):
    if total_locked_games <= 0:
        return "0%"

    accuracy = round((user_score / total_locked_games) * 100)
    return f"{accuracy}%"


def get_locked_games(games):
    locked_games = {}

    for game_id, game in games.items():
        winner = game.get("winner", "")
        if winner and normalize(winner) != "tbd":
            locked_games[str(game_id)] = game

    return locked_games


def calculate_game_breakdown(valid_users, user_picks, locked_games):
    breakdown = []

    for game_id, game in sorted(locked_games.items(), key=lambda item: int(item[0])):
        team1 = game.get("team1", "TBD")
        team2 = game.get("team2", "TBD")
        winner = game.get("winner", "")

        picks_for_game = []

        for user in valid_users:
            uid = user["uid"]
            pick = user_picks.get(uid, {}).get(str(game_id))

            if pick:
                picks_for_game.append(pick)

        total_picks = len(picks_for_game)

        if total_picks == 0:
            percent_correct = 0
        else:
            correct_count = sum(
                1 for pick in picks_for_game if normalize(pick) == normalize(winner)
            )

            # Accuracy stays based only on people who actually made a pick.
            percent_correct = round((correct_count / total_picks) * 100)

        # Pick popularity uses ALL valid leaderboard users as denominator.
        total_valid_users = len(valid_users)

        official_teams = []

        for team in [team1, team2]:
            clean_team = str(team or "").strip()

            if clean_team and normalize(clean_team) != "tbd":
                official_teams.append(clean_team)

        # Start each official team at 0 so teams with 0 picks still display.
        pick_counts = {team: 0 for team in official_teams}
        no_pick_count = 0

        for user in valid_users:
            uid = user["uid"]
            pick = user_picks.get(uid, {}).get(str(game_id))
            clean_pick = str(pick or "").strip()

            if not clean_pick:
                no_pick_count += 1
                continue

            matched_official_team = None

            for team in official_teams:
                if normalize(team) == normalize(clean_pick):
                    matched_official_team = team
                    break

            if matched_official_team:
                pick_counts[matched_official_team] = (
                    pick_counts.get(matched_official_team, 0) + 1
                )
            else:
                pick_counts[clean_pick] = pick_counts.get(clean_pick, 0) + 1

        # Only show No Pick if at least one valid user skipped that game.
        if no_pick_count > 0:
            pick_counts["No Pick"] = no_pick_count

        if pick_counts:
            highest_pick_count = max(pick_counts.values())

            most_picked_teams = [
                team
                for team, count in pick_counts.items()
                if count == highest_pick_count
            ]

            most_picked_team = " / ".join(most_picked_teams)

            pick_popularity = [
                {
                    "team": team,
                    "count": count,
                    "percent": round((count / total_valid_users) * 100)
                    if total_valid_users
                    else 0,
                }
                for team, count in sorted(
                    pick_counts.items(),
                    key=lambda item: item[1],
                    reverse=True,
                )
            ]
        else:
            most_picked_team = "No picks"
            pick_popularity = []

        if percent_correct >= 70:
            upset_level = "Expected"
        elif percent_correct >= 40:
            upset_level = "Mixed"
        else:
            upset_level = "Chaos"

        breakdown.append(
            {
                "game": f"Game {game_id}",
                "team1": team1,
                "team2": team2,
                "winner": winner,
                "percentCorrect": percent_correct,
                "mostPickedTeam": most_picked_team,
                "pickPopularity": pick_popularity,
                "upsetLevel": upset_level,
            }
        )

    return breakdown

def get_user_pick_vector(user, user_picks, locked_games):
    uid = user["uid"]
    picks = user_picks.get(uid, {})

    vector = []

    for game_id in sorted(locked_games.keys(), key=lambda value: int(value)):
        vector.append(normalize(picks.get(str(game_id))))

    return vector


def calculate_similarity_percent(vector_a, vector_b):
    comparable = 0
    same = 0

    for pick_a, pick_b in zip(vector_a, vector_b):
        # Only compare games where both users made a pick.
        if not pick_a or not pick_b:
            continue

        comparable += 1

        if pick_a == pick_b:
            same += 1

    if comparable == 0:
        return 0

    return round((same / comparable) * 100)


def build_similarity_data(valid_users, user_picks, locked_games):
    user_vectors = {}

    for user in valid_users:
        username = user.get("username", user.get("uid", "Unknown"))
        user_vectors[username] = get_user_pick_vector(user, user_picks, locked_games)

    pair_results = []

    usernames = list(user_vectors.keys())

    for i in range(len(usernames)):
        for j in range(i + 1, len(usernames)):
            username_a = usernames[i]
            username_b = usernames[j]

            similarity = calculate_similarity_percent(
                user_vectors[username_a],
                user_vectors[username_b]
            )

            pair_results.append({
                "users": [username_a, username_b],
                "similarity": similarity,
            })

    if not pair_results:
        return {
            "mostSimilarPairs": [],
            "mostUniqueUsers": [],
            "allPairs": [],
        }

    highest_similarity = max(pair["similarity"] for pair in pair_results)

    most_similar_pairs = [
        pair for pair in pair_results
        if pair["similarity"] == highest_similarity
    ]

    user_average_similarity = {}

    for username in usernames:
        similarities = []

        for pair in pair_results:
            if username in pair["users"]:
                similarities.append(pair["similarity"])

        user_average_similarity[username] = (
            round(sum(similarities) / len(similarities), 1)
            if similarities
            else 0
        )

    lowest_average_similarity = min(user_average_similarity.values())

    most_unique_users = [
        {
            "username": username,
            "averageSimilarity": average_similarity,
        }
        for username, average_similarity in user_average_similarity.items()
        if average_similarity == lowest_average_similarity
    ]

    return {
        "mostSimilarPairs": most_similar_pairs,
        "mostUniqueUsers": most_unique_users,
        "allPairs": sorted(
            pair_results,
            key=lambda pair: pair["similarity"],
            reverse=True,
        ),
    }


def format_user_list(usernames):
    if not usernames:
        return ""

    if len(usernames) == 1:
        return usernames[0]

    if len(usernames) == 2:
        return f"{usernames[0]} and {usernames[1]}"

    return f"{', '.join(usernames[:-1])}, and {usernames[-1]}"


def format_pair_list(pairs):
    if not pairs:
        return ""

    pair_names = [
        f"{pair['users'][0]} + {pair['users'][1]}"
        for pair in pairs
    ]

    if len(pair_names) == 1:
        return pair_names[0]

    if len(pair_names) == 2:
        return f"{pair_names[0]} and {pair_names[1]}"

    return f"{', '.join(pair_names[:-1])}, and {pair_names[-1]}"


def get_biggest_upset(game_breakdown):
    if not game_breakdown:
        return "N/A"

    lowest_percent = min(game["percentCorrect"] for game in game_breakdown)

    biggest_upset_games = [
        game for game in game_breakdown
        if game["percentCorrect"] == lowest_percent
    ]

    return format_game_list(biggest_upset_games)

def get_most_predictable_games(game_breakdown):
    if not game_breakdown:
        return []

    highest_percent = max(game["percentCorrect"] for game in game_breakdown)

    return [
        game for game in game_breakdown
        if game["percentCorrect"] == highest_percent
    ]


def get_most_chaotic_games(game_breakdown):
    if not game_breakdown:
        return []

    lowest_percent = min(game["percentCorrect"] for game in game_breakdown)

    return [
        game for game in game_breakdown
        if game["percentCorrect"] == lowest_percent
    ]


def format_game_list(games):
    if not games:
        return ""

    if len(games) == 1:
        return games[0]["game"]

    if len(games) == 2:
        return f"{games[0]['game']} and {games[1]['game']}"

    game_names = [game["game"] for game in games]
    return f"{', '.join(game_names[:-1])}, and {game_names[-1]}"


def format_winner_list(games):
    unique_winners = []

    for game in games:
        winner = game.get("winner", "")
        if winner and winner not in unique_winners:
            unique_winners.append(winner)

    if len(unique_winners) == 1:
        return unique_winners[0]

    if len(unique_winners) == 2:
        return f"{unique_winners[0]} and {unique_winners[1]}"

    return f"{', '.join(unique_winners[:-1])}, and {unique_winners[-1]}"


def build_insights(game_breakdown, similarity_data):
    most_predictable_games = get_most_predictable_games(game_breakdown)
    most_chaotic_games = get_most_chaotic_games(game_breakdown)

    if most_predictable_games:
        predictable_percent = most_predictable_games[0]["percentCorrect"]
        predictable_text = (
            f"{format_game_list(most_predictable_games)} "
            f"{'was' if len(most_predictable_games) == 1 else 'were'} "
            f"the most predictable "
            f"{'game' if len(most_predictable_games) == 1 else 'games'}, "
            f"with {predictable_percent}% of submitted picks choosing "
            f"{format_winner_list(most_predictable_games)}."
        )
    else:
        predictable_text = "Not enough game data yet."

    if most_chaotic_games:
        chaotic_percent = most_chaotic_games[0]["percentCorrect"]
        chaotic_text = (
            f"{format_game_list(most_chaotic_games)} "
            f"{'was' if len(most_chaotic_games) == 1 else 'were'} "
            f"the most chaotic "
            f"{'game' if len(most_chaotic_games) == 1 else 'games'}, "
            f"with only {chaotic_percent}% of users picking "
            f"{format_winner_list(most_chaotic_games)}."
        )
    else:
        chaotic_text = "Not enough game data yet."

    most_unique_users = similarity_data.get("mostUniqueUsers", [])
    most_similar_pairs = similarity_data.get("mostSimilarPairs", [])

    if most_unique_users:
        unique_average = most_unique_users[0]["averageSimilarity"]
        unique_names = format_user_list([
            user["username"] for user in most_unique_users
        ])

        unique_text = (
            f"{unique_names} had the most unique "
            f"{'bracket' if len(most_unique_users) == 1 else 'brackets'}, "
            f"averaging only {unique_average}% similarity with the rest of the leaderboard."
        )
    else:
        unique_text = "Not enough similarity data yet."

    if most_similar_pairs:
        similar_percent = most_similar_pairs[0]["similarity"]
        similar_text = (
            f"{format_pair_list(most_similar_pairs)} had the most similar "
            f"{'bracket pair' if len(most_similar_pairs) == 1 else 'bracket pairs'}, "
            f"matching {similar_percent}% of comparable picks."
        )
    else:
        similar_text = "Not enough similarity data yet."

    return {
        "mostPredictableGame": predictable_text,
        "mostChaoticGame": chaotic_text,
        "mostUniqueBracket": unique_text,
        "mostSimilarBrackets": similar_text,
    }


def get_tiebreaker_bonus(username):
    return TIEBREAKER_BONUSES.get(normalize(username), 0)


def format_score(score):
    if float(score).is_integer():
        return int(score)

    return score

def build_score_distribution(leaderboard):
    distribution = {}

    for user in leaderboard:
        score = str(user["score"])
        distribution[score] = distribution.get(score, 0) + 1

    return [
        {
            "score": score,
            "count": count,
        }
        for score, count in sorted(
            distribution.items(),
            key=lambda item: float(item[0])
        )
    ]

def build_chaos_ranking(game_breakdown):
    return sorted(
        game_breakdown,
        key=lambda game: game["percentCorrect"]
    )


def get_best_underdog_pick(user, user_picks, game_breakdown):
    uid = user["uid"]
    picks = user_picks.get(uid, {})

    best_pick = None

    for game in game_breakdown:
        game_id = game["game"].replace("Game ", "")
        user_pick = picks.get(game_id)

        if not user_pick:
            continue

        if normalize(user_pick) != normalize(game["winner"]):
            continue

        # Lower percentCorrect = harder/more impressive correct pick.
        if best_pick is None or game["percentCorrect"] < best_pick["percentCorrect"]:
            best_pick = game

    if not best_pick:
        return "No standout upset pick"

    return f"{best_pick['winner']} in {best_pick['game']} ({best_pick['percentCorrect']}% correct)"


def calculate_user_pick_style(user, user_picks, game_breakdown):
    uid = user["uid"]
    picks = user_picks.get(uid, {})

    popularity_per_pick = []

    for game in game_breakdown:
        game_id = game["game"].replace("Game ", "")
        user_pick = picks.get(game_id)

        if not user_pick:
            continue

        popularity_rows = game.get("pickPopularity", [])

        for row in popularity_rows:
          if normalize(row["team"]) == normalize(user_pick):
              popularity_per_pick.append(row["percent"])
              break

    if not popularity_per_pick:
        return "Incomplete"

    average_pick_popularity = sum(popularity_per_pick) / len(popularity_per_pick)

    if average_pick_popularity >= 65:
        return "Chalk"
    if average_pick_popularity <= 40:
        return "Contrarian"

    return "Balanced"


def build_user_recaps(leaderboard, valid_users, user_picks, game_breakdown):
    users_by_username = {
        user.get("username", user.get("uid", "Unknown")): user
        for user in valid_users
    }

    recaps = []

    for row in leaderboard:
        username = row["username"]
        user = users_by_username.get(username)

        if not user:
            continue

        recaps.append(
            {
                "rank": row["rank"],
                "username": username,
                "score": row["score"],
                "accuracy": row["accuracy"],
                "style": calculate_user_pick_style(user, user_picks, game_breakdown),
                "bestPick": get_best_underdog_pick(user, user_picks, game_breakdown),
            }
        )

    return recaps

def build_leaderboard(valid_users, total_locked_games):
    users_with_adjusted_scores = []

    for user in valid_users:
        username = user.get("username", user.get("uid", "Unknown"))
        raw_score = float(user.get("score", 0) or 0)
        bonus = get_tiebreaker_bonus(username)
        adjusted_score = raw_score + bonus

        users_with_adjusted_scores.append(
            {
                **user,
                "rawScore": raw_score,
                "bonus": bonus,
                "adjustedScore": adjusted_score,
            }
        )

    sorted_users = sorted(
        users_with_adjusted_scores,
        key=lambda user: user["adjustedScore"],
        reverse=True,
    )

    leaderboard = []
    current_rank = 1
    index = 0

    while index < len(sorted_users):
        current_score = sorted_users[index]["adjustedScore"]

        tied_group = [
            user
            for user in sorted_users
            if user["adjustedScore"] == current_score
        ]

        is_tied = len(tied_group) > 1
        rank_label = f"T-{current_rank}" if is_tied else str(current_rank)

        for user in tied_group:
            username = user.get("username", user.get("uid", "Unknown"))

            leaderboard.append(
                {
                    "rank": rank_label,
                    "username": username,
                    "score": format_score(user["adjustedScore"]),
                    "rawScore": format_score(user["rawScore"]),
                    "bonus": user["bonus"],
                    "accuracy": calculate_user_accuracy(
                        user["rawScore"], total_locked_games
                    ),
                }
            )

        current_rank += len(tied_group)
        index += len(tied_group)

    return leaderboard


def write_js_data_file(data):
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    js_content = (
        "// src/data/analytics2025Data.js\n\n"
        "// Auto-generated by scripts/analyze_2025.py\n"
        "// Do not manually edit this file once real data generation is active.\n\n"
        f"export const analytics2025Data = {json.dumps(data, indent=2)};\n"
    )

    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
        file.write(js_content)

    print(f"✅ Wrote analytics data to: {OUTPUT_FILE}")


def main():
    users = load_json("users.json")
    user_picks = load_json("userPicks.json")
    games = load_json("games.json")

    valid_users = [user for user in users if is_valid_2025_leaderboard_user(user)]
    locked_games = get_locked_games(games)

    total_players = len(valid_users)
    total_games = len(locked_games)

    raw_scores = [float(user.get("score", 0) or 0) for user in valid_users]

    adjusted_scores = [
        float(user.get("score", 0) or 0) + get_tiebreaker_bonus(user.get("username", ""))
        for user in valid_users
    ]

    average_score = round(mean(adjusted_scores), 2) if adjusted_scores else 0
    winning_score = max(adjusted_scores) if adjusted_scores else 0

    game_breakdown = calculate_game_breakdown(valid_users, user_picks, locked_games)
    similarity_data = build_similarity_data(valid_users, user_picks, locked_games)
    leaderboard = build_leaderboard(valid_users, total_games)
    score_distribution = build_score_distribution(leaderboard)
    chaos_ranking = build_chaos_ranking(game_breakdown)
    user_recaps = build_user_recaps(
        leaderboard,
        valid_users,
        user_picks,
        game_breakdown,
    )

    analytics_data = {
        "overview": {
            "totalPlayers": total_players,
            "totalGames": total_games,
            "averageScore": average_score,
            "winningScore": format_score(winning_score),
            "biggestUpset": get_biggest_upset(game_breakdown),
        },
        "leaderboard": leaderboard,
        "scoreDistribution": score_distribution,
        "gameBreakdown": game_breakdown,
        "chaosRanking": chaos_ranking,
        "userRecaps": user_recaps,
        "similarity": similarity_data,
        "insights": build_insights(game_breakdown, similarity_data),
    }

    write_js_data_file(analytics_data)


if __name__ == "__main__":
    main()