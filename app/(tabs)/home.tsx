// app/(tabs)/home.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ViewStyle, TextStyle } from "react-native";
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
  team_name: string;
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

interface TeamMember {
  team_id: string;
  user_id: string;
  vine_id: string;
}

interface TeamData {
  team_id: string;
  teams?: {
    name?: string;
    team_id?: string;
    team_members?: { user_id: string }[];
  };
}

interface Team {
  team_id: string;
  name: string;
  vine_id: string;
  team_members?: { user_id: string }[];
}

interface TeamMemberWithTeam extends TeamMember {
  teams?: Team;
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
  const [userTeamDetails, setUserTeamDetails] = useState<Array<{team_id: string, name: string, members: string[]}>>([]);
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
        await fetchUserData(); // Call the new combined fetch function
      } catch (e) {
        Alert.alert("Error", "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [userId, authLoading, router]);

  // Fetch user roles and teams
  const fetchUserData = useCallback(async () => {
    if (!userId || !vineId) {
      setUserProfile({ roles: [] });
      setUserTeams([]);
      setUserTeamDetails([]);
      return;
    }
    
    try {
      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role:roles(name)')
        .eq('user_id', userId)
        .eq('vine_id', vineId);
        
      if (rolesError) {
        setUserProfile({ roles: [] });
        Alert.alert('Error', 'Failed to fetch user roles.');
      } else {
        const roles = (rolesData || [])
          .map(item => {
            const roleItem = item as { role?: { name?: string } };
            return roleItem.role?.name;
          })
          .filter((name): name is string => typeof name === 'string');
        setUserProfile({ roles });
      }

      // Fetch user teams with details
      const { data: teamsData, error: teamsError } = await supabase
        .from('team_members')
        .select('team_id, teams!fk_team_members_team_id(name, team_id, team_members!fk_team_members_team_id(user_id))')
        .eq('user_id', userId)
        .eq('vine_id', vineId);

      if (teamsError) {
        console.error('Failed to fetch user teams:', teamsError);
        setUserTeams([]);
        setUserTeamDetails([]);
      } else {
        const teamDetails = (teamsData as TeamData[] || []).reduce((acc, item) => {
        // Type guard to ensure we only process valid team member entries
        if (item.team_id && item.teams) {
          const teamMembers = item.teams.team_members?.map((m: { user_id: string }) => m.user_id) || [];
          const teamDetail = {
            team_id: item.team_id,
            name: item.teams.name || 'Unnamed Team',
            members: teamMembers,
            wins: 0,  // Default wins
            losses: 0  // Default losses
          };
          acc.push(teamDetail);
        }
        return acc;
      }, [] as Array<{team_id: string, name: string, members: string[], wins: number, losses: number}>);

      setUserTeams(teamDetails.map(team => team.team_id));
      setUserTeamDetails(teamDetails);
      }
    } catch (e) {
      console.error('Unexpected error:', e);
      setUserProfile({ roles: [] });
      setUserTeams([]);
      setUserTeamDetails([]);
      Alert.alert('Error', 'An unexpected error occurred.');
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
        .select('*, teams(name)')
        .eq('ladder_id', selectedLadder.ladder_id);
      
      if (doublesError) {
        Alert.alert('Error', 'Failed to fetch doubles standings');
        setDoublesStandings([]);
      } else {
        // Ensure team_name is populated
        const formattedDoublesData = (doublesData || []).map(item => ({
          ...item,
          team_name: item.teams?.name || item.name || 'Unnamed Team'
        }));
        setDoublesStandings(formattedDoublesData);
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
      fetchUserData();
      fetchLadders();
    }
  }, [vineId, userId, fetchUserData, fetchLadders]);

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
          {SEGMENTS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.segmentButton,
                segment === s && { backgroundColor: COLORS.primaryGradient[0] },
              ]}
              onPress={() => setSegment(s)}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  segment === s && { color: COLORS.secondary },
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ladder Selector */}
        <LadderSelector
          ladders={ladders}
          selectedLadder={selectedLadder}
          onSelectLadder={setSelectedLadder}
        />

        {/* Standings List */}
        <StandingsList
          data={segment === "Singles" ? singlesStandings : doublesStandings}
          segment={segment as "Singles" | "Doubles"}
          onChallenge={(item) => {
            setChallengeTarget(item);
            setModalVisible(true);
          }}
          userTeams={userTeamDetails.map(team => team.team_id)}
        />

        {/* Team Creation Modal */}
        <TeamCreationModal
          visible={false}
          onClose={() => {}}
          onCreateTeam={handleCreateTeam}
          userRole={userProfile.roles[0] || ''}
          userId={userId || ''}
          vineId={vineId || ''}
        />

        {/* Challenge Modal */}
        {modalVisible && challengeTarget && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(false);
              setChallengeTarget(null);
            }}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Challenge {challengeTarget && ('name' in challengeTarget ? challengeTarget.name : '')}?
                </Text>
                
                {challengeTarget && 'user_id' in challengeTarget ? (
                  <>
                    <Text style={styles.modalText}>
                      Rank: {challengeTarget.position || 'N/A'}   Rating: {challengeTarget.rating || 'N/A'}
                    </Text>
                    <Text style={styles.modalText}>
                      W-L: {(challengeTarget.wins || 0)}-{(challengeTarget.losses || 0)}  
                      Win%: {((challengeTarget.wins || 0) + (challengeTarget.losses || 0)) > 0 
                        ? Math.round(((challengeTarget.wins || 0) / ((challengeTarget.wins || 0) + (challengeTarget.losses || 0))) * 100) 
                        : 0}%
                    </Text>
                  </>
                ) : challengeTarget && 'team_id' in challengeTarget ? (
                  <>
                    <Text style={styles.modalText}>
                      Members: {(challengeTarget.members || []).join(", ") || 'No members'}
                    </Text>
                    <Text style={styles.modalText}>
                      W-L: {(challengeTarget.wins || 0)}-{(challengeTarget.losses || 0)}  
                      Win%: {((challengeTarget.wins || 0) + (challengeTarget.losses || 0)) > 0 
                        ? Math.round(((challengeTarget.wins || 0) / ((challengeTarget.wins || 0) + (challengeTarget.losses || 0))) * 100) 
                        : 0}%
                    </Text>
                  </>
                ) : null}

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleCreateChallenge}
                >
                  <Text style={styles.confirmButtonText}>Send Challenge</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setModalVisible(false);
                    setChallengeTarget(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </BackgroundWrapper>
  );
};

type Styles = {
  [key: string]: ViewStyle | TextStyle;
}

const styles: Styles = StyleSheet.create({
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
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  segmentButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  segmentButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15,
    color: COLORS.secondary,
  },
  modalText: {
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: COLORS.primaryGradient[0],
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'gray',
  }
});