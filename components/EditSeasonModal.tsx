import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Switch,
  Platform,
} from "react-native";
import { supabase } from "../supabase";
import DateTimePicker from "@react-native-community/datetimepicker";

interface EditSeasonModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdated: () => void;
  season: {
    season_id: string;
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    ladder_id?: string;
    is_active?: boolean;
  };
  ladders: { ladder_id: string; name: string }[];
}

export default function EditSeasonModal({ visible, onClose, onUpdated, season, ladders }: EditSeasonModalProps) {
  const [name, setName] = useState(season.name);
  const [description, setDescription] = useState(season.description || "");
  const [startDate, setStartDate] = useState<Date | null>(
    season.start_date ? new Date(season.start_date) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    season.end_date ? new Date(season.end_date) : null
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [ladderId, setLadderId] = useState(season.ladder_id || (ladders[0]?.ladder_id ?? ""));
  const [isActive, setIsActive] = useState(!!season.is_active);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Sync modal fields with season prop when it changes
  React.useEffect(() => {
    setName(season.name);
    setDescription(season.description || "");
    setStartDate(season.start_date ? new Date(season.start_date) : null);
    setEndDate(season.end_date ? new Date(season.end_date) : null);
    setLadderId(season.ladder_id || (ladders[0]?.ladder_id ?? ""));
    setIsActive(!!season.is_active);
    setDeleteConfirm(false);
  }, [
    season.season_id,
    season.name,
    season.description,
    season.start_date,
    season.end_date,
    season.ladder_id,
    season.is_active,
    visible,
    ladders,
  ]);

  // Format date to MM/DD/YYYY for display
  const formatDateDisplay = (date: Date | null): string => {
    if (!date) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Format date to YYYY-MM-DD for database storage
  const formatDateForStorage = (date: Date | null): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  // Handle date selection for start date
  const onChangeStartDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartPicker(Platform.OS === "ios"); // Keep picker open on iOS until dismissed
    setStartDate(currentDate);
  };

  // Handle date selection for end date
  const onChangeEndDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndPicker(Platform.OS === "ios"); // Keep picker open on iOS until dismissed
    setEndDate(currentDate);
  };

  const handleUpdate = async () => {
    if (!name || !startDate || !endDate || !ladderId) {
      Alert.alert("Error", "All fields are required.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("seasons").update({
      name,
      description,
      start_date: formatDateForStorage(startDate),
      end_date: formatDateForStorage(endDate),
      ladder_id: ladderId,
      is_active: isActive,
    }).eq("season_id", season.season_id);
    setLoading(false);
    if (error) {
      Alert.alert("Error", "Could not update season.");
    } else {
      onUpdated();
      onClose();
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const { error } = await supabase.from("seasons").delete().eq("season_id", season.season_id);
    setLoading(false);
    if (error) {
      Alert.alert("Error", "Could not delete season.");
    } else {
      onUpdated();
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Edit Season</Text>
          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
          />

          {/* Start Date Picker */}
          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            style={styles.input}
          >
            <Text>
              {startDate ? `Start Date: ${formatDateDisplay(startDate)}` : "Select Start Date"}
            </Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={onChangeStartDate}
            />
          )}

          {/* End Date Picker */}
          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            style={styles.input}
          >
            <Text>
              {endDate ? `End Date: ${formatDateDisplay(endDate)}` : "Select End Date"}
            </Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={onChangeEndDate}
            />
          )}

          <Text style={styles.label}>Ladder</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
            {ladders.map((l) => (
              <TouchableOpacity
                key={l.ladder_id}
                style={[
                  styles.ladderButton,
                  ladderId === l.ladder_id && styles.ladderButtonSelected,
                ]}
                onPress={() => setLadderId(l.ladder_id)}
              >
                <Text>{l.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <Text style={styles.label}>Active:</Text>
            <Switch value={isActive} onValueChange={setIsActive} />
          </View>
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={onClose} color="#888" />
            <Button
              title={loading ? "Saving..." : "Save"}
              onPress={handleUpdate}
              disabled={loading || deleteConfirm}
            />
            <Button
              title={deleteConfirm ? "Confirm Delete" : "Delete"}
              color="red"
              onPress={() => (deleteConfirm ? handleDelete() : setDeleteConfirm(true))}
              disabled={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modal: { backgroundColor: "#fff", padding: 24, borderRadius: 12, width: "90%" },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    justifyContent: "center",
  },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  label: { marginTop: 8, fontWeight: "bold" },
  ladderButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  ladderButtonSelected: { backgroundColor: "#cceeff" },
});