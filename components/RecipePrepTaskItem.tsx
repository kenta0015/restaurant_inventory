import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock } from 'lucide-react-native';
import { PrepTask } from '../types/types';
import { formatTime } from '../utils/prepSheetUtils';
import RecipePrepDetailModal from './RecipePrepDetailModal';

interface PrepTaskItemProps {
  task: PrepTask;
  onComplete: (taskId: string, isCompleted: boolean, completedQuantity: number) => void;
  onQuantityChange: (taskId: string, newQuantity: number) => void;
}

export default function RecipePrepTaskItem({ task, onComplete, onQuantityChange }: PrepTaskItemProps) {
  const [showModal, setShowModal] = useState(false);

  const handleCardPress = () => {
    setShowModal(true);
  };

  const currentStock = task.currentMealStock ?? 0;
  const plannedPrep = task.plannedPrepOverride ?? Math.max(task.quantity - currentStock, 0);
 // ← 常に suggestion - stock で表示

  return (
    <>
      <TouchableOpacity onPress={handleCardPress} activeOpacity={0.9}>
        <View style={styles.card}>
          <Text style={styles.recipeName}>{task.recipeName}</Text>

          <View style={styles.row}>
            <Clock size={14} color="#333" />
            <Text style={styles.timeText}>
              Estimated Time: {formatTime(task.estimatedTime)}
            </Text>
          </View>

          <View style={styles.prepRow}>
            <Text style={styles.prepLabel}>Planned Prep (based on suggestion): </Text>
            <Text style={styles.prepValue}>{plannedPrep} batch(es)</Text>
          </View>

          <View style={styles.prepRow}>
            <Text style={styles.prepLabel}>Current Stock: </Text>
            <Text style={styles.stockValue}>
              {currentStock} batch(es)
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => onComplete(task.id, true, plannedPrep)}
            >
              <Text style={styles.doneText}>✅ Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.notDoneButton}
              onPress={() => onComplete(task.id, false, plannedPrep)}
            >
              <Text style={styles.notDoneText}>❌ Not Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <RecipePrepDetailModal
        visible={showModal}
        recipe={task.recipe}
        initialBatchQuantity={plannedPrep}
        shortages={task.shortages}
        necessaryPrepInfo={task.necessaryPrepInfo}
        showShortage={true}
        onCloseShortage={() => {}}
        onQuantityChange={() => {}} // モーダル内部では使わない
        onConfirm={(qty) => {
          onQuantityChange(task.id, qty); // ✅ plannedPrepOverride として保存される
          setShowModal(false);
        }}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B0000',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#555',
  },
  prepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  prepLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  prepValue: {
    fontSize: 18,
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  stockValue: {
    fontSize: 16,
    color: '#444',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  doneButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  notDoneButton: {
    backgroundColor: '#B0BEC5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  doneText: {
    color: '#fff',
    fontWeight: '600',
  },
  notDoneText: {
    color: '#fff',
    fontWeight: '600',
  },
});
