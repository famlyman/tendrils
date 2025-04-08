import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HowItWorks() {
  const handleSkip = async () => {
    console.log("Skip pressed in How It Works");
    try {
      await AsyncStorage.setItem("hasCompletedOnboarding", "skipped");
      console.log("AsyncStorage set to skipped");
      router.push("/(tabs)/home");
      console.log("Navigation attempted to /(tabs)/home");
    } catch (error) {
      console.log("Skip error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How It Works</Text>
      <Text style={styles.description}>Play matches, earn points, and climb the ladder!</Text>
      <Button title="Next" onPress={() => router.push("/onboarding/join-now")} />
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
});