// app/(tabs)/home.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, StatusBar, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../supabase";
import { router } from "expo-router";
import * as Animatable from "react-native-animatable";

type StandingItem = {
  key: string;
  name?: string;
  player1_name?: string;
  player2_name?: string;
  wins: number;
  losses: number;
  points: number;
};

export default function Home() {
  const [individualStandings, setIndividualStandings] = useState<StandingItem[]>([]);
  const [doublesStandings, setDoublesStandings] = useState<StandingItem[]>([]);
  const [teamStandings, setTeamStandings] = useState<StandingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const { data: individualData, error: individualError } = await supabase
          .from("individual_standings")
          .select("*");
        if (individualError) throw individualError;
        setIndividualStandings(individualData.map(item => ({
          key: item.name,
          name: item.name,
          wins: item.wins,
          losses: item.losses,
          points: item.points,
        })));

        const { data: doublesData, error: doublesError } = await supabase
          .from("doubles_standings")
          .select("*");
        if (doublesError) throw doublesError;
        setDoublesStandings(doublesData.map(item => ({
          key: `${item.player1_name}-${item.player2_name}`,
          player1_name: item.player1_name,
          player2_name: item.player2_name,
          wins: item.wins,
          losses: item.losses,
          points: item.points,
        })));

        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("team_id, team_name")
          .order("team_name");
        if (teamsError) throw teamsError;

        const { data: standingsData, error: standingsError } = await supabase
          .from("team_standings")
          .select("team_name, wins, losses, total_points");
        if (standingsError) throw standingsError;

        const mergedStandings = teamsData.map(team => {
          const standing = standingsData.find(s => s.team_name === team.team_name) || {
            wins: 0,
            losses: 0,
            total_points: 0,
          };
          return {
            key: team.team_name,
            name: team.team_name,
            wins: standing.wins,
            losses: standing.losses,
            points: standing.total_points,
          };
        });
        setTeamStandings(mergedStandings);
      } catch (err: any) {
        console.log("Error fetching standings:", err);
        setError("Failed to load standings. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchStandings();
  }, []);

  const renderItem = ({ item }: { item: StandingItem }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => router.push(`/team-details?teamName=${encodeURIComponent(item.name || "")}`)}
    >
      <Text style={styles.itemText}>
        {item.name 
          ? `${item.name}` 
          : `${item.player1_name} & ${item.player2_name}`} 
        {" "}— W: {item.wins}, L: {item.losses}, Pts: {item.points}
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
        <Text style={styles.title}>Standings</Text>

        <Text style={styles.sectionTitle}>Individual</Text>
        <FlatList
          data={individualStandings}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          style={styles.list}
        />

        <Text style={styles.sectionTitle}>Doubles</Text>
        <FlatList
          data={doublesStandings}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          style={styles.list}
        />

        <Text style={styles.sectionTitle}>Teams</Text>
        <FlatList
          data={teamStandings}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          style={styles.list}
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
  sectionTitle: {
    fontSize: 24,
    fontFamily: "Roboto-Bold",
    color: "#1A3C34", // Changed to dark green
    marginTop: 10,
    marginBottom: 10,
  },
  list: {
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