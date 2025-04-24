import React, { useState } from "react";
import { Modal, View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { supabase } from "../supabase";

interface AddLadderModalProps {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddLadderModal({ visible, onClose, onAdded }: AddLadderModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !type) {
      Alert.alert("Error", "Name and type are required.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("ladders").insert({ name, type, description });
    setLoading(false);
    if (error) {
      Alert.alert("Error", "Could not add ladder.");
    } else {
      setName("");
      setType("");
      setDescription("");
      onAdded();
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Add Ladder</Text>
          <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
          <TextInput placeholder="Type" value={type} onChangeText={setType} style={styles.input} />
          <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
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
