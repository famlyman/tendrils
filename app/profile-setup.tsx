// app/profile-setup.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  StatusBar,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "react-native-elements";
import { router } from "expo-router";
import { supabase } from "../supabase";
import * as Animatable from "react-native-animatable";
import { TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileSetup() {
  const [name, setName] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [contactInfo, setContactInfo] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string>("");
  const [teamJoined, setTeamJoined] = useState<string | null>(null); // Track if a team was joined

  const saveButtonRef = useRef<any>(null);
  const joinButtonRef = useRef<any>(null);

  const handleSaveProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("No authenticated user");
  
      if (name) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: name },
        });
        if (authError) throw authError;
  
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .select("user_id")
          .eq("user_id", user.id)
          .single();
        if (playerError && playerError.code !== "PGRST116") throw playerError;
        if (playerData) {
          const { error: playerUpdateError } = await supabase
            .from("players")
            .update({ name })
            .eq("user_id", user.id);
          if (playerUpdateError) throw playerUpdateError;
        }
      }
  
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            bio: bio || null,
            contact_info: contactInfo || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      if (profileError) throw profileError;
  
      // Set onboarding flag
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");
  
      Alert.alert("Success", "Profile setup complete!");
      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.log("Error saving profile:", err);
      Alert.alert("Error", err.message || "Failed to save profile.");
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) {
      Alert.alert("Error", "Please enter a join code.");
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("No authenticated user");

      // Check if the join code exists
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("team_id, team_name, join_code")
        .eq("join_code", joinCode.toUpperCase())
        .single();
      if (teamError || !teamData) {
        throw new Error("Invalid join code. Please try again.");
      }

      // Check if user is already on the team
      const { data: existingMembership, error: membershipError } = await supabase
        .from("team_players")
        .select("player_id")
        .eq("team_id", teamData.team_id)
        .eq("player_id", user.id);
      if (membershipError) throw membershipError;

      if (existingMembership.length > 0) {
        Alert.alert("Info", `You’re already on ${teamData.team_name}!`);
        setTeamJoined(teamData.team_name);
        return;
      }

      // Ensure user is in players table
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
            name: name || user.user_metadata.full_name || "Unnamed Player",
            auth_linked: true,
          });
        if (playerInsertError) throw playerInsertError;
      }

      // Join the team
      const { error: joinError } = await supabase
        .from("team_players")
        .insert({
          team_id: teamData.team_id,
          player_id: user.id,
        });
      if (joinError) throw joinError;

      Alert.alert("Success", `Joined team: ${teamData.team_name}`);
      setTeamJoined(teamData.team_name);
    } catch (err: any) {
      console.log("Error joining team:", err);
      Alert.alert("Error", err.message || "Failed to join team. Try again.");
    }
  };

  const handleSkipTeam = () => {
    setTeamJoined("skipped"); // Mark as skipped to disable the join section
  };

  return (
    <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animatable.View animation="fadeIn" duration={1000} style={styles.content}>
          <Image source={require("../assets/images/pickleball.png")} style={styles.icon} />
          <Text style={styles.title}>Welcome to Tendrils!</Text>
          <Text style={styles.subtitle}>Let’s set up your profile</Text>

          {/* Profile Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Profile</Text>
            <Text style={styles.cardLabel}>Name (Required):</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
            <Text style={styles.cardLabel}>Bio (Optional):</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell others about yourself"
              placeholderTextColor="#999"
              multiline
            />
            <Text style={styles.cardLabel}>Contact Info (Optional):</Text>
            <TextInput
              style={styles.input}
              value={contactInfo}
              onChangeText={setContactInfo}
              placeholder="e.g., phone or social handle"
              placeholderTextColor="#999"
            />
          </View>

          {/* Team Join Section */}
          {!teamJoined && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Join a Team (Optional)</Text>
              <Text style={styles.cardLabel}>Enter a team join code:</Text>
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
              <TouchableOpacity onPress={handleSkipTeam} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>
          )}
          {teamJoined && teamJoined !== "skipped" && (
            <Text style={styles.successText}>Successfully joined {teamJoined}!</Text>
          )}

          {/* Finish Button */}
          <Animatable.View ref={saveButtonRef}>
            <Button
              title="Finish"
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    marginBottom: 20,
    textAlign: "center",
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
  skipButton: {
    marginTop: 10,
    alignItems: "center",
  },
  skipText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    textDecorationLine: "underline",
  },
  successText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    marginBottom: 20,
    textAlign: "center",
  },
});