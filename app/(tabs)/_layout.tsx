// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import Cucumber from "../../assets/images/cucumber.svg";
import Vine from "../../assets/images/vine.svg";
import Leaf from "../../assets/images/leaf.svg";
import Trophy from "../../assets/images/trophy.svg";
import ProfileIcon from "../../assets/images/profile.svg";
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="home"
        options={{
          title: "Standings",
          tabBarIcon: ({ color, size }) => (
            <Trophy width={size} height={size} fill={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Matches",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}