import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { MealLog } from '../types/types';

interface Props {
  log: MealLog;
  onDelete: () => void;
  onQuantityUpdate?: (newQuantity: number) => void;
  onEditComment: () => void;
}

export default function MealLogEntry({
  log,
  onDelete,
  onQuantityUpdate,
  onEditComment,
}: Props) {
  const [editingQuantity, setEditingQuantity] = useState(false);
  const [editedQuantity, setEditedQuantity] = useState(log.quantity.toString());

  // 🔁 Sync quantity state with updated log prop
  useEffect(() => {
    setEditedQuantity(log.quantity.toString());
  }, [log.quantity]);

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      onDelete(); // Fallback: skip Alert on Web
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete "${log.recipe.name}" log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleQuantitySubmit = () => {
    const parsed = parseInt(editedQuantity);
    if (!isNaN(parsed) && onQuantityUpdate) {
      onQuantityUpdate(parsed);
      setEditingQuantity(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{log.recipe.name}</Text>
      <View style={styles.row}>
        <Text>Quantity: </Text>
        {editingQuantity ? (
          <TextInput
            style={styles.input}
            value={editedQuantity}
            keyboardType="numeric"
            onChangeText={setEditedQuantity}
            onSubmitEditing={handleQuantitySubmit}
            onBlur={() => setEditingQuantity(false)}
          />
        ) : (
          <TouchableOpacity onPress={() => setEditingQuantity(true)}>
            <Text style={styles.quantity}>{log.quantity}</Text>
          </TouchableOpacity>
        )}
      </View>
      {log.notes ? <Text style={styles.note}>Note: {log.notes}</Text> : null}
      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={onEditComment}>
          <Text style={styles.link}>💬 Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete}>
          <Text style={styles.delete}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 4,
    width: 50,
    textAlign: 'center',
  },
  note: {
    fontStyle: 'italic',
    color: '#555',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  link: {
    color: '#007AFF',
  },
  delete: {
    color: 'red',
  },
});
