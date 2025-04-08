import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function PlayerDetails() {
  const { playerId } = useLocalSearchParams();
  // Mock details for now
  const player = { id: playerId, name: `Player ${playerId}`, details: "Skilled player!" };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{player.name}</Text>
      <Text>{player.details}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});