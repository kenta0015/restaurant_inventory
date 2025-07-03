import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../supabaseClient';

export default function RecipeFormModal({ visible, onClose, onRecipeAdded, initialRecipe }: any) {
  const isEditMode = Boolean(initialRecipe?.id);

  const [recipeName, setRecipeName] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [ingredients, setIngredients] = useState([{ ingredientId: '', quantity: '', unit: 'kg' }]);
  const [inventoryOptions, setInventoryOptions] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const [{ data: inv }, { data: cats }] = await Promise.all([
        supabase.from('inventory').select('id, name, unit'),
        supabase.from('recipe_categories').select('*'),
      ]);
      if (inv) setInventoryOptions(inv);
      if (cats) setCategories(cats);

      if (isEditMode) {
        setRecipeName(initialRecipe.name || '');
        const matchedCategory = cats?.find((c) => c.name === initialRecipe.category);
        setSelectedCategoryId(matchedCategory?.id || '');

        const { data: ingLinks } = await supabase
          .from('recipe_ingredients')
          .select('ingredient_id, quantity_per_batch, unit')
          .eq('recipe_id', initialRecipe.id);

        if (ingLinks) {
          setIngredients(
            ingLinks.map((link: any) => ({
              ingredientId: link.ingredient_id,
              quantity: link.quantity_per_batch.toString(),
              unit: link.unit,
            }))
          );
        }
      }
    };
    if (visible) fetchInitialData();
  }, [visible]);

  const addIngredientRow = () => {
    setIngredients([...ingredients, { ingredientId: '', quantity: '', unit: 'kg' }]);
  };

  const updateIngredient = (index: number, key: string, value: string) => {
    const updated = [...ingredients];
    updated[index][key] = value;

    if (key === 'ingredientId') {
      const selected = inventoryOptions.find((opt) => opt.id === value);
      if (selected) {
        updated[index].unit = selected.unit || 'kg';
      }
    }

    setIngredients(updated);
  };

  const handleSave = async () => {
    if (!recipeName || !(selectedCategoryId || newCategory)) {
      Alert.alert('Error', 'Recipe name and category are required.');
      return;
    }

    let finalCategory = '';

    if (newCategory) {
      const { data: newCat, error: catError } = await supabase
        .from('recipe_categories')
        .insert([{ name: newCategory }])
        .select()
        .single();

      if (catError || !newCat) {
        Alert.alert('Error', 'Failed to create new category');
        return;
      }
      finalCategory = newCat.name;
    } else {
      const selectedCat = categories.find((cat) => cat.id === selectedCategoryId);
      if (!selectedCat) {
        Alert.alert('Error', 'Please select or create a category');
        return;
      }
      finalCategory = selectedCat.name;
    }

    let recipeId = initialRecipe?.id;

    if (isEditMode) {
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ name: recipeName, category: finalCategory })
        .eq('id', recipeId);
      if (updateError) {
        Alert.alert('Error', 'Failed to update recipe');
        return;
      }

      await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
    } else {
      const { data: newRecipe, error } = await supabase
        .from('recipes')
        .insert([{ name: recipeName, category: finalCategory }])
        .select()
        .single();

      if (error || !newRecipe) {
        Alert.alert('Error', 'Failed to save recipe.');
        return;
      }

      recipeId = newRecipe.id;
    }

    const ingredientLinks = ingredients
      .filter((ing) => ing.ingredientId && ing.quantity)
      .map((ing) => ({
        recipe_id: recipeId,
        ingredient_id: ing.ingredientId,
        quantity_per_batch: parseFloat(ing.quantity),
        unit: ing.unit,
      }));

    const { error: linkError } = await supabase
      .from('recipe_ingredients')
      .insert(ingredientLinks);

    if (linkError) {
      Alert.alert('Error', 'Failed to save ingredients.');
      return;
    }

    onRecipeAdded?.();
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setRecipeName('');
    setSelectedCategoryId('');
    setNewCategory('');
    setShowNewCategoryInput(false);
    setIngredients([{ ingredientId: '', quantity: '', unit: 'kg' }]);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{isEditMode ? 'Edit Recipe' : 'Add New Recipe'}</Text>

        <Text style={styles.label}>Recipe Name:</Text>
        <TextInput style={styles.input} value={recipeName} onChangeText={setRecipeName} />

        <Text style={styles.label}>Category:</Text>
        {!showNewCategoryInput ? (
          <>
            <View style={styles.pickerWrapper}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    selectedCategoryId === cat.id && styles.categorySelected,
                  ]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                >
                  <Text>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowNewCategoryInput(true)}>
              <Text style={styles.addMore}>+ Create New Category</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              placeholder="New Category Name"
              style={styles.input}
              value={newCategory}
              onChangeText={setNewCategory}
            />
            <TouchableOpacity onPress={() => setShowNewCategoryInput(false)}>
              <Text style={styles.addMore}>← Back to Category List</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.label}>Ingredients:</Text>
        {ingredients.map((ing, index) => (
          <View key={index} style={styles.ingredientRow}>
            <View style={{ flex: 2 }}>
              <Picker
                selectedValue={ing.ingredientId}
                onValueChange={(value) => updateIngredient(index, 'ingredientId', value)}
                style={{ height: 48 }}
              >
                <Picker.Item label="Select Ingredient" value="" />
                {inventoryOptions.map((inv) => (
                  <Picker.Item key={inv.id} label={inv.name} value={inv.id} />
                ))}
              </Picker>
            </View>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Quantity"
              keyboardType="numeric"
              value={ing.quantity}
              onChangeText={(text) => updateIngredient(index, 'quantity', text)}
            />
            <Text style={styles.unit}>{ing.unit}</Text>
          </View>
        ))}
        <TouchableOpacity onPress={addIngredientRow}>
          <Text style={styles.addMore}>+ Add Another Ingredient</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>
            {isEditMode ? 'Update Recipe' : 'Save Recipe'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  label: { marginTop: 12, marginBottom: 4, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 10,
  },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  unit: { marginLeft: 8 },
  addMore: { color: '#007AFF', marginBottom: 16 },
  saveButton: {
    backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10,
  },
  saveButtonText: { color: '#fff', fontSize: 16 },
  cancelButton: { alignItems: 'center' },
  cancelButtonText: { color: '#007AFF', fontSize: 16 },
  pickerWrapper: { marginBottom: 10 },
  categoryOption: {
    padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginBottom: 5,
  },
  categorySelected: { backgroundColor: '#def', borderColor: '#007AFF' },
});
