// Matches tab: segmented control for Recent and Upcoming matches
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useDemoData } from "../../components/DemoDataContext";
import { demoTeamMatches, demoTeams } from "../../demoData";

const SEGMENTS = ["Recent", "Upcoming"];

export default function Matches() {
  const { demoMode, matches = [], upcomingMatches = [] } = useDemoData();
  const [segment, setSegment] = useState("Recent");

  // For demo: combine singles and doubles matches
  let singles = matches;
  let doubles = demoTeamMatches;
  let allMatches = [
    ...singles.map(m => ({ ...m, match_type: "singles" })),
    ...doubles.map(m => ({ ...m, match_type: "doubles" }))
  ];
  allMatches = allMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // For now, no upcoming doubles matches in demo
  const data = segment === "Recent" ? allMatches : upcomingMatches;

  return (
    <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
      <View style={styles.segmentedControl}>
        {SEGMENTS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.segment, segment === s && styles.segmentActive]}
            onPress={() => setSegment(s)}
          >
            <Text style={[styles.segmentText, segment === s && styles.segmentTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={data}
        keyExtractor={item => item.match_id || item.id}
        renderItem={({ item }) => (
          <View style={styles.matchItem}>
            <Text style={styles.matchText}>
              {item.match_type === "singles" ? (
                <>
                  <Text style={{ fontWeight: 'bold' }}>Singles</Text>{"  "}
                  {segment === "Recent"
                    ? `${item.player_1} vs ${item.player_2} — Winner: ${item.winner} — ${item.score}`
                    : `${item.player_1} vs ${item.player_2} — Scheduled: ${item.date}`}
                </>
              ) : (
                <>
                  <Text style={{ fontWeight: 'bold' }}>Doubles</Text>{"  "}
                  {(() => {
                    const team1 = demoTeams.find(t => t.team_id === item.team_1);
                    const team2 = demoTeams.find(t => t.team_id === item.team_2);
                    const team1Name = team1 ? team1.name : item.team_1;
                    const team2Name = team2 ? team2.name : item.team_2;
                    const team1Members = team1 ? team1.members.join(" & ") : (item.team_1_players || []).join(" & ");
                    const team2Members = team2 ? team2.members.join(" & ") : (item.team_2_players || []).join(" & ");
                    return segment === "Recent"
                      ? `${team1Name} (${team1Members}) vs ${team2Name} (${team2Members}) — Winner: ${team1Name === item.winner ? team1Name : team2Name} — ${item.score}`
                      : `${team1Name} (${team1Members}) vs ${team2Name} (${team2Members}) — Scheduled: ${item.date}`;
                  })()}
                </>
              )}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No {segment.toLowerCase()} matches.</Text>}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  segmentedControl: {
    flexDirection: "row",
    justifyContent: "center",
    margin: 16,
    borderRadius: 16,
    backgroundColor: "#D0F2E8",
  },
  segment: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 16,
  },
  segmentActive: {
    backgroundColor: "#FFD54F",
  },
  segmentText: {
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    fontSize: 16,
  },
  segmentTextActive: {
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
  },
  matchItem: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  matchText: {
    fontSize: 15,
    color: "#1A3C34",
    fontFamily: "Roboto-Regular",
  },
  emptyText: {
    textAlign: "center",
    margin: 30,
    color: "#1A3C34",
    fontSize: 16,
  },
});
