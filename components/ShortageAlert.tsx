import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TriangleAlert as AlertTriangle, X } from 'lucide-react-native';
import { IngredientShortage } from '../types/types';

interface ShortageAlertProps {
  shortages: IngredientShortage[];
  onClose: () => void;
}

export default function ShortageAlert({ shortages, onClose }: ShortageAlertProps) {
  if (shortages.length === 0) return null;

  return (
    <View style={styles.alertBox}>
      <View style={styles.alertHeader}>
        <View style={styles.iconAndTitle}>
          <AlertTriangle color="#FFF" size={18} />
          <Text style={styles.alertTitle}>Ingredient Shortage Alert</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <X color="#FFF" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.messageText}>
          The following ingredients are low or unavailable for the suggested prep:
        </Text>

        {shortages.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.rowInner}>
              <Text style={styles.needText}>Need: <Text style={styles.boldText}>{item.required} {item.unit}</Text></Text>
              <Text style={styles.haveText}>Have: <Text style={styles.boldText}>{item.available} {item.unit}</Text></Text>
            </View>
          </View>
        ))}

        <Text style={styles.footnote}>
          Consider adjusting your prep quantity or restocking these items.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  alertBox: {
    borderColor: '#FFA500',
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  alertHeader: {
    backgroundColor: '#FFA500',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertTitle: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  body: {
    backgroundColor: '#FFFAF2',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  itemRow: {
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  rowInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  needText: {
    fontSize: 14,
    color: '#555',
  },
  haveText: {
    fontSize: 14,
    color: '#555',
  },
  boldText: {
    fontWeight: '600',
    color: '#222',
  },
  footnote: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 10,
  },
});
