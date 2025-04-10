// app/player-details.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, StatusBar, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../supabase";
import * as Animatable from "react-native-animatable";

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
      <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
        <ActivityIndicator size="large" color="#FFD700" />
      </LinearGradient>
    );
  }

  if (!player) {
    return (
      <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
        <Animatable.View animation="fadeIn" duration={1000} style={styles.content}>
          <Image source={require("../assets/images/pickleball.png")} style={styles.icon} />
          <Text style={styles.title}>Player Details</Text>
          <Text style={styles.errorText}>Player not found</Text>
        </Animatable.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
      <Animatable.View animation="fadeIn" duration={1000} style={styles.content}>
        <Image source={require("../assets/images/pickleball.png")} style={styles.icon} />
        <Text style={styles.title}>{player.name}</Text>
        <View style={styles.card}>
          <Text style={styles.statText}>Wins: {player.wins}</Text>
          <Text style={styles.statText}>Losses: {player.losses}</Text>
          <Text style={styles.statText}>Points: {player.points}</Text>
        </View>
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
    alignItems: "center",
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
    color: "#1A3C34",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  statText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    textAlign: "center",
  },
});