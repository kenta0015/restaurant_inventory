import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Clock, Check, X } from 'lucide-react-native';
import { PrepTask } from '../types/types';
import { formatTime } from '../utils/prepSheetUtils';
import RecipePrepDetailModal from './RecipePrepDetailModal';

interface PrepTaskItemProps {
  task: PrepTask;
  onComplete: (taskId: string, isCompleted: boolean, completedQuantity: number) => void;
}

export default function RecipePrepTaskItem({ task, onComplete }: PrepTaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [batchQuantity, setBatchQuantity] = useState(task.quantity);
  const [isCompleted, setIsCompleted] = useState(task.isCompleted);
  const [completedQuantity, setCompletedQuantity] = useState(
    task.isCompleted ? task.completedQuantity : task.quantity
  );

  const handleToggleComplete = (value: boolean) => {
    setIsCompleted(value);
    if (value && !isEditing) {
      onComplete(task.id, value, batchQuantity);
    } else if (!value) {
      onComplete(task.id, false, 0);
    }
  };

  const handleSave = () => {
    onComplete(task.id, isCompleted, completedQuantity);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCompletedQuantity(task.isCompleted ? task.completedQuantity : task.quantity);
    setIsCompleted(task.isCompleted);
    setIsEditing(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setShowModal(true)}>
        <View style={[
          styles.container,
          task.isCompleted && styles.completedContainer
        ]}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.recipeName}>{task.recipeName}</Text>
              <Text style={styles.ingredientName}>{task.ingredientName}</Text>
            </View>

            <View style={styles.timeContainer}>
              <Clock color="#666" size={14} />
              <Text style={styles.timeText}>{formatTime(task.estimatedTime)}</Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Required:</Text>
              <Text style={styles.quantityValue}>
                {batchQuantity.toFixed(2)} {task.unit}
              </Text>
            </View>

            {isEditing ? (
              <View style={styles.editContainer}>
                <Text style={styles.editLabel}>Completed Amount:</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={completedQuantity.toString()}
                    onChangeText={(text) => {
                      const value = parseFloat(text);
                      if (!isNaN(value)) {
                        setCompletedQuantity(value);
                      } else if (text === '') {
                        setCompletedQuantity(0);
                      }
                    }}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                  <Text style={styles.unitText}>{task.unit}</Text>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={handleSave}
                  >
                    <Check color="#FFF" size={16} />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={handleCancel}
                  >
                    <X color="#FFF" size={16} />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.statusContainer}>
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>
                    {task.isCompleted ? 'Completed' : 'Mark as completed'}
                  </Text>
                  <Switch
                    value={isCompleted}
                    onValueChange={handleToggleComplete}
                    trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                    thumbColor={isCompleted ? '#4CAF50' : '#FFF'}
                  />
                </View>

                {task.isCompleted ? (
                  <View style={styles.completedInfo}>
                    <Text style={styles.completedLabel}>Added to inventory:</Text>
                    <Text style={styles.completedValue}>
                      {task.completedQuantity.toFixed(2)} {task.unit}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditing(true)}
                  >
                    <Text style={styles.editButtonText}>Edit Quantity</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <RecipePrepDetailModal
        visible={showModal}
        recipe={task.recipe}
        initialBatchQuantity={batchQuantity}
        shortages={task.shortages || []}
        onConfirm={(qty) => {
          setBatchQuantity(qty);
          setShowModal(false);
        }}
        onClose={() => setShowModal(false)}
        onQuantityChange={(qty) => {
          setBatchQuantity(qty); // 同期だけ（保存ではない）
        }}
        necessaryPrepInfo={task.necessaryPrepInfo}
        showShortage={true}
        onCloseShortage={() => {}}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  completedContainer: {
    borderLeftColor: '#4CAF50',
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  ingredientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B0000',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
  },
  editButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  editContainer: {
    marginTop: 8,
  },
  editLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    width: 100,
  },
  unitText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FF5252',
  },
  cancelButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedLabel: {
    fontSize: 14,
    color: '#4CAF50',
  },
  completedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
});
