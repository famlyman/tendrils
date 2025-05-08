// app/(tabs)/profile.tsx
import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, StyleSheet, Alert, StatusBar, Image, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "react-native-elements";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabase";

import * as Animatable from "react-native-animatable";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";

import { useRouter } from "expo-router";
import TeamEditModal from '../../components/TeamEditModal';

export default function Profile() {

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
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);

  // --- Team state ---
  const [teams, setTeams] = useState<any[]>([]); // Array of user's teams
  const [teamMembers, setTeamMembers] = useState<{ [teamId: string]: any[] }>({}); // Map: teamId -> members
  // Team edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTeamId, setEditTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState<string>('');
  const [editTeamMembers, setEditTeamMembers] = useState<{ user_id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!session || !session.user) return;
      // Get user's teams
      const { data: userTeams, error: userTeamsError } = await supabase
        .from('team_members')
        .select('team_id, teams!fk_team_members_team_id(name)')
        .eq('user_id', session.user.id);
      console.log('userTeams:', userTeams);
      if (userTeamsError) {
        console.log('userTeamsError:', userTeamsError);
        Alert.alert('Teams Query Error', userTeamsError.message || 'Unknown error');
      }
      if (!userTeams || userTeams.length === 0) {
        Alert.alert('No Teams Found', 'You are not a member of any teams or there was an issue fetching teams.');
      }
      const uniqueTeams = Array.from(
        new Map((userTeams || []).map((t: any) => [t.team_id, t.teams])).entries()
      ).map(([team_id, team]) => ({ team_id, ...team }));
      setTeams(uniqueTeams);
      // For each team, fetch members
      const membersByTeam: { [teamId: string]: any[] } = {};
      for (const t of uniqueTeams) {
        const { data: members, error: membersError } = await supabase
          .from('team_members')
          .select('user_id, profiles(name)')
          .eq('team_id', t.team_id);
        if (membersError) {
          console.log(`membersError for team ${t.team_id}:`, membersError);
        }
        if (members) {
          membersByTeam[t.team_id] = members.map((m: any) => ({
            user_id: m.user_id,
            name: m.profiles?.name || 'Unknown',
          }));
        }
      }
      setTeamMembers(membersByTeam);
      console.log('teams state:', uniqueTeams);
      console.log('teamMembers state:', membersByTeam);
    };
    if (session && session.user) fetchTeams();
  }, [session]);

  // Handler for edit team button
  const handleEditTeam = (teamId: string) => {
    const team = teams.find(t => t.team_id === teamId);
    const members = teamMembers[teamId] || [];
    setEditTeamId(teamId);
    setEditTeamName(team?.name || '');
    setEditTeamMembers(members);
    setEditModalVisible(true);
  };

  // Fetch session on mount and listen for auth state changes
  useEffect(() => {
    let mounted = true;
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) setSession(session);
    };
    getSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Check onboarding state on mount
  useEffect(() => {
    let mounted = true;
    const checkOnboarding = async () => {
      const completed = await AsyncStorage.getItem('hasCompletedOnboarding');
      if (mounted) setHasCompletedOnboarding(completed === 'true');
      if (mounted) setOnboardingChecked(true);
    };
    checkOnboarding();
    return () => { mounted = false; };
  }, []);

  // Onboarding redirect logic
  useEffect(() => {
    if (onboardingChecked && !loading && session && !hasCompletedOnboarding) {
      AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      AsyncStorage.setItem('isSignedUp', 'true');
      if (router && typeof router.replace === 'function') {
        router.replace('/(tabs)/home');
      }
    }
  }, [onboardingChecked, loading, session, hasCompletedOnboarding, router]);

  const saveButtonRef = useRef<any>(null);
  const removeButtonRef = useRef<any>(null);
  const coordinatorButtonRef = useRef<any>(null);
  const logoutButtonRef = useRef<any>(null);
  const loginButtonRef = useRef<any>(null);

  // Handler for club info
  const handleViewClub = () => {
    router.push("/vine-profile");
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        
        const { data: { session } } = await supabase.auth.getSession();
        

        if (session && session.user) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError || !userData || !userData.user) throw userError || new Error('No user');
          const fullName = userData.user.user_metadata.full_name || "";
          const userId = userData.user.id;
          
          setName(fullName);

          type UserRoleWithName = { role: { name: string } | null };
const { data: userRoleData, error: userRoleError } = await supabase
  .from("user_roles")
  .select("role:role(name)")
  .eq("user_id", session.user.id);
if (userRoleError) throw userRoleError;

let roleNames: string[] = [];
if (userRoleData && userRoleData.length > 0) {
  roleNames = (userRoleData as unknown as UserRoleWithName[])
    .map(item => Array.isArray(item.role) ? item.role[0]?.name : item.role?.name)
    .filter((name): name is string => typeof name === 'string');
  setRoles(roleNames);
} else {
  setRoles([]);
}

          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("name, bio, phone, rating, profile_picture, avatar_url") // Fetch avatar_url from profiles
            .eq("user_id", session.user.id)
            .single();
          
          if (!profileError && profileData) {
            setName(profileData.name || fullName || ""); // Prefer name from profiles
            setBio(profileData.bio || "");
            setPhone(profileData.phone || "");
            setRating(profileData.rating || null);
            setProfilePicture(profileData.avatar_url || profileData.profile_picture || null); // Prefer avatar_url
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
        
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [session]);

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

      let avatarUrl: string | null = null;
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
          
          Alert.alert("Error", "Failed to upload profile picture.");
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(fileName);

        avatarUrl = publicUrlData.publicUrl;
        setProfilePicture(avatarUrl); // Update state with the new URL
      } else {
        avatarUrl = profilePicture; // Keep the existing URL if no new image is selected
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
            profile_picture: avatarUrl, // (optional: keep for backward compatibility)
            avatar_url: avatarUrl,      // Save avatar_url
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      if (profileError) throw profileError;

      Alert.alert("Success", "Profile updated!");
      setShowEditCard(false);
    } catch (err: any) {
      
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
          <Text style={styles.label}>Name: {name}</Text>
{phone ? <Text style={styles.label}>Phone: {phone}</Text> : null}
<Text style={styles.label}>Email: {session.user.email}</Text>
{rating !== null ? <Text style={styles.label}>Rating: {rating}</Text> : null}
{bio ? <Text style={styles.label}>Bio: {bio}</Text> : null}
{/* <Text style={styles.label}>Roles: {roles.join(", ") || "None"}</Text> */}
{/* --- Teams Section --- */}
{teams.length > 0 ? (
  <View style={{ marginTop: 24, width: '100%' }}>
    <Text style={[styles.label, { fontWeight: 'bold', fontSize: 18 }]}>Teams</Text>
    {teams.map((team) => (
      <View key={team.team_id} style={{ marginVertical: 8, padding: 10, backgroundColor: '#f3f3f3', borderRadius: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[styles.label, { fontSize: 16 }]}>{team.name || 'Unnamed Team'}</Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => handleEditTeam(team.team_id)}>
            <MaterialIcons name="edit" size={20} color="#1A3C34" />
            <Text style={{ color: '#1A3C34', marginLeft: 4 }}>Edit Team</Text>
          </TouchableOpacity>
        </View>
        {teamMembers[team.team_id] ? (
          <View style={{ marginTop: 4, marginLeft: 10 }}>
            <Text style={{ color: '#888', fontSize: 14 }}>Members:</Text>
            {teamMembers[team.team_id].map((member) => (
              <Text key={member.user_id} style={{ color: '#333', fontSize: 14, marginLeft: 8 }}>- {member.name}</Text>
            ))}
          </View>
        ) : null}
      </View>
    ))}
  </View>
) : null}
{/* <Text style={styles.label}>Team: {teamInfo}</Text> */}
{roles.includes("Coordinator") && joinCode ? (
  <Text style={styles.label}>Join Code: {joinCode} (Share this with players!)</Text>
) : null}
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
              <Text style={styles.cardLabel}>Phone Number:</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g., 1234567890"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
              <Text style={styles.cardLabel}>Email:</Text>
              <Text style={styles.input}>{session.user.email}</Text>
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
          {roles.some(role => role.toLowerCase() === "coordinator") && (
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
      {/* Team Edit Modal */}
      <TeamEditModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        teamId={editTeamId || ''}
        initialName={editTeamName}
        initialMembers={editTeamMembers}
        onUpdated={() => {
          // Refresh teams after update
          if (session && session.user) {
            // Re-run fetchTeams logic
            (async () => {
              const { data: userTeams } = await supabase
                .from('team_members')
                .select('team_id, teams!fk_team_members_team_id(name)')
                .eq('user_id', session.user.id);
              const uniqueTeams = Array.from(
                new Map((userTeams || []).map((t: any) => [t.team_id, t.teams])).entries()
              ).map(([team_id, team]) => ({ team_id, ...team }));
              setTeams(uniqueTeams);
              // For each team, fetch members
              const membersByTeam: { [teamId: string]: any[] } = {};
              for (const t of uniqueTeams) {
                // Use left join so all team_members are returned even if profile is missing
                const { data: members, error: fetchMembersErr } = await supabase
                  .from('team_members')
                  .select('user_id, profiles(name)')
                  .eq('team_id', t.team_id);
                console.log('DEBUG: team_id', t.team_id, 'members', members, 'error', fetchMembersErr);
                if (members) {
                  // Always include the member, fallback to user_id if no profile
                  membersByTeam[t.team_id] = members.map((m: any) => ({
                    user_id: m.user_id,
                    name: m.profiles?.name || m.user_id || 'Unknown',
                  }));
                }
              }
              setTeamMembers(membersByTeam);
            })();
          }
        }}
      />
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