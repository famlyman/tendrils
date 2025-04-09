// app/onboarding/join-now.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabase";

export default function JoinNow() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [roles, setRoles] = useState({ Player: false, Captain: false, Coordinator: false });

  const handleRoleChange = (role: keyof typeof roles) => {
    setRoles(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const setStorageItem = async (key: string, value: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value);
      console.log(`Set ${key} in localStorage`);
    } else {
      await AsyncStorage.setItem(key, value);
      console.log(`Set ${key} in AsyncStorage`);
    }
  };

  const handleJoin = async () => {
    console.log("Starting signup:", { email, password, name, roles });
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name.");
      return;
    }
    const selectedRoles = Object.entries(roles).filter(([_, isSelected]) => isSelected).map(([role]) => role);
    if (selectedRoles.length === 0) {
      Alert.alert("Error", "Please select at least one role.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) {
        console.log("Auth error:", error.message);
        throw error;
      }
      console.log("Signup success:", data);

      const user = data.user;
      if (!user) throw new Error("No user returned");

      const roleMap: { [key: string]: number } = { Player: 1, Captain: 2, Coordinator: 3 };
      const roleInserts = selectedRoles.map(role => ({ user_id: user.id, role_id: roleMap[role] }));
      const { error: roleError } = await supabase.from("user_roles").insert(roleInserts);
      if (roleError) {
        console.log("Role insert error:", roleError);
        throw roleError;
      }
      console.log("Roles inserted");

      if (roles.Player) {
        console.log("Inserting player:", { name, user_id: user.id });
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .insert({ name, user_id: user.id, auth_linked: true })
          .select("player_id");
        if (playerError) {
          console.log("Player insert error:", playerError);
          throw playerError;
        }
        const player = Array.isArray(playerData) ? playerData[0] : playerData;
        console.log("Player inserted:", player);

        const { error: recordError } = await supabase
          .from("individual_records")
          .insert({ player_id: player.player_id, wins: 0, losses: 0, points: 0 });
        if (recordError) {
          console.log("Record insert error:", recordError);
          throw recordError;
        }
        console.log("Individual record inserted");
      }

      await setStorageItem("isSignedUp", "true");
      await setStorageItem("hasCompletedOnboarding", "completed");

      if (roles.Captain) {
        console.log("Redirecting to team-creation");
        if (typeof window !== "undefined") {
          console.log("Using window.location for web");
          window.location.href = "/team-creation";
        } else {
          console.log("Using router.push for native");
          router.push("/team-creation");
        }
      } else {
        console.log("Redirecting to home");
        if (typeof window !== "undefined") {
          console.log("Using window.location for web");
          window.location.href = "/(tabs)/home";
        } else {
          console.log("Using router.replace for native");
          router.replace("/(tabs)/home");
        }
      }
    } catch (e: any) {
      console.log("Signup failed:", e.message);
      Alert.alert("Error", e.message || "Failed to sign up. Try again.");
    }
  };

  const handleSkip = async () => {
    await setStorageItem("hasCompletedOnboarding", "skipped");
    router.push("/(tabs)/home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Now</Text>
      <Text style={styles.description}>Sign up to start playing!</Text>
      <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} autoCapitalize="words" />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Text style={styles.roleTitle}>Select Your Role(s)</Text>
      <TouchableOpacity style={styles.checkboxContainer} onPress={() => handleRoleChange("Player")}>
        <View style={[styles.checkbox, roles.Player && styles.checkboxSelected]}>
          {roles.Player && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Player</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.checkboxContainer} onPress={() => handleRoleChange("Captain")}>
        <View style={[styles.checkbox, roles.Captain && styles.checkboxSelected]}>
          {roles.Captain && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Captain</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.checkboxContainer} onPress={() => handleRoleChange("Coordinator")}>
        <View style={[styles.checkbox, roles.Coordinator && styles.checkboxSelected]}>
          {roles.Coordinator && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Coordinator</Text>
      </TouchableOpacity>
      <Button title="Sign Up" onPress={handleJoin} />
      <Button title="Skip" onPress={handleSkip} color="#888" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  description: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 20 },
  input: { width: "100%", height: 40, borderColor: "#ccc", borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, marginBottom: 10 },
  roleTitle: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: "#ccc", borderRadius: 3, justifyContent: "center", alignItems: "center", marginRight: 10 },
  checkboxSelected: { backgroundColor: "#0000ff", borderColor: "#0000ff" },
  checkmark: { color: "#fff", fontSize: 14 },
  checkboxLabel: { fontSize: 16 },
});