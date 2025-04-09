// app/(tabs)/home.tsx (Working with New Teams)
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { supabase } from "../../supabase";

type StandingItem = {
  key: string;
  name?: string;
  player1_name?: string;
  player2_name?: string;
  wins: number;
  losses: number;
  points: number;
};

export default function Home() {
  const [individualStandings, setIndividualStandings] = useState<StandingItem[]>([]);
  const [doublesStandings, setDoublesStandings] = useState<StandingItem[]>([]);
  const [teamStandings, setTeamStandings] = useState<StandingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        // Fetch Individual Standings
        const { data: individualData, error: individualError } = await supabase
          .from("individual_standings")
          .select("*");
        if (individualError) throw individualError;
        setIndividualStandings(individualData.map(item => ({
          key: item.name,
          name: item.name,
          wins: item.wins,
          losses: item.losses,
          points: item.points,
        })));

        // Fetch Doubles Standings
        const { data: doublesData, error: doublesError } = await supabase
          .from("doubles_standings")
          .select("*");
        if (doublesError) throw doublesError;
        setDoublesStandings(doublesData.map(item => ({
          key: `${item.player1_name}-${item.player2_name}`,
          player1_name: item.player1_name,
          player2_name: item.player2_name,
          wins: item.wins,
          losses: item.losses,
          points: item.points,
        })));

        // Fetch Teams and Standings
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("team_id, team_name")
          .order("team_name");
        if (teamsError) throw teamsError;

        const { data: standingsData, error: standingsError } = await supabase
          .from("team_standings")
          .select("team_name, wins, losses, total_points");
        if (standingsError) throw standingsError;

        const mergedStandings = teamsData.map(team => {
          const standing = standingsData.find(s => s.team_name === team.team_name) || {
            wins: 0,
            losses: 0,
            total_points: 0,
          };
          return {
            key: team.team_name,
            name: team.team_name,
            wins: standing.wins,
            losses: standing.losses,
            points: standing.total_points,
          };
        });
        setTeamStandings(mergedStandings);

      } catch (err: any) {
        console.log("Error fetching standings:", err);
        setError("Failed to load standings. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchStandings();
  }, []);

  const renderItem = ({ item }: { item: StandingItem }) => (
    <View style={styles.item}>
      <Text>
        {item.name 
          ? `${item.name}` 
          : `${item.player1_name} & ${item.player2_name}`} 
        {" "}— W: {item.wins}, L: {item.losses}, Pts: {item.points}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Standings</Text>

      <Text style={styles.sectionTitle}>Individual</Text>
      <FlatList
        data={individualStandings}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        style={styles.list}
      />

      <Text style={styles.sectionTitle}>Doubles</Text>
      <FlatList
        data={doublesStandings}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        style={styles.list}
      />

      <Text style={styles.sectionTitle}>Teams</Text>
      <FlatList
        data={teamStandings}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        style={styles.list}
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
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  list: {
    marginBottom: 20,
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
});