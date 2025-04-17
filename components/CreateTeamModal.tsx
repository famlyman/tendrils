// Modal for creating a doubles team: select partner, enter team name
import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, TextInput, FlatList, StyleSheet } from "react-native";
import { useDemoData } from "./DemoDataContext";

export default function CreateTeamModal({
  visible,
  onClose,
  onCreate,
  currentUserId
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (team: { team_id: string; name: string; members: string[] }) => void;
  currentUserId: string;
}) {
  const { profiles, teams } = useDemoData();
  const [teamName, setTeamName] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

  // Exclude users already in a team and the current user
  const unavailableIds = new Set(teams.flatMap(t => t.members));
  unavailableIds.add(currentUserId);
  const availablePartners = profiles.filter(
    p => !unavailableIds.has(p.user_id)
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Create Doubles Team</Text>
          <TextInput
            placeholder="Team Name"
            value={teamName}
            onChangeText={setTeamName}
            style={styles.input}
          />
          <Text style={styles.subtitle}>Select a Partner</Text>
          <FlatList
            data={availablePartners}
            keyExtractor={item => item.user_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.partner, selectedPartner === item.user_id && styles.partnerSelected]}
                onPress={() => setSelectedPartner(item.user_id)}
              >
                <Text style={styles.partnerText}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No available partners.</Text>}
            style={{ maxHeight: 120, marginBottom: 12 }}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.create, !(teamName && selectedPartner) && { opacity: 0.5 }]}
              disabled={!(teamName && selectedPartner)}
              onPress={() => {
                onCreate({
                  team_id: `team-${Date.now()}`,
                  name: teamName,
                  members: [currentUserId, selectedPartner!],
                });
                setTeamName("");
                setSelectedPartner(null);
                onClose();
              }}
            >
              <Text style={styles.createText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: 320,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: "Roboto-Bold",
    color: "#1A3C34",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#A8E6CF",
    borderRadius: 8,
    padding: 8,
    width: "100%",
    marginBottom: 12,
    fontFamily: "Roboto-Regular",
    fontSize: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#1A3C34",
    marginBottom: 8,
    fontFamily: "Roboto-Bold",
    alignSelf: "flex-start",
  },
  partner: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F2F2F2",
    marginBottom: 6,
  },
  partnerSelected: {
    backgroundColor: "#FFD54F",
  },
  partnerText: {
    fontFamily: "Roboto-Regular",
    fontSize: 15,
    color: "#1A3C34",
  },
  empty: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
    marginVertical: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
  },
  cancel: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
    marginRight: 8,
  },
  cancelText: {
    color: "#1A3C34",
    fontFamily: "Roboto-Bold",
    fontSize: 16,
  },
  create: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#A8E6CF",
    marginLeft: 8,
  },
  createText: {
    color: "#1A3C34",
    fontFamily: "Roboto-Bold",
    fontSize: 16,
  },
});
