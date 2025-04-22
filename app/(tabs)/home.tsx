// app/(tabs)/home.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from "react-native";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";
import { supabase } from "../../supabase";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import BackgroundWrapper from "../../components/BackgroundWrapper";
import TeamCreationModal from "../../components/TeamCreationModal";
import LadderSelector from "../../components/LadderSelector";
import StandingsList from "../../components/StandingsList";

const SEGMENTS = ["Singles", "Doubles"];

interface PlayerProfile {
  user_id: string;
  name: string;
  rating: number;
  wins: number;
  losses: number;
  position: number;
}

interface TeamProfile {
  team_id: string;
  name: string;
  members: string[];
  wins: number;
  losses: number;
  position: number;
}

type ChallengeTarget = PlayerProfile | TeamProfile | null;

export default function Home() {
  const [challengeTarget, setChallengeTarget] = useState<ChallengeTarget>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [segment, setSegment] = useState("Singles");
  const [singlesStandings, setSinglesStandings] = useState<PlayerProfile[]>([]);
  const [doublesStandings, setDoublesStandings] = useState<TeamProfile[]>([]);
  const [vineId, setVineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userTeams, setUserTeams] = useState<string[]>([]); // Track user's teams for doubles
  const router = useRouter();
  const { userId, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<{ role: string } | null>(null);

  const [ladders, setLadders] = useState<any[]>([]);
  const [selectedLadder, setSelectedLadder] = useState<any>(null);

  const fetchLadders = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("ladders").select("*");
      if (error) throw error;
      setLadders(data || []);
      setSelectedLadder(data?.[0] || null);
    } catch (error) {
      console.error("Error fetching ladders:", error);
    }
  }, []);


  // Fetch user profile (with role)
  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();
      if (!error && data) setUserProfile(data);
    };
    fetchProfile();
  }, [userId]);

  useEffect(() => { fetchLadders(); }, [fetchLadders]);
  // Fetch vineId once on login
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.replace("/login");
      return;
    }
    const fetchVine = async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("vine_id")
          .eq("user_id", userId)
          .single();
        if (profileError || !profile?.vine_id) {
          Alert.alert("Error", "You must join a vine first.");
          setLoading(false);
          return;
        }
        setVineId(profile.vine_id);
      } catch (e) {
        Alert.alert("Error", "An unexpected error occurred.");
      }
    };
    fetchVine();
  }, [userId, authLoading]);

  // Fetch standings when selectedLadder changes
  useEffect(() => {
    if (!selectedLadder || !vineId) return;
    setLoading(true);
    const fetchStandings = async () => {
      try {
        // Singles
        const { data: singlesData, error: singlesError } = await supabase
          .from("user_ladder_nodes")
          .select(`
            user_id,
            position,
            profiles (name, rating),
            fruit_records (wins, losses)
          `)
          .eq("ladder_id", selectedLadder.ladder_id)
          .is("team_id", null)
          .order("position", { ascending: true });
        if (singlesError) {
          setSinglesStandings([]);
        } else {
          const singles = (singlesData || []).map((item: any) => ({
            user_id: item.user_id,
            name: item.profiles?.name || '',
            rating: item.profiles?.rating || 0,
            wins: item.fruit_records?.wins || 0,
            losses: item.fruit_records?.losses || 0,
            position: item.position,
          }));
          setSinglesStandings(singles);
        }
        // Doubles
        const { data: doublesData, error: doublesError } = await supabase
          .from("user_ladder_nodes")
          .select(`
            team_id,
            position,
            teams (name),
            fruit_records (wins, losses)
          `)
          .eq("ladder_id", selectedLadder.ladder_id)
          .is("user_id", null)
          .order("position", { ascending: true });
        if (doublesError) {
          setDoublesStandings([]);
        } else {
          const teamsData = await Promise.all(
            (doublesData || []).map(async (item: any) => {
              const { data: membersData } = await supabase
                .from("team_members")
                .select("user_id, profiles!user_id (name)")
                .eq("team_id", item.team_id);
              const members = membersData?.map((m: any) => m.profiles?.name || "") || [];
              return {
                team_id: item.team_id,
                name: item.teams?.name || '',
                members,
                wins: item.fruit_records?.wins || 0,
                losses: item.fruit_records?.losses || 0,
                position: item.position,
              };
            })
          );
          setDoublesStandings(teamsData);
        }
        // Fetch user's teams
        const { data: userTeamsData } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", userId);
        setUserTeams(userTeamsData?.map((t: any) => t.team_id) || []);
      } catch (e) {
        setSinglesStandings([]);
        setDoublesStandings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStandings();
  }, [selectedLadder, vineId, userId]);

  // JOIN LADDER LOGIC
  const handleJoinLadder = async () => {
    if (!selectedLadder || !vineId) return;
    try {
      if (segment === "Singles") {
        // Insert user into user_ladder_nodes for this ladder
        const { error } = await supabase.from("user_ladder_nodes").insert({
          user_id: userId,
          ladder_id: selectedLadder.ladder_id,
          position: singlesStandings.length + 1,
        });
        if (error) throw error;
        Alert.alert("Success", "You have joined the ladder!");
      } else {
        // Find user's team (first one)
        if (!userTeams || userTeams.length === 0) {
          Alert.alert("Error", "You must create a team first.");
          return;
        }
        // Insert team into user_ladder_nodes for this ladder
        const { error } = await supabase.from("user_ladder_nodes").insert({
          team_id: userTeams[0],
          ladder_id: selectedLadder.ladder_id,
          position: doublesStandings.length + 1,
        });
        if (error) throw error;
        Alert.alert("Success", "Your team has joined the ladder!");
      }
      // Refresh standings
      setLoading(true);
      // Triggers useEffect
      setSelectedLadder({ ...selectedLadder });
    } catch (e) {
      Alert.alert("Error", "Failed to join ladder.");
    }
  };

  // COORDINATOR REMOVE LOGIC
  const handleRemoveFromLadder = async (item: any) => {
    if (!selectedLadder) return;
    Alert.alert(
      "Remove from Ladder",
      `Are you sure you want to remove ${item.name} from this ladder?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive", onPress: async () => {
            try {
              if (segment === "Singles" && "user_id" in item) {
                await supabase
                  .from("user_ladder_nodes")
                  .delete()
                  .eq("user_id", item.user_id)
                  .eq("ladder_id", selectedLadder.ladder_id);
              } else if (segment === "Doubles" && "team_id" in item) {
                await supabase
                  .from("user_ladder_nodes")
                  .delete()
                  .eq("team_id", item.team_id)
                  .eq("ladder_id", selectedLadder.ladder_id);
              }
              // Refresh standings
              setLoading(true);
              setSelectedLadder({ ...selectedLadder });
            } catch (e) {
              Alert.alert("Error", "Failed to remove from ladder.");
            }
          }
        }
      ]
    );
  };

  // Accepts the object from CreateTeamModal and extracts partnerId from members[1]
  const handleCreateTeam = async ({ name, members }: { name: string; members: string[] }) => {
    try {
      if (!vineId || !userId || !members[1]) {
        Alert.alert("Error", "Missing information for team creation.");
        return;
      }
      const partnerId = members[1];
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert({ vine_id: vineId, name: name })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add current user and partner to the team
      await supabase
        .from("team_members")
        .insert([
          { team_id: teamData.team_id, user_id: userId },
          { team_id: teamData.team_id, user_id: partnerId },
        ]);

      // Add team to the ladder
      const { data: nodeData } = await supabase
        .from("ladder_nodes")
        .insert({
          vine_id: vineId,
          position: (
            await supabase
              .from("ladder_nodes")
              .select("position")
              .eq("vine_id", vineId)
              .order("position", { ascending: false })
              .limit(1)
              .single()
          ).data?.position + 1 || 1,
        })
        .select()
        .single();

      await supabase
        .from("user_ladder_nodes")
        .insert({
          node_id: nodeData.node_id,
          team_id: teamData.team_id,
          vine_id: vineId,
          position: nodeData.position,
        });

      // Fetch member names before updating state
      const currentUserName = (await supabase.from("profiles").select("name").eq("user_id", userId).single()).data?.name;
      const partnerName = (await supabase.from("profiles").select("name").eq("user_id", partnerId).single()).data?.name;
      setDoublesStandings([...doublesStandings, {
        team_id: teamData.team_id,
        name: teamData.name,
        members: [currentUserName, partnerName],
        wins: 0,
        losses: 0,
        position: nodeData.position,
      }]);
      setUserTeams([...userTeams, teamData.team_id]);
      setUserTeams((prev) => [...prev, teamData.team_id]);
      setModalVisible(false);
    } catch (e) {
      console.log("Error creating team:", e);
      Alert.alert("Error", "Failed to create team.");
    }
  };

  const handleChallenge = async () => {
    if (!challengeTarget || !vineId || !userId) return;

    try {
      if ("user_id" in challengeTarget) {
        // Singles challenge
        const { data, error } = await supabase.rpc("create_challenge", {
          p_challenger_id: userId,
          p_opponent_id: challengeTarget.user_id,
          p_vine_id: vineId,
        });

        if (error) {
          console.log("Error creating singles challenge:", error.message);
          Alert.alert("Error", error.message);
        } else {
          Alert.alert("Success", "Challenge sent!");
        }
      } else {
        // Doubles challenge
        // Find a team that the current user belongs to
        if (userTeams.length === 0) {
          Alert.alert("Error", "You must be part of a team to challenge in doubles.");
          return;
        }

        const { data, error } = await supabase.rpc("create_challenge", {
          p_team_1_id: userTeams[0], // Use the first team the user belongs to
          p_team_2_id: challengeTarget.team_id,
          p_vine_id: vineId,
        });

        if (error) {
          console.log("Error creating doubles challenge:", error.message);
          Alert.alert("Error", error.message);
        } else {
          Alert.alert("Success", "Team challenge sent!");
        }
      }
    } catch (e) {
      console.log("Unexpected error:", e);
      Alert.alert("Error", "Failed to send challenge.");
    } finally {
      setChallengeTarget(null);
    }
  };

  if (loading) {
    return (
      <BackgroundWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
      {/* Challenge Modal */}
      {challengeTarget && (
        <Modal
          visible={!!challengeTarget}
          transparent
          animationType="slide"
          onRequestClose={() => setChallengeTarget(null)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, minWidth: 260, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                Challenge {challengeTarget && ('name' in challengeTarget ? challengeTarget.name : '')}?
              </Text>
              {challengeTarget && 'user_id' in challengeTarget ? (
                <>
                  <Text style={{ fontSize: 15, marginBottom: 4 }}>
                    Rank: {challengeTarget.position}   Rating: {challengeTarget.rating}
                  </Text>
                  <Text style={{ fontSize: 15, marginBottom: 16 }}>
                    W-L: {challengeTarget.wins}-{challengeTarget.losses}  Win%: {(challengeTarget.wins + challengeTarget.losses) > 0 ? Math.round((challengeTarget.wins / (challengeTarget.wins + challengeTarget.losses)) * 100) : 0}%
                  </Text>
                </>
              ) : challengeTarget && 'team_id' in challengeTarget ? (
                <>
                  <Text style={{ fontSize: 15, marginBottom: 4 }}>
                    Members: {challengeTarget.members.join(", ")}
                  </Text>
                  <Text style={{ fontSize: 15, marginBottom: 16 }}>
                    W-L: {challengeTarget.wins}-{challengeTarget.losses}  Win%: {(challengeTarget.wins + challengeTarget.losses) > 0 ? Math.round((challengeTarget.wins / (challengeTarget.wins + challengeTarget.losses)) * 100) : 0}%
                  </Text>
                </>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <TouchableOpacity
                  style={{ paddingVertical: 8, paddingHorizontal: 18, backgroundColor: COLORS.primaryGradient[1], borderRadius: 8, marginRight: 8 }}
                  onPress={handleChallenge}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send Challenge</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingVertical: 8, paddingHorizontal: 18, backgroundColor: '#eee', borderRadius: 8 }}
                  onPress={() => setChallengeTarget(null)}
                >
                  <Text style={{ color: COLORS.secondary, fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      <View style={styles.container}>
        {/* Segment Control */}
        <View style={styles.segmentedControl}>
          {SEGMENTS.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.segment, segment === s && styles.segmentActive]}
              onPress={() => setSegment(s)}
            >
              <Text style={[styles.segmentText, segment === s && styles.segmentTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <LadderSelector
          ladders={ladders}
          selectedLadder={selectedLadder}
          onSelectLadder={setSelectedLadder}
        />
        {/* JOIN LADDER BUTTON LOGIC */}
        {segment === "Singles"
          ? !singlesStandings.some(p => p.user_id === userId) && userProfile?.role === 'player' && (
              <TouchableOpacity
                style={[styles.createTeamBtn, { marginBottom: 10 }]}
                onPress={handleJoinLadder}
              >
                <Text style={styles.createTeamBtnText}>Join Ladder</Text>
              </TouchableOpacity>
            )
          : !doublesStandings.some(t => userTeams?.includes(t.team_id)) && userProfile?.role === 'player' && (
              <TouchableOpacity
                style={[styles.createTeamBtn, { marginBottom: 10 }]}
                onPress={handleJoinLadder}
              >
                <Text style={styles.createTeamBtnText}>Join Ladder</Text>
              </TouchableOpacity>
            )}
        {segment === "Singles" ? (
          <StandingsList
            data={singlesStandings}
            segment="Singles"
            onChallenge={setChallengeTarget}
            isCoordinator={userProfile?.role === 'coordinator'}
            onRemove={item => handleRemoveFromLadder(item)}
          />
        ) : (
          <>
            <StandingsList
              data={doublesStandings}
              segment="Doubles"
              onChallenge={setChallengeTarget}
              userTeams={userTeams}
              isCoordinator={userProfile?.role === 'coordinator'}
              onRemove={item => handleRemoveFromLadder(item)}
            />
            {userProfile?.role === 'player' && (
              <TouchableOpacity
                style={styles.createTeamBtn}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.createTeamBtnText}>+ Create Team</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        <TeamCreationModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onCreateTeam={({ name, members }) => handleCreateTeam({ name, members })}
          userRole={userProfile?.role || ''}
          userId={userId || ''}
        />
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  challengeBtn: {
    marginLeft: 'auto',
    backgroundColor: '#F8E71C22',
    borderRadius: 16,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singlesCard: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 18,
    marginVertical: 8,
    elevation: 2,
    width: '100%',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 0,
  },
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingTop: 40,
  },
  segmentedControl: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#D0F2E8",
  },
  segment: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 16,
  },
  segmentActive: {
    backgroundColor: "#FFD54F",
  },
  segmentText: {
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    fontSize: 16,
  },
  segmentTextActive: {
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
  },
  createTeamBtn: {
    backgroundColor: "#FFD54F",
    borderRadius: 20,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginTop: 10,
    marginBottom: 4,
  },
  createTeamBtnText: {
    color: "#1A3C34",
    fontFamily: "Roboto-Bold",
    fontSize: 16,
  },
  doublesCard: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 18,
    marginVertical: 8,
    elevation: 2,
    width: '100%',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 0,
  },
  rank: {
    fontSize: 18,
    fontWeight: "bold",
    width: 30,
    textAlign: "center",
    color: COLORS.secondary,
  },
  name: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
    color: COLORS.text.dark,
  },
  rating: {
    fontSize: 15,
    color: COLORS.text.dark,
    marginLeft: 12,
    marginTop: 2,
  },
});