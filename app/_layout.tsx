// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  console.log("RootLayout mounting");

  useEffect(() => {
    console.log("useEffect starting");
    const setupAuth = async () => {
      try {
        console.log("Fetching session");
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Root - Initial session:", session);
        setSession(session);
        await AsyncStorage.setItem("isSignedUp", session ? "true" : "false");
      } catch (error) {
        console.log("Error in setupAuth:", error);
      } finally {
        console.log("Setting loading to false");
        setLoading(false);
      }
    };
    setupAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Root - Auth state changed:", session);
      setSession(session);
      AsyncStorage.setItem("isSignedUp", session ? "true" : "false");
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  console.log("Rendering with loading:", loading);

  if (loading) {
    console.log("Returning null due to loading");
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}