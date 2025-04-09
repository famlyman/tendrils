// app/(tabs)/players.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../supabase";

type PlayerItem = {
  name: string;
  wins?: number;
  losses?: number;
  points?: number;
};

export default function Players() {
  const [players, setPlayers] = useState<PlayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from("players")
          .select("name, individual_records(wins, losses, points)")
          .order("name");
        if (error) throw error;
    
        console.log("Raw players data:", data);
        const formattedPlayers = data.map(player => ({
          name: player.name,
          wins: player.individual_records?.[0]?.wins ?? 0,
          losses: player.individual_records?.[0]?.losses ?? 0,
          points: player.individual_records?.[0]?.points ?? 0,
        }));
        console.log("Formatted players:", formattedPlayers);
        setPlayers(formattedPlayers);
        console.log("Players state set");
      } catch (err: any) {
        console.log("Error fetching players:", err);
        setError("Failed to load players. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  const handlePlayerPress = async (playerName: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push(`/player-details?playerName=${encodeURIComponent(playerName)}`);
    } else {
      Alert.alert("Please log in", "You need to be logged in to view player details.");
    }
  };

  const renderItem = ({ item }: { item: PlayerItem }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handlePlayerPress(item.name)}
    >
      <Text>{item.name} — W: {item.wins}, L: {item.losses}, Pts: {item.points}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Players</Text>
      <FlatList
        data={players}
        keyExtractor={item => item.name}
        renderItem={renderItem}
      />
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
    textAlign: "center",
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
});