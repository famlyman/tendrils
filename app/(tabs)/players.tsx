import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../supabase";


const mockPlayers = [
  { id: "1", name: "Alex", points: 30 },
  { id: "2", name: "Brooke", points: 25 },
];

export default function Players() {
  const [session, setSession] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  const renderPlayerItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.playerItem}
      onPress={() => {
        if (session) {
          router.push({ pathname: "/player-details", params: { playerId: item.id } });
        } else {
          alert("Please log in to view player details.");
        }
      }}
    >
      <Text style={styles.playerText}>{item.name} - {item.points} points</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Players</Text>
      <FlatList
        data={mockPlayers}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayerItem}
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
  playerItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  playerText: {
    fontSize: 18,
  },
});
