import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { Player } from '../../types/user';

interface TeamCreationModalProps {
  visible: boolean;
  onClose: () => void;
  // onCreateTeam expects: { name: string; members: string[] }
onCreateTeam: (team: { name: string; members: string[] }) => void;
  userRole: string;
  userId: string;
  // Add any other props needed (e.g., vineId, loading, etc.)
}

export const TeamCreationModal: React.FC<TeamCreationModalProps> = ({
  visible,
  onClose,
  onCreateTeam,
  userRole,
  userId,
}) => {
  const [teamName, setTeamName] = useState('');
  const [partnerId, setPartnerId] = useState('');

  if (userRole !== 'player') return null;

  const handleSubmit = () => {
    if (!teamName || !partnerId) {
      Alert.alert('Error', 'Please enter a team name and partner ID.');
      return;
    }
    onCreateTeam({ name: teamName, members: [userId, partnerId] });
    setTeamName('');
    setPartnerId('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Create Team</Text>
          <TextInput
            style={styles.input}
            placeholder="Team Name"
            value={teamName}
            onChangeText={setTeamName}
          />
          <TextInput
            style={styles.input}
            placeholder="Partner User ID"
            value={partnerId}
            onChangeText={setPartnerId}
          />
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={onClose} color="#888" />
            <Button title="Create" onPress={handleSubmit} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    alignItems: 'stretch',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});

export default TeamCreationModal;
