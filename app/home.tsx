import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

// Mock data for individual standings
const individualStandings = [
  { id: "1", name: "Alex", points: 30 },
  { id: "2", name: "Brooke", points: 25 },
  { id: "3", name: "Chris", points: 20 },
  { id: "4", name: "Dana", points: 15 },
];

// Mock data for doubles standings (two-player teams)
const doublesStandings = [
  { id: "d1", players: ["Alex", "Brooke"], points: 55 },
  { id: "d2", players: ["Chris", "Dana"], points: 35 },
  { id: "d3", players: ["Evan", "Fiona"], points: 28 },
];

// Mock data for team standings (aggregating individual and doubles)
const teamStandings = [
  { id: "t1", name: "Team Aces", members: ["Alex", "Brooke", "Chris", "Dana"], points: 90 },
  { id: "t2", name: "Team Smashers", members: ["Evan", "Fiona", "Greg", "Hannah"], points: 60 },
];

export default function Home() {
  const renderIndividualItem = ({ item, index }) => (
    <View style={styles.ladderItem}>
      <Text style={styles.ladderText}>
        {index + 1}. {item.name} - {item.points} points
      </Text>
    </View>
  );

  const renderDoublesItem = ({ item, index }) => (
    <View style={styles.ladderItem}>
      <Text style={styles.ladderText}>
        {index + 1}. {item.players[0]} & {item.players[1]} - {item.points} points
      </Text>
    </View>
  );

  const renderTeamItem = ({ item, index }) => (
    <View style={styles.ladderItem}>
      <Text style={styles.ladderText}>
        {index + 1}. {item.name} - {item.points} points
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Tendrils Standings</Text>

      {/* Individual Standings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Individual Standings</Text>
        <FlatList
          data={individualStandings}
          keyExtractor={(item) => item.id}
          renderItem={renderIndividualItem}
          scrollEnabled={false} // Disable scrolling for small lists (optional)
        />
      </View>

      {/* Doubles Standings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Doubles Standings</Text>
        <FlatList
          data={doublesStandings}
          keyExtractor={(item) => item.id}
          renderItem={renderDoublesItem}
          scrollEnabled={false}
        />
      </View>

      {/* Team Standings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Standings</Text>
        <FlatList
          data={teamStandings}
          keyExtractor={(item) => item.id}
          renderItem={renderTeamItem}
          scrollEnabled={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  ladderItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  ladderText: {
    fontSize: 18,
  },
});