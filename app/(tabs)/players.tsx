// app/(tabs)/players.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { supabase } from "../../supabase";
import * as Animatable from "react-native-animatable";

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
      <Text style={styles.itemText}>
        {item.name} — W: {item.wins}, L: {item.losses}, Pts: {item.points}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
        <ActivityIndicator size="large" color="#FFD700" />
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
        <Text style={styles.errorText}>{error}</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
      <Animatable.View animation="fadeIn" duration={1000} style={styles.content}>
        <Image source={require("../../assets/images/pickleball.png")} style={styles.icon} />
        <Text style={styles.title}>Players</Text>
        <FlatList
          data={players}
          keyExtractor={item => item.name}
          renderItem={renderItem}
        />
      </Animatable.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  icon: {
    width: 50,
    height: 50,
    marginBottom: 20,
    alignSelf: "center",
  },
  title: {
    fontSize: 36,
    fontFamily: "AmaticSC-Bold",
    color: "#1A3C34", // Changed to dark green
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginBottom: 20,
  },
  item: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  itemText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
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
    fontFamily: "Roboto-Regular",
    color: "#1A3C34", // Changed to dark green
    textAlign: "center",
  },
});