import React, { useState } from "react";
import { Modal, View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { supabase } from "../supabase";

interface EditLadderModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdated: () => void;
  ladder: { ladder_id: string; name: string; type: string; description?: string };
}

export default function EditLadderModal({ visible, onClose, onUpdated, ladder }: EditLadderModalProps) {
  const [name, setName] = useState(ladder.name);
  const [type, setType] = useState(ladder.type);
  const [description, setDescription] = useState(ladder.description || "");
  const [loading, setLoading] = useState(false);

  // Sync modal fields with ladder prop when it changes
  React.useEffect(() => {
    setName(ladder.name);
    setType(ladder.type);
    setDescription(ladder.description || "");
  }, [ladder.ladder_id, ladder.name, ladder.type, ladder.description, visible]);

  const handleUpdate = async () => {
    if (!name || !type) {
      Alert.alert("Error", "Name and type are required.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("ladders").update({ name, type, description }).eq("ladder_id", ladder.ladder_id);
    setLoading(false);
    if (error) {
      Alert.alert("Error", "Could not update ladder.");
    } else {
      onUpdated();
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Edit Ladder</Text>
          <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
          <TextInput placeholder="Type" value={type} onChangeText={setType} style={styles.input} />
          <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={onClose} color="#888" />
            <Button title={loading ? "Saving..." : "Save"} onPress={handleUpdate} disabled={loading} />
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
