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
import { COLORS, TYPOGRAPHY } from "../constants/theme";
import { router } from "expo-router";

import SeasonManager from "../components/SeasonManager";
import CoordinatorMatchesSection from "../components/CoordinatorMatchesSection";
import SendAnnouncementModal from "../components/SendAnnouncementModal";
import AddLadderModal from "../components/AddLadderModal";
import EditLadderModal from "../components/EditLadderModal";

interface Profile {
  id: string;
  name: string;
  // Add other fields from profiles as needed
}

export default function CoordinatorDashboard() {
  const [laddersRefreshTrigger, setLaddersRefreshTrigger] = useState(0);
  const [userRoles, setUserRoles] = useState<string[]>([]);
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
        const { data, error } = await supabase.from("profiles").select("user_id, name");
        if (error) throw error;
        setPlayers(data || []);
      } catch (err) {
        console.error("Error fetching players:", err);
      }
    };
    fetchPlayers();
  }, []);

  // Fetch user and validate coordinator role
  useEffect(() => {
    const fetchUserAndValidateRole = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          Alert.alert("Error", "You must be logged in.");
          router.replace("/login");
          return;
        }

        type UserRoleWithName = { role: { name: string } | null };
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role:role(name)")
          .eq("user_id", user.id);
        if (roleError) throw roleError;

        const roleNames = ((roleData || []) as unknown as UserRoleWithName[])
          .map((item) => Array.isArray(item.role) ? item.role[0]?.name : item.role?.name)
          .filter((name): name is string => typeof name === 'string');
        setUserRoles(roleNames);

        if (!roleNames.some((role) => role.toLowerCase() === "coordinator")) {
          Alert.alert("Access Denied", "Only Coordinators can view this page.");
          router.replace("/(tabs)/home");
          return;
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndValidateRole();
  }, []);

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
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        target_type: targetType,
        target_id: targetId || null,
        ladder_id: ladderId || null,
        content,
        topic: "announcement", // required
        extension: "text",     // required
      });
      if (error) {
        Alert.alert("Error", error.message || "Failed to send announcement.");
        return;
      }
      Alert.alert("Success", "Announcement sent!");
      setAnnouncementModalVisible(false);
    } catch (e) {
      Alert.alert("Error", "Failed to send announcement.");
    }
  };

  if (loading) return <ActivityIndicator />;

  // Define data structure for FlatList - removed pending teams section
  const sections = [
    { type: "announcement_button" },
    { type: "ladders", data: ladders },
    { type: "seasons" },
    ...(ladders.length > 0 ? [{ type: "pending_matches", ladderId: ladders[0].ladder_id }] : []),
  ];

  // Render each section - removed pending teams rendering
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
        teams={[]} // Empty array since we no longer track pending teams
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
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  ladderCard: {
    backgroundColor: "#f0f0f0",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  ladderName: { fontSize: 18, fontWeight: "bold", color: "#1976d2" },
  announceBtn: {
    backgroundColor: COLORS.secondary,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 18,
  },
  announceBtnText: { color: COLORS.text.dark, fontWeight: "bold", fontSize: 16 },
});