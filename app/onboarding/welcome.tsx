import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Welcome() {
  const handleSkip = async () => {
    console.log("Skip pressed in Welcome");
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
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.description}>Get ready to join the pickleball fun.</Text>
      <Button title="Next" onPress={() => router.push("/onboarding/how-it-works")} />
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