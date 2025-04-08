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
      console.log("Landing - Session:", session);
      console.log("Landing - hasCompletedOnboarding:", hasCompletedOnboarding);
      console.log("Landing - isSignedUp:", isSignedUp);

      if (session) {
        router.replace("/(tabs)/home");
      } else {
        // Reset AsyncStorage if no session to avoid stale data
        await AsyncStorage.clear();
        console.log("AsyncStorage cleared due to no session");
      }
    };
    checkStatus();
  }, []);

  const handleGetStarted = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      router.replace("/(tabs)/home");
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