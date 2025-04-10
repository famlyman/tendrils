import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { supabase } from "../supabase";
import { router } from "expo-router";

export default function CoordinatorDashboard() {
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndTeams = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          Alert.alert("Error", "You must be logged in.");
          router.replace("/login");
          return;
        }

        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role_id")
          .eq("user_id", user.id);
        if (roleError) throw roleError;

        const roleIds = roleData.map(item => item.role_id);
        const { data: roles, error: rolesError } = await supabase
          .from("roles")
          .select("role_name")
          .in("role_id", roleIds);
        if (rolesError) throw rolesError;

        const roleNames = roles.map(r => r.role_name);
        setUserRoles(roleNames);

        if (!roleNames.includes("Coordinator")) {
          Alert.alert("Access Denied", "Only Coordinators can view this page.");
          router.replace("/(tabs)/home");
          return;
        }

        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("team_id, team_name, captain_id, team_records(wins, losses, total_points)")
          .order("team_id");
        if (teamError) throw teamError;

        setTeams(teamData.map(team => ({
          team_id: team.team_id,
          team_name: team.team_name,
          wins: team.team_records?.[0]?.wins ?? 0,
          losses: team.team_records?.[0]?.losses ?? 0,
          total_points: team.team_records?.[0]?.total_points ?? 0,
        })));
      } catch (err) {
        console.log("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndTeams();
  }, []);

  const renderTeam = ({ item }: { item: { team_id: number; team_name: string; wins: number; losses: number; total_points: number } }) => (
    <View style={styles.teamItem}>
      <Text style={styles.teamName}>{item.team_name}</Text>
      <Text>Wins: {item.wins} | Losses: {item.losses} | Points: {item.total_points}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!userRoles.includes("Coordinator")) {
    return null; // Redirect handled in useEffect
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coordinator Dashboard</Text>
      <Text style={styles.subtitle}>Team Standings</Text>
      {teams.length > 0 ? (
        <FlatList
          data={teams}
          renderItem={renderTeam}
          keyExtractor={item => item.team_id.toString()}
          style={styles.teamList}
        />
      ) : (
        <Text>No teams found.</Text>
      )}
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
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  teamList: {
    width: "100%",
  },
  teamItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  teamName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});