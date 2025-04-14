// app/index.tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet, StatusBar, Image, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "react-native-elements";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase";
import { useFonts } from "expo-font";
import * as Animatable from "react-native-animatable";

// Import the theme values
import { COLORS, TYPOGRAPHY, STYLES, ICONS } from "../constants/theme";

export default function LandingPage() {
  const [fontsLoaded] = useFonts({
    "AmaticSC-Bold": require("../assets/fonts/AmaticSC-Bold.ttf"),
    "Roboto-Regular": require("../assets/fonts/Roboto-Regular.ttf"),
    "Roboto-Bold": require("../assets/fonts/Roboto-Bold.ttf"),
  });

  useEffect(() => {
    const checkStatus = async () => {
      const hasCompletedOnboarding = await AsyncStorage.getItem("hasCompletedOnboarding");
      const isSignedUp = await AsyncStorage.getItem("isSignedUp");
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Landing - Session:", session);
      console.log("Landing - hasCompletedOnboarding:", hasCompletedOnboarding);
      console.log("Landing - isSignedUp:", isSignedUp);

      if (session) {
        router.replace("/(tabs)/home");
      } else {
        await AsyncStorage.clear();
        console.log("AsyncStorage cleared due to no session");
      }
    };
    checkStatus();
  }, []);

  if (!fontsLoaded) {
    return null; // Wait for fonts to load
  }

  const handleGetStarted = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      router.replace("/(tabs)/home");
    } else {
      router.push("/onboarding/welcome");
    }
  };

  const handleAttributionPress = () => {
    Linking.openURL("https://www.vecteezy.com/free-png/competition");
  };

  return (
    <LinearGradient
      colors={[COLORS.primaryGradient[0], COLORS.primaryGradient[1]]} // Explicitly create tuple from array
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryGradient[1]} />
      <View style={styles.content}>
        {/* Pickleball PNG - To be replaced with new illustration */}
        <Image
          source={require("../assets/images/pickleball.png")}
          style={styles.icon}
        />

        {/* Updated Header */}
        <Text style={styles.title}>TENDRILS</Text>
        <View style={STYLES.textOverlay}>
          <Text style={styles.tagline}>The Ultimate Pickleball Ladder Experience</Text>
        </View>
        <Animatable.View style={STYLES.textOverlay} animation="fadeIn" duration={1500}>
          <Text style={styles.callToAction}>CLIMB THE VINE. CLAIM YOUR GLORY.</Text>
        </Animatable.View>

        {/* Updated Footer */}
        <View style={styles.footer}>
          {/* Footer description with icons */}
          <View style={[styles.footerTextContainer, STYLES.textOverlay]}>
            <View style={styles.footerTextRow}>
              <Image source={ICONS.vine} style={STYLES.featureIcon} />
              <Text style={styles.footerText}> Create or join vines, </Text>
            </View>
            <View style={styles.footerTextRow}>
              <Image source={ICONS.trophy} style={STYLES.featureIcon} />
              <Text style={styles.footerText}> challenge opponents, and </Text>
            </View>
            <View style={styles.footerTextRow}>
              <Image source={ICONS.ladder} style={STYLES.featureIcon} />
              <Text style={styles.footerText}> climb the ladder to become a pickleball legend.</Text>
            </View>
          </View>

          <View style={STYLES.textOverlay}>
            <Text style={styles.communityText}>JOIN THE FASTEST-GROWING PICKLEBALL COMMUNITY</Text>
          </View>

          <Animatable.View
            animation="fadeInUp"
            duration={1000}
            style={styles.buttonWrapper}
          >
            <Button
              title="Get Started"
              onPress={handleGetStarted}
              buttonStyle={styles.button}
              titleStyle={styles.buttonText}
              containerStyle={styles.buttonContainer}
              ViewComponent={LinearGradient}
              linearGradientProps={{
                colors: COLORS.buttonGradient, // Use button gradient from theme
                start: { x: 0, y: 0 },
                end: { x: 1, y: 0 },
              }}
            />
          </Animatable.View>

          {/* Attribution */}
          <Text
            style={styles.attributionText}
            onPress={handleAttributionPress}
          >
            Competition PNGs by Vecteezy
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  icon: {
    width: 50,
    height: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.landing.title, // 60
    fontFamily: TYPOGRAPHY.fonts.heading, // AmaticSC-Bold
    color: COLORS.text.dark, // #1A3C34
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: TYPOGRAPHY.sizes.landing.tagline, // 28 (increased from 22)
    fontFamily: TYPOGRAPHY.fonts.body, // Roboto-Regular
    color: COLORS.text.secondary, // #FFD700 (gold)
    textAlign: "center",
    marginTop: 10,
    letterSpacing: TYPOGRAPHY.letterSpacing.heading, // 0.5 for readability
  },
  callToAction: {
    fontSize: TYPOGRAPHY.sizes.landing.callToAction, // 24
    fontFamily: TYPOGRAPHY.fonts.bold, // Roboto-Bold
    color: COLORS.text.primary, // #FFFFFF
    textAlign: "center",
    marginTop: 15,
    maxWidth: "85%",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  footer: {
    alignItems: "center",
    marginBottom: 20,
  },
  footerTextContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 20,
  },
  footerTextRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    fontSize: TYPOGRAPHY.sizes.small, // 14 (decreased from 16)
    fontFamily: TYPOGRAPHY.fonts.body, // Roboto-Regular
    color: COLORS.text.primary, // #FFFFFF
    textAlign: "center",
  },
  communityText: {
    fontFamily: TYPOGRAPHY.fonts.bold, // Roboto-Bold
    fontSize: TYPOGRAPHY.sizes.landing.communityText, // 18
    marginBottom: 25,
    color: COLORS.text.secondary, // #FFD700 (gold)
    textAlign: "center",
  },
  buttonWrapper: {
    borderRadius: 25,
    overflow: "hidden",
  },
  buttonContainer: {
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fonts.bold, // Roboto-Bold
    color: COLORS.text.dark, // #1A3C34
  },
  attributionText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fonts.body, // Roboto-Regular
    color: COLORS.text.attribution, // #E0E0E0 (brighter gray)
    textAlign: "center",
    marginTop: 15,
    textDecorationLine: "underline", // Mimics a hyperlink
  },
});