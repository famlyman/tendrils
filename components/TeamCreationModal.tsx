import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '../supabase';
import { Picker } from '@react-native-picker/picker';

interface TeamCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateTeam: (team: { name: string; members: string[] }) => void;
  userRole: string;
  userId: string;
  ladderId?: string;
}

const MAX_TEAM_SIZE = 4;

const TeamCreationModal: React.FC<TeamCreationModalProps> = ({
  visible,
  onClose,
  onCreateTeam,
  userRole,
  userId,
  ladderId,
}) => {
  const [teamName, setTeamName] = useState('');
  const [teammates, setTeammates] = useState<{ id?: string; email: string; name?: string; invited?: boolean }[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [eligiblePlayers, setEligiblePlayers] = useState<any[]>([]);

  // Fetch all registered users and filter eligible players
  useEffect(() => {
    if (!ladderId) return;
    let active = true;
    (async () => {
      // Fetch all users
      const { data: users, error: userErr } = await supabase
        .from('profiles')
        .select('id, name, email');
      if (userErr || !users) return;
      // Fetch all users already on a team in this ladder
      const { data: teamUsers, error: teamErr } = await supabase
        .from('user_teams')
        .select('user_id')
        .eq('ladder_id', ladderId);
      if (teamErr) return;
      const teamUserIds = (teamUsers || []).map(u => u.user_id);
      // Filter out current user, already-added teammates, and users already on a team in this ladder
      const eligible = users.filter(
        (u: any) =>
          u.id !== userId &&
          !teammates.some(t => t.id === u.id) &&
          !teamUserIds.includes(u.id)
      );
      if (active) {
        setAllPlayers(users);
        setEligiblePlayers(eligible);
      }
    })();
    return () => { active = false; };
  }, [teammates, ladderId, userId]);

  // Invite by email (if not registered)
  const handleInviteByEmail = () => {
    if (!search || teammates.length >= MAX_TEAM_SIZE - 1) return;
    if (teammates.some(t => t.email === search)) {
      Alert.alert('Already added', 'This email is already in your team list.');
      return;
    }
    setTeammates([...teammates, { email: search, invited: true }]);
    setSearch('');
    setSearchResults([]);
  };

  // Add teammate from dropdown
  const handleAddTeammateFromDropdown = (playerId: string) => {
    const player = eligiblePlayers.find(u => u.id === playerId);
    if (player) {
      setTeammates([...teammates, { id: player.id, email: player.email, name: player.name }]);
      setSelectedPlayer(null);
    }
  };

  // Remove teammate
  const handleRemoveTeammate = (email: string) => {
    setTeammates(teammates.filter(t => t.email !== email));
  };

  // Check team name uniqueness per ladder
  const checkTeamNameUnique = async () => {
    if (!ladderId) return true;
    setCheckingName(true);
    const { data, error } = await supabase
      .from('teams')
      .select('team_id, captain_id')
      .eq('ladder_id', ladderId)
      .eq('name', teamName);
    setCheckingName(false);
    // Allow same captain to use same name in different ladders
    return !error && (!data || data.length === 0 || (data.length === 1 && data[0].captain_id === userId));
  };

  // Check if any teammate is already on a team in this ladder
  const checkTeammateAvailability = async () => {
    if (!ladderId || teammates.length === 0) return true;
    const ids = teammates.filter(t => t.id).map(t => t.id);
    if (ids.length === 0) return true;
    const { data, error } = await supabase
      .from('user_teams')
      .select('user_id')
      .in('user_id', ids)
      .eq('ladder_id', ladderId);
    return !error && (!data || data.length === 0);
  };

  // Create team handler
  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Error', 'Team name is required.');
      return;
    }
    if (teammates.length < 1) {
      Alert.alert('Error', 'Please add at least one teammate.');
      return;
    }
    if (teammates.length > MAX_TEAM_SIZE - 1) {
      Alert.alert('Error', `Teams can have up to ${MAX_TEAM_SIZE} players including you.`);
      return;
    }
    setLoading(true);
    // Uniqueness check
    const isUnique = await checkTeamNameUnique();
    if (!isUnique) {
      setLoading(false);
      Alert.alert('Error', 'A team with this name already exists in this ladder.');
      return;
    }
    // Availability check
    const available = await checkTeammateAvailability();
    if (!available) {
      setLoading(false);
      Alert.alert('Error', 'One or more teammates are already on a team in this ladder.');
      return;
    }
    // Insert team
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .insert({ name: teamName, ladder_id: ladderId, captain_id: userId })
      .select()
      .single();
    if (teamErr || !team) {
      setLoading(false);
      Alert.alert('Error', 'Failed to create team.');
      return;
    }
    // Insert members
    const members = [
      userId,
      ...teammates.filter(t => t.id).map(t => t.id!),
    ];
    await supabase.from('user_teams').insert(
      members.map(uid => ({ user_id: uid, team_id: team.team_id, ladder_id: ladderId }))
    );
    // Handle invites
    const invites = teammates.filter(t => t.invited && !t.id);
    if (invites.length > 0) {
      await supabase.from('team_invites').insert(
        invites.map(i => ({ team_id: team.team_id, email: i.email, ladder_id: ladderId, status: 'pending' }))
      );
      // Optionally: trigger email invite here (future)
    }
    setLoading(false);
    Alert.alert('Success', 'Team created! Pending invites will be sent to unregistered players.');
    setTeamName('');
    setTeammates([]);
    onCreateTeam({ name: teamName, members });
    onClose();
  };

  if (userRole !== 'player') return null;

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
            autoCapitalize="words"
          />
          {/* Always-visible dropdown for player selection */}
          <Text style={styles.label}>Add a Registered Player</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedPlayer}
              onValueChange={(itemValue) => {
                if (itemValue) {
                  handleAddTeammateFromDropdown(itemValue);
                }
              }}
              style={styles.picker}
              enabled={eligiblePlayers.length > 0}
            >
              <Picker.Item label={eligiblePlayers.length > 0 ? "Select a player..." : "No eligible players available"} value={null} color="#888" />
              {eligiblePlayers.map(player => (
                <Picker.Item key={player.id} label={`${player.name} (${player.email})`} value={player.id} />
              ))}
            </Picker>
          </View>
          {/* Debug: show eligible player count */}
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Eligible players: {eligiblePlayers.length}</Text>
          {eligiblePlayers.length === 0 && (
            <Text style={{ color: 'red', marginBottom: 8 }}>No eligible players available to add.</Text>
          )}
          {/* Invite by email if not found in eligible players */}
          <TextInput
            style={styles.input}
            value={search}
            onChangeText={setSearch}
            placeholder="Enter email to invite"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {search.length > 0 &&
            !allPlayers.some(u => u.email === search) &&
            !teammates.some(t => t.email === search) && (
              <TouchableOpacity style={styles.inviteBtn} onPress={handleInviteByEmail}>
                <Text>Invite "{search}" by email</Text>
              </TouchableOpacity>
          )}
          <View style={styles.teammateList}>
            <Text style={styles.label}>Current Teammates:</Text>
            <FlatList
              data={teammates}
              keyExtractor={item => item.email}
              renderItem={({ item }) => (
                <View style={styles.teammateItem}>
                  <Text>{item.name || item.email}{item.invited ? ' (invited)' : ''}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTeammate(item.email)}>
                    <Text style={{ color: 'red', marginLeft: 8 }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
              style={{ maxHeight: 80 }}
            />
          </View>
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={onClose} color="#888" disabled={loading} />
            <Button title={loading ? 'Creating...' : 'Create Team'} onPress={handleCreateTeam} disabled={loading} />
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
  label: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  searchList: {
    maxHeight: 80,
    marginBottom: 8,
  },
  searchItem: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    marginBottom: 4,
  },
  inviteBtn: {
    padding: 8,
    backgroundColor: '#e0f7fa',
    borderRadius: 6,
    marginBottom: 4,
    alignItems: 'center',
  },
  teammateList: {
    marginTop: 10,
  },
  teammateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    width: '100%',
  },
});

export default TeamCreationModal;
