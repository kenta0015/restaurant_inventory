import React, { useState } from 'react'; 
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Recipe, RecipeIngredient } from '../types/types';
import { supabase } from '../supabaseClient';

interface Props {
  visible: boolean;
  onClose: () => void;
  recipe: Recipe;
  ingredients: RecipeIngredient[];
  onSave: () => void;
  onDelete: () => void;
}

const RecipeDetailModal: React.FC<Props> = ({ visible, onClose, recipe, ingredients, onSave, onDelete }) => {
  const [name, setName] = useState(recipe.name);
  const [description, setDescription] = useState(recipe.description || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('recipes')
      .update({ name, description })
      .eq('id', recipe.id);

    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      onSave();
      onClose();
    }
  };

  const handleDelete = async () => {
    console.log('🧪 handleDelete START');
    if (!recipe?.id) {
      console.log('❌ No recipe.id provided');
      Alert.alert('Error', 'Recipe ID is missing.');
      return;
    }

    const deleteRecipe = async () => {
      console.log('🆔 Deleting recipe with ID:', recipe.id);

      const { error: ingError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipe.id);
      console.log('🔍 recipe_ingredients delete error:', ingError);

      const { error: recipeError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipe.id);
      console.log('🔍 recipes delete error:', recipeError);

      if (recipeError) {
        Alert.alert('Error', 'Failed to delete recipe.');
        return;
      }

      console.log('✅ Recipe deleted successfully!');
      onDelete?.();
      onClose?.();
    };

    if (Platform.OS === 'web') {
      deleteRecipe();
    } else {
      Alert.alert('Confirm Delete', 'Are you sure you want to delete this recipe?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteRecipe },
      ]);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Edit Recipe</Text>

        <Text style={styles.label}>Recipe Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Text style={styles.label}>Ingredients</Text>
        <View style={styles.ingredientList}>
          {ingredients.map((ing) => (
            <Text key={ing.id} style={styles.ingredientText}>
              {ing.name} - {ing.quantity} {ing.unit}
            </Text>
          ))}
        </View>

        <Text style={styles.label}>How to Cook</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Step-by-step cooking instructions..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={6}
          style={styles.textArea}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            console.log('🧪 Delete button tapped');
            handleDelete();
          }}
        >
          <Text style={styles.deleteButtonText}>Delete Recipe</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f8f8f8',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 24,
    color: '#222',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 30,
  },
  ingredientList: {
    marginBottom: 24,
  },
  ingredientText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 2,
  },
  saveButton: {
    backgroundColor: '#222',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#e33',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: '#aaa',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 30,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 15,
  },
});

export default RecipeDetailModal;
