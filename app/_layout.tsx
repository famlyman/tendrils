// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        await AsyncStorage.setItem("isSignedUp", session ? "true" : "false");
      } catch (error) {
        console.log("Error in setupAuth:", error);
      } finally {
        setLoading(false);
      }
    };
    setupAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      AsyncStorage.setItem("isSignedUp", session ? "true" : "false");
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="team-creation" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}