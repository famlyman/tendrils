// app/(tabs)/teams.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { supabase } from "../../supabase";
import * as Animatable from "react-native-animatable";

type TeamItem = {
  team_name: string;
  wins?: number;
  losses?: number;
  total_points?: number;
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data, error } = await supabase
          .from("teams")
          .select("team_name, team_records(wins, losses, total_points)")
          .order("team_name");
        if (error) throw error;

        const formattedTeams = data.map(team => ({
          team_name: team.team_name,
          wins: team.team_records[0]?.wins ?? 0,
          losses: team.team_records[0]?.losses ?? 0,
          total_points: team.team_records[0]?.total_points ?? 0,
        }));
        setTeams(formattedTeams);
      } catch (err: any) {
        console.log("Error fetching teams:", err);
        setError("Failed to load teams. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const handleTeamPress = async (teamName: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push(`/team-details?teamName=${encodeURIComponent(teamName)}`);
    } else {
      Alert.alert("Please log in", "You need to be logged in to view team details.");
    }
  };

  const renderItem = ({ item }: { item: TeamItem }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleTeamPress(item.team_name)}
    >
      <Text style={styles.itemText}>
        {item.team_name} — W: {item.wins}, L: {item.losses}, Pts: {item.total_points}
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
        <Text style={styles.title}>Teams</Text>
        <FlatList
          data={teams}
          keyExtractor={item => item.team_name}
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