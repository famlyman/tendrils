import React, { useRef } from "react";
import { View, Text, StyleSheet, StatusBar, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Icon } from "react-native-elements";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";

export default function Welcome() {
  // Create a ref for the animatable view
  const buttonAnimationRef = useRef(null);

  const handleSkip = async () => {
    console.log("Skip pressed in Welcome");
    try {
      await AsyncStorage.setItem("hasCompletedOnboarding", "skipped");
      console.log("AsyncStorage set to skipped");
      router.push("/(tabs)/home");
      console.log("Navigation attempted to /(tabs)/home");
    } catch (error) {
      console.log("Skip error:", error);
    }
  };

  const handleButtonPress = () => {
    // Animate the button when pressed
    if (buttonAnimationRef.current) {
      buttonAnimationRef.current.bounce(800);
    }
    router.push("/onboarding/how-it-works");
  };

  return (
    <LinearGradient
      colors={["#A8E6CF", "#4A704A"]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
      <View style={styles.content}>
        <Animatable.View animation="fadeIn" duration={1000}>
          <Image
            source={require("../../assets/images/pickleball.png")}
            style={styles.icon}
          />
          <Text style={styles.title}>Game On!</Text>
          <Text style={styles.subtitle}>Your Pickleball Journey Starts Here</Text>
          <View style={styles.descriptionContainer}>
            <Icon
              name="sprout"
              type="material-community"
              color="#FFD700"
              size={24}
              containerStyle={styles.illustration}
            />
            <Text style={styles.description}>
              Join a thriving community where every match brings you closer to the top.
            </Text>
          </View>
          <View style={styles.featureContainer}>
            <Text style={styles.featureText}>
              • Track your progress in real-time
            </Text>
            <Text style={styles.featureText}>
              • Challenge players at your skill level
            </Text>
            <Text style={styles.featureText}>
              • Build your reputation on the courts
            </Text>
          </View>
        </Animatable.View>
        <View style={styles.buttonContainer}>
          <Animatable.View 
            animation="fadeInUp" 
            duration={1000} 
            delay={300}
            ref={buttonAnimationRef}
          >
            <Button
              title="Let's Go!"
              onPress={handleButtonPress}
              buttonStyle={styles.nextButton}
              titleStyle={styles.buttonText}
              containerStyle={styles.buttonWrapper}
              ViewComponent={LinearGradient}
              linearGradientProps={{
                colors: ["#FFD700", "#FFC107"],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 0 },
              }}
            />
          </Animatable.View>
          <Animatable.Text
            animation="fadeIn"
            duration={1000}
            delay={600}
            style={styles.skipText}
            onPress={handleSkip}
          >
            Skip
          </Animatable.Text>
          {/* Progress Dots */}
          <View style={styles.progressDots}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
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
    alignSelf: "center",
  },
  title: {
    fontSize: 42,
    fontFamily: "AmaticSC-Bold",
    color: "#1A3C34",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "Roboto-Bold",
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 15,
  },
  descriptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  illustration: {
    marginRight: 10,
  },
  description: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#FFFFFF",
    textAlign: "left",
    flex: 1,
  },
  featureContainer: {
    alignItems: "flex-start",
    alignSelf: "center",
    marginVertical: 10,
  },
  featureText: {
    fontSize: 15,
    fontFamily: "Roboto-Regular",
    color: "#FFFFFF",
    marginVertical: 5,
  },
  buttonContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  buttonWrapper: {
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  nextButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
  },
  skipText: {
    fontSize: 16,
    fontFamily: "Roboto-Regular",
    color: "#D3D3D3",
    textAlign: "center",
    marginTop: 15,
  },
  progressDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D3D3D3",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#FFD700",
  },
});
