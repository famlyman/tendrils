// app/(tabs)/settings.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Settings() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Settings - Initial session:", session);
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    console.log("Attempting logout");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log("Logout error:", error);
        Alert.alert("Error", error.message);
      } else {
        console.log("Logout successful");
        await AsyncStorage.removeItem("isSignedUp");
        setUser(null);
        router.replace("/login");
        Alert.alert("Success", "You have been logged out.");
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session after logout:", session);
      }
    } catch (e) {
      console.log("Logout exception:", e);
      Alert.alert("Error", "Failed to log out. Try again.");
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {user ? (
        <View style={styles.profileSection}>
          <Text style={styles.label}>Email: {user.email}</Text>
          <Text style={styles.label}>Stats (Placeholder):</Text>
          <Text>Matches Played: 0</Text>
          <Text>Wins: 0</Text>
          <Text>Losses: 0</Text>
          <Button title="Log Out" onPress={handleLogout} color="#ff4444" />
        </View>
      ) : (
        <View style={styles.notLoggedIn}>
          <Text style={styles.label}>Not logged in</Text>
          <Button title="Log In" onPress={handleLogin} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  profileSection: {
    marginBottom: 20,
  },
  notLoggedIn: {
    alignItems: "center",
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
});