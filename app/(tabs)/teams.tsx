import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { router, useRootNavigationState } from "expo-router";
import { supabase } from "../../supabase";


const mockTeams = [
  { id: "t1", name: "Team Aces", points: 90 },
  { id: "t2", name: "Team Smashers", points: 60 },
];

export default function Teams() {
  const [session, setSession] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  const renderTeamItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.teamItem}
      onPress={() => {
        if (session) {
          router.push({ pathname: "/team-details", params: { teamId: item.id } });
        } else {
          alert("Please log in to view team details.");
        }
      }}
    >
      <Text style={styles.teamText}>{item.name} - {item.points} points</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teams</Text>
      <FlatList
        data={mockTeams}
        keyExtractor={(item) => item.id}
        renderItem={renderTeamItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  teamItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  teamText: {
    fontSize: 18,
  },
});
