// app/onboarding/create-vine.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, Switch } from "react-native";
import { Button } from "react-native-elements";
import { router } from "expo-router";
import { supabase } from "../../supabase";
import BackgroundWrapper from "../../components/BackgroundWrapper";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import uuid from 'react-native-uuid';

const generateRandomUUID = () => uuid.v4();

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

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace("/login");
          return;
        }

        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("vine_id")
          .eq("user_id", session.user.id);

        if (profileError) {
          return;
        }

        if (profiles && profiles.length > 0) {
          const profile = profiles[0];
          if (profile.vine_id) {
            router.replace("/(tabs)/home");
            return;
          }
        }
      } catch (e) {
        console.error("Error checking profile:", e);
      }
    };
    checkProfileAndRedirect();
  }, []);

  const handleCreateVine = async () => {
    if (!vineName) {
        
        alert("Please enter a vine name.");
        return;
    }

    setLoading(true);
    try {
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            alert(`Error fetching session: ${sessionError.message}`);
            return;
        }
        if (!session) {
            alert("You must be logged in to create a vine.");
            router.push("/signup");
            return;
        }

        let joinCode = null;
        if (isPrivate) {
            let attempts = 0;
            const maxAttempts = 10;
            let isUnique = false;

            while (!isUnique && attempts < maxAttempts) {
                joinCode = generateRandomCode();

                const { data, error } = await supabase
                    .from("vines")
                    .select("vine_id")
                    .eq("join_code", joinCode)
                    .maybeSingle();

                if (error) {
                    alert(`Error checking join code: ${error.message}`);
                    return;
                }

                isUnique = !data;
                attempts++;
            }

            if (!isUnique) {
                alert("Failed to generate a unique join code. Please try again.");
                return;
            }
        }

        const { data: vineData, error: vineError } = await supabase
            .from("vines")
            .insert({
                name: vineName,
                is_public: !isPrivate,
                join_code: joinCode,
                coordinator_id: session.user.id,
            })
            .select()
            .single();

        if (vineError) {
            alert(`Error creating vine: ${vineError.message}`);
            return;
        }

        // Insert user_roles row for coordinator
        const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .insert({
        id: generateRandomUUID(), // Use react-native-uuid
        user_id: session.user.id,
        vine_id: vineData.vine_id,
        role: (await supabase.from("roles").select("id").eq("name", "coordinator").single()).data?.id,
    })
    .select()
    .single();

        if (roleError) {
            alert(`Error assigning coordinator role: ${roleError.message}`);
            return;
        }

        router.push({ pathname: "/onboarding/profile", params: { vine_id: vineData.vine_id } });
    } catch (e) {
        console.error("Unexpected error during vine creation:", e);
        alert(`An error occurred: ${(e as Error).message || "Unknown error"}`);
    } finally {
        setLoading(false);
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