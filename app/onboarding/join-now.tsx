// app/onboarding/join-now.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, CheckBox } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabase";

export default function JoinNow() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState({
    Player: false,
    Captain: false,
    Coordinator: false,
  });

  const handleRoleChange = (role: keyof typeof roles) => {
    setRoles(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const handleJoin = async () => {
    const selectedRoles = Object.entries(roles)
      .filter(([_, isSelected]) => isSelected)
      .map(([role]) => role);

    if (selectedRoles.length === 0) {
      Alert.alert("Error", "Please select at least one role.");
      return;
    }

    console.log("Attempting signup with:", { email, password, roles: selectedRoles });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        console.log("Supabase error:", error.message, error.code);
        Alert.alert("Signup Error", error.message);
        return;
      }

      console.log("Signup success:", data);
      const user = data.user;
      if (!user) throw new Error("No user returned after signup");

      // Map role names to role_ids
      const roleMap: { [key: string]: number } = {
        Player: 1,
        Captain: 2,
        Coordinator: 3,
      };

      // Insert selected roles into user_roles
      const roleInserts = selectedRoles.map(role => ({
        user_id: user.id,
        role_id: roleMap[role],
      }));

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert(roleInserts);
      if (roleError) throw roleError;

      await AsyncStorage.setItem("isSignedUp", "true");
      await AsyncStorage.setItem("hasCompletedOnboarding", "completed");

      // If Captain is selected, redirect to team creation
      if (roles.Captain) {
        router.push("/team-creation");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (e: any) {
      console.log("Error:", e);
      Alert.alert("Error", e.message || "Failed to sign up. Try again.");
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("hasCompletedOnboarding", "skipped");
    router.push("/(tabs)/home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Now</Text>
      <Text style={styles.description}>Sign up to start playing!</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Text style={styles.roleTitle}>Select Your Role(s)</Text>
      <View style={styles.checkboxContainer}>
        <CheckBox value={roles.Player} onValueChange={() => handleRoleChange("Player")} />
        <Text style={styles.checkboxLabel}>Player</Text>
      </View>
      <View style={styles.checkboxContainer}>
        <CheckBox value={roles.Captain} onValueChange={() => handleRoleChange("Captain")} />
        <Text style={styles.checkboxLabel}>Captain</Text>
      </View>
      <View style={styles.checkboxContainer}>
        <CheckBox value={roles.Coordinator} onValueChange={() => handleRoleChange("Coordinator")} />
        <Text style={styles.checkboxLabel}>Coordinator</Text>
      </View>
      <Button title="Sign Up" onPress={handleJoin} />
      <Button title="Skip" onPress={handleSkip} color="#888" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 10,
  },
});