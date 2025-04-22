import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";

interface PlayerProfile {
  user_id: string;
  name: string;
  rating: number;
  wins: number;
  losses: number;
  position: number;
}

interface TeamProfile {
  team_id: string;
  name: string;
  members: string[];
  wins: number;
  losses: number;
  position: number;
}

type StandingsItem = PlayerProfile | TeamProfile;

interface StandingsListProps {
  data: StandingsItem[];
  segment: "Singles" | "Doubles";
  onChallenge: (target: StandingsItem) => void;
  userTeams?: string[]; // For highlighting user's teams in doubles
}

const StandingsList: React.FC<StandingsListProps> = ({ data, segment, onChallenge, userTeams }) => (
  <FlatList
    data={data}
    keyExtractor={item => ("user_id" in item ? item.user_id : item.team_id)}
    renderItem={({ item }) => (
      <TouchableOpacity
        style={[
          styles.itemCard,
          segment === "Doubles" && userTeams?.includes((item as TeamProfile).team_id)
            ? styles.highlight
            : null,
        ]}
        onPress={() => onChallenge(item)}
      >
        <Text style={styles.name}>
          {"user_id" in item
            ? `${item.position}. ${item.name} (Rating: ${item.rating})`
            : `${item.position}. ${item.name} (Members: ${(item as TeamProfile).members.join(", ")})`}
        </Text>
        <Text>
          Wins: {item.wins} | Losses: {item.losses}
        </Text>
      </TouchableOpacity>
    )}
    ListEmptyComponent={<Text style={styles.emptyText}>No standings found.</Text>}
  />
);

const styles = StyleSheet.create({
  itemCard: { backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 10 },
  highlight: { backgroundColor: "#e0f7fa" },
  name: { fontWeight: "bold" },
  emptyText: { textAlign: "center", marginTop: 20, color: "#888" },
});

export default StandingsList;