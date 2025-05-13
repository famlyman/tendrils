// app/(tabs)/home.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ViewStyle, TextStyle } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../supabase";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "../../context/AuthContext";
import BackgroundWrapper from "../../components/BackgroundWrapper";
import TeamCreationModal from "../../components/TeamCreationModal";
import LadderSelector from "../../components/LadderSelector";
import StandingsList from "../../components/StandingsList";
import type { StandingsItem as ImportedStandingsItem } from "../../components/StandingsList";

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
  opponentName?: string;
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
  opponentName?: string;
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
  teams: {
    name: string | null;
    team_id?: string;
    team_members?: { user_id: string }[];
  } | null;
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

type ChallengeTarget = (ImportedStandingsItem & {
  opponentName?: string;
  opponentUserId?: string;
  team_id?: string;
  user_id?: string;
  team_name?: string;
  teams?: { name?: string };
}) | null;

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
  const [userTeamDetails, setUserTeamDetails] = useState<Array<{team_id: string, name: string, members: { user_id: string, name: string }[]}>>([]);
  const [targetTeamMembers, setTargetTeamMembers] = useState<{ user_id: string, name: string }[]>([]);
  const [userProfile, setUserProfile] = useState<{ roles: string[] }>({ roles: [] });
  const [ladders, setLadders] = useState<Ladder[]>([]);
  const [selectedLadder, setSelectedLadder] = useState<Ladder | null>(null);

  // Fetch target team members when challengeTarget changes (for Doubles)
  React.useEffect(() => {
    const fetchTargetTeamMembers = async () => {
      if (segment === "Doubles" && challengeTarget && 'team_id' in challengeTarget && challengeTarget.team_id) {
        const { data: memberData } = await supabase
          .from('team_members')
          .select('user_id, profiles(name)')
          .eq('team_id', challengeTarget.team_id);
        setTargetTeamMembers(
          (memberData as { user_id: string; profiles?: { name?: string } }[] || []).map(m => ({
            user_id: m.user_id,
            name: m.profiles?.name || 'Unknown',
          })) as { user_id: string; name: string }[]
        );
      } else {
        setTargetTeamMembers([]);
      }
    };
    fetchTargetTeamMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeTarget, segment]);

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
        .select('team_id, teams!fk_team_members_team_id(name)')
        .eq('user_id', userId);

      if (teamsError) {
        setUserTeams([]);
        setUserTeamDetails([]);
        Alert.alert('Error', 'Failed to fetch user teams.');
      } else {
        const teamIds = (teamsData || []).map(item => item.team_id);
        setUserTeams(teamIds);

        const teamDetails = await Promise.all((teamsData || []).map(async item => {
          let members: { user_id: string, name: string }[] = [];
          if (item.team_id) {
            const { data: memberData } = await supabase
              .from('team_members')
              .select('user_id, profiles(name)')
              .eq('team_id', item.team_id);
            members = (memberData as { user_id: string; profiles?: { name?: string } }[] || []).map(m => ({
              user_id: m.user_id,
              name: m.profiles?.name || 'Unknown',
            }));
          }
          return {
            team_id: item.team_id,
            name: item.teams?.[0]?.name || 'Unnamed Team',
            members,
          };
        }));
        setUserTeamDetails(teamDetails);
      }
    } catch (error) {
      setUserProfile({ roles: [] });
      setUserTeams([]);
      setUserTeamDetails([]);
      Alert.alert('Error', 'An unexpected error occurred while fetching user data.');
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
    console.log('Challenge Creation Started', {
      segment,
      challengeTarget,
      userId,
      ladderID: selectedLadder?.ladder_id,
      vineId
    });

    if (!challengeTarget) {
      Alert.alert("Error", "No valid target selected");
      return;
    }

    // Validate required fields for challenge creation
    if (!userId) {
      Alert.alert("Error", "User ID is required");
      return;
    }

    if (!selectedLadder?.ladder_id) {
      Alert.alert("Error", "Please select a ladder");
      return;
    }

    if (!vineId) {
      Alert.alert("Error", "Vine ID is required");
      return;
    }
    
    try {
      // Detailed logging for doubles challenge
      if (segment === "Doubles") {
        console.log('Doubles Challenge Details', {
          challengeTargetType: 'team_id' in challengeTarget ? 'team' : 'unknown',
          challengeTargetId: 'team_id' in challengeTarget ? challengeTarget.team_id : 'N/A'
        });
      }

      // Validate challenge target for doubles
      if (segment === "Doubles" && !('team_id' in challengeTarget)) {
        Alert.alert("Error", "Invalid doubles challenge target");
        return;
      }

      // Detailed logging of challenge target for debugging
      console.log('Challenge Target Details for Opponent Selection', {
        segment,
        challengeTarget: JSON.stringify(challengeTarget, null, 2),
        challengeTargetKeys: Object.keys(challengeTarget),
        playerName: segment === 'Singles' ? challengeTarget.player_name : ('name' in challengeTarget ? challengeTarget.name : undefined)
      });

      // Fetch additional player details for logging and potential name display
      let opponentName = 'Unknown Opponent';
      let opponentUserId: string | null = null;

      console.log('Challenge Target Initial State', {
        segment,
        challengeTarget: JSON.stringify(challengeTarget, null, 2)
      });

      const isValidName = (name?: string) => 
        name && name.trim().length > 0 && name !== challengeTarget?.team_id;

      try {
        if (segment === 'Singles' && challengeTarget && 'user_id' in challengeTarget) {
          const { data: playerData, error: playerError } = await supabase
            .from('profiles')
            .select('full_name, user_id, player_name')
            .eq('user_id', challengeTarget.user_id)
            .single();

          console.log('Singles Player Details Fetch', {
            userId: challengeTarget.user_id,
            playerData,
            playerError,
            challengeTargetPlayerName: challengeTarget.player_name
          });

          const nameOptions = [
            playerData?.full_name,
            playerData?.player_name,
            challengeTarget.player_name
          ];

          opponentName = nameOptions.find(isValidName) || 'Unknown Opponent';
          opponentUserId = challengeTarget.user_id || null;

        } else if (segment === 'Doubles' && challengeTarget && 'team_id' in challengeTarget) {
          const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select('team_id, name, team_members!fk_team_members_team_id(user_id)')
            .eq('team_id', challengeTarget.team_id)
            .single();

          console.log('Doubles Team Details Fetch', {
            teamId: challengeTarget.team_id,
            teamData: JSON.stringify(teamData, null, 2),
            teamError: JSON.stringify(teamError, null, 2)
          });

          const nameOptions = [
            challengeTarget?.team_name || challengeTarget?.name || challengeTarget?.teams?.name,
            teamData?.name
          ];

          opponentName = nameOptions.find(isValidName) || `Team ${challengeTarget.team_id}`;

          // Fetch team members separately
          const { data: teamMembersData } = await supabase
            .from('team_members')
            .select('user_id, profiles(full_name)')
            .eq('team_id', challengeTarget.team_id);

          // Select first team member as opponent
          const teamMembers = teamMembersData || [];
          if (teamMembers.length > 0) {
            opponentUserId = teamMembers[0].user_id;
          }

          console.log('Doubles Opponent Name', { opponentName, opponentUserId });
        }
      } catch (fetchError) {
        console.error('Error fetching challenge details', fetchError);
      }

      if (!opponentUserId) {
        console.error('Opponent User ID Selection Failed', {
          segment,
          challengeTarget: JSON.stringify(challengeTarget, null, 2)
        });
        Alert.alert("Error", "Could not determine opponent user ID. Please check team configuration.");
        return;
      }

      console.log('Selected Opponent User ID', { opponentUserId });

      // Data structure for challenge insert
      const challengeData = {
        flower_id: uuidv4(), // Generate a new UUID
        challenger_id: userId,
        opponent_id: opponentUserId,
        ladder_id: selectedLadder.ladder_id,
        vine_id: vineId,
        status: "pending",
        date: new Date().toISOString(),
        result: null,
        score: null,
        team_1_id: segment === 'Doubles' && 'team_id' in challengeTarget ? challengeTarget.team_id : null,
        team_2_id: null // We'll leave this null for now
      };

      console.log('Challenge Insert Data', challengeData);

      // Validate challenge data before insert
      type ChallengeDataType = typeof challengeData & Record<string, any>;
      const requiredFields = ['flower_id', 'challenger_id', 'opponent_id', 'ladder_id', 'vine_id', 'status', 'date'] as const;
      const missingFields = requiredFields.filter(field => !(challengeData as ChallengeDataType)[field]);
      
      if (missingFields.length > 0) {
        console.error('Missing Challenge Fields', missingFields);
        Alert.alert("Error", `Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      try {
        // Diagnostic logging of Supabase configuration
        console.log('Supabase Client Configuration', {
          url: await supabase.auth.getUser() ? 'Configured' : 'Not Fully Configured',
          // Avoid accessing protected properties
        });

        // Validate table existence and schema
        try {
          const { data: tableCheck, error: tableError } = await supabase
            .from('flowers')
            .select('*')
            .limit(1);
          
          console.log('Challenges Table Check', {
            tableExists: tableError === null,
            sampleData: tableCheck,
            tableErrorDetails: tableError
          });
        } catch (tableCheckError) {
          console.error('Table Existence Check Failed', tableCheckError instanceof Error ? tableCheckError.message : tableCheckError);
        }

        // Detailed logging of exact insert payload
        console.log('Supabase Challenge Insert Payload', {
          table: 'flowers',
          data: challengeData,
          userId,
          segment,
          challengeTarget,
          // Add more contextual information
          challengeTargetKeys: Object.keys(challengeTarget),
          challengeDataKeys: Object.keys(challengeData)
        });

        // Attempt to insert challenge with comprehensive error handling
        const { data, error } = await supabase
          .from('flowers')
          .insert(challengeData)
          .select();

        // Log the raw Supabase response with more details
        console.log('Supabase Raw Response', {
          response: { data, error },
          data,
          error,
          status: 200,
          statusText: 'OK'
        });

        // Additional error checking
        // Define a type for Supabase error details
        type SupabaseErrorDetails = {
          message?: string;
          details?: string;
          code?: string;
          hint?: string;
        };

        const errorDetails: SupabaseErrorDetails = error || {};

        if (error) {
          // Capture and log every possible error detail
          console.error('Challenge Creation Detailed Error', {
            fullErrorObject: error,
            message: error.message ?? 'No error message',
            details: error.details ?? 'No details',
            code: error.code ?? 'No error code',
            hint: error.hint ?? 'No hint',
            // Additional context
            challengeData,
            userId,
            segment
          });

          // Comprehensive error type checking
          const errorCode = error.code;
          if (errorCode === '23505') {
            Alert.alert("Error", "A similar challenge already exists.");
          } else if (errorCode === '23503') {
            Alert.alert("Error", "Invalid reference in challenge data.");
          } else if (error.message) {
            Alert.alert("Error", error.message);
          } else {
            Alert.alert("Error", "An unknown error occurred while creating the challenge.");
          }
        } else if (Array.isArray(data)) {
          console.log('Challenge Created Successfully', data);
          Alert.alert("Success", "Challenge sent!");
          setChallengeTarget(null);
          setModalVisible(false);
        } else {
          // Unexpected case: no error but also no data
          console.warn('Challenge insert completed without data or error');
          Alert.alert("Warning", "Challenge may not have been created.");
        }
      } catch (catchError) {
        // Capture any unexpected errors during the entire process
        console.error('Unexpected Challenge Creation Error', {
          error: catchError,
          challengeData,
          userId,
          segment
        });
        
        Alert.alert(
          "Critical Error", 
          catchError instanceof Error ? catchError.message : "An unexpected error occurred"
        );
      }
    } catch (e) {
      console.error('Challenge Creation Catch Error', e);
      Alert.alert("Error", "Failed to send challenge. " + (e instanceof Error ? e.message : String(e)));
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
                  Challenge {challengeTarget?.opponentName || challengeTarget?.name || challengeTarget?.player_name || 'Opponent'}?
                </Text>
                {segment === "Singles" && 'user_id' in challengeTarget ? (
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: 'bold' }}>Opponent Name:</Text>{"\n"}
                    {challengeTarget.opponentName || challengeTarget.player_name || challengeTarget.name || 'Unknown Opponent'}
                  </Text>
                ) : challengeTarget && 'team_id' in challengeTarget ? (
                  <>
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: 'bold' }}>Opponent Team Name:</Text>{"\n"}
                      {challengeTarget.opponentName || challengeTarget.name || 'Unknown Team'}
                    </Text>
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: 'bold' }}>Opponent Team Members:</Text>{"\n"}
                      {targetTeamMembers.length > 0 ? (
                        targetTeamMembers.map(m => (
                          <Text key={m.user_id}>{m.name}{"\n"}</Text>
                        ))
                      ) : (
                        <Text>No team members found{"\n"}</Text>
                      )}
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