import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button, Modal, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { supabase } from "../supabase";

interface Ladder {
  ladder_id: string;
  name: string;
  type: string;
  description?: string;
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

export default function SeasonManager() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [ladders, setLadders] = useState<Ladder[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "", description: "", ladder_id: "" });

  useEffect(() => {
    fetchSeasons();
    fetchLadders();
  }, []);

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
        renderItem={({ item }) => (
          <View style={styles.seasonCard}>
            <Text style={styles.seasonName}>{item.name} ({item.ladders?.name || "N/A"})</Text>
            <Text>{item.start_date} - {item.end_date}</Text>
            <Text>{item.description}</Text>
            <Text>Status: {item.is_active ? "Active" : "Inactive"}</Text>
            {/* Add Edit/Delete/Set Active buttons as needed */}
          </View>
        )}
        ListEmptyComponent={<Text>No seasons found.</Text>}
      />
      <Button title="Add Season" onPress={() => setModalVisible(true)} />
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <TextInput placeholder="Season Name" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} style={styles.input} />
          <TextInput placeholder="Start Date (YYYY-MM-DD)" value={form.start_date} onChangeText={v => setForm(f => ({ ...f, start_date: v }))} style={styles.input} />
          <TextInput placeholder="End Date (YYYY-MM-DD)" value={form.end_date} onChangeText={v => setForm(f => ({ ...f, end_date: v }))} style={styles.input} />
          <TextInput placeholder="Description" value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} style={styles.input} />
          <Text style={styles.label}>Ladder</Text>
          <FlatList
            data={ladders}
            keyExtractor={item => item.ladder_id}
            horizontal
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.ladderButton,
                  form.ladder_id === item.ladder_id && styles.ladderButtonSelected,
                ]}
                onPress={() => setForm(f => ({ ...f, ladder_id: item.ladder_id }))}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          <Button title="Save" onPress={handleSave} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} color="#888" />
        </View>
      </Modal>
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
