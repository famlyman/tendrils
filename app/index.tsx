// app/index.tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet, StatusBar, Linking, ScrollView } from "react-native";
import { Button } from "react-native-elements";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase";
import { useFonts } from "expo-font";
import * as Animatable from "react-native-animatable";
import { MaterialIcons } from "@expo/vector-icons";

// Import the theme values
import { COLORS, TYPOGRAPHY, STYLES, ICONS } from "../constants/theme";
// Import the BackgroundWrapper
import BackgroundWrapper from "../components/BackgroundWrapper";
import { LinearGradient } from "expo-linear-gradient";

export default function LandingPage() {
  const [fontsLoaded] = useFonts({
    "AmaticSC-Bold": require("../assets/fonts/AmaticSC-Bold.ttf"),
    "Roboto-Regular": require("../assets/fonts/Roboto-Regular.ttf"),
    "Roboto-Bold": require("../assets/fonts/Roboto-Bold.ttf"),
  });

// app/index.tsx (relevant parts)
useEffect(() => {
  const checkStatus = async () => {
    const hasCompletedOnboarding = await AsyncStorage.getItem("hasCompletedOnboarding");
    const isSignedUp = await AsyncStorage.getItem("isSignedUp");
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Landing - Session:", session);
    console.log("Landing - hasCompletedOnboarding:", hasCompletedOnboarding);
    console.log("Landing - isSignedUp:", isSignedUp);

    if (session && hasCompletedOnboarding === "true") {
      router.replace("/(tabs)/home");
    } else if (session) {
      // If the user is logged in but hasn't completed onboarding, skip registration
      router.replace("/onboarding/join-vine");
    } else {
      await AsyncStorage.clear();
      console.log("AsyncStorage cleared due to no session or incomplete onboarding");
    }
  };
  checkStatus();
}, []);

const handleGetStarted = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const hasCompletedOnboarding = await AsyncStorage.getItem("hasCompletedOnboarding");

  if (session && hasCompletedOnboarding === "true") {
    router.replace("/(tabs)/home");
  } else if (session) {
    // If the user is logged in, skip registration
    router.push("/onboarding/join-vine");
  } else {
    // If not logged in, proceed to the welcome screen (which leads to registration)
    router.push("/onboarding/welcome");
  }
};

  const handleLearnMore = () => {
    router.push("/learn-more");
  };

  const handleAttributionPress = () => {
    Linking.openURL("https://www.vecteezy.com/free-png/competition");
  };

  return (
    <BackgroundWrapper>
      <StatusBar barStyle="light-content" backgroundColor="#6BAF92" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* New Tendrils Illustration */}
        <Animatable.Image
          source={require("../assets/images/tendrils-illustration.png")}
          style={styles.illustration}
          animation="swing"
          duration={3000}
          iterationCount="infinite"
          easing="ease-in-out"
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
          The Ultimate Pickleball Ladder Experience – Grow Your Rank!
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
              Create or join{' '}
              <MaterialIcons name={ICONS.vine.name} size={20} color={COLORS.secondary} style={styles.inlineIcon} />
              {' '}vines,{' '}
              <MaterialIcons name={ICONS.trophy.name} size={20} color={COLORS.secondary} style={styles.inlineIcon} />
              {' '}challenge opponents, and{' '}
              <MaterialIcons name={ICONS.ladder.name} size={20} color={COLORS.secondary} style={styles.inlineIcon} />
              {' '}climb the ladder to become a pickleball legend.
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

          {/* Button Section */}
          <View style={styles.buttonSection}>
            <Animatable.View
              animation="fadeInUp"
              duration={1000}
              delay={1200}
              style={[styles.buttonWrapper, styles.getStartedButton]} // Add spacing
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

            <Animatable.View
              animation="fadeInUp"
              duration={1000}
              delay={1400}
              style={styles.buttonWrapper}
            >
              <Button
                title="Learn More"
                onPress={handleLearnMore}
                buttonStyle={styles.secondaryButton}
                titleStyle={styles.secondaryButtonText}
                containerStyle={styles.secondaryButtonContainer}
                ViewComponent={LinearGradient}
                linearGradientProps={{
                  colors: ['#FFECB3', '#FFD54F'],
                  start: { x: 0, y: 0 },
                  end: { x: 1, y: 0 },
                }}
              />
            </Animatable.View>
          </View>

          {/* Attribution */}
          <Text
            style={styles.attributionText}
            onPress={handleAttributionPress}
          >
            Competition PNGs by Vecteezy
          </Text>
        </View>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  illustration: {
    width: 150,
    height: 150,
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
    marginBottom: 15,
  },
  tagline: {
    fontSize: TYPOGRAPHY.sizes.landing.tagline, // 28
    fontFamily: TYPOGRAPHY.fonts.body, // Roboto-Regular
    color: COLORS.secondary, // #FFD54F
    textAlign: "center",
    marginBottom: 15,
    letterSpacing: TYPOGRAPHY.letterSpacing.heading,
    textShadowColor: "rgba(74, 112, 74, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  callToAction: {
    fontSize: TYPOGRAPHY.sizes.landing.callToAction, // 24
    fontFamily: TYPOGRAPHY.fonts.bold, // Roboto-Bold
    color: COLORS.text.primary, // #FFFFFF
    textAlign: "center",
    marginBottom: 30,
    maxWidth: "85%",
    textShadowColor: "rgba(74, 112, 74, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  footer: {
    alignItems: "center",
    marginBottom: 15,
  },
  footerTextContainer: {
    marginBottom: 20,
    maxWidth: "90%",
  },
  footerText: {
    fontSize: TYPOGRAPHY.sizes.small, // 14
    fontFamily: TYPOGRAPHY.fonts.body, // Roboto-Regular
    color: COLORS.text.primary, // #FFFFFF
    opacity: 0.9,
    textAlign: "center",
    lineHeight: 22,
    textShadowColor: "rgba(74, 112, 74, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  communityText: {
    fontFamily: TYPOGRAPHY.fonts.bold, // Roboto-Bold
    fontSize: TYPOGRAPHY.sizes.landing.communityText, // 18
    marginBottom: 20,
    color: COLORS.secondary, // #FFD54F
    textAlign: "center",
    textShadowColor: "rgba(74, 112, 74, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  buttonSection: {
    alignItems: "center",
    marginBottom: 15,
  },
  buttonWrapper: {
    borderRadius: 25,
    overflow: "hidden",
  },
  getStartedButton: {
    marginBottom: 15, // Add spacing between buttons
  },
  buttonContainer: {
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.secondary, // #FFD54F
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
  secondaryButtonContainer: {
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fonts.body, // Roboto-Regular
    color: COLORS.text.dark,
  },
  attributionText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fonts.body, // Roboto-Regular
    color: COLORS.text.attribution, // #E0E0E0
    textAlign: "center",
    marginTop: 10,
    textDecorationLine: "underline",
  },
  inlineIcon: {
    marginHorizontal: 4,
  },
});