import React, { useState } from "react";
import { Modal, View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { supabase } from "../supabase";

interface EditSeasonModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdated: () => void;
  season: {
    season_id: string;
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    ladder_id?: string;
    is_active?: boolean;
  };
  ladders: { ladder_id: string; name: string }[];
}

export default function EditSeasonModal({ visible, onClose, onUpdated, season, ladders }: EditSeasonModalProps) {
  const [name, setName] = useState(season.name);
  const [description, setDescription] = useState(season.description || "");
  const [startDate, setStartDate] = useState(season.start_date || "");
  const [endDate, setEndDate] = useState(season.end_date || "");
  const [ladderId, setLadderId] = useState(season.ladder_id || (ladders[0]?.ladder_id ?? ""));
  const [isActive, setIsActive] = useState(!!season.is_active);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Sync modal fields with season prop when it changes
  React.useEffect(() => {
    setName(season.name);
    setDescription(season.description || "");
    setStartDate(season.start_date || "");
    setEndDate(season.end_date || "");
    setLadderId(season.ladder_id || (ladders[0]?.ladder_id ?? ""));
    setIsActive(!!season.is_active);
    setDeleteConfirm(false);
  }, [season.season_id, season.name, season.description, season.start_date, season.end_date, season.ladder_id, season.is_active, visible, ladders]);

  const handleUpdate = async () => {
    if (!name || !startDate || !endDate || !ladderId) {
      Alert.alert("Error", "All fields are required.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("seasons").update({
      name,
      description,
      start_date: startDate,
      end_date: endDate,
      ladder_id: ladderId,
      is_active: isActive,
    }).eq("season_id", season.season_id);
    setLoading(false);
    if (error) {
      Alert.alert("Error", "Could not update season.");
    } else {
      onUpdated();
      onClose();
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const { error } = await supabase.from("seasons").delete().eq("season_id", season.season_id);
    setLoading(false);
    if (error) {
      Alert.alert("Error", "Could not delete season.");
    } else {
      onUpdated();
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Edit Season</Text>
          <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
          <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
          <TextInput placeholder="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} style={styles.input} />
          <TextInput placeholder="End Date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} style={styles.input} />
          <Text style={styles.label}>Ladder</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
            {ladders.map(l => (
              <TouchableOpacity
                key={l.ladder_id}
                style={[styles.ladderButton, ladderId === l.ladder_id && styles.ladderButtonSelected]}
                onPress={() => setLadderId(l.ladder_id)}
              >
                <Text>{l.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={styles.label}>Active:</Text>
            <TouchableOpacity onPress={() => setIsActive(a => !a)} style={{ marginLeft: 8 }}>
              <Text style={{ color: isActive ? 'green' : 'gray', fontWeight: 'bold' }}>{isActive ? 'Yes' : 'No'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={onClose} color="#888" />
            <Button title={loading ? "Saving..." : "Save"} onPress={handleUpdate} disabled={loading || deleteConfirm} />
            <Button title={deleteConfirm ? "Confirm Delete" : "Delete"} color="red" onPress={() => deleteConfirm ? handleDelete() : setDeleteConfirm(true)} disabled={loading} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#fff', padding: 24, borderRadius: 12, width: '90%' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  label: { marginTop: 8, fontWeight: 'bold' },
  ladderButton: { padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginRight: 8, marginBottom: 6 },
  ladderButtonSelected: { backgroundColor: '#cceeff' },
});
