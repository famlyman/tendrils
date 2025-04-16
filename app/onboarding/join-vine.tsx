// app/onboarding/join-vine.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, Platform } from "react-native";
import { Button } from "react-native-elements";
import { router } from "expo-router";
import { supabase } from "../../supabase";
import BackgroundWrapper from "../../components/BackgroundWrapper";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";

export default function JoinVine() {
  const [vines, setVines] = useState<{ vine_id: string; name: string }[]>([]);
  const [selectedVine, setSelectedVine] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [privateLoading, setPrivateLoading] = useState(false);

  useEffect(() => {
    const fetchVines = async () => {
      try {
        const { data, error } = await supabase
          .from("vines")
          .select("vine_id, name")
          .eq("is_public", true)
          .order("created_at", { ascending: true });

        if (error) {
          console.warn("Failed to fetch vines:", error.message);
          setVines([]);
        } else {
          setVines(data || []);
        }
      } catch (e) {
        console.warn("Unexpected error while fetching vines:", e);
        setVines([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVines();
  }, []);

  const handleJoinPublicVine = async () => {
    if (!selectedVine) {
      alert("Please select a public vine to join.");
      return;
    }
    router.push({ pathname: "/onboarding/profile", params: { vine_id: selectedVine } });
  };

  const handleJoinPrivateVine = async () => {
    if (!joinCode) {
      alert("Please enter a join code.");
      return;
    }

    setPrivateLoading(true);
    const { data, error } = await supabase
      .from("vines")
      .select("vine_id")
      .eq("is_public", false)
      .eq("join_code", joinCode)
      .single();

    setPrivateLoading(false);
    if (error || !data) {
      alert("Invalid join code. Please try again.");
    } else {
      router.push({ pathname: "/onboarding/profile", params: { vine_id: data.vine_id } });
    }
  };

  const handleCreateVine = () => {
    router.push("/onboarding/create-vine");
  };

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Join a Vine</Text>
        <Text style={styles.subtitle}>
          A vine is your pickleball community. Join an existing vine or create your own to start competing!
        </Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading vines...</Text>
        ) : vines.length > 0 ? (
          <View style={styles.vineContainer}>
            <View style={styles.row}>
              <Text style={styles.label}>Public:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedVine}
                  onValueChange={(itemValue) => setSelectedVine(itemValue)}
                  style={[styles.picker, Platform.OS === "android" && styles.pickerAndroid]}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select a vine..." value={null} color={COLORS.text.dark} />
                  {vines.map((vine) => (
                    <Picker.Item
                      key={vine.vine_id}
                      label={vine.name}
                      value={vine.vine_id}
                      color={COLORS.text.dark}
                    />
                  ))}
                </Picker>
              </View>
              <Button
                title="Join"
                onPress={handleJoinPublicVine}
                buttonStyle={styles.smallButton}
                titleStyle={styles.smallButtonText}
                containerStyle={styles.smallButtonContainer}
                ViewComponent={LinearGradient}
                linearGradientProps={{
                  colors: COLORS.buttonGradient,
                  start: { x: 0, y: 0 },
                  end: { x: 1, y: 0 },
                }}
              />
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Private:</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter join code"
                placeholderTextColor={COLORS.text.primary}
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
              />
              <Button
                title="Join"
                onPress={handleJoinPrivateVine}
                buttonStyle={styles.smallButton}
                titleStyle={styles.smallButtonText}
                containerStyle={styles.smallButtonContainer}
                ViewComponent={LinearGradient}
                linearGradientProps={{
                  colors: COLORS.buttonGradient,
                  start: { x: 0, y: 0 },
                  end: { x: 1, y: 0 },
                }}
                loading={privateLoading}
              />
            </View>
          </View>
        ) : (
          <Text style={styles.noVinesText}>No vines available. Create one to get started!</Text>
        )}

        <View style={[styles.buttonWrapper, styles.secondaryButton]}>
          <Button
            title="Create a Vine"
            onPress={handleCreateVine}
            buttonStyle={styles.secondaryButtonStyle}
            titleStyle={styles.secondaryButtonText}
            containerStyle={styles.secondaryButtonContainer}
            ViewComponent={LinearGradient}
            linearGradientProps={{
              colors: ["#FFECB3", "#FFD54F"],
              start: { x: 0, y: 0 },
              end: { x: 1, y: 0 },
            }}
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
  vineContainer: {
    width: "100%",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
    justifyContent: "space-between",
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.primary,
    width: 70,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 10,
    height: 50,
    justifyContent: "center",
  },
  picker: {
    height: 50,
    color: COLORS.text.primary,
  },
  pickerAndroid: {
    color: COLORS.text.dark,
  },
  pickerItem: {
    color: COLORS.text.dark,
    fontSize: TYPOGRAPHY.sizes.body,
    fontFamily: TYPOGRAPHY.fonts.body,
    height: 50,
    backgroundColor: COLORS.secondary,
  },
  input: {
    flex: 1,
    height: 40,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.body,
    marginRight: 10,
  },
  smallButtonContainer: {
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  smallButtonText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fonts.body,
    color: COLORS.text.dark,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontFamily: TYPOGRAPHY.fonts.body,
    color: COLORS.text.primary,
    marginBottom: 20,
  },
  noVinesText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontFamily: TYPOGRAPHY.fonts.body,
    color: COLORS.text.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  buttonWrapper: {
    borderRadius: 25,
    overflow: "hidden",
  },
  secondaryButton: {
    marginTop: 15,
  },
  secondaryButtonContainer: {
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  secondaryButtonStyle: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fonts.body,
    color: COLORS.text.dark,
  },
});