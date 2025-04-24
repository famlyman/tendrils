import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button, Modal, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { supabase } from "../supabase";
import AddSeasonModal from "./AddSeasonModal";
import EditSeasonModal from "./EditSeasonModal";

interface Ladder {
  ladder_id: string;
  name: string;
  type: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface Season {
  season_id: string;
  ladder_id: string;
  name: string;
  start_date: string;
  end_date: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  ladders?: Ladder; // for joined data
}

interface SeasonManagerProps {
  laddersRefreshTrigger?: number;
}

export default function SeasonManager({ laddersRefreshTrigger }: SeasonManagerProps = {}) {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [seasonToEdit, setSeasonToEdit] = useState<Season | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [ladders, setLadders] = useState<Ladder[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "", description: "", ladder_id: "" });

  useEffect(() => {
    fetchSeasons();
    fetchLadders();
  }, []);

  // Refetch ladders when trigger changes
  useEffect(() => {
    if (typeof laddersRefreshTrigger !== 'undefined') {
      fetchLadders();
    }
  }, [laddersRefreshTrigger]);

  const fetchSeasons = async () => {
    const { data } = await supabase
      .from("seasons")
      .select("*, ladders(name)")
      .order("start_date", { ascending: false });
    setSeasons(data || []);
  };

  const fetchLadders = async () => {
    const { data } = await supabase.from("ladders").select("*");
    setLadders(data || []);
  };

  const handleSave = async () => {
    if (!form.name || !form.start_date || !form.end_date || !form.ladder_id) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }
    await supabase.from("seasons").insert({
      name: form.name,
      start_date: form.start_date,
      end_date: form.end_date,
      description: form.description,
      ladder_id: form.ladder_id,
    });
    setModalVisible(false);
    setForm({ name: "", start_date: "", end_date: "", description: "", ladder_id: "" });
    fetchSeasons();
  };

  return (
    <View style={styles.seasonContainer}>
      <Text style={styles.header}>Seasons</Text>
      <FlatList
        data={seasons}
        keyExtractor={item => item.season_id}
        renderItem={({ item }) => {
          // Defensive: force is_active to boolean
          const isActive = typeof item.is_active === 'boolean' ? item.is_active : item.is_active === true || item.is_active === 'true';
          return (
            <View style={styles.seasonCard}>
              <Text style={styles.seasonName}>{item.name} ({item.ladders?.name || "N/A"})</Text>
              <Text>{item.start_date} - {item.end_date}</Text>
              <Text>{item.description}</Text>
              <Text>Status: {isActive ? "Active" : "Inactive"}</Text>
              <Button title="Edit" onPress={() => { setSeasonToEdit(item); setEditModalVisible(true); }} />
            </View>
          );
        }}
        ListEmptyComponent={<Text>No seasons found.</Text>}
      />
      <Button title="Add Season" onPress={() => setModalVisible(true)} />
      {seasonToEdit && (
        <EditSeasonModal
          visible={editModalVisible}
          onClose={() => { setEditModalVisible(false); setSeasonToEdit(null); }}
          onUpdated={fetchSeasons}
          season={{
            season_id: seasonToEdit.season_id,
            name: seasonToEdit.name,
            description: seasonToEdit.description || '',
            start_date: seasonToEdit.start_date || '',
            end_date: seasonToEdit.end_date || '',
            ladder_id: seasonToEdit.ladder_id || '',
            is_active: !!seasonToEdit.is_active,
          }}
          ladders={ladders}
        />
      )}
      <AddSeasonModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdded={fetchSeasons}
        ladders={ladders}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  seasonContainer: { marginTop: 32 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  seasonCard: { backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 10 },
  seasonName: { fontWeight: "bold" },
  modalContent: { flex: 1, justifyContent: "center", padding: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 10 },
  label: { marginTop: 8, fontWeight: "bold" },
  ladderButton: { padding: 8, borderWidth: 1, borderColor: "#ccc", borderRadius: 6, marginRight: 8 },
  ladderButtonSelected: { backgroundColor: "#cceeff" },
});
