import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function JoinNow() {
  const handleJoin = async () => {
    await AsyncStorage.setItem("hasCompletedOnboarding", "completed");
    // Later, this could trigger signup; for now, go to home
    router.push("/home");
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("hasCompletedOnboarding", "skipped");
    router.push("/home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Now</Text>
      <Text style={styles.description}>Sign up to start playing!</Text>
      <Button title="Join" onPress={handleJoin} />
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