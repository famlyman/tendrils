// app/(tabs)/profile.tsx
import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, StyleSheet, Alert, StatusBar, Image, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "react-native-elements";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabase";
import * as Animatable from "react-native-animatable";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

export default function Profile() {
  const [session, setSession] = useState<any>(null);
  const [name, setName] = useState<string>("");
  const [roles, setRoles] = useState<string[]>([]);
  const [isPlayer, setIsPlayer] = useState(false);
  const [bio, setBio] = useState<string>("");
  const [contactInfo, setContactInfo] = useState<string>("");
  const [teamInfo, setTeamInfo] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showEditCard, setShowEditCard] = useState(false); // New state for toggling the edit card

  const saveButtonRef = useRef<any>(null);
  const removeButtonRef = useRef<any>(null);
  const coordinatorButtonRef = useRef<any>(null);
  const logoutButtonRef = useRef<any>(null);
  const loginButtonRef = useRef<any>(null);

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

          let teamText = "";
          if (roleNames.includes("Captain")) {
            const { data: captainTeam, error: captainError } = await supabase
              .from("teams")
              .select("team_name, join_code")
              .eq("captain_id", session.user.id)
              .single();
            if (!captainError && captainTeam) {
              teamText += `Captain of: ${captainTeam.team_name}`;
              setJoinCode(captainTeam.join_code);
            }
          }
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
              const teamNames = playerTeams
                .map((pt: { teams: { team_name: string }[] }) => pt.teams[0].team_name)
                .join(", ");
              teamText += (teamText ? " | " : "") + `Plays for: ${teamNames}`;
            }
            setIsPlayer(true);
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
              if (roleError && roleError.code !== "PGRST116") throw roleError;

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
        .upsert(
          {
            user_id: user.id,
            bio,
            contact_info: contactInfo,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      if (profileError) throw profileError;

      Alert.alert("Success", "Profile updated!");
      setShowEditCard(false); // Hide the card after saving
    } catch (err: any) {
      console.log("Error saving profile:", err);
      Alert.alert("Error", "Failed to save profile.");
    }
  };

  const handleGoToCoordinatorDashboard = () => {
    router.push("/coordinator");
  };

  const toggleEditCard = () => {
    setShowEditCard(!showEditCard);
  };

  if (loading) {
    return (
      <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
        <Text style={styles.loadingText}>Loading...</Text>
      </LinearGradient>
    );
  }

  if (!session) {
    return (
      <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
        <Animatable.View animation="fadeIn" duration={1000} style={styles.content}>
          <Image source={require("../../assets/images/pickleball.png")} style={styles.icon} />
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.errorText}>Not logged in</Text>
          <Animatable.View ref={loginButtonRef}>
            <Button
              title="Log In"
              onPress={() => {
                loginButtonRef.current?.bounce(800);
                router.push("/login");
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

  const canRemovePlayerRole = isPlayer && (roles.includes("Captain") || roles.includes("Coordinator"));

  return (
    <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animatable.View animation="fadeIn" duration={1000} style={styles.content}>
          <Image source={require("../../assets/images/pickleball.png")} style={styles.icon} />
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.label}>Email: {session.user.email}</Text>
          <Text style={styles.label}>Roles: {roles.join(", ") || "None"}</Text>
          <Text style={styles.label}>Team: {teamInfo}</Text>
          {joinCode && (
            <Text style={styles.label}>Join Code: {joinCode} (Share this with players!)</Text>
          )}
          <TouchableOpacity style={styles.editButton} onPress={toggleEditCard}>
            <MaterialIcons name="edit" size={24} color="#1A3C34" style={styles.editIcon} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          {showEditCard && (
            <Animatable.View animation="fadeIn" duration={500} style={styles.card}>
              <Text style={styles.cardTitle}>Edit Profile</Text>
              <Text style={styles.cardLabel}>Name:</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
              <Text style={styles.cardLabel}>Bio:</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell others about yourself"
                placeholderTextColor="#999"
                multiline
              />
              <Text style={styles.cardLabel}>Contact Info:</Text>
              <TextInput
                style={styles.input}
                value={contactInfo}
                onChangeText={setContactInfo}
                placeholder="e.g., phone or social handle"
                placeholderTextColor="#999"
              />
            </Animatable.View>
          )}
          {showEditCard && (
            <Animatable.View ref={saveButtonRef}>
              <Button
                title="Save Profile"
                onPress={() => {
                  saveButtonRef.current?.bounce(800);
                  handleSaveProfile();
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
          )}
          {roles.includes("Coordinator") && (
            <Animatable.View ref={coordinatorButtonRef}>
              <Button
                title="Coordinator Dashboard"
                onPress={() => {
                  coordinatorButtonRef.current?.bounce(800);
                  handleGoToCoordinatorDashboard();
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
          )}
          <Animatable.View ref={logoutButtonRef}>
            <Button
              title="Log Out"
              onPress={() => {
                logoutButtonRef.current?.bounce(800);
                handleLogout();
              }}
              buttonStyle={[styles.button, styles.logoutButton]}
              titleStyle={styles.buttonText}
              containerStyle={styles.buttonWrapper}
              ViewComponent={LinearGradient}
              linearGradientProps={{
                colors: ["#D3D3D3", "#A9A9A9"],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 0 },
              }}
            />
          </Animatable.View>
          {canRemovePlayerRole && (
            <Animatable.View ref={removeButtonRef}>
              <Button
                title="Remove Player Role"
                onPress={() => {
                  removeButtonRef.current?.bounce(800);
                  handleRemovePlayerRole();
                }}
                buttonStyle={[styles.button, styles.removeButton]}
                titleStyle={styles.removeButtonText}
                containerStyle={styles.removeButtonWrapper}
                ViewComponent={LinearGradient}
                linearGradientProps={{
                  colors: ["#FF6666", "#FF3333"],
                  start: { x: 0, y: 0 },
                  end: { x: 1, y: 0 },
                }}
              />
            </Animatable.View>
          )}
        </Animatable.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
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
  label: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    marginBottom: 10,
    textAlign: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)", // Subtle white background
    borderRadius: 10,
  },
  editIcon: {
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 18,
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
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
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
    marginBottom: 15,
    textAlign: "center",
  },
  cardLabel: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    marginBottom: 5,
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
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 10,
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
  removeButtonWrapper: {
    borderRadius: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginVertical: 5,
    width: "60%",
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  removeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderColor: "#FF3333",
    borderWidth: 1,
  },
  logoutButton: {
    borderColor: "#A9A9A9",
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
  },
  removeButtonText: {
    fontSize: 14,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    textAlign: "center",
    marginBottom: 20,
  },
});