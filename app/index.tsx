// app/index.tsx
import React, { useEffect } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase";

export default function LandingPage() {
  useEffect(() => {
    const checkStatus = async () => {
      const hasCompletedOnboarding = await AsyncStorage.getItem("hasCompletedOnboarding");
      const isSignedUp = await AsyncStorage.getItem("isSignedUp");
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        router.replace("/(tabs)/home");
      } else if (isSignedUp === "true") {
        router.replace("/login");
      } else if (hasCompletedOnboarding === "completed") {
        router.replace("/(tabs)/home");
      }
    };
    checkStatus();
  }, []);

  const handleGetStarted = async () => {
    const hasCompletedOnboarding = await AsyncStorage.getItem("hasCompletedOnboarding");
    const isSignedUp = await AsyncStorage.getItem("isSignedUp");
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      router.replace("/(tabs)/home");
    } else if (isSignedUp === "true") {
      router.replace("/login");
    } else {
      router.push("/onboarding/welcome");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Pickleball Ladder</Text>
      <Text style={styles.tagline}>Join, Play, and Climb the Ranks!</Text>
      <Button title="Get Started" onPress={handleGetStarted} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  tagline: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
});