// app/(tabs)/matches.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, StatusBar, Modal, TextInput, Alert } from "react-native";
import { supabase } from "../../supabase";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";
import { useRouter } from "expo-router";
import BackgroundWrapper from "../../components/BackgroundWrapper";
import LoadingScreen from "../../components/LoadingScreen";
import { LinearGradient } from "expo-linear-gradient";

const SEGMENTS = ["Recent", "Upcoming"];

interface Profile {
  user_id: string;
  name: string;
  // Add other fields from profiles as needed
}

interface Challenge {
  flower_id: string;
  vine_id: string;
  challenger_id?: string;
  opponent_id?: string;
  team_1_id?: string;
  team_2_id?: string;
  status: "pending" | "accepted" | "declined" | "completed";
  date: string;
  winner_id?: string;
  challenger_name?: string;
  opponent_name?: string;
  team_1_name?: string;
  team_2_name?: string;
  team_1_members?: string[];
  team_2_members?: string[];
  team_1_user_ids?: string[];
  team_2_user_ids?: string[];
  match_type: "singles" | "doubles";
  score?: string;
}

export default function Matches() {
  const [segment, setSegment] = useState("Recent");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [upcomingChallenges, setUpcomingChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [score, setScore] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        console.log("[DEBUG] Fetching session...");
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[DEBUG] Session result:", session);
        if (!session) {
          console.log("[DEBUG] No session found, redirecting to /login");
          router.replace("/login");
          return;
        }
        setCurrentUser(session.user);
        console.log("[DEBUG] Set currentUser:", session.user);

        console.log("[DEBUG] Fetching profile for user id:", session.user.id);
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("vine_id")
          .eq("user_id", session.user.id)
          .single();
        console.log("[DEBUG] Profile result:", profile, profileError);

        if (!profile?.vine_id) {
          console.log("[DEBUG] No vine_id in profile. Setting challenges to empty and loading to false.");
          setChallenges([]);
          setUpcomingChallenges([]);
          setLoading(false);
          return;
        }

        // Fetch recent (completed) challenges
        console.log("[DEBUG] Fetching recent challenges for vine_id:", profile.vine_id);
        const { data: recentData, error: recentError } = await supabase
          .from("flowers")
          .select(`
            *,
            challenger:profiles!challenger_id (name),
            opponent:profiles!opponent_id (name),
            team_1:teams!team_1_id (name),
            team_2:teams!team_2_id (name)
          `)
          .eq("vine_id", profile.vine_id)
          .eq("status", "completed")
          .order("date", { ascending: false });
        console.log("[DEBUG] Recent challenges fetch result:", recentData, recentError);

        if (recentError) {
          console.log("[DEBUG] Error fetching recent challenges:", recentError.message);
          Alert.alert("Error", "Failed to load recent challenges.");
        } else {
          const recentChallenges = await Promise.all(
            recentData.map(async (item: any) => {
              let team_1_members: string[] = [];
              let team_2_members: string[] = [];
              let team_1_user_ids: string[] = [];
              let team_2_user_ids: string[] = [];
              if (item.team_1_id) {
                const { data: members1 } = await supabase
                  .from("team_members")
                  .select("user_id, profiles!user_id (name)")
                  .eq("team_id", item.team_1_id);
                team_1_members = members1?.map((m: any) => m.profiles.name) || [];
                team_1_user_ids = members1?.map((m: any) => m.user_id) || [];

                const { data: members2 } = await supabase
                  .from("team_members")
                  .select("user_id, profiles!user_id (name)")
                  .eq("team_id", item.team_2_id);
                team_2_members = members2?.map((m: any) => m.profiles.name) || [];
                team_2_user_ids = members2?.map((m: any) => m.user_id) || [];
              }

              return {
                ...item,
                challenger_name: item.challenger?.name,
                opponent_name: item.opponent?.name,
                team_1_name: item.team_1?.name,
                team_2_name: item.team_2?.name,
                team_1_members,
                team_2_members,
                team_1_user_ids,
                team_2_user_ids,
                match_type: item.challenger_id ? "singles" : "doubles",
              };
            })
          );
          console.log("[DEBUG] Processed recent challenges:", recentChallenges);
          setChallenges(recentChallenges);
        }

        // Fetch upcoming (pending/accepted) challenges
        console.log("[DEBUG] Fetching upcoming challenges for vine_id:", profile.vine_id);
        const { data: upcomingData, error: upcomingError } = await supabase
          .from("flowers")
          .select(`
            *,
            challenger:profiles!challenger_id (name),
            opponent:profiles!opponent_id (name),
            team_1:teams!team_1_id (name),
            team_2:teams!team_2_id (name)
          `)
          .eq("vine_id", profile.vine_id)
          .in("status", ["pending", "accepted"])
          .order("date", { ascending: true });
        console.log("[DEBUG] Upcoming challenges fetch result:", upcomingData, upcomingError);

        if (upcomingError) {
          console.log("[DEBUG] Error fetching upcoming challenges:", upcomingError.message);
          Alert.alert("Error", "Failed to load upcoming challenges.");
        } else {
          const upcomingChallenges = await Promise.all(
            upcomingData.map(async (item: any) => {
              let team_1_members: string[] = [];
              let team_2_members: string[] = [];
              let team_1_user_ids: string[] = [];
              let team_2_user_ids: string[] = [];
              if (item.team_1_id) {
                const { data: members1 } = await supabase
                  .from("team_members")
                  .select("user_id, profiles!user_id (name)")
                  .eq("team_id", item.team_1_id);
                team_1_members = members1?.map((m: any) => m.profiles.name) || [];
                team_1_user_ids = members1?.map((m: any) => m.user_id) || [];

                const { data: members2 } = await supabase
                  .from("team_members")
                  .select("user_id, profiles!user_id (name)")
                  .eq("team_id", item.team_2_id);
                team_2_members = members2?.map((m: any) => m.profiles.name) || [];
                team_2_user_ids = members2?.map((m: any) => m.user_id) || [];
              }

              return {
                ...item,
                challenger_name: item.challenger?.name,
                opponent_name: item.opponent?.name,
                team_1_name: item.team_1?.name,
                team_2_name: item.team_2?.name,
                team_1_members,
                team_2_members,
                team_1_user_ids,
                team_2_user_ids,
                match_type: item.challenger_id ? "singles" : "doubles",
              };
            })
          );
          console.log("[DEBUG] Processed upcoming challenges:", upcomingChallenges);
          setUpcomingChallenges(upcomingChallenges);
        }
      } catch (e) {
        console.log("[DEBUG] Unexpected error:", e);
        Alert.alert("Error", "An unexpected error occurred.");
      } finally {
        console.log("[DEBUG] Setting loading to false");
        setLoading(false);
      }
    };
    fetchChallenges();
  }, []);

  // Show loading spinner until data is ready - MOVED HERE after useEffect
  if (loading || !currentUser) {
    return (
      <BackgroundWrapper>
        <LoadingScreen />
      </BackgroundWrapper>
    );
  }

  const handleAcceptChallenge = async (flower_id: string) => {
    try {
      const { error } = await supabase.rpc("accept_challenge", {
        p_flower_id: flower_id,
        p_opponent_id: currentUser?.id,
      });

      if (error) {
        console.log("Error accepting challenge:", error.message);
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Success", "Challenge accepted!");
        setUpcomingChallenges((prev) =>
          prev.map((c) =>
            c.flower_id === flower_id ? { ...c, status: "accepted" } : c
          )
        );
      }
    } catch (e) {
      console.log("Unexpected error:", e);
      Alert.alert("Error", "Failed to accept challenge.");
    }
  };

  const handleDeclineChallenge = async (flower_id: string) => {
    try {
      const { error } = await supabase.rpc("decline_challenge", {
        p_flower_id: flower_id,
        p_opponent_id: currentUser?.id,
      });

      if (error) {
        console.log("Error declining challenge:", error.message);
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Success", "Challenge declined.");
        setUpcomingChallenges((prev) =>
          prev.filter((c) => c.flower_id !== flower_id)
        );
      }
    } catch (e) {
      console.log("Unexpected error:", e);
      Alert.alert("Error", "Failed to decline challenge.");
    }
  };

  const handleRecordOutcome = async (winner_id: string) => {
    if (!selectedChallenge || !score) return;

    try {
      const { error } = await supabase.rpc("record_challenge_outcome", {
        p_flower_id: selectedChallenge.flower_id,
        p_winner_id: winner_id,
        p_recorder_id: currentUser?.id,
      });

      if (error) {
        console.log("Error recording outcome:", error.message);
        Alert.alert("Error", error.message);
      } else {
        await supabase
          .from("flowers")
          .update({ score })
          .eq("flower_id", selectedChallenge.flower_id);

        Alert.alert("Success", "Challenge outcome recorded!");
        setUpcomingChallenges((prev) =>
          prev.filter((c) => c.flower_id !== selectedChallenge.flower_id)
        );
        setChallenges((prev) => [
          { ...selectedChallenge, status: "completed", winner_id, score },
          ...prev,
        ]);
        setScoreModalVisible(false);
        setScore("");
      }
    } catch (e) {
      console.log("Unexpected error:", e);
      Alert.alert("Error", "Failed to record outcome.");
    }
  };

  const isUserInvolved = (challenge: Challenge) => {
    if (challenge.match_type === "singles") {
      return challenge.challenger_id === currentUser?.id || challenge.opponent_id === currentUser?.id;
    } else {
      return (
        challenge.team_1_user_ids?.includes(currentUser?.id) ||
        challenge.team_2_user_ids?.includes(currentUser?.id)
      );
    }
  };

  const canAcceptDecline = (challenge: Challenge) => {
    if (challenge.match_type === "singles") {
      return challenge.opponent_id === currentUser?.id && challenge.status === "pending";
    } else {
      return challenge.status === "pending" && challenge.team_2_user_ids?.includes(currentUser?.id);
    }
  };

  const data = segment === "Recent" ? challenges : upcomingChallenges;

  type ChallengeWithProfiles = Challenge & {
  challenger?: Profile | null;
  opponent?: Profile | null;
};

const renderMatch = ({ item }: { item: ChallengeWithProfiles }) => (
    <View style={styles.challengeCard}>
      <Text style={styles.challengeTitle}>
        {item.match_type === "singles"
          ? `${item.challenger?.name || "Unknown"} vs ${item.opponent?.name || "Unknown"}`
          : `${item.team_1_name} vs ${item.team_2_name}`}
      </Text>
      <Text style={styles.challengeMeta}>
        {new Date(item.date).toLocaleString()} | Status: {item.status}
      </Text>
      {item.match_type === "doubles" && (
        <Text style={styles.challengeMeta}>
          {item.team_1_members?.join(", ")} vs {item.team_2_members?.join(", ")}
        </Text>
      )}
      {item.score && (
        <Text style={styles.challengeScore}>Score: {item.score}</Text>
      )}
      {segment === "Upcoming" && canAcceptDecline(item) && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAcceptChallenge(item.flower_id)}
          >
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleDeclineChallenge(item.flower_id)}
          >
            <Text style={styles.actionButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
      {segment === "Upcoming" && item.status === "accepted" && isUserInvolved(item) && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedChallenge(item);
            setScoreModalVisible(true);
          }}
        >
          <Text style={styles.actionButtonText}>Enter Score</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {/* Segment Control */}
        <View style={styles.segmentedControl}>
          {SEGMENTS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.segment, segment === s && styles.segmentActive]}
              onPress={() => setSegment(s)}
            >
              <Text style={[styles.segmentText, segment === s && styles.segmentTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Challenge List */}
        <FlatList
          data={data}
          keyExtractor={(item) => item.flower_id}
          renderItem={renderMatch}
          ListEmptyComponent={<Text style={styles.emptyText}>No matches found.</Text>}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={scoreModalVisible}
        onRequestClose={() => setScoreModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Match Score</Text>
            <TextInput
              style={styles.input}
              placeholder="Score (e.g., 11-8)"
              value={score}
              onChangeText={setScore}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleRecordOutcome(selectedChallenge?.match_type === "singles" ? selectedChallenge?.challenger_id! : selectedChallenge?.team_1_id!)}
              >
                <Text style={styles.actionButtonText}>
                  {selectedChallenge?.match_type === "singles" ? selectedChallenge?.challenger_name : selectedChallenge?.team_1_name} Wins
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleRecordOutcome(selectedChallenge?.match_type === "singles" ? selectedChallenge?.opponent_id! : selectedChallenge?.team_2_id!)}
              >
                <Text style={styles.actionButtonText}>
                  {selectedChallenge?.match_type === "singles" ? selectedChallenge?.opponent_name : selectedChallenge?.team_2_name} Wins
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => setScoreModalVisible(false)}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  segmentedControl: {
    flexDirection: "row",
    justifyContent: "center",
    margin: 16,
    borderRadius: 16,
    backgroundColor: COLORS.background.card,
  },
  segment: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 16,
  },
  segmentActive: {
    backgroundColor: COLORS.secondary,
  },
  segmentText: {
    fontFamily: TYPOGRAPHY.fonts.body,
    color: COLORS.text.dark,
    fontSize: 16,
  },
  segmentTextActive: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.dark,
  },
  challengeCard: {
    backgroundColor: COLORS.background.card,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    padding: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  challengeTitle: {
    fontSize: 16,
    color: COLORS.text.dark,
    fontFamily: TYPOGRAPHY.fonts.bold,
    marginBottom: 4,
  },
  challengeMeta: {
    fontSize: 13,
    color: COLORS.text.muted,
    fontFamily: TYPOGRAPHY.fonts.body,
    marginBottom: 2,
  },
  challengeScore: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: TYPOGRAPHY.fonts.bold,
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    margin: 30,
    color: COLORS.text.dark,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fonts.body,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: COLORS.secondary,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: COLORS.text.dark,
    fontFamily: TYPOGRAPHY.fonts.bold,
  },
  declineButton: {
    backgroundColor: "red",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: COLORS.background.card,
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fonts.bold,
    marginBottom: 20,
    color: COLORS.text.dark,
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.text.muted,
    marginBottom: 20,
    fontFamily: TYPOGRAPHY.fonts.body,
    color: COLORS.text.dark,
  },
});