import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";

interface PlayerProfile {
  user_id: string;
  name?: string;
  player_name?: string;
  rating: number;
  wins: number;
  losses: number;
  position: number;
  ladder_id?: string;
}

interface TeamProfile {
  [x: string]: any;
  members: any;
  team_id: string;
  team_name: string;
  wins: number;
  losses: number;
  position: number;
  ladder_id?: string;
}

export type StandingsItem = PlayerProfile | TeamProfile;

interface StandingsListProps {
  data: StandingsItem[];
  segment: "Singles" | "Doubles";
  onChallenge: (target: StandingsItem) => void;
  userTeams?: string[]; // For highlighting user's teams in doubles
  isCoordinator?: boolean;
  onRemove?: (target: StandingsItem) => void;
}

const StandingsList: React.FC<StandingsListProps> = ({ data, segment, onChallenge, userTeams, isCoordinator, onRemove }) => (
  <FlatList
    data={data}
    keyExtractor={item => ("user_id" in item ? item.user_id : item.team_id)}
    renderItem={({ item }) => (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          style={[
            styles.itemCard,
            segment === "Doubles" && userTeams?.includes((item as TeamProfile).team_id)
              ? styles.highlight
              : null,
            { flex: 1 }
          ]}
          onPress={() => onChallenge(item)}
        >
          <Text style={styles.name}>
            {"user_id" in item
              ? `${item.position}. ${(item.name || item.player_name) ?? "Unknown"} (Rating: ${item.rating})`
              : `${item.position}. ${(item as TeamProfile).team_name}`}
          </Text>
          <Text>
            Wins: {item.wins} | Losses: {item.losses}
          </Text>
        </TouchableOpacity>
        {isCoordinator && onRemove && (
          <TouchableOpacity
            style={{ marginLeft: 8, padding: 6 }}
            onPress={() => onRemove(item)}
            accessibilityLabel="Remove from ladder"
          >
            <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 20 }}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
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