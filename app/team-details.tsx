import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, FlatList } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../supabase";

export default function TeamDetails() {
  const { teamName } = useLocalSearchParams();
  const [team, setTeam] = useState<any>(null);
  const [joinCode, setJoinCode] = useState("");
  const [players, setPlayers] = useState<{ player_id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamDetails = async () => {
    try {
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("team_id, team_name, captain_id, join_code, team_records(wins, losses, total_points)")
        .eq("team_name", decodeURIComponent(teamName as string))
        .single();
      if (teamError) throw teamError;

      setTeam({
        team_id: teamData.team_id,
        team_name: teamData.team_name,
        captain_id: teamData.captain_id,
        join_code: teamData.join_code,
        wins: teamData.team_records?.[0]?.wins ?? 0,
        losses: teamData.team_records?.[0]?.losses ?? 0,
        total_points: teamData.team_records?.[0]?.total_points ?? 0,
      });

      const { data: teamPlayers, error: playersError } = await supabase
        .from("team_players")
        .select("player_id")
        .eq("team_id", teamData.team_id);
      if (playersError) throw playersError;

      if (teamPlayers.length > 0) {
        const playerIds = teamPlayers.map(tp => tp.player_id);
        const { data: playerData, error: namesError } = await supabase
          .from("players")
          .select("user_id, name")
          .in("user_id", playerIds);
        if (namesError) throw namesError;

        setPlayers(playerData.map(p => ({
          player_id: p.user_id,
          name: p.name || "Unnamed Player",
        })) || []);
      } else {
        setPlayers([]);
      }
    } catch (err) {
      console.log("Error fetching team details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [teamName]);

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) {
      Alert.alert("Error", "Please enter the join code.");
      return;
    }
  
    if (!team) {
      Alert.alert("Error", "Team details not loaded yet.");
      return;
    }
  
    if (joinCode.toUpperCase() !== team.join_code) {
      Alert.alert("Error", "Incorrect join code. Please try again.");
      return;
    }
  
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("No authenticated user");
  
      const { data: existingMembership, error: membershipError } = await supabase
        .from("team_players")
        .select("player_id")
        .eq("team_id", team.team_id)
        .eq("player_id", user.id);
      if (membershipError) throw membershipError;
  
      if (existingMembership.length > 0) {
        Alert.alert("Info", "You’re already on this team!");
        router.replace("/(tabs)/home");
        return;
      }
  
      // Only insert into players if not already there
      const { data: playerCheck, error: playerCheckError } = await supabase
        .from("players")
        .select("user_id")
        .eq("user_id", user.id)
        .single();
      if (playerCheckError && playerCheckError.code !== "PGRST116") throw playerCheckError;
  
      if (!playerCheck) {
        const { error: playerInsertError } = await supabase
          .from("players")
          .insert({
            user_id: user.id,
            name: user.user_metadata.full_name || "Unnamed Player",
            auth_linked: true, // Match join-now.tsx
          });
        if (playerInsertError) throw playerInsertError;
      }
  
      const { error: joinError } = await supabase
        .from("team_players")
        .insert({
          team_id: team.team_id,
          player_id: user.id,
        });
      if (joinError) throw joinError;
  
      Alert.alert("Success", `Joined team: ${team.team_name}`);
      fetchTeamDetails();
  
    } catch (err: any) {
      console.log("Error joining team:", err);
      Alert.alert("Error", err.message || "Failed to join team. Try again.");
    }
  };

  const renderPlayer = ({ item }: { item: { player_id: string; name: string } }) => (
    <Text style={styles.playerItem}>{item.name}</Text>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.container}>
        <Text>Team not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{team.team_name}</Text>
      <Text>Wins: {team.wins}</Text>
      <Text>Losses: {team.losses}</Text>
      <Text>Total Points: {team.total_points}</Text>
      {/* join_code hidden; captain sees it in Profile */}

      <Text style={styles.sectionTitle}>Players:</Text>
      {players.length > 0 ? (
        <FlatList
          data={players}
          renderItem={renderPlayer}
          keyExtractor={item => item.player_id}
          style={styles.playerList}
        />
      ) : (
        <Text>No players on this team yet.</Text>
      )}

      <Text style={styles.joinPrompt}>Enter the join code to join this team:</Text>
      <TextInput
        style={styles.input}
        placeholder="Join Code (e.g., ABC123)"
        value={joinCode}
        onChangeText={setJoinCode}
        autoCapitalize="characters"
      />
      <Button title="Join Team" onPress={handleJoinTeam} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  playerList: {
    width: "100%",
    marginBottom: 20,
  },
  playerItem: {
    fontSize: 16,
    paddingVertical: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  joinPrompt: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
});