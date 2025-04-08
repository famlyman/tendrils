// app/team-creation.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "../supabase";

export default function TeamCreation() {
  const [teamName, setTeamName] = useState("");

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase(); // e.g., "ABC123"
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert("Error", "Please enter a team name.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const joinCode = generateJoinCode();
      const { error } = await supabase
        .from("teams")
        .insert({
          team_name: teamName,
          captain_id: user.id,
          join_code: joinCode,
        });

      if (error) throw error;

      Alert.alert("Success", `Team created! Join code: ${joinCode}`);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.log("Error creating team:", err);
      Alert.alert("Error", "Failed to create team. Try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Team</Text>
      <Text style={styles.description}>As a Captain, set up your team below.</Text>
      <TextInput
        style={styles.input}
        placeholder="Team Name"
        value={teamName}
        onChangeText={setTeamName}
      />
      <Button title="Create Team" onPress={handleCreateTeam} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
});