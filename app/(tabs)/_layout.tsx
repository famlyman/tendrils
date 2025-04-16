// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: "Standings" }} />
      <Tabs.Screen name="vine-profile" options={{ title: "Vine" }} />
      <Tabs.Screen name="players" options={{ title: "Players" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}