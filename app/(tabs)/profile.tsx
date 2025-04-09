import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabase";

export default function Settings() {
  const [session, setSession] = useState<any>(null);
  const [name, setName] = useState<string>("");
  const [roles, setRoles] = useState<string[]>([]);
  const [isPlayer, setIsPlayer] = useState(false);
  const [bio, setBio] = useState<string>("");
  const [contactInfo, setContactInfo] = useState<string>("");
  const [teamInfo, setTeamInfo] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string>(""); // New state for join_code
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          const fullName = userData.user.user_metadata.full_name || "";
          setName(fullName);

          const { data: userRoleData, error: userRoleError } = await supabase
            .from("user_roles")
            .select("role_id")
            .eq("user_id", session.user.id);
          if (userRoleError) throw userRoleError;

          let roleNames: string[] = [];
          if (userRoleData && userRoleData.length > 0) {
            const roleIds = userRoleData.map(item => item.role_id);
            const { data: roleData, error: roleError } = await supabase
              .from("roles")
              .select("role_name")
              .in("role_id", roleIds);
            if (roleError) throw roleError;

            roleNames = roleData.map(item => item.role_name);
            setRoles(roleNames);
            setIsPlayer(roleNames.includes("Player"));
          } else {
            setRoles([]);
            setIsPlayer(false);
          }

          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("bio, contact_info")
            .eq("user_id", session.user.id)
            .single();
          if (!profileError && profileData) {
            setBio(profileData.bio || "");
            setContactInfo(profileData.contact_info || "");
          }

          if (!fullName) {
            const { data: playerData, error: playerError } = await supabase
              .from("players")
              .select("name")
              .eq("user_id", session.user.id)
              .single();
            if (!playerError && playerData) setName(playerData.name);
          }

          // Fetch team info and join_code
          let teamText = "";
          if (roleNames.includes("Captain")) {
            const { data: captainTeam, error: captainError } = await supabase
              .from("teams")
              .select("team_name, join_code") // Added join_code
              .eq("captain_id", session.user.id)
              .single();
            if (!captainError && captainTeam) {
              teamText += `Captain of: ${captainTeam.team_name}`;
              setJoinCode(captainTeam.join_code); // Set join_code
            }
          }
          if (roleNames.includes("Player")) {
            const { data: playerData, error: playerError } = await supabase
              .from("players")
              .select("player_id")
              .eq("user_id", session.user.id)
              .single();
            if (!playerError && playerData) {
              const { data: playerTeams, error: teamError } = await supabase
                .from("team_players")
                .select("teams(team_name)")
                .eq("player_id", playerData.player_id);
              if (!teamError && playerTeams?.length > 0) {
                console.log("Raw playerTeams:", playerTeams);
                const teamNames = playerTeams
                  .map((pt: { teams: { team_name: string }[] }) => pt.teams[0].team_name)
                  .join(", ");
                teamText += (teamText ? " | " : "") + `Plays for: ${teamNames}`;
              }
            }
          }
          setTeamInfo(teamText || "Not affiliated with any team");
        }
      } catch (err) {
        console.log("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem("isSignedUp");
    router.replace("/login");
  };

  const handleRemovePlayerRole = async () => {
    Alert.alert(
      "Confirm",
      "Are you sure you want to remove yourself as a Player?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("No user");

              const { error: playerError } = await supabase
                .from("players")
                .delete()
                .eq("user_id", user.id);
              if (playerError) throw playerError;

              const { error: roleError } = await supabase
                .from("user_roles")
                .delete()
                .eq("user_id", user.id)
                .eq("role_id", 1);
              if (roleError) throw roleError;

              setIsPlayer(false);
              setRoles(roles.filter(role => role !== "Player"));
              setTeamInfo(teamInfo.replace(/Plays for: .*$/, "").trim() || "Not affiliated with any team");
              Alert.alert("Success", "Player role removed.");
            } catch (err: any) {
              console.log("Error removing player role:", err);
              Alert.alert("Error", "Failed to remove Player role.");
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      if (name !== user.user_metadata.full_name) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: name },
        });
        if (authError) throw authError;

        if (isPlayer) {
          const { error: playerError } = await supabase
            .from("players")
            .update({ name })
            .eq("user_id", user.id);
          if (playerError) throw playerError;
        }
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          bio,
          contact_info: contactInfo,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      if (profileError) throw profileError;

      Alert.alert("Success", "Profile updated!");
    } catch (err: any) {
      console.log("Error saving profile:", err);
      Alert.alert("Error", "Failed to save profile.");
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><Text>Loading...</Text></View>;
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text>Not logged in</Text>
        <Button title="Log In" onPress={() => router.push("/login")} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.label}>Email: {session.user.email}</Text>
      <Text style={styles.label}>Name:</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
        autoCapitalize="words"
      />
      <Text style={styles.label}>Roles: {roles.join(", ") || "None"}</Text>
      <Text style={styles.label}>Team: {teamInfo}</Text>
      {joinCode && (
        <Text style={styles.label}>Join Code: {joinCode} (Share this with players!)</Text>
      )}
      
      <Text style={styles.label}>Bio:</Text>
      <TextInput
        style={styles.input}
        value={bio}
        onChangeText={setBio}
        placeholder="Tell others about yourself"
        multiline
      />
      <Text style={styles.label}>Contact Info:</Text>
      <TextInput
        style={styles.input}
        value={contactInfo}
        onChangeText={setContactInfo}
        placeholder="e.g., phone or social handle"
      />
      <Button title="Save Profile" onPress={handleSaveProfile} />
      {isPlayer && (roles.includes("Captain") || roles.includes("Coordinator")) && (
        <Button title="Remove Player Role" onPress={handleRemovePlayerRole} color="red" />
      )}
      <Button title="Log Out" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});