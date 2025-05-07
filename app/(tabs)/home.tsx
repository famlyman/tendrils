// app/(tabs)/home.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../supabase";
import { useAuth } from "../../context/AuthContext";
import BackgroundWrapper from "../../components/BackgroundWrapper";
import TeamCreationModal from "../../components/TeamCreationModal";
import LadderSelector from "../../components/LadderSelector";
import StandingsList from "../../components/StandingsList";
import type { StandingsItem } from "../../components/StandingsList";

// Constants
const SEGMENTS = ["Singles", "Doubles"];

// Types
interface SinglesStanding {
  user_id: string;
  player_name: string;
  rating: number;
  wins: number;
  losses: number;
  position: number;
  ladder_id: string;
}

interface DoublesStanding {
  team_id: string;
  name: string;
  members: string[];
  wins: number;
  losses: number;
  position: number;
  ladder_id: string;
}

interface Ladder {
  ladder_id: string;
  name: string;
  type: string;
}

type ChallengeTarget = StandingsItem | null;

// Safe color access with fallbacks
const COLORS = {
  primaryGradient: ["#FFD54F", "#FFC107"],
  secondary: "#1A3C34",
  text: { dark: "#333" }
};

export default function Home() {
  // State
  const [challengeTarget, setChallengeTarget] = useState<ChallengeTarget>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [segment, setSegment] = useState("Singles");
  const [singlesStandings, setSinglesStandings] = useState<SinglesStanding[]>([]);
  const [doublesStandings, setDoublesStandings] = useState<DoublesStanding[]>([]);
  const [vineId, setVineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userTeams, setUserTeams] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<{ roles: string[] }>({ roles: [] });
  const [ladders, setLadders] = useState<Ladder[]>([]);
  const [selectedLadder, setSelectedLadder] = useState<Ladder | null>(null);

  // Hooks
  const router = useRouter();
  const { userId, loading: authLoading } = useAuth();

  // Fetch user's vine and initialize data
  useEffect(() => {
    if (authLoading) return;
    
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
        Alert.alert("Error", "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [userId, authLoading, router]);

  // Fetch user roles
  const fetchUserRoles = useCallback(async () => {
    if (!userId || !vineId) {
      setUserProfile({ roles: [] });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role:roles(name)')
        .eq('user_id', userId)
        .eq('vine_id', vineId);
        
      if (error) {
        setUserProfile({ roles: [] });
        Alert.alert('Error', 'Failed to fetch user roles.');
        return;
      }
      
      const roles = (data || [])
        .map((item: any) => item.role?.name)
        .filter((name: string) => typeof name === 'string');
        
      setUserProfile({ roles });
    } catch (e) {
      setUserProfile({ roles: [] });
      Alert.alert('Error', 'Failed to fetch user roles.');
    }
  }, [userId, vineId]);

  // Fetch ladders for the user
  const fetchLadders = useCallback(async () => {
    if (!vineId || !userId) {
      setLadders([]);
      return;
    }
    
    try {
      // Get ladder IDs for this user
      const { data: nodeData, error: nodeError } = await supabase
        .from('user_ladder_nodes')
        .select('ladder_id')
        .eq('vine_id', vineId)
        .eq('user_id', userId);
      
      if (nodeError || !nodeData || nodeData.length === 0) {
        setLadders([]);
        // Allow coordinators to proceed without ladders
        if (userProfile?.roles.includes('coordinator')) {
          setSelectedLadder({ ladder_id: 'none', name: 'No Ladder', type: 'none' });
        }
        return;
      }

      // Get ladder details
      const ladderIds = [...new Set(nodeData.map(node => node.ladder_id))]; // Deduplicate
      const { data: ladderData, error: ladderError } = await supabase
        .from('ladders')
        .select('ladder_id, name, type')
        .in('ladder_id', ladderIds);
      
      if (ladderError || !ladderData || ladderData.length === 0) {
        setLadders([]);
        if (userProfile?.roles.includes('coordinator')) {
          setSelectedLadder({ ladder_id: 'none', name: 'No Ladder', type: 'none' });
        }
        return;
      }

      setLadders(ladderData);
      if (!selectedLadder && ladderData.length > 0) {
        setSelectedLadder(ladderData[0]);
      }
    } catch (e) {
      setLadders([]);
      if (userProfile?.roles.includes('coordinator')) {
        setSelectedLadder({ ladder_id: 'none', name: 'No Ladder', type: 'none' });
      }
    }
  }, [vineId, userId, userProfile, selectedLadder]);

  // Fetch standings data
  const fetchStandings = useCallback(async () => {
    if (!selectedLadder || selectedLadder.ladder_id === 'none') {
      setSinglesStandings([]);
      setDoublesStandings([]);
      return;
    }
    
    setLoading(true);
    
    try {
      // Fetch singles standings
      const { data: singlesData, error: singlesError } = await supabase
        .from('singles_standings')
        .select('*')
        .eq('ladder_id', selectedLadder.ladder_id)
        .order('position', { ascending: true });
        
      if (!singlesError && singlesData) {
        setSinglesStandings(singlesData);
      } else {
        setSinglesStandings([]);
      }
      
      // Fetch doubles standings
      const { data: doublesData, error: doublesError } = await supabase
        .from('doubles_standings')
        .select('*')
        .eq('ladder_id', selectedLadder.ladder_id)
        .order('position', { ascending: true });
        
      if (!doublesError && doublesData) {
        setDoublesStandings(doublesData);
      } else {
        setDoublesStandings([]);
      }
    } catch (e) {
      setSinglesStandings([]);
      setDoublesStandings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedLadder]);

  // Initialize user roles and ladders when vineId is available
  useEffect(() => {
    if (vineId && userId) {
      fetchUserRoles();
      fetchLadders();
    }
  }, [vineId, userId, fetchUserRoles, fetchLadders]);

  // Load standings when ladder is selected
  useEffect(() => {
    if (selectedLadder && selectedLadder.ladder_id !== 'none' && vineId && userId) {
      fetchStandings();
    } else {
      setLoading(false);
    }
  }, [selectedLadder, vineId, userId, fetchStandings]);

  // Create a new ladder (coordinator function)
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
          name: `Ladder for ${userProfile?.roles.includes('coordinator') ? 'Coordinator' : 'User'}`,
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
      Alert.alert("Error", "Failed to create ladder.");
    }
  };

  // Join an existing ladder
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
      fetchStandings();
      
    } catch (e) {
      Alert.alert("Error", "Failed to join ladder.");
    }
  };

  // Remove a player/team from ladder (coordinator function)
  const handleRemoveFromLadder = async (item: any) => {
    if (!selectedLadder || selectedLadder.ladder_id === 'none') return;
    
    const itemName = segment === "Singles" ? item.player_name : item.name;
    
    Alert.alert(
      "Remove from Ladder",
      `Are you sure you want to remove ${itemName} from this ladder?`,
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
              
              fetchStandings();
              
            } catch (e) {
              Alert.alert("Error", "Failed to remove from ladder.");
            }
          },
        },
      ],
    );
  };

  // Create a new team for doubles play
  const handleCreateTeam = async (team: { name: string; members: string[] }) => {
    if (!team.name || team.name.trim() === '') {
      Alert.alert('Error', 'Team name cannot be empty');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a team');
        setLoading(false);
        return;
      }

      // Insert into teams table
      const { data: teamInsertData, error: teamInsertError } = await supabase
        .from('teams')
        .insert({
          name: team.name,
          vine_id: vineId,
        })
        .select()
        .single();

      if (teamInsertError || !teamInsertData) {
        Alert.alert('Error', 'Failed to create team.');
        setLoading(false);
        return;
      }

      const newTeamId = teamInsertData.team_id;
      
      // Ensure the creator is included in the members
      let allMembers = [...team.members];
      if (!allMembers.includes(user.id)) {
        allMembers.push(user.id);
      }

      // Insert all members into team_members
      const memberRows = allMembers.map(user_id => ({
        user_id,
        team_id: newTeamId,
        vine_id: vineId,
      }));
      
      // Insert into team_members
      const { error: membersError } = await supabase
        .from('team_members')
        .insert(memberRows);
        
      if (membersError) {
        Alert.alert('Error', 'Failed to add team members.');
        setLoading(false);
        return;
      }
      
      await fetchStandings();
      setUserTeams([...userTeams, newTeamId]);
      setModalVisible(false);
      Alert.alert('Success', 'Team created successfully!');
      
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Create a challenge against another player/team
  const handleCreateChallenge = async () => {
    if (!challengeTarget) {
      Alert.alert("Error", "No valid target selected");
      return;
    }
    
    try {
      // Data structure would depend on your database schema
      const { error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: userId,
          challenger_type: segment === "Singles" ? "user" : "team",
          target_id: 'user_id' in challengeTarget ? challengeTarget.user_id : challengeTarget.team_id,
          target_type: segment === "Singles" ? "user" : "team",
          ladder_id: selectedLadder?.ladder_id,
          vine_id: vineId,
          status: "pending"
        });
        
      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Success", "Challenge sent!");
        setChallengeTarget(null);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to send challenge.");
    }
  };

  // Loading state
  if (!userId) return null;
  
  if (loading) {
    return (
      <BackgroundWrapper>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </BackgroundWrapper>
    );
  }

  // Error states
  if (!vineId) {
    return (
      <BackgroundWrapper>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            Please join a vine to view standings.
          </Text>
        </View>
      </BackgroundWrapper>
    );
  }

  if (!userProfile?.roles || userProfile.roles.length === 0) {
    return (
      <BackgroundWrapper>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            No role assigned. Please contact your coordinator.
          </Text>
        </View>
      </BackgroundWrapper>
    );
  }

  if (!selectedLadder) {
    return (
      <BackgroundWrapper>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            No ladder selected. Please select or create a ladder.
          </Text>
          {userProfile.roles.includes('coordinator') && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCreateLadder}
            >
              <Text style={styles.actionButtonText}>+ Create Ladder</Text>
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
        {/* Segmented control for Singles/Doubles */}
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
        
        {/* Ladder selector */}
        <LadderSelector
          ladders={ladders}
          selectedLadder={selectedLadder}
          onSelectLadder={setSelectedLadder}
        />

        {/* Main content section */}
        {noStandings ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              No {segment.toLowerCase()} standings found.
            </Text>
            
            {userProfile.roles.includes('player') && (
              <>
                {segment === "Singles"
                  ? !singlesStandings.some(p => p.user_id === userId) && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleJoinLadder}
                        disabled={!selectedLadder || !vineId}
                      >
                        <Text style={styles.actionButtonText}>
                          Join {segment} Ladder
                        </Text>
                      </TouchableOpacity>
                    )
                  : !doublesStandings.some(t => userTeams?.includes(t.team_id)) && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleJoinLadder}
                        disabled={!selectedLadder || !vineId}
                      >
                        <Text style={styles.actionButtonText}>
                          Join {segment} Ladder
                        </Text>
                      </TouchableOpacity>
                    )}
              </>
            )}
            
            {userProfile.roles.includes('coordinator') && (
              <Text style={styles.coordinatorText}>
                As a coordinator, you can manage ladders or invite players.
              </Text>
            )}
          </View>
        ) : (
          <>
            {/* Singles standings */}
            {segment === "Singles" && singlesStandings.length > 0 && (
              <StandingsList
                data={singlesStandings.map(item => ({ ...item, name: item.player_name }))}
                segment="Singles" 
                onChallenge={setChallengeTarget} 
                isCoordinator={userProfile.roles.includes('coordinator')} 
                onRemove={item => handleRemoveFromLadder(item)}
              />
            )}
            
            {/* Doubles standings */}
            {segment === "Doubles" && doublesStandings.length > 0 && (
              <StandingsList
                data={doublesStandings.map(item => ({ ...item, team_name: item.name }))}
                segment="Doubles"
                onChallenge={setChallengeTarget}
                userTeams={userTeams}
                isCoordinator={userProfile.roles.includes('coordinator')}
                onRemove={item => handleRemoveFromLadder(item)}
              />
            )}
          </>
        )}
        
        {/* Create team button (for doubles) */}
        {segment === "Doubles" && userProfile.roles.includes('player') && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.actionButtonText}>+ Create Team</Text>
          </TouchableOpacity>
        )}

        {/* Team creation modal */}
        <TeamCreationModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onCreateTeam={({ name, members }) => handleCreateTeam({ name, members })}
          userRole={userProfile.roles[0] || ''}
          userId={userId || ''}
          vineId={vineId || ''}
        />
        
        {/* Challenge confirmation modal */}
        {challengeTarget && (
          <Modal
            visible={!!challengeTarget}
            transparent
            animationType="slide"
            onRequestClose={() => setChallengeTarget(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Challenge {challengeTarget && ('name' in challengeTarget ? challengeTarget.name : '')}?
                </Text>
                
                {challengeTarget && 'user_id' in challengeTarget ? (
                  <>
                    <Text style={styles.modalText}>
                      Rank: {challengeTarget.position}   Rating: {challengeTarget.rating}
                    </Text>
                    <Text style={styles.modalText}>
                      W-L: {challengeTarget.wins}-{challengeTarget.losses}  
                      Win%: {(challengeTarget.wins + challengeTarget.losses) > 0 
                        ? Math.round((challengeTarget.wins / (challengeTarget.wins + challengeTarget.losses)) * 100) 
                        : 0}%
                    </Text>
                  </>
                ) : challengeTarget && 'team_id' in challengeTarget ? (
                  <>
                    <Text style={styles.modalText}>
                      Members: {challengeTarget.members.join(", ")}
                    </Text>
                    <Text style={styles.modalText}>
                      W-L: {challengeTarget.wins}-{challengeTarget.losses}  
                      Win%: {(challengeTarget.wins + challengeTarget.losses) > 0 
                        ? Math.round((challengeTarget.wins / (challengeTarget.wins + challengeTarget.losses)) * 100) 
                        : 0}%
                    </Text>
                  </>
                ) : null}
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleCreateChallenge}
                  >
                    <Text style={styles.confirmButtonText}>Send Challenge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setChallengeTarget(null)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </BackgroundWrapper>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  messageContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  messageText: {
    color: '#888', 
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16
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
  emptyStateContainer: {
    padding: 24, 
    alignItems: 'center'
  },
  emptyStateText: {
    color: '#888', 
    fontSize: 18, 
    marginVertical: 16,
    textAlign: 'center'
  },
  coordinatorText: {
    color: '#888', 
    fontSize: 16,
    textAlign: 'center'
  },
  actionButton: {
    backgroundColor: "#FFD54F",
    borderRadius: 20,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginTop: 10,
    marginBottom: 20,
  },
  actionButtonText: {
    color: "#1A3C34",
    fontFamily: "Roboto-Bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  modalContent: {
    backgroundColor: '#fff', 
    padding: 24, 
    borderRadius: 12, 
    minWidth: 280, 
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 8
  },
  modalText: {
    fontSize: 15, 
    marginBottom: 8
  },
  modalButtons: {
    flexDirection: 'row', 
    marginTop: 16
  },
  confirmButton: {
    paddingVertical: 8, 
    paddingHorizontal: 18, 
    backgroundColor: COLORS.primaryGradient[1], 
    borderRadius: 8, 
    marginRight: 8
  },
  confirmButtonText: {
    color: '#fff', 
    fontWeight: 'bold'
  },
  cancelButton: {
    paddingVertical: 8, 
    paddingHorizontal: 18, 
    backgroundColor: '#eee', 
    borderRadius: 8
  },
  cancelButtonText: {
    color: COLORS.secondary, 
    fontWeight: 'bold'
  }
});