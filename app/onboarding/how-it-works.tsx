import React, { useRef } from "react";
import { View, Text, StyleSheet, StatusBar, Image, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Icon } from "react-native-elements";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";

export default function HowItWorks() {
  // Create a ref for the animatable view
  const buttonAnimationRef = useRef(null);

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

  const handleButtonPress = () => {
    // Animate the button when pressed
    if (buttonAnimationRef.current) {
      buttonAnimationRef.current.bounce(800);
    }
    router.push("/onboarding/join-now");
  };

  return (
    <LinearGradient
      colors={["#A8E6CF", "#4A704A"]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#4A704A" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Animatable.View animation="fadeIn" duration={1000}>
            <Image
              source={require("../../assets/images/pickleball.png")}
              style={styles.icon}
            />
            <Text style={styles.title}>The Climb Awaits</Text>
            <Text style={styles.tagline}>Your Path to Pickleball Greatness</Text>
            
            <Animatable.View animation="fadeInLeft" delay={300} duration={800} style={styles.stepContainer}>
              <Icon
                name="numeric-1-circle"
                type="material-community"
                color="#FFD700"
                size={28}
                containerStyle={styles.illustration}
              />
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>COMPETE</Text>
                <Text style={styles.stepDescription}>
                  Challenge opponents and record your thrilling matches
                </Text>
              </View>
            </Animatable.View>
            
            <Animatable.View animation="fadeInLeft" delay={500} duration={800} style={styles.stepContainer}>
              <Icon
                name="numeric-2-circle"
                type="material-community"
                color="#FFD700"
                size={28}
                containerStyle={styles.illustration}
              />
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>SCORE</Text>
                <Text style={styles.stepDescription}>
                  Earn points with each victory as you showcase your skills
                </Text>
              </View>
            </Animatable.View>
            
            <Animatable.View animation="fadeInLeft" delay={700} duration={800} style={styles.stepContainer}>
              <Icon
                name="numeric-3-circle"
                type="material-community"
                color="#FFD700"
                size={28}
                containerStyle={styles.illustration}
              />
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>CONQUER</Text>
                <Text style={styles.stepDescription}>
                  Rise through the ranks and establish your dominance
                </Text>
              </View>
            </Animatable.View>
          </Animatable.View>
          
          <View style={styles.buttonContainer}>
            <Animatable.View 
              animation="fadeInUp" 
              duration={1000} 
              delay={900}
              ref={buttonAnimationRef}
            >
              <Button
                title="Ready to Dominate"
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
              delay={1100}
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
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  tagline: {
    fontSize: 18,
    fontFamily: "Roboto-Bold",
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 30,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 15,
    width: "100%",
  },
  illustration: {
    marginRight: 15,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontFamily: "Roboto-Bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: "Roboto-Regular",
    color: "#FFFFFF",
    lineHeight: 20,
  },
  descriptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    marginTop: 20,
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