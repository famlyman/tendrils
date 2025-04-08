import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function TeamDetails() {
  const { teamId } = useLocalSearchParams();
  // Mock details for now
  const team = { id: teamId, name: `Team ${teamId}`, details: "This is a great team!" };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{team.name}</Text>
      <Text>{team.details}</Text>
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