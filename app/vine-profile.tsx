// app/(tabs)/vine-profile.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { Button } from "react-native-elements";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../supabase";
import { useDemoData } from "../components/DemoDataContext";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, TYPOGRAPHY } from "../constants/theme";

export default function VineProfile() {
  const { demoMode, vines } = useDemoData();
  const [loading, setLoading] = useState(true);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [vine, setVine] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (demoMode && vines.length > 0) {
      const demo = vines[0];
      setVine(demo);
      setLogoUrl(null);
      setName(demo.name);
      setDescription(demo.description ?? "");
      setLocation(demo.location ?? "");
      setContactEmail("");
      setWebsite("");
      setJoinCode(demo.join_code ?? "");
      setIsCoordinator(true);
      setLoading(false);
      return;
    }
    const fetchVine = async () => {
      setLoading(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Not logged in");
        // Get user's profile to find their vine_id
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("vine_id")
          .eq("user_id", user.id)
          .single();
        if (profileError || !profile || !profile.vine_id) throw new Error("No vine found for your account");
        // Fetch the vine by vine_id
        const { data: vineData, error: vineError } = await supabase
          .from("vines")
          .select("*")
          .eq("vine_id", profile.vine_id)
          .single();
        if (vineError || !vineData) throw new Error("No vine found for your account");
        setVine(vineData);
        setLogoUrl(vineData.logo_url || null);
        setName(vineData.name || "");
        setDescription(vineData.description || "");
        setLocation(vineData.location || "");
        setContactEmail(vineData.contact_email || "");
        setWebsite(vineData.website || "");
        setJoinCode(vineData.join_code || "");
        // Check if user is coordinator
        setIsCoordinator(vineData.coordinator_id === user.id);
      } catch (err) {
        setIsCoordinator(false);
        setVine(null);
      } finally {
        setLoading(false);
      }
    };
    fetchVine();
  }, []);

  const pickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "We need permission to access your photos.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLogoUrl(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates: any = {
        name,
        description,
        location,
        contact_email: contactEmail,
        website,
      };
      // Handle logo upload if changed
      if (logoUrl && logoUrl !== vine.logo_url && logoUrl.startsWith("file")) {
        const fileName = `vine-logos/${vine.vine_id}-${Date.now()}.jpg`;
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("vine-logos")
          .upload(fileName, blob, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from("vine-logos").getPublicUrl(fileName);
        updates.logo_url = publicUrlData.publicUrl;
      }
      const { error: updateError } = await supabase
        .from("vines")
        .update(updates)
        .eq("vine_id", vine.vine_id);
      if (updateError) throw updateError;
      Alert.alert("Success", "Vine profile updated!");
      setEditing(false);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not update vine");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }
  if (!vine) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No vine found. You must be a coordinator to view this page.</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <TouchableOpacity disabled={!isCoordinator || !editing} onPress={pickLogo}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>No Logo</Text>
              </View>
            )}
            {isCoordinator && editing && <Text style={styles.editLogoText}>Edit Logo</Text>}
          </TouchableOpacity>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.label}>Join Code: {joinCode}</Text>
          <Text style={styles.sectionTitle}>About</Text>
          {isCoordinator && editing ? (
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your vine..."
              multiline
            />
          ) : (
            <Text style={styles.value}>{description}</Text>
          )}
          <Text style={styles.sectionTitle}>Location</Text>
          {isCoordinator && editing ? (
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Location (e.g. City, Club)"
            />
          ) : (
            <Text style={styles.value}>{location}</Text>
          )}
          <Text style={styles.sectionTitle}>Contact Email</Text>
          {isCoordinator && editing ? (
            <TextInput
              style={styles.input}
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder="Contact Email"
              keyboardType="email-address"
            />
          ) : (
            <Text style={styles.value}>{contactEmail}</Text>
          )}
          <Text style={styles.sectionTitle}>Website</Text>
          {isCoordinator && editing ? (
            <TextInput
              style={styles.input}
              value={website}
              onChangeText={setWebsite}
              placeholder="Website or Social Link"
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.value}>{website}</Text>
          )}
          {isCoordinator && (
            <Button
              title={editing ? "Save" : "Edit"}
              onPress={() => {
                if (editing) handleSave();
                else setEditing(true);
              }}
              buttonStyle={styles.button}
              titleStyle={styles.buttonText}
              containerStyle={styles.buttonWrapper}
            />
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  content: { flex: 1, padding: 20, alignItems: "center", width: "100%" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  logo: { width: 120, height: 120, borderRadius: 60, marginBottom: 16 },
  logoPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#ccc", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  logoText: { color: "#fff" },
  editLogoText: { color: COLORS.secondary, fontSize: 12, textAlign: "center" },
  title: { fontSize: 28, fontFamily: TYPOGRAPHY.fonts.heading, color: COLORS.text.dark, marginBottom: 8 },
  label: { fontSize: 16, color: COLORS.secondary, marginBottom: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 16, marginBottom: 4, color: COLORS.secondary },
  value: { fontSize: 16, color: COLORS.text.primary, marginBottom: 8, textAlign: "center" },
  input: { width: "100%", minHeight: 40, borderColor: "#ccc", borderWidth: 1, borderRadius: 6, padding: 8, marginBottom: 8, backgroundColor: "#fff" },
  button: { marginTop: 24, backgroundColor: COLORS.secondary, borderRadius: 25, paddingVertical: 12, paddingHorizontal: 32 },
  buttonText: { fontSize: 16, color: COLORS.text.dark },
  buttonWrapper: { width: "80%", alignSelf: "center" },
  errorText: { color: "#c00", fontSize: 16, textAlign: "center" },
});
