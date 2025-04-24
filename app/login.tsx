// app/login.tsx
import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Button } from "react-native-elements";
import { router } from "expo-router";
import { supabase } from "../supabase";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundWrapper from "../components/BackgroundWrapper";
import { COLORS, TYPOGRAPHY } from "../constants/theme";
import { LinearGradient } from "expo-linear-gradient";



export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        
        Alert.alert("Error", error.message);
        return;
      }

     
      if (!data?.user?.id) {
        
        Alert.alert("Error", "No user ID returned after login");
        return;
      }
      const userId = data.user.id;
      

      // First clear any stale state
      await AsyncStorage.multiRemove(["hasCompletedOnboarding", "isSignedUp"]);
     

      // Check if user has a profile with a vine_id in the database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, vine_id, name')
        .eq('user_id', userId)
        .single();

      

      if (profileError) {
        
      }
      if (profile) {
        
      }

      // Log AsyncStorage before setting
      const beforeHasCompleted = await AsyncStorage.getItem("hasCompletedOnboarding");
      const beforeIsSignedUp = await AsyncStorage.getItem("isSignedUp");
      

      if (profile?.vine_id && profile?.name) {
        // User has a complete profile with vine_id and name
        
        await AsyncStorage.setItem("hasCompletedOnboarding", "true");
        await AsyncStorage.setItem("isSignedUp", "true");
        // Log AsyncStorage after setting
        const afterHasCompleted = await AsyncStorage.getItem("hasCompletedOnboarding");
        const afterIsSignedUp = await AsyncStorage.getItem("isSignedUp");
        
        router.replace("/(tabs)/home");
      } else {
        // User needs to complete onboarding
        if (!profile) {
          
        } else if (!profile.vine_id) {
          
        } else if (!profile.name) {
          
        } else {
          
        }
        router.replace("/onboarding/join-vine");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to log in. Try again.");
    }
  };

  try {
    return (
      <BackgroundWrapper>
        <View style={styles.container}>
          <Text style={styles.title}>Log In</Text>
          <Text style={styles.subtitle}>Welcome back! Log in to continue.</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.text.primary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.text.primary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <View style={styles.buttonWrapper}>
            <Button
              title="Log In"
              onPress={() => {
                handleLogin();
              }}
              buttonStyle={styles.button}
              titleStyle={styles.buttonText}
              containerStyle={styles.buttonContainer}
              ViewComponent={LinearGradient}
              linearGradientProps={{
                colors: COLORS.buttonGradient,
                start: { x: 0, y: 0 },
                end: { x: 1, y: 0 },
              }}
            />
          </View>

          <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.push('/onboarding/register')}>
            <Text style={styles.toggleText}>
              Need an account? Sign up
            </Text>
          </TouchableOpacity>
        </View>
      </BackgroundWrapper>
    );
  } catch (renderErr) {
    return <Text>Error rendering Login screen: {String(renderErr)}</Text>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.landing.title,
    fontFamily: TYPOGRAPHY.fonts.heading,
    color: COLORS.text.dark,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginBottom: 15,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.landing.tagline,
    fontFamily: TYPOGRAPHY.fonts.body,
    color: COLORS.secondary,
    textAlign: "center",
    marginBottom: 30,
    textShadowColor: "rgba(74, 112, 74, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  input: {
    width: "80%",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.body,
    marginBottom: 20,
    textAlign: "center",
  },
  buttonWrapper: {
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 20,
  },
  buttonContainer: {
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.dark,
  },
  toggleText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontFamily: TYPOGRAPHY.fonts.body,
    color: COLORS.secondary,
    marginTop: 20,
    textDecorationLine: "underline",
    textAlign: "center",
    fontWeight: "bold",
  },
});