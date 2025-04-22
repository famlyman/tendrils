import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, Button, TouchableOpacity } from "react-native";
import { supabase } from "../supabase";
import { router } from "expo-router";

import SeasonManager from "../components/SeasonManager";
import CoordinatorMatchesSection from "../components/CoordinatorMatchesSection";
import SendAnnouncementModal from "../components/SendAnnouncementModal";

export default function CoordinatorDashboard() {
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ladders, setLadders] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);

  useEffect(() => {
    const fetchLadders = async () => {
      try {
        const { data, error } = await supabase.from("ladders").select("*");
        if (error) throw error;
        setLadders(data || []);
      } catch (err) {
        console.error("Error fetching ladders:", err);
      }
    };
    fetchLadders();
  }, []);

  // Fetch all players for targeted messaging
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("id, name");
        if (error) throw error;
        setPlayers(data || []);
      } catch (err) {
        console.error("Error fetching players:", err);
      }
    };
    fetchPlayers();
  }, []);


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

  // Handler for sending an announcement
  const handleSendAnnouncement = async ({ content, targetType, targetId, ladderId }: { content: string, targetType: string, targetId?: string | null, ladderId?: string | null }) => {
    try {
      // Get current user as sender
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");
      await supabase.from("messages").insert({
        sender_id: user.id,
        target_type: targetType,
        target_id: targetId || null,
        ladder_id: ladderId || null,
        content
      });
      Alert.alert("Success", "Announcement sent!");
      setAnnouncementModalVisible(false);
    } catch (e) {
      Alert.alert("Error", "Failed to send announcement.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.announceBtn} onPress={() => setAnnouncementModalVisible(true)}>
        <Text style={styles.announceBtnText}>Send Announcement</Text>
      </TouchableOpacity>
      <SendAnnouncementModal
        visible={announcementModalVisible}
        onClose={() => setAnnouncementModalVisible(false)}
        onSend={handleSendAnnouncement}
        ladders={ladders}
        teams={teams}
        players={players}
      />
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
      {/* --- NEW: Coordinator Match Score Entry Section --- */}
      {ladders && ladders.length > 0 && (
        <View style={{ marginTop: 32 }}>
          <Text style={styles.header}>Pending Match Scores</Text>
          {/* Show for the first ladder by default; can be extended for selection */}
          <CoordinatorMatchesSection ladderId={ladders[0].ladder_id} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  teamCard: { backgroundColor: "#fff", padding: 16, borderRadius: 8, marginBottom: 12 },
  teamName: { fontSize: 18, fontWeight: "bold" },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  announceBtn: { backgroundColor: '#2196f3', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 18 },
  announceBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});