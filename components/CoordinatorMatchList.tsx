import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { supabase } from "../supabase";
import EnterScoreModal from "./EnterScoreModal";

interface CoordinatorMatchListProps {
  ladderId: string;
  isDoubles: boolean;
}

const CoordinatorMatchList: React.FC<CoordinatorMatchListProps> = ({ ladderId, isDoubles }) => {
  const [pendingMatches, setPendingMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from("flowers")
      .select(`
        *,
        challenger:profiles!challenger_id (name),
        opponent:profiles!opponent_id (name),
        team_1:teams!team_1_id (name),
        team_2:teams!team_2_id (name)
      `)
      .eq("ladder_id", ladderId)
      .eq("status", "pending")
      .order("date", { ascending: true });
    if (!error) setPendingMatches(data || []);
  };

  useEffect(() => { fetchMatches(); }, [ladderId]);

  const handleOpenModal = (match: any) => {
    setSelectedMatch(match);
    setModalVisible(true);
  };

  const handleSubmitScore = async (score: string, winnerId: string) => {
    if (!selectedMatch) return;
    try {
      // Determine loser
      let loserId = null;
      if (isDoubles) {
        loserId = winnerId === selectedMatch.team_1_id ? selectedMatch.team_2_id : selectedMatch.team_1_id;
      } else {
        loserId = winnerId === selectedMatch.challenger_id ? selectedMatch.opponent_id : selectedMatch.challenger_id;
      }
      // Update match in Supabase
      await supabase.from("flowers").update({
        score,
        result: { winner_id: winnerId, loser_id: loserId },
        status: "complete"
      }).eq("flower_id", selectedMatch.flower_id);
      setModalVisible(false);
      setSelectedMatch(null);
      fetchMatches();
    } catch (e) {
      alert("Failed to update match.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pending Matches</Text>
      <FlatList
        data={pendingMatches}
        keyExtractor={item => item.flower_id}
        renderItem={({ item }) => (
          <View style={styles.matchCard}>
            <Text style={styles.matchText}>
              {isDoubles
                ? `${item.team_1?.name || 'Unknown Team'} vs ${item.team_2?.name || 'Unknown Team'}`
                : `${item.challenger?.name || 'Unknown Player'} vs ${item.opponent?.name || 'Unknown Player'}`}
            </Text>
            <TouchableOpacity style={styles.enterBtn} onPress={() => handleOpenModal(item)}>
              <Text style={styles.enterBtnText}>Enter Score</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No pending matches.</Text>}
      />
      <EnterScoreModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setSelectedMatch(null); }}
        match={selectedMatch}
        onSubmit={handleSubmitScore}
        isDoubles={isDoubles}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  header: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  matchCard: { backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchText: { flex: 1 },
  enterBtn: { backgroundColor: '#2196f3', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6 },
  enterBtnText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#888' },
});

export default CoordinatorMatchList;
