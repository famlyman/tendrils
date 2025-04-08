// app/player-details.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../supabase";

export default function PlayerDetails() {
  const { playerName } = useLocalSearchParams();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayerDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("individual_standings")
          .select("name, wins, losses, points")
          .eq("name", decodeURIComponent(playerName as string))
          .single();
        if (error) throw error;
        setPlayer(data);
      } catch (err) {
        console.log("Error fetching player details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayerDetails();
  }, [playerName]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!player) {
    return (
      <View style={styles.container}>
        <Text>Player not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{player.name}</Text>
      <Text>Wins: {player.wins}</Text>
      <Text>Losses: {player.losses}</Text>
      <Text>Points: {player.points}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});