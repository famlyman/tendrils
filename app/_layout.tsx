// app/_layout.tsx
import React from 'react';
import { DemoDataProvider } from "../components/DemoDataContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <DemoDataProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </DemoDataProvider>
  );
}