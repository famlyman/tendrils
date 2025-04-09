// app/(tabs)/teams.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../supabase";

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
      <Text>{item.team_name} — W: {item.wins}, L: {item.losses}, Pts: {item.total_points}</Text>
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
      <Text style={styles.title}>Teams</Text>
      <FlatList
        data={teams}
        keyExtractor={item => item.team_name}
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