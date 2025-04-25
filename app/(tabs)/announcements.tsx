import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { supabase } from "../../supabase";
import { useAuth } from "../../context/AuthContext";
import BackgroundWrapper from "../../components/BackgroundWrapper";
import LoadingScreen from "../../components/LoadingScreen";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";

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

  if (!userId || loading) {
    return (
      <BackgroundWrapper>
        <LoadingScreen />
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
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
    </BackgroundWrapper>
  );
}
;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: {
    fontSize: TYPOGRAPHY.sizes.landing.title,
    fontFamily: TYPOGRAPHY.fonts.heading,
    color: COLORS.text.dark,
    marginBottom: 16,
    textAlign: "center",
  },
  announcementCard: {
    backgroundColor: COLORS.background.card,
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  content: {
    fontSize: 16,
    marginBottom: 6,
    fontFamily: TYPOGRAPHY.fonts.body,
    color: "#000", // High contrast for readability
  },
  meta: {
    color: COLORS.text.muted,
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fonts.body,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: COLORS.text.muted,
    fontFamily: TYPOGRAPHY.fonts.body,
  },
});

export default AnnouncementsScreen;
