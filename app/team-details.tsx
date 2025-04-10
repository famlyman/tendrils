// app/team-details.tsx
import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Alert, FlatList, StatusBar, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "react-native-elements";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../supabase";
import * as Animatable from "react-native-animatable";

export default function TeamDetails() {
  const { teamName } = useLocalSearchParams();
  const [team, setTeam] = useState<any>(null);
  const [joinCode, setJoinCode] = useState("");
  const [players, setPlayers] = useState<{ player_id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const joinButtonRef = useRef<any>(null);

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
            auth_linked: true,
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
    <View style={styles.playerItem}>
      <Text style={styles.playerText}>{item.name}</Text>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
        <ActivityIndicator size="large" color="#FFD700" />
      </LinearGradient>
    );
  }

  if (!team) {
    return (
      <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
        <Animatable.View animation="fadeIn" duration={1000} style={styles.content}>
          <Image source={require("../assets/images/pickleball.png")} style={styles.icon} />
          <Text style={styles.title}>Team Details</Text>
          <Text style={styles.errorText}>Team not found</Text>
        </Animatable.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
      <Animatable.View animation="fadeIn" duration={1000} style={styles.content}>
        <Image source={require("../assets/images/pickleball.png")} style={styles.icon} />
        <Text style={styles.title}>{team.team_name}</Text>
        <View style={styles.card}>
          <Text style={styles.statText}>Wins: {team.wins}</Text>
          <Text style={styles.statText}>Losses: {team.losses}</Text>
          <Text style={styles.statText}>Total Points: {team.total_points}</Text>
        </View>

        <Text style={styles.sectionTitle}>Players:</Text>
        {players.length > 0 ? (
          <FlatList
            data={players}
            renderItem={renderPlayer}
            keyExtractor={item => item.player_id}
            style={styles.playerList}
          />
        ) : (
          <Text style={styles.noPlayersText}>No players on this team yet.</Text>
        )}

        <Text style={styles.joinPrompt}>Enter the join code to join this team:</Text>
        <TextInput
          style={styles.input}
          placeholder="Join Code (e.g., ABC123)"
          placeholderTextColor="#999"
          value={joinCode}
          onChangeText={setJoinCode}
          autoCapitalize="characters"
        />
        <Animatable.View ref={joinButtonRef}>
          <Button
            title="Join Team"
            onPress={() => {
              joinButtonRef.current?.bounce(800);
              handleJoinTeam();
            }}
            buttonStyle={styles.button}
            titleStyle={styles.buttonText}
            containerStyle={styles.buttonWrapper}
            ViewComponent={LinearGradient}
            linearGradientProps={{
              colors: ["#FFD700", "#FFC107"],
              start: { x: 0, y: 0 },
              end: { x: 1, y: 0 },
            }}
          />
        </Animatable.View>
      </Animatable.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  icon: {
    width: 50,
    height: 50,
    marginBottom: 20,
    alignSelf: "center",
  },
  title: {
    fontSize: 36,
    fontFamily: "AmaticSC-Bold",
    color: "#1A3C34",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  statText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
    marginTop: 10,
    marginBottom: 10,
  },
  playerList: {
    width: "100%",
    marginBottom: 20,
  },
  playerItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  playerText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
  },
  noPlayersText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    textAlign: "center",
  },
  joinPrompt: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  buttonWrapper: {
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginVertical: 5,
    width: "100%",
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
  },
});