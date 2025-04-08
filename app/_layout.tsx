// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      AsyncStorage.setItem("isSignedUp", session ? "true" : "false");
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      AsyncStorage.setItem("isSignedUp", session ? "true" : "false");
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" /> {/* Remove redirect */}
    </Stack>
  );
}