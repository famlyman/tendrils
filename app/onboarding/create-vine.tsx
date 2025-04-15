// app/onboarding/create-vine.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Switch } from "react-native";
import { Button } from "react-native-elements";
import { router } from "expo-router";
import { supabase } from "../../supabase";
import BackgroundWrapper from "../../components/BackgroundWrapper";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";

// Function to generate a random 6-character code
const generateRandomCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

export default function CreateVine() {
  const [vineName, setVineName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateVine = async () => {
    console.log("Starting vine creation...");
    console.log("Input - Vine Name:", vineName, "Is Private:", isPrivate);

    if (!vineName) {
      console.log("Validation failed: Vine name is missing");
      alert("Please enter a vine name.");
      return;
    }

    setLoading(true);
    try {
      console.log("Fetching session...");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.log("Session error:", sessionError.message);
        alert(`Error fetching session: ${sessionError.message}`);
        return;
      }
      if (!session) {
        console.log("No session found - redirecting to signup");
        alert("You must be logged in to create a vine.");
        router.push("/signup");
        return;
      }
      console.log("Session retrieved:", session.user.id);

      let inviteCode = null;
      if (isPrivate) {
        console.log("Generating invite code for private vine...");
        let attempts = 0;
        const maxAttempts = 10; // Prevent infinite loops
        let isUnique = false;

        while (!isUnique && attempts < maxAttempts) {
          inviteCode = generateRandomCode();
          console.log(`Attempt ${attempts + 1}: Generated invite code: ${inviteCode}`);

          const { data, error } = await supabase
            .from("vine")
            .select("id")
            .eq("invite_code", inviteCode)
            .maybeSingle(); // Use maybeSingle to handle no rows more gracefully

          if (error) {
            console.log("Error checking invite code:", error.message);
            throw new Error(`Error checking invite code: ${error.message}`);
          }

          isUnique = !data; // If no vine with this code exists, it's unique
          attempts++;
        }

        if (!isUnique) {
          console.log("Failed to generate a unique invite code after", maxAttempts, "attempts");
          throw new Error("Unable to generate a unique invite code. Please try again.");
        }
        console.log("Unique invite code generated:", inviteCode);
      }

      console.log("Inserting new vine...");
      const { data: vineData, error: vineError } = await supabase
        .from("vines")
        .insert({
          name: vineName,
          is_private: isPrivate,
          invite_code: inviteCode,
          created_by: session.user.id,
        })
        .select()
        .single();

      if (vineError) {
        console.log("Vine insert error:", vineError.message);
        throw new Error(`Error creating vine: ${vineError.message}`);
      }
      console.log("Vine created:", vineData);

      console.log("Navigating to profile setup...");
      router.push({ pathname: "/onboarding/profile", params: { vineId: vineData.id } });
    } catch (e) {
      console.log("Unexpected error during vine creation:", e);
      alert(`An error occurred: ${e.message || "Unknown error"}`);
    } finally {
      setLoading(false);
      console.log("Vine creation completed (success or failure)");
    }
  };

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Create a New Vine</Text>
        <Text style={styles.subtitle}>Set up a new vine to start competing!</Text>

        <TextInput
          style={styles.input}
          placeholder="Vine Name"
          placeholderTextColor={COLORS.text.primary}
          value={vineName}
          onChangeText={setVineName}
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Private Vine?</Text>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: COLORS.secondary }}
            thumbColor={COLORS.text.primary}
          />
        </View>

        <View style={styles.buttonWrapper}>
          <Button
            title="Create Vine"
            onPress={handleCreateVine}
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
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.primary,
    marginRight: 10,
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