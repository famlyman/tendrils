import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, Button } from "react-native";
import { supabase } from "../supabase";
import { router } from "expo-router";

import SeasonManager from "./components/SeasonManager";

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

        // Role check (as you already have)
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

        // Fetch only pending teams
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("team_id, name, status")
          .eq("status", "pending")
          .order("created_at");
        if (teamError) throw teamError;

        setTeams(teamData);
      } catch (err) {
        console.log("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndTeams();
  }, []);

  // Approve handler
  const handleApprove = async (team_id: string) => {
    const { error } = await supabase.from("teams").update({ status: "approved" }).eq("team_id", team_id);
    if (!error) {
      setTeams(teams.filter(t => t.team_id !== team_id));
      Alert.alert("Success", "Team approved.");
    } else {
      Alert.alert("Error", "Could not approve team.");
    }
  };

  // Reject handler
  const handleReject = async (team_id: string) => {
    const { error } = await supabase.from("teams").update({ status: "rejected" }).eq("team_id", team_id);
    if (!error) {
      setTeams(teams.filter(t => t.team_id !== team_id));
      Alert.alert("Success", "Team rejected.");
    } else {
      Alert.alert("Error", "Could not reject team.");
    }
  };

  if (loading) return <ActivityIndicator />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pending Teams</Text>
      <FlatList
        data={teams}
        keyExtractor={item => item.team_id}
        renderItem={({ item }) => (
          <View style={styles.teamCard}>
            <Text style={styles.teamName}>{item.name}</Text>
            <Text>Status: {item.status}</Text>
            <View style={styles.actionRow}>
              <Button title="Approve" onPress={() => handleApprove(item.team_id)} />
              <Button title="Reject" onPress={() => handleReject(item.team_id)} color="red" />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text>No pending teams.</Text>}
      />
      <SeasonManager />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  teamCard: { backgroundColor: "#fff", padding: 16, borderRadius: 8, marginBottom: 12 },
  teamName: { fontSize: 18, fontWeight: "bold" },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 8 },
});