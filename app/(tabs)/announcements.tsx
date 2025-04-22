import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { supabase } from "../../supabase";
import { useAuth } from "../../context/AuthContext";

interface Announcement {
  message_id: string;
  sender_id: string;
  target_type: string;
  target_id: string | null;
  ladder_id: string | null;
  content: string;
  created_at: string;
}

const AnnouncementsScreen: React.FC = () => {
  const { userId } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [userTeams, setUserTeams] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserTeams = async () => {
      // Get all team_ids for this user (for team-targeted announcements)
      const { data, error } = await supabase
        .from("user_teams")
        .select("team_id")
        .eq("user_id", userId);
      if (!error && data) {
        setUserTeams(data.map((row: any) => row.team_id));
      }
    };
    if (userId) fetchUserTeams();
  }, [userId]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      // Fetch global, user, and team-targeted messages
      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      const { data, error } = await query;
      if (error) {
        setAnnouncements([]);
        setLoading(false);
        return;
      }
      // Filter relevant messages
      const relevant = (data as Announcement[]).filter(msg =>
        msg.target_type === "all" ||
        (msg.target_type === "player" && msg.target_id === userId) ||
        (msg.target_type === "team" && userTeams.includes(msg.target_id || ""))
      );
      setAnnouncements(relevant);
      setLoading(false);
    };
    fetchAnnouncements();
  }, [userId, userTeams]);

  if (loading) return <ActivityIndicator />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Announcements</Text>
      <FlatList
        data={announcements}
        keyExtractor={item => item.message_id}
        renderItem={({ item }) => (
          <View style={styles.announcementCard}>
            <Text style={styles.content}>{item.content}</Text>
            <Text style={styles.meta}>
              {new Date(item.created_at).toLocaleString()} | {item.target_type === 'all' ? 'All' : item.target_type.charAt(0).toUpperCase() + item.target_type.slice(1)}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No announcements yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  announcementCard: { backgroundColor: "#fff", padding: 14, borderRadius: 8, marginBottom: 12 },
  content: { fontSize: 16, marginBottom: 6 },
  meta: { color: "#888", fontSize: 12 },
  emptyText: { textAlign: "center", marginTop: 40, color: "#888" },
});

export default AnnouncementsScreen;
