// app/onboarding/join-now.tsx
import React, { useState, useRef } from "react";
import { View, Text, TextInput, StyleSheet, StatusBar, Image, Alert, TouchableOpacity, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Icon } from "react-native-elements";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabase";
import * as Animatable from "react-native-animatable";

export default function JoinNow() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rating, setRating] = useState("");
  const [roles, setRoles] = useState({ Captain: false, Coordinator: false });
  
  // Create ref for button animation
  const buttonAnimationRef = useRef(null);

  const handleRoleChange = (role: keyof typeof roles) => {
    setRoles(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const setStorageItem = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
      console.log(`Set ${key} in AsyncStorage`);
    } catch (error) {
      console.error(`Error setting ${key} in AsyncStorage:`, error);
    }
  };

  const handleButtonPress = () => {
    // Animate the button when pressed
    if (buttonAnimationRef.current) {
      buttonAnimationRef.current.bounce(800);
    }
    handleJoin();
  };

  const handleJoin = async () => {
    console.log("Starting signup:", { email, password, name, phone, rating, roles });
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name.");
      return;
    }
    const selectedRoles = Object.entries(roles).filter(([_, isSelected]) => isSelected).map(([role]) => role);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, phone, rating: rating ? parseFloat(rating) : null } },
      });
      if (error) {
        console.log("Auth error:", error.message);
        throw error;
      }
      console.log("Signup success:", data);

      const user = data.user;
      if (!user) throw new Error("No user returned");

      console.log("Inserting player:", { name, user_id: user.id });
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .insert({ name, user_id: user.id, auth_linked: true, phone, rating: rating ? parseFloat(rating) : null })
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

      const roleMap: { [key: string]: number } = { Player: 1, Captain: 2, Coordinator: 3 };
      const roleInserts = [{ user_id: user.id, role_id: roleMap["Player"] }];
      selectedRoles.forEach(role => roleInserts.push({ user_id: user.id, role_id: roleMap[role] }));
      const { error: roleError } = await supabase.from("user_roles").insert(roleInserts);
      if (roleError) {
        console.log("Role insert error:", roleError);
        throw roleError;
      }
      console.log("Roles inserted");

      await setStorageItem("isSignedUp", "true");
      await setStorageItem("hasCompletedOnboarding", "completed");
      await setStorageItem("playerId", player.player_id.toString());

      // Redirect to profile setup instead of home
      console.log("Redirecting to profile-setup");
      router.push("/profile-setup");
    } catch (e: any) {
      console.log("Signup failed:", e.message);
      Alert.alert("Error", e.message || "Failed to sign up. Try again.");
    }
  };

  return (
    <LinearGradient
      colors={["#A8E6CF", "#4A704A"]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Animatable.View animation="fadeIn" duration={1000}>
            <Image
              source={require("../../assets/images/pickleball.png")}
              style={styles.icon}
            />
            <Text style={styles.title}>Join Now</Text>
            <View style={styles.descriptionContainer}>
              <Icon
                name="account-plus"
                type="material-community"
                color="#FFD700"
                size={24}
                containerStyle={styles.illustration}
              />
              <Text style={styles.description}>Join and start climbing the Vine!</Text>
            </View>
          </Animatable.View>
          <Animatable.View animation="fadeInUp" duration={1000} delay={300}>
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number (Optional)"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Rating (Optional, e.g., 3.5)"
                placeholderTextColor="#999"
                value={rating}
                onChangeText={setRating}
                keyboardType="decimal-pad"
              />
              <Text style={styles.roleTitle}>Select Additional Role(s)</Text>
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
            </View>
            <Animatable.View 
              ref={buttonAnimationRef}
            >
              <Button
                title="Join Now"
                onPress={handleButtonPress}
                buttonStyle={styles.signUpButton}
                titleStyle={styles.buttonText}
                containerStyle={styles.buttonWrapper}
                ViewComponent={LinearGradient}
                linearGradientProps={{
                  colors: ["#FFD700", "#FFC107"],
                  start: { x: 0, y: 0 },
                  end: { x: 1, y: 0 },
                }}
              />
            </Animatable.View>
            {/* Progress Dots */}
            <View style={styles.progressDots}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={[styles.dot, styles.activeDot]} />
            </View>
          </Animatable.View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  icon: {
    width: 50,
    height: 50,
    marginBottom: 20,
    alignSelf: "center",
  },
  title: {
    fontSize: 36,
    fontFamily: "AmaticSC-Bold",
    color: "#1A3C34",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  descriptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    marginRight: 10,
  },
  description: {
    fontSize: 18,
    fontFamily: "Roboto-Regular",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    width: "100%",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  roleTitle: {
    fontSize: 18,
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
    marginTop: 10,
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#1A3C34",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
  },
  checkmark: {
    color: "#1A3C34",
    fontSize: 16,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
  },
  buttonWrapper: {
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginTop: 10,
  },
  signUpButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
  },
  skipText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#D3D3D3",
    textAlign: "center",
    marginTop: 15,
  },
  progressDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D3D3D3",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#FFD700",
  },
});