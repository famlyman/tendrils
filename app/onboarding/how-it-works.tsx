// app/onboarding/how-it-works.tsx
import React from "react";
import { View, Text, StyleSheet, StatusBar, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Icon } from "react-native-elements";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";

export default function HowItWorks() {
  const handleSkip = async () => {
    console.log("Skip pressed in How It Works");
    try {
      await AsyncStorage.setItem("hasCompletedOnboarding", "skipped");
      console.log("AsyncStorage set to skipped");
      router.push("/(tabs)/home");
      console.log("Navigation attempted to /(tabs)/home");
    } catch (error) {
      console.log("Skip error:", error);
    }
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
          <Text style={styles.title}>How It Works</Text>
          <View style={styles.descriptionContainer}>
            <Icon
              name="tennis-ball"
              type="material-community"
              color="#FFD700"
              size={24}
              containerStyle={styles.illustration}
            />
            <Text style={styles.description}>Play matches, earn points, and climb the ladder!</Text>
          </View>
        </Animatable.View>
        <View style={styles.buttonContainer}>
          <Animatable.View animation="fadeInUp" duration={1000} delay={300}>
            <Button
              title="Next"
              onPress={() => router.push("/onboarding/join-now")}
              buttonStyle={styles.nextButton}
              titleStyle={styles.buttonText}
              containerStyle={styles.buttonWrapper}
              ViewComponent={LinearGradient}
              linearGradientProps={{
                colors: ["#FFD700", "#FFC107"],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 0 },
              }}
              onPressIn={() => {
                const buttonRef = this.button as any;
                buttonRef?.bounce(800);
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
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
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
    fontSize: 36,
    fontFamily: "AmaticSC-Bold",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  descriptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    marginRight: 10,
  },
  description: {
    fontSize: 18,
    fontFamily: "Roboto-Regular",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
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