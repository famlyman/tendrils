import React, { useState } from "react";
import { Modal, View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from "react-native";

interface SendAnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (payload: { content: string; targetType: string; targetId?: string | null; ladderId?: string | null }) => void;
  ladders: any[];
  teams: any[];
  players: any[];
}

const SendAnnouncementModal: React.FC<SendAnnouncementModalProps> = ({ visible, onClose, onSend, ladders, teams, players }) => {
  const [targetType, setTargetType] = useState<'all' | 'player' | 'team'>('all');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [ladderId, setLadderId] = useState<string | null>(null);
  const [content, setContent] = useState("");

  const handleSend = () => {
    if (!content.trim()) {
      Alert.alert("Error", "Message content cannot be empty.");
      return;
    }
    if ((targetType === 'player' && !targetId) || (targetType === 'team' && !targetId)) {
      Alert.alert("Error", `Please select a ${targetType}.`);
      return;
    }
    onSend({ content, targetType, targetId, ladderId });
    setContent("");
    setTargetId(null);
    setLadderId(null);
    setTargetType('all');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Send Announcement</Text>
          <Text style={styles.label}>Target</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.targetBtn, targetType === 'all' && styles.selectedBtn]} onPress={() => setTargetType('all')}>
              <Text>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.targetBtn, targetType === 'player' && styles.selectedBtn]} onPress={() => setTargetType('player')}>
              <Text>Player</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.targetBtn, targetType === 'team' && styles.selectedBtn]} onPress={() => setTargetType('team')}>
              <Text>Team</Text>
            </TouchableOpacity>
          </View>
          {targetType === 'player' && (
            <View>
              <Text style={styles.label}>Select Player</Text>
              <View style={styles.dropdown}>
                {players.map((p: any) => (
                  <TouchableOpacity key={p.id} style={[styles.dropdownItem, targetId === p.id && styles.selectedDropdown]} onPress={() => setTargetId(p.id)}>
                    <Text>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {targetType === 'team' && (
            <View>
              <Text style={styles.label}>Select Team</Text>
              <View style={styles.dropdown}>
                {teams.map((t: any) => (
                  <TouchableOpacity key={t.team_id} style={[styles.dropdownItem, targetId === t.team_id && styles.selectedDropdown]} onPress={() => setTargetId(t.team_id)}>
                    <Text>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <Text style={styles.label}>Ladder (optional)</Text>
          <View style={styles.dropdown}>
            <TouchableOpacity key={"none"} style={[styles.dropdownItem, ladderId === null && styles.selectedDropdown]} onPress={() => setLadderId(null)}>
              <Text>All Ladders</Text>
            </TouchableOpacity>
            {ladders.map((l: any) => (
              <TouchableOpacity key={l.ladder_id} style={[styles.dropdownItem, ladderId === l.ladder_id && styles.selectedDropdown]} onPress={() => setLadderId(l.ladder_id)}>
                <Text>{l.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            placeholder="Enter your announcement..."
            multiline
            numberOfLines={4}
          />
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={onClose} color="#888" />
            <Button title="Send" onPress={handleSend} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  label: { fontWeight: 'bold', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12, minHeight: 60 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  targetBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#aaa', borderRadius: 6, marginHorizontal: 5, alignItems: 'center' },
  selectedBtn: { backgroundColor: '#cceeff' },
  dropdown: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 4 },
  dropdownItem: { padding: 8, borderWidth: 1, borderColor: '#aaa', borderRadius: 6, margin: 3, backgroundColor: '#f5f5f5' },
  selectedDropdown: { backgroundColor: '#cceeff' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
});

export default SendAnnouncementModal;
