import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '../supabase';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';

interface TeamCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateTeam: (team: { name: string; members: string[] }) => void;
  userRole: string;
  userId: string;
  vineId?: string;
}

const MAX_TEAM_SIZE = 4;

const TeamCreationModal: React.FC<TeamCreationModalProps> = ({
  visible,
  onClose,
  onCreateTeam,
  userRole,
  userId,
  vineId,
}) => {
  useEffect(() => {
    if (visible) {
      console.log('[TeamCreationModal] Modal opened', { userId, vineId, userRole });
    }
  }, [visible, userId, vineId, userRole]);

  const [teamName, setTeamName] = useState('');
  const [teammates, setTeammates] = useState<{ id?: string; user_id?: string; name?: string; email?: string; invited?: boolean }[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [eligiblePlayers, setEligiblePlayers] = useState<any[]>([]);

  // Fetch all registered users and filter eligible players
  useEffect(() => {
    if (!vineId) return;
    let active = true;
    (async () => {
      try {
        // Fetch all users with proper auth
        const { data: users, error: userErr } = await supabase
          .from('profiles')
          .select('id, name, user_id')
          .eq('vine_id', vineId);
        
        if (userErr) {
          console.error('Error fetching users:', userErr);
          return;
        }
        
        if (!users) {
          console.log('No users found');
          return;
        }

        // Fetch all users already on a team in this vine
        const { data: teamUsers, error: teamErr } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('vine_id', vineId);
          
        if (teamErr) {
          console.error('Error fetching team members:', teamErr);
          return;
        }

        const teamUserIds = (teamUsers || []).map(u => u.user_id);
        
        // Filter out current user, already-added teammates, and users already on a team in this vine
        const eligible = users.filter(
          (u: any) =>
            u.user_id !== userId &&
            !teammates.some(t => t.id === u.user_id) &&
            !teamUserIds.includes(u.user_id)
        );

        if (active) {
          setAllPlayers(users);
          setEligiblePlayers(eligible);
        }
      } catch (error) {
        console.error('Error in useEffect:', error);
      }
    })();
    return () => { active = false; };
  }, [teammates, vineId, userId]);

  // Add teammate from dropdown
  const handleAddTeammateFromDropdown = (playerId: string) => {
    const player = eligiblePlayers.find(u => u.user_id === playerId);
    if (player) {
      setTeammates([...teammates, { id: player.user_id, user_id: player.user_id, name: player.name }]);
      setSelectedPlayer(null);
    }
  };

  // Remove teammate
  const handleRemoveTeammate = (user_id: string) => {
    setTeammates(teammates.filter(t => t.user_id !== user_id));
  };

  // Create team handler - Modified to remove approval flow
  const handleCreateTeam = async () => {
    try {
      console.log('TeamCreationModal: handleCreateTeam called');
      console.log('Current state:', { teamName, teammates, vineId, userId });

      if (!teamName.trim()) {
        Alert.alert("Error", "Please enter a team name");
        return;
      }

      if (teammates.length === 0) {
        Alert.alert("Error", "Please select at least one teammate");
        return;
      }

      // Check if team name is unique
      const isUnique = await checkTeamNameUnique();
      if (!isUnique) {
        Alert.alert("Error", "Team name already exists in this vine");
        return;
      }

      console.log('Creating team with:', {
        name: teamName,
        members: teammates.map(t => t.id || t.user_id || ''),
        vineId,
        userId
      });

      // Call the parent's onCreateTeam function - team will be created with "active" status directly
      console.log('[TeamCreationModal] Calling onCreateTeam', { name: teamName, members: teammates.map(t => t.id || t.user_id || '') });
      await onCreateTeam({
        name: teamName,
        members: teammates.map(t => t.id || t.user_id || '')
      });

      // Reset form
      setTeamName("");
      setTeammates([]);
      setSearch('');
      setSelectedPlayer(null);
      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Error in handleCreateTeam:', error);
      Alert.alert("Error", "Failed to create team. Please try again.");
      setLoading(false);
    }
  };

  // Check team name uniqueness per vine
  const checkTeamNameUnique = async () => {
    if (!vineId) return true;
    setCheckingName(true);
    const { data, error } = await supabase
      .from('teams')
      .select('team_id')
      .eq('vine_id', vineId)
      .eq('name', teamName);
    setCheckingName(false);
    return !error && (!data || data.length === 0);
  };

  // Add UI for selecting eligible players
  const renderPlayerPickerSection = () => {
    if (teammates.length >= MAX_TEAM_SIZE - 1) {
      return <Text style={styles.infoText}>Maximum team size reached</Text>;
    }

    return (
      <View style={styles.pickerSection}>
        <Text style={styles.sectionTitle}>Add Players:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedPlayer || ''}
            onValueChange={(itemValue) => {
              if (itemValue) setSelectedPlayer(itemValue.toString());
            }}
            style={styles.picker}
          >
            <Picker.Item label="Select a player..." value="" />
            {eligiblePlayers.map(player => (
              <Picker.Item
                key={player.user_id}
                label={player.name || player.user_id}
                value={player.user_id}
              />
            ))}
          </Picker>
          <TouchableOpacity
            style={[
              styles.addButton,
              (!selectedPlayer) ? styles.addButtonDisabled : null
            ]}
            disabled={!selectedPlayer}
            onPress={() => {
              if (selectedPlayer) handleAddTeammateFromDropdown(selectedPlayer);
            }}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (userRole !== 'player' && userRole !== 'coordinator') return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create New Team</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Team Name"
            value={teamName}
            onChangeText={setTeamName}
          />

          {renderPlayerPickerSection()}

          <View style={styles.teammateSection}>
            <Text style={styles.sectionTitle}>Team Members:</Text>
            {teammates.length > 0 ? (
              <View style={styles.teammateList}>
                {teammates.map((teammate) => (
                  <View key={teammate.user_id || teammate.id || ''} style={styles.teammateItem}>
                    <Text>{teammate.name || teammate.user_id || ''}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        console.log('Removing teammate:', teammate.user_id || teammate.id || '');
                        handleRemoveTeammate(teammate.user_id || teammate.id || '');
                      }}
                    >
                      <MaterialIcons name="close" size={24} color="red" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.infoText}>No team members added yet</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              console.log('Create team button pressed');
              handleCreateTeam();
            }}
          >
            <Text style={styles.createButtonText}>Create Team</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              console.log('Cancel button pressed');
              onClose();
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    alignItems: 'stretch',
  },
  modalTitle: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pickerSection: {
    marginVertical: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  picker: {
    flex: 1,
    height: 50,
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 6,
    marginLeft: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  teammateSection: {
    marginTop: 16,
  },
  teammateList: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    padding: 8,
  },
  teammateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoText: {
    fontStyle: 'italic',
    color: '#666',
    marginVertical: 8,
  },
  createButton: {
    padding: 12,
    backgroundColor: '#007bff',
    borderRadius: 6,
    marginTop: 20,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  cancelButton: {
    padding: 12,
    backgroundColor: '#888',
    borderRadius: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default TeamCreationModal;