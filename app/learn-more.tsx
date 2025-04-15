// app/learn-more.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { Button } from "react-native-elements";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import { COLORS, TYPOGRAPHY, ICONS } from "../constants/theme";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { LinearGradient } from "expo-linear-gradient";

export default function LearnMore() {
  const handleGetStarted = () => {
    router.push("/onboarding/welcome");
  };

  return (
    <BackgroundWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animatable.Image
          source={require("../assets/images/tendrils-illustration.png")}
          style={styles.illustration}
          animation="fadeIn"
          duration={1000}
        />

        <Animatable.View animation="fadeInUp" duration={1000} delay={200} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="nature" size={24} color={COLORS.secondary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>What Are Tendrils?</Text>
          </View>
          <Text style={styles.sectionText}>
            Tendrils is the name of our app, inspired by the spiraling structures of a cucumber plant. Just as tendrils help the plant climb and connect, Tendrils connects pickleball players in a thriving community!
          </Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={1000} delay={400} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name={ICONS.vine.name} size={24} color={COLORS.secondary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>What Are Vines?</Text>
          </View>
          <Text style={styles.sectionText}>
            In Tendrils, a <Text style={styles.highlight}>"vine"</Text> is a club—a community of pickleball players. Join or create a vine to connect with others and start competing.
          </Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={1000} delay={600} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="local-florist" size={24} color={COLORS.secondary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>What Are Leaves?</Text>
          </View>
          <Text style={styles.sectionText}>
            Players are the <Text style={styles.highlight}>"leaves"</Text> on the vine. As a leaf, you’ll grow by competing in challenges and climbing the ladder!
          </Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={1000} delay={800} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name={ICONS.trophy.name} size={24} color={COLORS.secondary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>What Is a Ladder?</Text>
          </View>
          <Text style={styles.sectionText}>
            A <Text style={styles.highlight}>"ladder"</Text> is a ranking system made up of <Text style={styles.highlight}>"nodes"</Text>. Each node represents a position—Node 1 is the top-ranked player, Node 2 is second, and so on. Challenge others to move up the nodes!
          </Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={1000} delay={1000} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="emoji-people" size={24} color={COLORS.secondary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>What Are Challenges?</Text>
          </View>
          <Text style={styles.sectionText}>
            A <Text style={styles.highlight}>"challenge"</Text>—or <Text style={styles.highlight}>"flower"</Text>—is a match where you compete against another player in your vine. Win to earn points and climb the ladder!
          </Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={1000} delay={1200} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="trending-up" size={24} color={COLORS.secondary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>What Is a Node?</Text>
          </View>
          <Text style={styles.sectionText}>
            A <Text style={styles.highlight}>"node"</Text> is your position on the ladder. For example, if you’re at Node 3, you’re the third-ranked player in your vine. Win challenges to climb to a higher node!
          </Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={1000} delay={1400} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name={ICONS.ladder.name} size={24} color={COLORS.secondary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Climbing the Vine</Text>
          </View>
          <Text style={styles.sectionText}>
            Challenge opponents in your vine to earn points and <Text style={styles.highlight}>climb the ladder</Text>. Each win moves you up a node—aim for Node 1 to become the top leaf!
          </Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={1000} delay={1600} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="local-florist" size={24} color={COLORS.secondary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>What Are Fruits?</Text>
          </View>
          <Text style={styles.sectionText}>
            Winning a challenge or climbing to a new node yields <Text style={styles.highlight}>fruit</Text>—your achievements in Tendrils! Collect fruits and show them off in your <Text style={styles.highlight}>garden of glory</Text>, a special profile section where you can view your accomplishments.
          </Text>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={1000} delay={1800} style={styles.buttonWrapper}>
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
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  illustration: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fonts.bold, // Roboto-Bold
    color: COLORS.text.primary,
    textAlign: "center",
    textShadowColor: "rgba(74, 112, 74, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  sectionText: {
    fontSize: TYPOGRAPHY.sizes.body, // 16
    fontFamily: TYPOGRAPHY.fonts.body, // Roboto-Regular
    color: COLORS.text.primary,
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.9,
    textShadowColor: "rgba(74, 112, 74, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  highlight: {
    color: COLORS.secondary,
    fontFamily: TYPOGRAPHY.fonts.bold,
  },
  buttonWrapper: {
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 20,
  },
  buttonContainer: {
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.dark,
  },
});