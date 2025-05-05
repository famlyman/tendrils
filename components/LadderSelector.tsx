import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

interface Ladder {
  ladder_id: string;
  name: string;
  type: string;
  description?: string;
}

interface LadderSelectorProps {
  ladders: Ladder[];
  selectedLadder: Ladder | null;
  onSelectLadder: (ladder: Ladder) => void;
}

const LadderSelector: React.FC<LadderSelectorProps> = ({ ladders, selectedLadder, onSelectLadder }) => (
  <View style={styles.ladderSelector}>
    {ladders.map(ladder => (
      <TouchableOpacity
        key={ladder.ladder_id}
        style={[
          styles.ladderButton,
          selectedLadder?.ladder_id === ladder.ladder_id && styles.ladderButtonSelected,
        ]}
        onPress={() => onSelectLadder(ladder)}
      >
        <Text style={styles.ladderButtonText}>{ladder.name}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  ladderSelector: { flexDirection: "row", marginBottom: 16, justifyContent: 'center', alignItems: 'center' },
  ladderButton: { padding: 10, borderRadius: 6, borderWidth: 1, borderColor: "#ccc", marginRight: 8 },
  ladderButtonSelected: { backgroundColor: "#cceeff" },
  ladderButtonText: { fontWeight: "bold", textAlign: 'center' },
});

export default LadderSelector;
