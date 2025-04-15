// app/onboarding/_layout.tsx
import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="register" />
      <Stack.Screen name="join-vine" />
      <Stack.Screen name="create-vine" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="get-started" />
    </Stack>
  );
}