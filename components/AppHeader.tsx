// components/AppHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function AppHeader({ title = '' }) {
  const navigation = useNavigation<any>();
  return (

    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
        <MaterialIcons name="menu" size={28} color={COLORS.text.dark} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 28 }} /> {/* Placeholder for alignment */}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
    zIndex: 10,
  },
  menuButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.dark,
  },
});
