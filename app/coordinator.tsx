import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Button,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../supabase";
import { router } from "expo-router";

import SeasonManager from "../components/SeasonManager";
import CoordinatorMatchesSection from "../components/CoordinatorMatchesSection";
import SendAnnouncementModal from "../components/SendAnnouncementModal";
import AddLadderModal from "../components/AddLadderModal";
import EditLadderModal from "../components/EditLadderModal";

export default function CoordinatorDashboard() {
  const [laddersRefreshTrigger, setLaddersRefreshTrigger] = useState(0);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ladders, setLadders] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [addLadderModalVisible, setAddLadderModalVisible] = useState(false);
  const [editLadderModalVisible, setEditLadderModalVisible] = useState(false);
  const [ladderToEdit, setLadderToEdit] = useState<any | null>(null);

  // Fetch ladders
  const fetchLadders = async () => {
    try {
      const { data, error } = await supabase.from("ladders").select("*");
      if (error) throw error;
      setLadders(data || []);
    } catch (err) {
      console.error("Error fetching ladders:", err);
    }
  };

  useEffect(() => {
    fetchLadders();
  }, []);

  // Fetch players
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

  // Fetch user and teams
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
          .select("role")
          .eq("user_id", user.id);
        if (roleError) throw roleError;

        const roleIds = roleData.map((item) => item.role);
        const { data: roles, error: rolesError } = await supabase
          .from("roles")
          .select("name")
          .in("id", roleIds);
        if (rolesError) throw rolesError;

        const roleNames = roles.map((r) => r.name);
        setUserRoles(roleNames);

        if (!roleNames.some((role) => role.toLowerCase() === "coordinator")) {
          Alert.alert("Access Denied", "Only Coordinators can view this page.");
          router.replace("/(tabs)/home");
          return;
        }

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
    const { error } = await supabase
      .from("teams")
      .update({ status: "approved" })
      .eq("team_id", team_id);
    if (!error) {
      setTeams(teams.filter((t) => t.team_id !== team_id));
      Alert.alert("Success", "Team approved.");
    } else {
      Alert.alert("Error", "Could not approve team.");
    }
  };

  // Reject handler
  const handleReject = async (team_id: string) => {
    const { error } = await supabase
      .from("teams")
      .update({ status: "rejected" })
      .eq("team_id", team_id);
    if (!error) {
      setTeams(teams.filter((t) => t.team_id !== team_id));
      Alert.alert("Success", "Team rejected.");
    } else {
      Alert.alert("Error", "Could not reject team.");
    }
  };

  // Handle sending announcement
  const handleSendAnnouncement = async ({
    content,
    targetType,
    targetId,
    ladderId,
  }: {
    content: string;
    targetType: string;
    targetId?: string | null;
    ladderId?: string | null;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");
      await supabase.from("messages").insert({
        sender_id: user.id,
        target_type: targetType,
        target_id: targetId || null,
        ladder_id: ladderId || null,
        content,
      });
      Alert.alert("Success", "Announcement sent!");
      setAnnouncementModalVisible(false);
    } catch (e) {
      Alert.alert("Error", "Failed to send announcement.");
    }
  };

  if (loading) return <ActivityIndicator />;

  // Define data structure for FlatList
  const sections = [
    { type: "announcement_button" },
    { type: "pending_teams", data: teams },
    { type: "ladders", data: ladders },
    { type: "seasons" },
    ...(ladders.length > 0 ? [{ type: "pending_matches", ladderId: ladders[0].ladder_id }] : []),
  ];

  // Render each section
  const renderItem = ({ item }: { item: any }) => {
    switch (item.type) {
      case "announcement_button":
        return (
          <TouchableOpacity
            style={styles.announceBtn}
            onPress={() => setAnnouncementModalVisible(true)}
          >
            <Text style={styles.announceBtnText}>Send Announcement</Text>
          </TouchableOpacity>
        );
      case "pending_teams":
        return (
          <View style={styles.sectionCard}>
            <Text style={styles.header}>Pending Teams</Text>
            {item.data.length === 0 ? (
              <Text>No pending teams.</Text>
            ) : (
              item.data.map((team: any) => (
                <View key={team.team_id} style={styles.teamCard}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text>Status: {team.status}</Text>
                  <View style={styles.actionRow}>
                    <Button title="Approve" onPress={() => handleApprove(team.team_id)} />
                    <Button
                      title="Reject"
                      onPress={() => handleReject(team.team_id)}
                      color="red"
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        );
      case "ladders":
        return (
          <View style={styles.sectionCard}>
            <Text style={styles.header}>Ladders</Text>
            {item.data.length === 0 ? (
              <Text>No ladders found.</Text>
            ) : (
              item.data.map((ladder: any) => (
                <View key={ladder.ladder_id} style={styles.ladderCard}>
                  <Text style={styles.ladderName}>{ladder.name}</Text>
                  <Text>Type: {ladder.type}</Text>
                  <Text>Description: {ladder.description}</Text>
                  <Button
                    title="Edit"
                    onPress={() => {
                      setLadderToEdit(ladder);
                      setEditLadderModalVisible(true);
                    }}
                  />
                </View>
              ))
            )}
            <Button
              title="Add Ladder"
              onPress={() => setAddLadderModalVisible(true)}
            />
          </View>
        );
      case "seasons":
        return (
          <View style={styles.sectionCard}>
            <SeasonManager laddersRefreshTrigger={laddersRefreshTrigger} />
          </View>
        );
      case "pending_matches":
        return (
          <View style={[styles.sectionCard, { marginTop: 32 }]}>
            <Text style={styles.header}>Pending Match Scores</Text>
            <CoordinatorMatchesSection ladderId={item.ladderId} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sections}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
      <SendAnnouncementModal
        visible={announcementModalVisible}
        onClose={() => setAnnouncementModalVisible(false)}
        onSend={handleSendAnnouncement}
        ladders={ladders}
        teams={teams}
        players={players}
      />
      <EditLadderModal
        visible={editLadderModalVisible}
        onClose={() => setEditLadderModalVisible(false)}
        onUpdated={() => {
          fetchLadders();
          setLaddersRefreshTrigger((v) => v + 1);
        }}
        ladder={ladderToEdit || { ladder_id: "", name: "", type: "", description: "" }}
      />
      <AddLadderModal
        visible={addLadderModalVisible}
        onClose={() => setAddLadderModalVisible(false)}
        onAdded={() => {
          fetchLadders();
          setLaddersRefreshTrigger((v) => v + 1);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  sectionCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  teamCard: { backgroundColor: "#fff", padding: 16, borderRadius: 8, marginBottom: 12 },
  teamName: { fontSize: 18, fontWeight: "bold" },
  ladderCard: {
    backgroundColor: "#e3f2fd",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  ladderName: { fontSize: 18, fontWeight: "bold", color: "#1976d2" },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  announceBtn: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 18,
  },
  announceBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});