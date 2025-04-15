// app/onboarding/profile.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { Button } from "react-native-elements";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../supabase";
import BackgroundWrapper from "../../components/BackgroundWrapper";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";

export default function ProfileSetup() {
  const { vineId } = useLocalSearchParams();
  const [name, setName] = useState("");
  const [rating, setRating] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    console.log("Starting profile setup...");
    console.log("Input - Name:", name, "Rating:", rating, "Vine ID:", vineId);

    if (!name) {
      console.log("Validation failed: Name is missing");
      alert("Please enter your name.");
      return;
    }

    const numericRating = parseFloat(rating);
    if (!rating || isNaN(numericRating) || numericRating < 1.0 || numericRating > 5.0) {
      console.log("Validation failed: Invalid rating");
      alert("Please enter a valid rating between 1.0 and 5.0.");
      return;
    }

    if (!vineId) {
      console.log("Validation failed: Vine ID is missing");
      alert("No vine selected. Please go back and select or create a vine.");
      return;
    }

    setLoading(true);
    try {
      console.log("Fetching session...");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.log("Session error:", sessionError.message);
        alert("Error fetching session. Please try again.");
        return;
      }
      if (!session) {
        console.log("No session found - redirecting to signup");
        alert("You must be logged in to set up your profile.");
        router.push("/signup");
        return;
      }
      console.log("Session retrieved:", session.user.id);

      console.log("Upserting profile...");
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: session.user.id,
          name,
          rating: numericRating,
          vine_id: vineId,
        })
        .select()
        .single();

      if (profileError) {
        console.log("Profile upsert error:", profileError.message);
        alert(`Failed to save profile: ${profileError.message}`);
        return;
      }
      if (!profileData) {
        console.log("Profile upsert returned no data");
        alert("Failed to save profile: No data returned.");
        return;
      }
      console.log("Profile saved:", profileData);

      console.log("Counting profiles for vine...");
      const { count, error: countError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("vine_id", vineId);

      if (countError) {
        console.log("Count error:", countError.message);
        alert(`Failed to initialize ladder position: ${countError.message}`);
        return;
      }
      console.log("Profile count:", count);

      const nodePosition = (count || 0) + 1;
      console.log("Calculated node position:", nodePosition);

      console.log("Inserting ladder node...");
      const { data: nodeData, error: nodeError } = await supabase
        .from("ladder_nodes")
        .insert({
          vine_id: vineId,
          profile_id: profileData.id,
          position: nodePosition,
        })
        .select()
        .single();

      if (nodeError) {
        console.log("Ladder node insert error:", nodeError.message);
        alert(`Failed to initialize ladder position: ${nodeError.message}`);
        return;
      }
      console.log("Ladder node created:", nodeData);

      console.log("Navigating to get-started...");
      router.push("/onboarding/get-started");
    } catch (e) {
      console.log("Unexpected error during profile setup:", e);
      alert(`An unexpected error occurred: ${e.message || "Unknown error"}`);
    } finally {
      setLoading(false);
      console.log("Profile setup completed (success or failure)");
    }
  };

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Set Up Your Profile</Text>
        <Text style={styles.subtitle}>
          Tell us a bit about yourself to get started as a leaf on the vine!
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor={COLORS.text.primary}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Enter your rating (1.0 to 5.0):</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 3.5"
          placeholderTextColor={COLORS.text.primary}
          value={rating}
          onChangeText={setRating}
          keyboardType="numeric"
        />

        <View style={styles.buttonWrapper}>
          <Button
            title="Next"
            onPress={handleNext}
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
  label: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.primary,
    marginBottom: 10,
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
});