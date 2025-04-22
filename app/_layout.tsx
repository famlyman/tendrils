// app/_layout.tsx
import React from 'react';
import { AuthProvider } from "../context/AuthContext";

import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <AuthProvider>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
    </AuthProvider>

  );
}