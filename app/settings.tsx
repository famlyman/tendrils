// app/(tabs)/settings.tsx
import React from "react";
import { View, Text, Switch, StyleSheet, TouchableOpacity } from "react-native";
import { useDemoData } from "../components/DemoDataContext";
import { COLORS, TYPOGRAPHY } from "../constants/theme";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { MaterialIcons } from '@expo/vector-icons';

import { useRouter } from "expo-router";

function ExitDemoButton({ setDemoMode }: { setDemoMode: (v: boolean) => void }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={{ backgroundColor: COLORS.primaryGradient[1], paddingVertical: 12, paddingHorizontal: 28, borderRadius: 8 }}
      onPress={() => {
        setDemoMode(false);
        router.replace('/onboarding');
      }}
    >
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Exit Demo Mode</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { demoMode, setDemoMode } = useDemoData();

  return (
    <BackgroundWrapper>
      <View style={styles.outerContainer}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="settings" size={40} color={COLORS.secondary} />
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Demo Mode</Text>
            <Switch
              value={demoMode}
              onValueChange={setDemoMode}
              trackColor={{ false: COLORS.secondary, true: COLORS.primaryGradient[0] }}
              thumbColor={demoMode ? COLORS.primaryGradient[0] : COLORS.secondary}
            />
          </View>

          {demoMode && (
            <View style={{ marginTop: 24, alignItems: 'center' }}>
              <Text style={{ color: COLORS.secondary, marginBottom: 8 }}>
                Want to start using Tendrils for real?
              </Text>
              <ExitDemoButton setDemoMode={setDemoMode} />
            </View>
          )}

        </View>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 60,
    backgroundColor: 'transparent',
  },
  iconWrap: {
    marginBottom: 12,
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    minWidth: 280,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.landing.title,
    fontFamily: TYPOGRAPHY.fonts.heading,
    color: COLORS.text.dark,
    textAlign: "center",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
    width: 200,
  },
  label: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fonts.body,
    color: COLORS.text.dark,
    marginRight: 10,
  },
});
