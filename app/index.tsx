import React, { useEffect } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LandingPage() {
  const handleGetStarted = async () => {
    try {
      const hasCompletedOnboarding = await AsyncStorage.getItem("hasCompletedOnboarding");
      const isSignedUp = await AsyncStorage.getItem("isSignedUp");

      console.log("hasCompletedOnboarding:", hasCompletedOnboarding);
      console.log("isSignedUp:", isSignedUp);

      if (hasCompletedOnboarding === "completed" || isSignedUp === "true") {
        console.log("Redirecting to home from landing");
        router.replace("/home");
      } else {
        console.log("Redirecting to onboarding");
        router.push("/onboarding/welcome"); // Use push instead of replace to allow back navigation
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      router.push("/onboarding/welcome"); // Fallback to onboarding
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Tendrils YOUR Pickleball Ladder</Text>
      <Text style={styles.tagline}>Join, Play, and Climb the Vine!</Text>
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