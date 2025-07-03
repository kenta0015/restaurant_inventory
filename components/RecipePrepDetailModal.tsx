import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Button,
} from 'react-native';
import { Recipe } from '../types/types';
import PrepQuantityAdjuster from './PrepQuantityAdjuster';
import { supabase } from '../supabaseClient';

interface Props {
  visible: boolean;
  recipe: Recipe;
  initialBatchQuantity: number;
  shortages: any[];
  onConfirm: (batchQuantity: number) => void;
  onClose: () => void;
  onQuantityChange: (batchQuantity: number) => void;
  necessaryPrepInfo: {
    necessaryIngredients: Array<{
      name: string;
      necessaryAmount: number;
      unit: string;
      currentStock: number;
    }>;
    canPrepWithCurrentStock: boolean;
  };
  showShortage: boolean;
  onCloseShortage: () => void;
}

export default function RecipePrepDetailModal({
  visible,
  recipe,
  initialBatchQuantity,
  shortages,
  onConfirm,
  onClose,
  onQuantityChange,
  necessaryPrepInfo,
  showShortage,
  onCloseShortage,
}: Props) {
  const [batchQuantity, setBatchQuantity] = useState<number>(initialBatchQuantity);
  const [selectedTab, setSelectedTab] = useState<'prep' | 'suggestion'>('prep');
  const [weekdayType, setWeekdayType] = useState<'weekday' | 'weekend'>('weekday');
  const [suggestion, setSuggestion] = useState<number>(0);
  const [currentStock, setCurrentStock] = useState<number | null>(null);

  useEffect(() => {
    setBatchQuantity(initialBatchQuantity);
  }, [initialBatchQuantity]);

  useEffect(() => {
    if (selectedTab === 'suggestion') {
      fetchSuggestion();
    }
    fetchCurrentStock();
  }, [selectedTab, weekdayType, recipe?.id]);

  const fetchSuggestion = async () => {
    const { data } = await supabase
      .from('prep_suggestions')
      .select('suggested_quantity')
      .eq('recipe_id', recipe.id)
      .eq('weekday_type', weekdayType)
      .single();

    if (data?.suggested_quantity !== undefined) {
      setSuggestion(data.suggested_quantity);
    } else {
      setSuggestion(0);
    }
  };

  const fetchCurrentStock = async () => {
    const { data } = await supabase
      .from('meal_logs')
      .select('quantity')
      .eq('recipe_id', recipe.id);

    if (data) {
      const total = data.reduce((sum: number, row: any) => sum + (row.quantity || 0), 0);
      setCurrentStock(total);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    setBatchQuantity(newQuantity);
    onQuantityChange(newQuantity);
  };

  const saveSuggestion = async () => {
    const { error } = await supabase
      .from('prep_suggestions')
      .upsert(
        [{
          recipe_id: recipe.id,
          weekday_type: weekdayType,
          suggested_quantity: suggestion,
        }],
        { onConflict: 'recipe_id,weekday_type' }
      );

    if (!error) {
      alert("✅ Suggestion saved"); // ✅ Web-safe universal alert
      onClose(); // ✅ Close modal
    } else {
      console.error('Save error:', error);
    }
  };

  const dynamicIngredients = recipe.ingredients.map((ing) => {
    const matched = necessaryPrepInfo?.necessaryIngredients.find(
      (item) => item.name === ing.name
    );
    const need = ing.quantity * batchQuantity;
    const have = (matched?.currentStock ?? 0) - need;
    return {
      name: ing.name,
      unit: ing.unit,
      necessaryAmount: need,
      remainingStock: have,
      isLow: have < 2,
    };
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{recipe.name} – Detail</Text>

        <View style={styles.tabRow}>
          <Button
            title="Planned Prep"
            onPress={() => setSelectedTab('prep')}
            color={selectedTab === 'prep' ? '#4CAF50' : '#AAA'}
          />
          <Button
            title="Target Suggestion"
            onPress={() => setSelectedTab('suggestion')}
            color={selectedTab === 'suggestion' ? '#4CAF50' : '#AAA'}
          />
        </View>

        <Text style={styles.subInfo}>
          📦 Current Stock: {currentStock ?? '...'} batch(es)
        </Text>

        <Text style={styles.sectionTitle}>🧂 Ingredients Required</Text>
        {dynamicIngredients.map((item, index) => (
          <View key={index} style={styles.ingredientBox}>
            <Text style={styles.ingredientText}>
              {item.name} — Need: {item.necessaryAmount} {item.unit} / Have:{" "}
              {item.remainingStock < 0 ? 0 : item.remainingStock} {item.unit}
            </Text>
            {item.isLow && (
              <Text style={styles.alertText}>⚠️ Low Stock</Text>
            )}
          </View>
        ))}

        {selectedTab === 'prep' ? (
          <>
            <Text style={styles.sectionTitle}>Planned Prep Quantity</Text>
            <PrepQuantityAdjuster
              value={batchQuantity}
              suggestedValue={initialBatchQuantity}
              onChange={handleQuantityChange}
              min={0}
            />
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => onConfirm(batchQuantity)}
            >
              <Text style={styles.confirmButtonText}>✅ Confirm</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Edit Target Quantity ({weekdayType})</Text>
            <View style={styles.toggleRow}>
              <Button
                title="Weekday"
                onPress={() => setWeekdayType('weekday')}
                color={weekdayType === 'weekday' ? '#4CAF50' : '#AAA'}
              />
              <Button
                title="Weekend"
                onPress={() => setWeekdayType('weekend')}
                color={weekdayType === 'weekend' ? '#4CAF50' : '#AAA'}
              />
            </View>
            <PrepQuantityAdjuster
              value={suggestion}
              suggestedValue={suggestion}
              onChange={setSuggestion}
              min={0}
            />
            <TouchableOpacity style={styles.confirmButton} onPress={saveSuggestion}>
              <Text style={styles.confirmButtonText}>💾 Save Suggestion</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subInfo: {
    fontSize: 14,
    marginBottom: 12,
    color: '#444',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 12,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    marginBottom: 40,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  ingredientBox: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 6,
    borderRadius: 6,
  },
  ingredientText: {
    fontSize: 14,
    color: '#333',
  },
  alertText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    marginTop: 4,
  },
});
