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
import { MaterialIcons } from "@expo/vector-icons";

// Import the theme values
import { COLORS, TYPOGRAPHY, STYLES, ICONS } from "../constants/theme";

export default function LandingPage() {
  const [fontsLoaded] = useFonts({
    "AmaticSC-Bold": require("../assets/fonts/AmaticSC-Bold.ttf"),
    "Roboto-Regular": require("../assets/fonts/Roboto-Regular.ttf"),
    "Roboto-Bold": require("../assets/fonts/Roboto-Bold.ttf"),
    "Roboto-Light": require("../assets/fonts/Roboto-Light.ttf"), // Added for footer text
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
      colors={['#A8E6CF', '#6BAF92']} // Softer gradient for better cohesion
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#6BAF92" />
      <View style={styles.content}>
        {/* Pickleball PNG - To be replaced with new illustration */}
        <Animatable.Image
          source={require("../assets/images/pickleball.png")}
          style={styles.icon}
          animation="fadeIn"
          duration={1000}
        />

        {/* Updated Header */}
        <Animatable.Text
          style={styles.title}
          animation="fadeIn"
          duration={1000}
          delay={200}
        >
          TENDRILS
        </Animatable.Text>
        <Animatable.Text
          style={styles.tagline}
          animation="fadeIn"
          duration={1000}
          delay={400}
        >
          The Ultimate Pickleball Ladder Experience
        </Animatable.Text>
        <Animatable.Text
          style={styles.callToAction}
          animation="fadeIn"
          duration={1000}
          delay={600}
        >
          CLIMB THE VINE. CLAIM YOUR GLORY.
        </Animatable.Text>

        {/* Updated Footer */}
        <View style={styles.footer}>
          {/* Unified footer text with inline icons */}
          <Animatable.View
            style={styles.footerTextContainer}
            animation="fadeIn"
            duration={1000}
            delay={800}
          >
            <Text style={styles.footerText}>
              Create or join
              <MaterialIcons name="nature" size={20} color={COLORS.secondary} style={styles.inlineIcon} />{" "}
              vines,
              <MaterialIcons name="emoji-events" size={20} color={COLORS.secondary} style={styles.inlineIcon} />{" "}
              challenge opponents, and
              <MaterialIcons name="stairs" size={20} color={COLORS.secondary} style={styles.inlineIcon} />{" "}
              climb the ladder to become a pickleball legend.
            </Text>
          </Animatable.View>

          <Animatable.Text
            style={styles.communityText}
            animation="fadeIn"
            duration={1000}
            delay={1000}
          >
            JOIN THE FASTEST-GROWING PICKLEBALL COMMUNITY
          </Animatable.Text>

          <Animatable.View
            animation="fadeInUp"
            duration={1000}
            delay={1200}
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
                colors: COLORS.buttonGradient,
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
    marginBottom: 30, // Increased spacing
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.landing.title, // 60
    fontFamily: TYPOGRAPHY.fonts.heading, // AmaticSC-Bold
    color: COLORS.text.dark, // #1A3C34
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginBottom: 20, // Increased spacing
  },
  tagline: {
    fontSize: TYPOGRAPHY.sizes.landing.tagline, // 28
    fontFamily: TYPOGRAPHY.fonts.body, // Roboto-Regular
    color: '#FFD54F', // Softer gold for better cohesion
    textAlign: "center",
    marginBottom: 20, // Increased spacing
    letterSpacing: TYPOGRAPHY.letterSpacing.heading,
    textShadowColor: "rgba(74, 112, 74, 0.5)", // Darker green shadow
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  callToAction: {
    fontSize: TYPOGRAPHY.sizes.landing.callToAction, // 24
    fontFamily: TYPOGRAPHY.fonts.bold, // Roboto-Bold
    color: COLORS.text.primary, // #FFFFFF
    textAlign: "center",
    marginBottom: 40, // Increased spacing
    maxWidth: "85%",
    textShadowColor: "rgba(74, 112, 74, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  footer: {
    alignItems: "center",
    marginBottom: 20,
  },
  footerTextContainer: {
    marginBottom: 30, // Increased spacing
    maxWidth: "90%", // Ensure text doesn't stretch too wide
  },
  footerText: {
    fontSize: TYPOGRAPHY.sizes.small, // 14
    fontFamily: "Roboto-Light", // Lighter weight for better contrast
    color: COLORS.text.primary, // #FFFFFF
    textAlign: "center",
    lineHeight: 22, // Improved readability
    textShadowColor: "rgba(74, 112, 74, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  communityText: {
    fontFamily: TYPOGRAPHY.fonts.bold, // Roboto-Bold
    fontSize: TYPOGRAPHY.sizes.landing.communityText, // 18
    marginBottom: 30, // Increased spacing
    color: '#FFD54F', // Softer gold
    textAlign: "center",
    textShadowColor: "rgba(74, 112, 74, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
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
    borderWidth: 2, // Added border for polish
    borderColor: '#FFD54F',
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
    color: COLORS.text.attribution, // #E0E0E0
    textAlign: "center",
    marginTop: 15,
    textDecorationLine: "underline",
  },
  inlineIcon: {
    marginHorizontal: 4, // Spacing around inline icons
  },
});
