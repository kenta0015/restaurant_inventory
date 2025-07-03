import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { InventoryItem as InventoryItemType } from '../types/types';
import { supabase } from '../supabaseClient';
import { useIngredientCategories } from '../hooks/useIngredientCategories';

interface InventoryItemProps {
  item: InventoryItemType;
  onDelete: () => void;
}

export default function InventoryItem({ item, onDelete }: InventoryItemProps) {
  const safeQuantity = typeof item.quantity === 'number' ? item.quantity : 0;
  const safeName = item.name || 'Unnamed';
  const safeUnit = item.unit || '';
  const safeComment = item.comment || '';
  const [quantity, setQuantity] = useState(safeQuantity.toString());
  const [comment, setComment] = useState(safeComment);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState(item.category || '');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const { categories, addCategory } = useIngredientCategories();

  const isLowStock = safeQuantity < item.alertLevel;

  const handleSave = async () => {
    setLoading(true);
    const titleCase = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    const { error } = await supabase
      .from('inventory')
      .update({
        quantity: parseFloat(quantity),
        comment: comment,
        category: titleCase,
      })
      .eq('id', item.id);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Inventory item updated');
      addCategory(titleCase);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.itemName}>
          {safeName} {isLowStock && '⚠️'}
        </Text>
        <TouchableOpacity onPress={onDelete}>
          <Trash2 size={20} color="red" />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Text>Qty:</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />
        <Text>{safeUnit}</Text>
      </View>

      <View style={styles.row}>
        <Text>Comment:</Text>
        <TextInput
          style={styles.input}
          value={comment}
          onChangeText={setComment}
          placeholder="Add comment..."
        />
      </View>

      <View style={styles.rowColumn}>
        <Text style={styles.label}>Category:</Text>
        {!showNewCategoryInput ? (
          <View style={styles.categoryList}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryOption, category === cat && styles.categorySelected]}
                onPress={() => setCategory(cat)}
              >
                <Text>{cat}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowNewCategoryInput(true)}>
              <Text style={styles.addMore}>+ New</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.newCategoryBlock}>
            <TextInput
              placeholder="New Category"
              style={styles.input}
              value={category}
              onChangeText={(text) => setCategory(text)}
            />
            <TouchableOpacity onPress={() => setShowNewCategoryInput(false)}>
              <Text style={styles.addMore}>← Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        <Text style={styles.saveText}>{loading ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 6,
  },
  rowColumn: {
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 6,
    borderRadius: 4,
    flex: 1,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  categoryOption: {
    padding: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  categorySelected: {
    backgroundColor: '#def',
    borderColor: '#007AFF',
  },
  newCategoryBlock: {
    marginTop: 4,
  },
  label: {
    fontWeight: '600',
    marginBottom: 2,
  },
  addMore: {
    color: '#007AFF',
    marginLeft: 8,
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: '#8a1e1e',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
