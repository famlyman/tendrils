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
      colors={["#A8E6CF", "#4A704A"]} // Light green to darker green gradient
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
      <View style={styles.content}>
        {/* Pickleball PNG */}
        <Image
          source={require("../assets/images/pickleball.png")}
          style={styles.icon}
        />

        {/* Updated Header */}
        <Text style={styles.title}>TENDRILS</Text>
        <Text style={styles.tagline}>The Ultimate Pickleball Ladder Experience</Text>
        <Animatable.Text 
          animation="fadeIn" 
          duration={1500} 
          style={styles.callToAction}
        >
          CLIMB THE VINE. CLAIM YOUR GLORY.
        </Animatable.Text>

        {/* Updated Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            From casual players to competitive captains, Tendrils transforms your pickleball passion into organized competition that grows with your skills.
          </Text>
          <Text style={[styles.footerText, styles.communityText]}>
            JOIN THE FASTEST-GROWING PICKLEBALL COMMUNITY
          </Text>
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
                colors: ["#FFD700", "#FFC107"], // Yellow gradient
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
    fontSize: 60,
    fontFamily: "AmaticSC-Bold",
    color: "#1A3C34",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: 22,
    fontFamily: "Roboto-Regular",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 10,
  },
  callToAction: {
    fontSize: 24,
    fontFamily: "Roboto-Bold",
    color: "#FFFFFF",
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
  footerText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
    maxWidth: "90%",
  },
  communityText: {
    fontFamily: "Roboto-Bold",
    fontSize: 18,
    marginBottom: 25,
    color: "#FFD700", // Gold color to make it stand out
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
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
  },
  attributionText: {
    fontSize: 12,
    fontFamily: "Roboto-Regular",
    color: "#D3D3D3", // Light gray to be subtle
    textAlign: "center",
    marginTop: 15,
    textDecorationLine: "underline", // Mimics a hyperlink
  },
});