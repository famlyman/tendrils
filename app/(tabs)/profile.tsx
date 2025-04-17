// app/(tabs)/profile.tsx
import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, StyleSheet, Alert, StatusBar, Image, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "react-native-elements";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabase";
import { useDemoData } from "../../components/DemoDataContext";
import * as Animatable from "react-native-animatable";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";

import { useRouter } from "expo-router";

export default function Profile() {
  const { demoMode, profiles } = useDemoData();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [name, setName] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null); // New field for rating
  const [profilePicture, setProfilePicture] = useState<string | null>(null); // New field for profile picture
  const [roles, setRoles] = useState<string[]>([]);
  const [bio, setBio] = useState<string>("");
  const [phone, setPhone] = useState<string>(""); // Renamed from contactInfo to phone
  const [joinCode, setJoinCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showEditCard, setShowEditCard] = useState(false);

  const saveButtonRef = useRef<any>(null);
  const removeButtonRef = useRef<any>(null);
  const coordinatorButtonRef = useRef<any>(null);
  const logoutButtonRef = useRef<any>(null);
  const loginButtonRef = useRef<any>(null);

  // Handler for club info
  const handleViewClub = () => {
    router.push("/vine-profile-screen");
  };

  useEffect(() => {
    if (demoMode && profiles.length > 0) {
      // Use the first demo profile as the "user"
      const demo = profiles[0];
      setName(demo.name);
      setRating(demo.rating ?? null);
      setProfilePicture(null);
      setRoles([demo.role]);
      setBio(demo.bio ?? "");
      setPhone("");
      setLoading(false);
      return;
    }
    const fetchUserData = async () => {
      try {
        console.log("[Profile] Fetching user data...");
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        console.log("[Profile] Session:", session);

        if (session) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          const fullName = userData.user.user_metadata.full_name || "";
          const userId = userData.user.id;
          console.log("[Profile] User ID:", userId);
          setName(fullName);

          const { data: userRoleData, error: userRoleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);
          if (userRoleError) throw userRoleError;

          let roleNames: string[] = [];
          if (userRoleData && userRoleData.length > 0) {
            const roleIds = userRoleData.map(item => item.role);
            const { data: roleData, error: roleError } = await supabase
              .from("roles")
              .select("role_name")
              .in("role_id", roleIds);
            if (roleError) throw roleError;

            roleNames = roleData.map(item => item.role_name);
            setRoles(roleNames);
          } else {
            setRoles([]);
          }

          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("name, bio, phone, rating, profile_picture") // Fetch name from profiles
            .eq("user_id", session.user.id)
            .single();
          console.log("[Profile] profileData from profiles table:", profileData);
          console.log("[Profile] profileError:", profileError);
          if (!profileError && profileData) {
            setName(profileData.name || fullName || ""); // Prefer name from profiles
            setBio(profileData.bio || "");
            setPhone(profileData.phone || "");
            setRating(profileData.rating || null);
            setProfilePicture(profileData.profile_picture || null);
          } else {
            setName(fullName || "");
          }

          if (!fullName && (!profileData || !profileData.name)) {
            const { data: playerData, error: playerError } = await supabase
              .from("players")
              .select("name")
              .eq("user_id", session.user.id)
              .single();
            if (!playerError && playerData) setName(playerData.name);
          }
        }
      } catch (err) {
        console.log("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

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
      console.log("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem("isSignedUp");
    router.replace("/login");
  };

  const handleRemovePlayerRole = async () => {
    Alert.alert(
      "Confirm",
      "Are you sure you want to remove yourself as a Player?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("No user");

              const { error: playerError } = await supabase
                .from("players")
                .delete()
                .eq("user_id", user.id);
              if (playerError) throw playerError;

              const { error: roleError } = await supabase
                .from("user_roles")
                .delete()
                .eq("user_id", user.id)
                .eq("role_id", 1);
              if (roleError && roleError.code !== "PGRST116") throw roleError;

              setRoles(roles.filter(role => role !== "Player"));
              Alert.alert("Success", "Player role removed.");
            } catch (err: any) {
              console.log("Error removing player role:", err);
              Alert.alert("Error", "Failed to remove Player role.");
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      let profilePictureUrl: string | null = null;
      if (profilePicture && profilePicture.startsWith("file://")) { // Check if it's a new image (local URI)
        const fileExt = profilePicture.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${user.id}.${fileExt}`;
        const response = await fetch(profilePicture);
        const fileBlob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(fileName, fileBlob, {
            contentType: `image/${fileExt}`,
            upsert: true,
          });

        if (uploadError) {
          console.log("Image upload error:", uploadError.message);
          Alert.alert("Error", "Failed to upload profile picture.");
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(fileName);

        profilePictureUrl = publicUrlData.publicUrl;
        setProfilePicture(profilePictureUrl); // Update state with the new URL
      } else {
        profilePictureUrl = profilePicture; // Keep the existing URL if no new image is selected
      }

      if (name !== user.user_metadata.full_name) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: name },
        });
        if (authError) throw authError;

        const { error: playerError } = await supabase
          .from("players")
          .update({ name })
          .eq("user_id", user.id);
        if (playerError) throw playerError;
      }

      const ratingNum = rating ? parseFloat(rating.toString()) : null;
      if (ratingNum && (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5)) {
        Alert.alert("Error", "Please enter a valid rating between 0 and 5.");
        return;
      }
      if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ""))) {
        Alert.alert("Error", "Please enter a valid 10-digit phone number (e.g., 1234567890).");
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            bio: bio || null,
            phone: phone.replace(/\D/g, "") || null, // Renamed from contact_info to phone
            rating: ratingNum, // Save rating
            profile_picture: profilePictureUrl, // Save profile picture URL
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      if (profileError) throw profileError;

      Alert.alert("Success", "Profile updated!");
      setShowEditCard(false);
    } catch (err: any) {
      console.log("Error saving profile:", err);
      Alert.alert("Error", "Failed to save profile.");
    }
  };

  const handleGoToCoordinatorDashboard = () => {
    router.push("/coordinator");
  };

  const toggleEditCard = () => {
    setShowEditCard(!showEditCard);
  };

  if (loading) {
    return (
      <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
        <Text style={styles.loadingText}>Loading...</Text>
      </LinearGradient>
    );
  }

  if (!session) {
    return (
      <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
        <Animatable.View animation="fadeIn" duration={1000} style={styles.content}>
          <Image source={require("../../assets/images/pickleball.png")} style={styles.icon} />
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.errorText}>Not logged in</Text>
          <Animatable.View ref={loginButtonRef}>
            <Button
              title="Log In"
              onPress={() => {
                loginButtonRef.current?.bounce(800);
                router.push("/login");
              }}
              buttonStyle={styles.button}
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
        </Animatable.View>
      </LinearGradient>
    );
  }

  // Log state before render
  console.log("[Profile] Render state:", { name, bio, phone, rating, profilePicture });

  return (
    <LinearGradient colors={["#A8E6CF", "#4A704A"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Button
          title="View Club Info"
          onPress={handleViewClub}
          buttonStyle={{
            backgroundColor: "#FFD54F",
            borderRadius: 20,
            marginVertical: 12,
          }}
          titleStyle={{
            color: "#1A3C34",
            fontFamily: "Roboto-Bold",
            fontSize: 17,
          }}
          containerStyle={{ alignSelf: "center", width: 180 }}
        />
        <Animatable.View animation="fadeIn" duration={1000} style={styles.content}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Text style={styles.placeholderText}>No Picture</Text>
            </View>
          )}
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.label}>Email: {session.user.email}</Text>
          <Text style={styles.label}>Name: {name}</Text>
          {rating !== null && <Text style={styles.label}>Rating: {rating}</Text>}
          {bio && <Text style={styles.label}>Bio: {bio}</Text>}
          {phone && <Text style={styles.label}>Phone: {phone}</Text>}
          {/* <Text style={styles.label}>Roles: {roles.join(", ") || "None"}</Text> */}
          {/* <Text style={styles.label}>Team: {teamInfo}</Text> */}
          {roles.includes("Coordinator") && joinCode && (
            <Text style={styles.label}>Join Code: {joinCode} (Share this with players!)</Text>
          )}
          <TouchableOpacity style={styles.editButton} onPress={toggleEditCard}>
            <MaterialIcons name="edit" size={24} color="#1A3C34" style={styles.editIcon} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          {showEditCard && (
            <Animatable.View animation="fadeIn" duration={500} style={styles.card}>
              <Text style={styles.cardTitle}>Edit Profile</Text>
              <Text style={styles.cardLabel}>Profile Picture:</Text>
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
              ) : (
                <View style={styles.profilePicturePlaceholder}>
                  <Text style={styles.placeholderText}>No Picture Selected</Text>
                </View>
              )}
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Text style={styles.uploadButtonText}>Change Profile Picture</Text>
              </TouchableOpacity>
              <Text style={styles.cardLabel}>Name:</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
              <Text style={styles.cardLabel}>Rating (0-5):</Text>
              <TextInput
                style={styles.input}
                value={rating?.toString() || ""}
                onChangeText={(text) => setRating(text ? parseFloat(text) : null)}
                placeholder="Your Rating (e.g., 3.5)"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              <Text style={styles.cardLabel}>Bio:</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell others about yourself"
                placeholderTextColor="#999"
                multiline
              />
              <Text style={styles.cardLabel}>Phone Number:</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g., 1234567890"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </Animatable.View>
          )}
          {showEditCard && (
            <Animatable.View ref={saveButtonRef}>
              <Button
                title="Save Profile"
                onPress={() => {
                  saveButtonRef.current?.bounce(800);
                  handleSaveProfile();
                }}
                buttonStyle={styles.button}
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
          )}
          {roles.includes("Coordinator") && (
            <Animatable.View ref={coordinatorButtonRef}>
              <Button
                title="Coordinator Dashboard"
                onPress={() => {
                  coordinatorButtonRef.current?.bounce(800);
                  handleGoToCoordinatorDashboard();
                }}
                buttonStyle={styles.button}
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
          )}
          <Animatable.View ref={logoutButtonRef}>
            <Button
              title="Log Out"
              onPress={() => {
                logoutButtonRef.current?.bounce(800);
                handleLogout();
              }}
              buttonStyle={[styles.button, styles.logoutButton]}
              titleStyle={styles.buttonText}
              containerStyle={styles.buttonWrapper}
              ViewComponent={LinearGradient}
              linearGradientProps={{
                colors: ["#D3D3D3", "#A9A9A9"],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 0 },
              }}
            />
          </Animatable.View>

        </Animatable.View>
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
    padding: 20,
    alignItems: "center",
  },
  icon: {
    width: 50,
    height: 50,
    marginBottom: 20,
    alignSelf: "center",
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 20,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ccc",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
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
    fontFamily: "Roboto-Regular",
  },
  title: {
    fontSize: 36,
    fontFamily: "AmaticSC-Bold",
    color: "#1A3C34",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    marginBottom: 10,
    textAlign: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
  },
  editIcon: {
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 18,
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
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
  cardTitle: {
    fontSize: 20,
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
    marginBottom: 15,
    textAlign: "center",
  },
  cardLabel: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    marginBottom: 5,
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
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  buttonWrapper: {
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginVertical: 5,
    width: "100%",
  },
  removeButtonWrapper: {
    borderRadius: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginVertical: 5,
    width: "60%",
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  removeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderColor: "#FF3333",
    borderWidth: 1,
  },
  logoutButton: {
    borderColor: "#A9A9A9",
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
  },
  removeButtonText: {
    fontSize: 14,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#1A3C34",
    textAlign: "center",
    marginBottom: 20,
  },
});