// components/BackgroundWrapper.tsx
import React, { ReactNode } from "react";
import { StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants/theme";

interface BackgroundWrapperProps {
  children: ReactNode;
}

export default function BackgroundWrapper({ children }: BackgroundWrapperProps) {
  return (
    <LinearGradient
      colors={COLORS.primaryGradient} // ['#A8E6CF', '#6BAF92']
      style={styles.container}
    >
      <Image
        source={require("../assets/images/vine-pattern.png")}
        style={styles.backgroundPattern}
        resizeMode="repeat"
      />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.1,
  },
});