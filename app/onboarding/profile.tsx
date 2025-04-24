// app/onboarding/profile.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, Image, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../supabase";

export default function ProfileSetup() {
  const { vine_id } = useLocalSearchParams(); // Get vine_id from navigation params
  const [name, setName] = useState("");
  const [rating, setRating] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        if (!vine_id) {
          Alert.alert(
            "Error",
            "Vine ID is missing. Please join or create a vine first.",
            [{ text: "OK", onPress: () => router.replace("/onboarding/join-vine") }]
          );
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace("/login");
          return;
        }

        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("vine_id")
          .eq("user_id", session.user.id);

        if (error) {
          Alert.alert("Error", "Failed to check profile. Please try again.");
          return;
        }

        if (profiles.length > 0) {
          const profile = profiles[0];
          if (profile.vine_id) {
            router.replace("/(tabs)/home");
            return;
          }
        }

        // Verify the vine exists
        const { data: vine, error: vineError } = await supabase
          .from("vines")
          .select("vine_id")
          .eq("vine_id", vine_id)
          .single();

        if (vineError || !vine) {
          
          Alert.alert(
            "Error",
            "The selected vine does not exist. Please try again.",
            [{ text: "OK", onPress: () => router.replace("/onboarding/join-vine") }]
          );
          return;
        }
      } catch (error) {
        console.error("Error in checkProfile:", error);
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    checkProfile();
  }, [vine_id]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Error", "Sorry, we need camera roll permissions to make this work!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };



  const handleProfileSetup = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name.");
      return;
    }
    const ratingNum = parseFloat(rating);
    if (!rating || isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      Alert.alert("Error", "Please enter a valid rating between 0 and 5.");
      return;
    }
    if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ""))) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number (e.g., 1234567890).");
      return;
    }

    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert("Error", "Not logged in.");
        return;
      }

      let profilePictureUrl: string | null = null;
      if (profilePicture) {
        const fileExt = profilePicture.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${session.user.id}.${fileExt}`;
        const response = await fetch(profilePicture);
        const fileBlob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(fileName, fileBlob, {
            contentType: `image/${fileExt}`,
            upsert: true,
          });

        if (uploadError) {
          
          Alert.alert("Error", "Failed to upload profile picture.");
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(fileName);

        profilePictureUrl = publicUrlData.publicUrl;
      }





      

      // Upsert profile with vine_id
      const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .upsert({
    user_id: session.user.id,
    name: name.trim(),
    rating: ratingNum,
    bio: bio.trim() || null,
    phone: phone.replace(/\D/g, "") || null,
    profile_picture: profilePictureUrl,
    vine_id: vine_id,
  })
  .select()
  .single();

        if (profileError) {
            Alert.alert("Error", profileError.message);
            return;
        }

        // Redirect to home after profile setup
        router.replace("/onboarding/get-started");
    } catch (error) {
      Alert.alert("Error", "Failed to save profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Set Up Your Profile</Text>

        <Text style={styles.label}>Profile Picture</Text>
        {profilePicture ? (
          <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
        ) : (
          <View style={styles.profilePicturePlaceholder}>
            <Text style={styles.placeholderText}>No Picture Selected</Text>
          </View>
        )}
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Text style={styles.uploadButtonText}>Choose Profile Picture</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Rating (0-5) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Your Rating (e.g., 3.5)"
          value={rating}
          onChangeText={setRating}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell us about yourself (optional)"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone Number (optional, e.g., 1234567890)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Button
          title={loading ? "Saving..." : "Save Profile"}
          onPress={handleProfileSetup}
          disabled={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 10,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ccc",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  placeholderText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
  },
  uploadButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});