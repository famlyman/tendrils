import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '../supabase';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';

interface TeamEditModalProps {
  visible: boolean;
  onClose: () => void;
  teamId: string;
  initialName: string;
  initialMembers: { user_id: string; name: string }[];
  onUpdated: () => void;
}

const MAX_TEAM_SIZE = 4;

const TeamEditModal: React.FC<TeamEditModalProps> = ({ visible, onClose, teamId, initialName, initialMembers, onUpdated }) => {
  const [teamName, setTeamName] = useState(initialName);
  const [teammates, setTeammates] = useState<{ user_id: string; name: string }[]>(initialMembers);
  const [allPlayers, setAllPlayers] = useState<{ user_id: string; name: string }[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingName, setCheckingName] = useState(false);

  useEffect(() => {
    setTeamName(initialName);
    setTeammates(initialMembers);
    setSelectedPlayer(null);
    // Fetch all eligible players (not already on the team)
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name');
      if (!error && data) {
        setAllPlayers(data);
      }
    })();
  }, [visible, initialName, initialMembers]);

  const handleAddTeammate = async () => {
    if (!selectedPlayer) return;
    if (teammates.length >= MAX_TEAM_SIZE) return;
    const user = allPlayers.find(u => u.user_id === selectedPlayer);
    if (!user) return;
    setTeammates([...teammates, user]);
    setSelectedPlayer(null);
    Alert.alert('Player Added', `${user.name} has been added to the team.`);
    // --- Ensure vine_id is set for this user ---
    // 1. Get team's vine_id
    const { data: teamData, error: teamErr } = await supabase.from('teams').select('vine_id').eq('team_id', teamId).single();
    const teamVineId = teamData?.vine_id;
    console.log('DEBUG: teamId', teamId, 'teamVineId', teamVineId, 'teamErr', teamErr);
    if (!teamVineId) {
      Alert.alert('Debug', `Team vine_id is null for teamId: ${teamId}`);
      return;
    }
    // Streamlined logic:
    // 1. Insert into team_members for this user/team
    const { error: insertMemberErr, data: insertMemberData } = await supabase
      .from('team_members')
      .insert({ team_id: teamId, user_id: user.user_id });
    console.log('DEBUG: insert team_member', { insertMemberErr, insertMemberData });
    if (insertMemberErr) {
      Alert.alert('Debug', `Failed to add member to team: ${insertMemberErr.message}`);
    }

    // 2. Update vine_id in profiles for this user (profile must exist for all users)
    const { error: updateErr, data: updateData } = await supabase
      .from('profiles')
      .update({ vine_id: teamVineId, name: user.name })
      .eq('user_id', user.user_id)
      .select();
    console.log('DEBUG: update profiles', { updateErr, updateData });
    if (updateErr) {
      Alert.alert('Debug', `Failed to update profile: ${updateErr.message}`);
    }

    // 3. (Optional) If you ever need to handle orphaned users with no profile, add a check/insert here.
  };


  const handleRemoveTeammate = (user_id: string) => {
    setTeammates(teammates.filter(t => t.user_id !== user_id));
  };

  // Save changes (update team name, update members)
  const handleSave = async () => {
    if (!teamName.trim()) {
      Alert.alert('Error', 'Team name cannot be empty');
      return;
    }
    if (teammates.length === 0) {
      Alert.alert('Error', 'A team must have at least one member');
      return;
    }
    setLoading(true);
    try {
      // Update team name
      const { error: teamError } = await supabase
        .from('teams')
        .update({ name: teamName })
        .eq('team_id', teamId);
      if (teamError) throw teamError;

      // Fetch current members
      const { data: currentMembers } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);
      const currentIds = (currentMembers || []).map((m: any) => m.user_id);
      const newIds = teammates.map(t => t.user_id);

      // Add new members
      const toAdd = newIds.filter(id => !currentIds.includes(id));
      if (toAdd.length > 0) {
        const rows = toAdd.map(user_id => ({ team_id: teamId, user_id }));
        const { error: addError } = await supabase.from('team_members').insert(rows);
        if (addError) throw addError;
      }
      // Remove old members
      const toRemove = currentIds.filter(id => !newIds.includes(id));
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase.from('team_members')
          .delete()
          .eq('team_id', teamId)
          .in('user_id', toRemove);
        if (removeError) throw removeError;
      }
      Alert.alert('Success', 'Team updated!');
      onUpdated();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Edit Team</Text>
          <TextInput
            style={styles.input}
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Team Name"
            editable={!loading}
          />
          <Text style={styles.label}>Members:</Text>
          {teammates.map((t) => (
            <View key={t.user_id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ flex: 1 }}>{t.name}</Text>
              <TouchableOpacity disabled={loading} onPress={() => handleRemoveTeammate(t.user_id)}>
                <MaterialIcons name="remove-circle" size={22} color="#d32f2f" />
              </TouchableOpacity>
            </View>
          ))}
          <Text style={styles.label}>Add Member:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Picker
              selectedValue={selectedPlayer || ''}
              onValueChange={value => setSelectedPlayer(value)}
              style={{ flex: 1 }}
              enabled={!loading}
            >
              <Picker.Item label="Select player..." value="" />
              {allPlayers.filter(u => !teammates.some(t => t.user_id === u.user_id)).map(player => (
                <Picker.Item key={player.user_id} label={player.name} value={player.user_id} />
              ))}
            </Picker>
            <TouchableOpacity
              style={{ marginLeft: 10, backgroundColor: '#FFD54F', borderRadius: 6, padding: 6, opacity: selectedPlayer ? 1 : 0.5 }}
              onPress={handleAddTeammate}
              disabled={!selectedPlayer || loading}
            >
              <Text style={{ color: '#1A3C34', fontWeight: 'bold' }}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={onClose} color="#888" disabled={loading} />
            <Button title={loading ? "Saving..." : "Save"} onPress={handleSave} disabled={loading} />
          </View>
          <View style={{ marginTop: 10 }}>
            <Button
              title="Fix Team vine_id"
              color="#1A3C34"
              onPress={async () => {
                setLoading(true);
                try {
                  // Get team's vine_id
                  const { data: teamData, error: teamErr } = await supabase.from('teams').select('vine_id').eq('team_id', teamId).single();
                  const vineId = teamData?.vine_id;
                  if (!vineId) throw new Error('Team vine_id not found');
                  // Get all members
                  const { data: members, error: membersErr } = await supabase.from('team_members').select('user_id').eq('team_id', teamId);
                  if (membersErr) throw membersErr;
                  let debugMsg = `Team vine_id: ${vineId}\nMembers: ${JSON.stringify(members)}`;
                  let updateResults: string[] = [];
                  for (const member of members) {
                    const { data: updateData, error: updateErr } = await supabase.from('profiles').update({ vine_id: vineId }).eq('user_id', member.user_id).select();
                    updateResults.push(`user_id: ${member.user_id}, error: ${updateErr ? updateErr.message : 'none'}, data: ${JSON.stringify(updateData)}`);
                  }
                  debugMsg += '\nUpdate results:\n' + updateResults.join('\n');
                  Alert.alert('vine_id update results', debugMsg);
                } catch (e: any) {
                  Alert.alert('Error', e.message || 'Failed to fix vine_id');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#fff', padding: 24, borderRadius: 12, width: '90%' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 10 },
  label: { marginTop: 8, fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});

export default TeamEditModal;
