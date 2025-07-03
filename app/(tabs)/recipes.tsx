// app/(tabs)/recipes.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Recipe } from '../../types/types';
import { supabase } from '../../supabaseClient';
import RecipeFormModal from '../../components/RecipeFormModal';
import CSVRecipeUploadModal from '../../components/CSVRecipeUploadModal';
import RecipeDetailModal from '../../components/RecipeDetailModal';

export default function RecipeScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [csvModalVisible, setCsvModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<any[]>([]);

  const fetchRecipes = async () => {
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .select('*');

    if (recipeError) {
      console.error('Error fetching recipes:', recipeError);
      return;
    }

    const { data: linkData, error: linkError } = await supabase
      .from('recipe_ingredients')
      .select('*');

    if (linkError) {
      console.error('Error fetching recipe_ingredients:', linkError);
      return;
    }

    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory')
      .select('*');

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError);
      return;
    }

    const enriched = recipeData.map(recipe => {
      const linked = linkData.filter(link => link.recipe_id === recipe.id);
      const ingredients = linked.map(link => {
        const item = inventoryData.find(i => i.id === link.ingredient_id);
        return item ? {
          id: item.id,
          name: item.name,
          unit: item.unit,
          quantity: link.quantity_per_batch
        } : null;
      }).filter(Boolean);
      return { ...recipe, ingredients };
    });

    setRecipes(enriched);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const openFormModal = () => {
    setEditingRecipe(null);
    setFormModalVisible(true);
  };

  const openDetailModal = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setSelectedIngredients(recipe.ingredients || []);
    setDetailModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recipe List</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => setCsvModalVisible(true)}
            style={styles.uploadButton}
          >
            <Text style={styles.uploadButtonText}>📄</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openFormModal}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openDetailModal(item)}>
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.category}>Category: {item.category || '—'}</Text>
              <Text style={styles.ingredientsTitle}>Ingredients:</Text>
              {item.ingredients?.length ? item.ingredients.map((ing, index) => (
                <Text key={index} style={styles.ingredient}>
                  • {ing.name} ({ing.quantity} {ing.unit})
                </Text>
              )) : <Text>No ingredients</Text>}
            </View>
          </TouchableOpacity>
        )}
      />

      <RecipeFormModal
        visible={formModalVisible}
        onClose={() => setFormModalVisible(false)}
        onRecipeAdded={fetchRecipes}
        initialRecipe={null}
      />

      <CSVRecipeUploadModal
        visible={csvModalVisible}
        onClose={() => {
          setCsvModalVisible(false);
          fetchRecipes();
        }}
      />

      {detailModalVisible && editingRecipe && (
        <RecipeDetailModal
          visible={detailModalVisible}
          onClose={() => {
            setDetailModalVisible(false);
            setEditingRecipe(null); // ← これが重要
          }}
          recipe={editingRecipe}
          ingredients={selectedIngredients}
          onSave={fetchRecipes}
          onDelete={fetchRecipes}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  headerButtons: { flexDirection: 'row', gap: 8 },
  title: { fontSize: 24, fontWeight: 'bold' },
  addButton: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  uploadButton: {
    backgroundColor: '#34C759',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: { color: '#fff', fontSize: 18 },
  addButtonText: { color: '#fff', fontSize: 24, lineHeight: 24 },
  card: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  name: { fontSize: 18, fontWeight: 'bold' },
  category: { color: '#888' },
  ingredientsTitle: { marginTop: 8, fontWeight: 'bold' },
  ingredient: { marginLeft: 8 },
});
