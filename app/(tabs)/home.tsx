// app/(tabs)/home.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import BackgroundWrapper from "../../components/BackgroundWrapper";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";

export default function Home() {
  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Your Vine!</Text>
        <Text style={styles.subtitle}>This is your home screen. Start climbing the ladder!</Text>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.landing.title,
    fontFamily: TYPOGRAPHY.fonts.heading,
    color: COLORS.text.dark,
    textAlign: "center",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.landing.tagline,
    fontFamily: TYPOGRAPHY.fonts.body,
    color: COLORS.secondary,
    textAlign: "center",
  },
});