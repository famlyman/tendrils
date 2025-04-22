import React, { useState } from "react";
import { Modal, View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from "react-native";

interface EnterScoreModalProps {
  visible: boolean;
  onClose: () => void;
  match: any;
  onSubmit: (score: string, winnerId: string) => void;
  isDoubles: boolean;
}

const EnterScoreModal: React.FC<EnterScoreModalProps> = ({ visible, onClose, match, onSubmit, isDoubles }) => {
  const [score, setScore] = useState("");
  const [winnerId, setWinnerId] = useState("");

  if (!match) return null;

  const challengerLabel = isDoubles ? `Team 1: ${match.team_1_id}` : `Challenger: ${match.challenger_id}`;
  const opponentLabel = isDoubles ? `Team 2: ${match.team_2_id}` : `Opponent: ${match.opponent_id}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Enter Match Score</Text>
          <Text style={styles.label}>Score (e.g. 11-7, 6-11, 11-9)</Text>
          <TextInput
            style={styles.input}
            value={score}
            onChangeText={setScore}
            placeholder="Enter score"
          />
          <Text style={styles.label}>Winner</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.winnerBtn, winnerId === (isDoubles ? match.team_1_id : match.challenger_id) && styles.winnerBtnSelected]}
              onPress={() => setWinnerId(isDoubles ? match.team_1_id : match.challenger_id)}
            >
              <Text>{challengerLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.winnerBtn, winnerId === (isDoubles ? match.team_2_id : match.opponent_id) && styles.winnerBtnSelected]}
              onPress={() => setWinnerId(isDoubles ? match.team_2_id : match.opponent_id)}
            >
              <Text>{opponentLabel}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={onClose} color="#888" />
            <Button
              title="Submit"
              onPress={() => {
                if (!score || !winnerId) {
                  Alert.alert("Error", "Please enter a score and select a winner.");
                  return;
                }
                onSubmit(score, winnerId);
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '85%' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  label: { fontWeight: 'bold', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  winnerBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#aaa', borderRadius: 6, marginHorizontal: 5, alignItems: 'center' },
  winnerBtnSelected: { backgroundColor: '#cceeff' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
});

export default EnterScoreModal;
