// app/(tabs)/home.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from "react-native";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";

type ColorsType = typeof COLORS & {
  primaryGradient: readonly string[];
  secondary: string;
  text: { dark: string };
};
const safeCOLORS: ColorsType = {
  ...(COLORS || {}),
  primaryGradient: COLORS.primaryGradient || ["#FFD54F", "#FFC107"],
  secondary: COLORS.secondary || "#1A3C34",
  text: COLORS.text || { dark: "#333" },
};

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
  player_name: string;
  rating: number;
  wins: number;
  losses: number;
  position: number;
  ladder_id: string;
}

interface TeamProfile {
  team_id: string;
  name: string;
  members: string[];
  wins: number;
  losses: number;
  position: number;
}

interface UserRoleResponse {
  role: { name: string } | null;
}

interface Ladder {
  ladder_id: string;
  name: string;
  type: string;
}

import type { StandingsItem } from "../../components/StandingsList";
type ChallengeTarget = StandingsItem | null;

const styles = StyleSheet.create({
  challengeBtn: {
    marginLeft: 'auto',
    backgroundColor: safeCOLORS.primaryGradient[1],
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
    color: safeCOLORS.secondary,
  },
  name: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
    color: safeCOLORS.text.dark,
  },
  rating: {
    fontSize: 15,
    color: safeCOLORS.text.dark,
    marginLeft: 12,
    marginTop: 2,
  },
});

export default function Home() {
  const [challengeTarget, setChallengeTarget] = useState<ChallengeTarget>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [segment, setSegment] = useState("Singles");
  const [singlesStandings, setSinglesStandings] = useState<PlayerProfile[]>([]);
  const [doublesStandings, setDoublesStandings] = useState<TeamProfile[]>([]);
  const [vineId, setVineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userTeams, setUserTeams] = useState<string[]>([]);
  const router = useRouter();
  const { userId, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<{ role: string } | null>(null);
  const [ladders, setLadders] = useState<Ladder[]>([]);
  const [selectedLadder, setSelectedLadder] = useState<Ladder | null>(null);

  const fetchLadders = useCallback(async () => {
    
    if (!vineId || !userId) {
      
      setLadders([]);
      return;
    }
    try {
      // Diagnostic query without user_id to test RLS
      const { data: allNodes, error: allNodesError } = await supabase
        .from('user_ladder_nodes')
        .select('ladder_id, user_id, vine_id')
        .eq('vine_id', vineId);
      

      // Main query with user_id
      const { data: nodeData, error: nodeError } = await supabase
        .from('user_ladder_nodes')
        .select('ladder_id')
        .eq('vine_id', vineId)
        .eq('user_id', userId);
      

      if (nodeError) {
        // (error logging removed for production)'[DEBUG] Error fetching ladder_ids from user_ladder_nodes:', nodeError);
        setLadders([]);
        return;
      }
      if (!nodeData || nodeData.length === 0) {
        
        setLadders([]);
        // Allow coordinators to proceed without ladders
        if (userProfile?.role === 'coordinator') {
          setSelectedLadder({ ladder_id: 'none', name: 'No Ladder', type: 'none' });
        }
        return;
      }

      const ladderIds = [...new Set(nodeData.map((node: { ladder_id: string }) => node.ladder_id))]; // Deduplicate
      const { data: ladderData, error: ladderError } = await supabase
        .from('ladders')
        .select('ladder_id, name, type')
        .in('ladder_id', ladderIds);
      

      if (ladderError) {
        // (error logging removed for production)'[DEBUG] Error fetching ladders:', ladderError);
        setLadders([]);
        return;
      }
      if (!ladderData || ladderData.length === 0) {
        
        setLadders([]);
        if (userProfile?.role === 'coordinator') {
          setSelectedLadder({ ladder_id: 'none', name: 'No Ladder', type: 'none' });
        }
        return;
      }

      setLadders(ladderData);
      if (!selectedLadder && ladderData.length > 0) {
        setSelectedLadder(ladderData[0]);
        
      }
    } catch (e) {
      // (error logging removed for production)'[DEBUG] Unexpected error in fetchLadders:', e);
      setLadders([]);
      if (userProfile?.role === 'coordinator') {
        setSelectedLadder({ ladder_id: 'none', name: 'No Ladder', type: 'none' });
      }
    }
  }, [vineId, userId, userProfile, selectedLadder]);

  const fetchUserRole = useCallback(async () => {
    if (!userId || !vineId) {
      
      setUserProfile({ role: 'none' });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role:roles(name)')
        .eq('user_id', userId)
        .eq('vine_id', vineId)
        .single() as { data: UserRoleResponse | null; error: any };
      if (error) {
        // (error logging removed for production)'[DEBUG] Error fetching user role:', error);
        setUserProfile({ role: 'none' });
        Alert.alert('Error', 'Failed to fetch user role.');
        return;
      }
      const roleName = data?.role?.name || 'none';
      
      setUserProfile({ role: roleName });
    } catch (e) {
      // (error logging removed for production)'[DEBUG] Unexpected error fetching user role:', e);
      setUserProfile({ role: 'none' });
      Alert.alert('Error', 'Failed to fetch user role.');
    }
  }, [userId, vineId]);

  useEffect(() => {
    if (authLoading) {
      
      return;
    }
    if (!userId) {
      
      router.replace("/login");
      return;
    }

    const initialize = async () => {
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
        // (error logging removed for production)'[DEBUG] Unexpected error initializing:', e);
        Alert.alert("Error", "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    initialize();
    
  }, [userId, authLoading]);

  useEffect(() => {
    if (vineId && userId) {
      fetchUserRole();
      fetchLadders();
    }
  }, [vineId, userId]);

  useEffect(() => {
    if (!selectedLadder || !vineId || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchStandings = async () => {
      try {
        
        const { data: singlesData, error: singlesError } = await supabase
          .from("singles_standings")
          .select("*")
          .eq("ladder_id", selectedLadder.ladder_id)
          .order("position", { ascending: true });

        if (singlesError) {
          setSinglesStandings([]);
        } else if (!singlesData || singlesData.length === 0) {
          setSinglesStandings([]);
        } else {
          setSinglesStandings(singlesData);
        }

        const { data: doublesData, error: doublesError } = await supabase
          .from("doubles_standings")
          .select("*")
          .eq("ladder_id", selectedLadder.ladder_id)
          .order("position", { ascending: true });
        if (doublesError) {
          setDoublesStandings([]);
        } else if (!doublesData || doublesData.length === 0) {
          setDoublesStandings([]);
        } else {
          setDoublesStandings(doublesData);
        }
        
        const { data: userTeamsData } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", userId);
        setUserTeams(userTeamsData?.map((t: any) => t.team_id) || []);
        
      } catch (e) {
        setSinglesStandings([]);
        setDoublesStandings([]);
        Alert.alert("Error", "Failed to fetch standings.");
      } finally {
        setLoading(false);
      }
    };
    if (selectedLadder.ladder_id !== 'none') {
      fetchStandings();
    } else {
      setLoading(false);
    }
  }, [selectedLadder, vineId, userId]);

  const handleCreateLadder = async () => {
    if (!vineId || !userId) {
      Alert.alert("Error", "Missing vine or user information.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from('ladders')
        .insert({
          vine_id: vineId,
          name: `Ladder for ${userProfile?.role === 'coordinator' ? 'Coordinator' : 'User'}`,
          type: 'singles',
        })
        .select()
        .single();
      if (error) throw error;
      await supabase
        .from('user_ladder_nodes')
        .insert({
          user_id: userId,
          ladder_id: data.ladder_id,
          vine_id: vineId,
          position: 1,
        });
      setLadders([{ ladder_id: data.ladder_id, name: data.name, type: data.type }]);
      setSelectedLadder({ ladder_id: data.ladder_id, name: data.name, type: data.type });
      Alert.alert("Success", "Ladder created!");
    } catch (e) {
      // (error logging removed for production)'[DEBUG] Error creating ladder:', e);
      Alert.alert("Error", "Failed to create ladder.");
    }
  };

  const handleJoinLadder = async () => {
    if (!selectedLadder || !vineId) {
      Alert.alert("Error", "No ladder or vine selected.");
      return;
    }
    if (selectedLadder.ladder_id === 'none') {
      Alert.alert("Error", "Please create a ladder first.");
      return;
    }
    try {
      if (segment === "Singles") {
        const { error } = await supabase.from("user_ladder_nodes").insert({
          user_id: userId,
          ladder_id: selectedLadder.ladder_id,
          position: singlesStandings.length + 1,
          vine_id: vineId,
        });
        if (error) throw error;
        Alert.alert("Success", "You have joined the ladder!");
      } else {
        if (!userTeams || userTeams.length === 0) {
          Alert.alert("Error", "You must create a team first.");
          return;
        }
        const { error } = await supabase.from("user_ladder_nodes").insert({
          team_id: userTeams[0],
          ladder_id: selectedLadder.ladder_id,
          position: doublesStandings.length + 1,
          vine_id: vineId,
        });
        if (error) throw error;
        Alert.alert("Success", "Your team has joined the ladder!");
      }
      setLoading(true);
      setSelectedLadder({ ...selectedLadder });
    } catch (e) {
      // (error logging removed for production)'[DEBUG] Error joining ladder:', e);
      Alert.alert("Error", "Failed to join ladder.");
    }
  };

  const handleRemoveFromLadder = async (item: any) => {
    if (!selectedLadder || selectedLadder.ladder_id === 'none') return;
    Alert.alert(
      "Remove from Ladder",
      `Are you sure you want to remove ${item.player_name} from this ladder?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
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
              setLoading(true);
              setSelectedLadder({ ...selectedLadder });
            } catch (e) {
              // (error logging removed for production)'[DEBUG] Error removing from ladder:', e);
              Alert.alert("Error", "Failed to remove from ladder.");
            }
          },
        },
      ]
    );
  };

  const handleCreateTeam = async ({ name, members }: { name: string; members: string[] }) => {
    try {
      if (!vineId || !userId || !members[1]) {
        Alert.alert("Error", "Missing information for team creation.");
        return;
      }
      const partnerId = members[1];
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert({ vine_id: vineId, name })
        .select()
        .single();
      if (teamError) throw teamError;

      await supabase
        .from("team_members")
        .insert([
          { team_id: teamData.team_id, user_id: userId },
          { team_id: teamData.team_id, user_id: partnerId },
        ]);

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

      const currentUserName = (await supabase.from("profiles").select("name").eq("user_id", userId).single()).data?.name || 'Unknown';
      const partnerName = (await supabase.from("profiles").select("name").eq("user_id", partnerId).single()).data?.name || 'Unknown';
      setDoublesStandings([
        ...doublesStandings,
        {
          team_id: teamData.team_id,
          name: teamData.name,
          members: [currentUserName, partnerName],
          wins: 0,
          losses: 0,
          position: nodeData.position,
        },
      ]);
      setUserTeams([...userTeams, teamData.team_id]);
      setModalVisible(false);
    } catch (e) {
      // (error logging removed for production)'[DEBUG] Error creating team:', e);
      Alert.alert("Error", "Failed to create team.");
    }
  };

  const handleChallenge = async () => {
    if (!challengeTarget || !vineId || !userId) return;
    try {
      if ("user_id" in challengeTarget) {
        const { data, error } = await supabase.rpc("create_challenge", {
          p_challenger_id: userId,
          p_opponent_id: challengeTarget.user_id,
          p_vine_id: vineId,
        });
        if (error) {
          // (error logging removed for production)'[DEBUG] Error creating singles challenge:', error);
          Alert.alert("Error", error.message);
        } else {
          Alert.alert("Success", "Challenge sent!");
        }
      } else {
        if (userTeams.length === 0) {
          Alert.alert("Error", "You must be part of a team to challenge in doubles.");
          return;
        }
        const { data, error } = await supabase.rpc("create_challenge", {
          p_team_iettivi: true,
          p_team_1_id: userTeams[0],
          p_team_2_id: challengeTarget.team_id,
          p_vine_id: vineId,
        });
        if (error) {
          // (error logging removed for production)'[DEBUG] Error creating doubles challenge:', error);
          Alert.alert("Error", error.message);
        } else {
          Alert.alert("Success", "Team challenge sent!");
        }
      }
    } catch (e) {
      // (error logging removed for production)'[DEBUG] Unexpected error creating challenge:', e);
      Alert.alert("Error", "Failed to send challenge.");
    }
  };

  
  if (authLoading) {
    return (
      <BackgroundWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Authenticating...</Text>
        </View>
      </BackgroundWrapper>
    );
  }

  if (!userId) {
    return null; // Navigation handled in useEffect
  }

  if (loading) {
    
    return (
      <BackgroundWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </BackgroundWrapper>
    );
  }

  if (!vineId) {
    return (
      <BackgroundWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#888', fontSize: 18 }}>
            Please join a vine to view standings.
          </Text>
        </View>
      </BackgroundWrapper>
    );
  }

  if (!userProfile) {
    return (
      <BackgroundWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#888', fontSize: 18 }}>
            Loading user profile...
          </Text>
        </View>
      </BackgroundWrapper>
    );
  }

  if (userProfile.role === 'none') {
    return (
      <BackgroundWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#888', fontSize: 18 }}>
            No role assigned. Please contact your coordinator.
          </Text>
        </View>
      </BackgroundWrapper>
    );
  }

  if (!selectedLadder) {
    return (
      <BackgroundWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#888', fontSize: 18 }}>
            No ladder selected. Please select or create a ladder.
          </Text>
          {userProfile.role === 'coordinator' && (
            <TouchableOpacity
              style={styles.createTeamBtn}
              onPress={handleCreateLadder}
            >
              <Text style={styles.createTeamBtnText}>+ Create Ladder</Text>
            </TouchableOpacity>
          )}
        </View>
      </BackgroundWrapper>
    );
  }

  const noStandings =
    (segment === "Singles" && singlesStandings.length === 0) ||
    (segment === "Doubles" && doublesStandings.length === 0);
  

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        {noStandings && (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#888', fontSize: 18, marginVertical: 16 }}>
              No {segment.toLowerCase()} standings found.
            </Text>
            {userProfile?.role === 'player' && (
              <>
                {segment === "Singles"
                  ? !singlesStandings.some(p => p.user_id === userId) && (
                      <TouchableOpacity
                        style={[styles.createTeamBtn, { marginBottom: 10 }]}
                        onPress={handleJoinLadder}
                        disabled={!selectedLadder || !vineId}
                      >
                        <Text style={styles.createTeamBtnText}>
                          Join {segment} Ladder
                        </Text>
                      </TouchableOpacity>
                    )
                  : !doublesStandings.some(t => userTeams?.includes(t.team_id)) && (
                      <TouchableOpacity
                        style={[styles.createTeamBtn, { marginBottom: 10 }]}
                        onPress={handleJoinLadder}
                        disabled={!selectedLadder || !vineId}
                      >
                        <Text style={styles.createTeamBtnText}>
                          Join {segment} Ladder
                        </Text>
                      </TouchableOpacity>
                    )}

              </>
            )}
            {userProfile?.role === 'coordinator' && (
              <Text style={{ color: '#888', fontSize: 16 }}>
                As a coordinator, you can manage ladders or invite players.
              </Text>
            )}
          </View>
        )}
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
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    style={{ paddingVertical: 8, paddingHorizontal: 18, backgroundColor: safeCOLORS.primaryGradient[1], borderRadius: 8, marginRight: 8 }}
                    onPress={handleChallenge}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send Challenge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ paddingVertical: 8, paddingHorizontal: 18, backgroundColor: '#eee', borderRadius: 8 }}
                    onPress={() => setChallengeTarget(null)}
                  >
                    <Text style={{ color: safeCOLORS.secondary, fontWeight: 'bold' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
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

        {segment === "Singles" ? (
          singlesStandings.length > 0 ? (
            <StandingsList
              data={singlesStandings.map(item => ({ ...item, name: item.player_name }))}
              segment="Singles" onChallenge={setChallengeTarget} isCoordinator={userProfile?.role === 'coordinator'} onRemove={item => handleRemoveFromLadder(item)}
            />
          ) : (
            <Text style={{ color: '#888', textAlign: 'center', marginVertical: 16 }}>
              No singles standings available.
            </Text>
          )
        ) : (
          <>
            {doublesStandings.length > 0 ? (
              <StandingsList
                data={doublesStandings.map(item => ({ ...item, team_name: item.name }))}
                segment="Doubles"
                onChallenge={setChallengeTarget}
                userTeams={userTeams}
                isCoordinator={userProfile?.role === 'coordinator'}
                onRemove={item => handleRemoveFromLadder(item)}
              />
            ) : (
              <Text style={{ color: '#888', textAlign: 'center', marginVertical: 16 }}>
                No doubles standings available.
              </Text>
            )}
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