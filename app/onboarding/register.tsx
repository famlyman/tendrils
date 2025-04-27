// app/onboarding/register.tsx
import React, { useState } from "react";
import uuid from 'react-native-uuid';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Button } from "react-native-elements";
import { router } from "expo-router";
import { supabase } from "../../supabase";
import BackgroundWrapper from "../../components/BackgroundWrapper";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      alert("Error signing up: " + error.message);
      return;
    }

    // Wait for session to be available
    let userId = signUpData?.user?.id;
    if (!userId) {
      // Try to fetch the user from auth
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setLoading(false);
        alert("Could not get user after sign up.");
        return;
      }
      userId = userData.user.id;
    }

    setLoading(false);
    // Navigate to the next step after successful sign-up
    router.push("/onboarding/join-vine");
  };

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.subtitle}>
          Create an account to start growing with Tendrils!
        </Text>

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
            title={loading ? "Signing Up..." : "Sign Up"}
            onPress={handleSignUp}
            disabled={loading}
            buttonStyle={styles.button}
            titleStyle={styles.buttonText}
            containerStyle={styles.buttonContainer}
            ViewComponent={LinearGradient}
            linearGradientProps={{
              colors: COLORS.buttonGradient,
              start: { x: 0, y: 0 },
              end: { x: 1, y: 0 },
            }}
            loading={loading}
          />
        </View>

        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.push('/login')}>
          <Text style={styles.toggleText}>
            Already have an account? Log in
          </Text>
        </TouchableOpacity>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.landing.title, // 60
    fontFamily: TYPOGRAPHY.fonts.heading, // AmaticSC-Bold
    color: COLORS.text.dark,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginBottom: 15,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.landing.tagline, // 28
    fontFamily: TYPOGRAPHY.fonts.body, // Roboto-Regular
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
  },
});