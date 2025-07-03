import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CreditCard as Edit2, Trash2, Tag } from 'lucide-react-native';
import { Recipe } from "../types/types';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: () => void;
  onDelete: () => void;
}

export default function RecipeCard({ recipe, onEdit, onDelete }: RecipeCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.recipeName}>{recipe.name}</Text>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onEdit}
          >
            <Edit2 color="#4CAF50" size={18} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onDelete}
          >
            <Trash2 color="#FF5252" size={18} />
          </TouchableOpacity>
        </View>
      </View>
      
      {recipe.description && (
        <Text style={styles.description}>{recipe.description}</Text>
      )}
      
      <View style={styles.categoryRow}>
        <Tag color="#666" size={14} />
        <Text style={styles.category}>{recipe.category}</Text>
      </View>
      
      <View style={styles.divider} />
      
      <Text style={styles.ingredientsTitle}>
        Ingredients ({recipe.ingredients.length})
      </Text>
      
      <View style={styles.ingredientsContainer}>
        {recipe.ingredients.map((ingredient, index) => (
          <View key={ingredient.id} style={styles.ingredientItem}>
            <Text style={styles.ingredientBullet}>•</Text>
            <Text style={styles.ingredientName}>
              {ingredient.name}{' '}
              <Text style={styles.ingredientQuantity}>
                ({ingredient.quantity} {ingredient.unit})
              </Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  category: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginBottom: 12,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  ingredientsContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 10,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  ingredientBullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: -2,
  },
  ingredientName: {
    fontSize: 14,
    flex: 1,
  },
  ingredientQuantity: {
    color: '#666',
  },
});