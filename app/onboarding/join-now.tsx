import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabase";

export default function JoinNow() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleJoin = async () => {
    console.log("Attempting signup with:", { email, password });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        console.log("Supabase error:", error.message, error.code, error);
        Alert.alert("Signup Error", error.message);
      } else {
        console.log("Signup success:", data);
        await AsyncStorage.setItem("hasCompletedOnboarding", "completed");
        await AsyncStorage.setItem("isSignedUp", "true");
        router.push("/(tabs)/home");
      }
    } catch (e) {
      console.log("Network exception:", e.message, e.stack);
      Alert.alert("Network Error", "Failed to connect to Supabase. Check your connection or try again.");
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
});