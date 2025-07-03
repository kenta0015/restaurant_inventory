// 省略なしのフルコード

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { supabase } from '../supabaseClient';

interface AddIngredientModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function AddIngredientModal({ visible, onClose, onSave }: AddIngredientModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [unit, setUnit] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (visible) fetchCategories();
  }, [visible]);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('inventory').select('category');
    if (error) return console.error('Error fetching categories:', error.message);
    const unique = Array.from(new Set((data ?? []).map((i) => i.category).filter(Boolean))) as string[];
    setCategoryOptions(unique);
  };

  const clearForm = () => {
    setName('');
    setQuantity('0');
    setUnit('');
    setSelectedCategory('');
    setNewCategory('');
    setIsAddingNewCategory(false);
  };

  const handleSave = async () => {
    const rawCategory = isAddingNewCategory ? newCategory : selectedCategory;
    const finalCategory = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();

    if (!name || !unit || !finalCategory) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const { error } = await supabase.from('inventory').insert({
      name,
      quantity: parseFloat(quantity),
      unit,
      category: finalCategory,
      alertLevel: 1,
      lastChecked: new Date().toISOString(),
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      onSave();
      onClose();
      clearForm();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Add New Ingredient</Text>

          <ScrollView style={styles.scroll}>
            <Text>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <Text>Category</Text>
            {!isAddingNewCategory ? (
              <>
                {categoryOptions.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={[
                      styles.categoryOption,
                      selectedCategory === cat && styles.selectedCategory,
                    ]}
                  >
                    <Text>{cat}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setIsAddingNewCategory(true)}
                  style={styles.addNewCategory}
                >
                  <Text style={{ color: 'blue' }}>＋ Add new category</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Enter new category"
                value={newCategory}
                onChangeText={setNewCategory}
              />
            )}

            <Text>Unit</Text>
            <TextInput style={styles.input} value={unit} onChangeText={setUnit} />

            <Text>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                clearForm();
                onClose();
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '90%',
    justifyContent: 'space-between',
  },
  scroll: {
    maxHeight: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  categoryOption: {
    padding: 8,
    marginVertical: 4,
    backgroundColor: '#eee',
    borderRadius: 4,
  },
  selectedCategory: {
    backgroundColor: '#cce5ff',
  },
  addNewCategory: {
    marginTop: 6,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    padding: 10,
    marginRight: 10,
  },
  cancelText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 10,
    backgroundColor: '#8a1e1e',
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
