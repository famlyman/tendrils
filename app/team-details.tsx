// app/team-details.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../supabase";

export default function TeamDetails() {
  const { teamName } = useLocalSearchParams();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("teams")
          .select("team_name, captain_id, join_code, team_records(wins, losses, total_points)")
          .eq("team_name", decodeURIComponent(teamName as string))
          .single();
        if (error) throw error;

        setTeam({
          team_name: data.team_name,
          captain_id: data.captain_id,
          join_code: data.join_code,
          wins: data.team_records?.[0]?.wins ?? 0,
          losses: data.team_records?.[0]?.losses ?? 0,
          total_points: data.team_records?.[0]?.total_points ?? 0,
        });
      } catch (err) {
        console.log("Error fetching team details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamDetails();
  }, [teamName]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.container}>
        <Text>Team not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{team.team_name}</Text>
      <Text>Wins: {team.wins}</Text>
      <Text>Losses: {team.losses}</Text>
      <Text>Total Points: {team.total_points}</Text>
      <Text>Join Code: {team.join_code}</Text>
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