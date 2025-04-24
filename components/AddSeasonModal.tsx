import React, { useState } from "react";
import { Modal, View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { supabase } from "../supabase";

interface AddSeasonModalProps {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
  ladders: { ladder_id: string, name: string }[];
}

export default function AddSeasonModal({ visible, onClose, onAdded, ladders }: AddSeasonModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [ladderId, setLadderId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !startDate || !endDate || !ladderId) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("seasons").insert({
      name,
      start_date: startDate,
      end_date: endDate,
      description,
      ladder_id: ladderId,
    });
    setLoading(false);
    if (error) {
      Alert.alert("Error", "Could not add season.");
    } else {
      setName("");
      setStartDate("");
      setEndDate("");
      setDescription("");
      setLadderId("");
      onAdded();
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Add Season</Text>
          <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
          <TextInput placeholder="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} style={styles.input} />
          <TextInput placeholder="End Date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} style={styles.input} />
          <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
          <Text style={{marginTop:8}}>Ladder</Text>
          <View style={styles.input}>
            <select value={ladderId} onChange={e => setLadderId(e.target.value)} style={{width:'100%',padding:4}}>
              <option value="">Select Ladder</option>
              {ladders.map(l => (
                <option key={l.ladder_id} value={l.ladder_id}>{l.name}</option>
              ))}
            </select>
          </View>
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={onClose} color="#888" />
            <Button title={loading ? "Saving..." : "Save"} onPress={handleSave} disabled={loading} />
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
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }
});
