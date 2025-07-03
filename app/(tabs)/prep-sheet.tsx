import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import PrepSheetSummary from '../../components/PrepSheetSummary';
import RecipePrepTaskItem from '../../components/RecipePrepTaskItem';
import { supabase } from '../../supabaseClient';
import {
  Recipe,
  PrepTask,
  IngredientShortage,
} from '../../types/types';
import {
  checkIngredientShortages,
  calculateNecessaryPrepAmount,
} from '../../utils/prepSuggestionUtils';

export default function PrepSheet() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [tasks, setTasks] = useState<PrepTask[]>([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchRecipes();
    fetchOrCopyComment();
  }, []);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const fetchOrCopyComment = async () => {
    const today = formatDate(selectedDate);
    const yesterday = formatDate(new Date(Date.now() - 86400000));

    const { data: todayNote } = await supabase
      .from('prep_notes')
      .select('comment')
      .eq('note_date', today)
      .single();

    if (todayNote?.comment) {
      setComment(todayNote.comment);
    } else {
      const { data: yesterdayNote } = await supabase
        .from('prep_notes')
        .select('comment')
        .eq('note_date', yesterday)
        .single();

      if (yesterdayNote?.comment) {
        setComment(yesterdayNote.comment);
      }
    }
  };

  const saveComment = async (text: string) => {
    setComment(text);
    const today = formatDate(selectedDate);

    await supabase.from('prep_notes').upsert(
      {
        note_date: today,
        comment: text,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'note_date' }
    );
  };

  const convertShortages = (list: any[]) =>
    list.map((s) => ({
      name: s.ingredientName || s.name,
      necessaryAmount: s.required || s.necessaryAmount || 0,
      unit: s.unit || '',
      currentStock: s.available || s.currentStock || 0,
    }));

  const fetchRecipes = async () => {
    const { data: inventoryData } = await supabase.from('inventory').select('*');

    const { data: suggestionData } = await supabase.from('prep_suggestions').select('*');

    const { data: mealLogData, error: mealLogError } = await supabase
      .from('meal_logs')
      .select('recipe_id, manualOverrideServings, date')
      .order('date', { ascending: false }); // ✅ FIXED HERE

    console.log('🧪 mealLogData', mealLogData);
    console.log('🧪 mealLogError', mealLogError);

    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .select(
        `id, name, category, createdAt, description,
         recipe_ingredients (
           ingredient_id ( id, name ),
           quantity_per_batch,
           unit
         )`
      );

    if (recipeError || !recipeData) {
      console.error('❌ Failed to load recipes:', recipeError?.message);
      return;
    }

    const weekdayType = [0, 6].includes(new Date().getDay()) ? 'weekend' : 'weekday';

    const formatted: Recipe[] = recipeData.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      category: r.category,
      createdAt: r.createdAt,
      ingredients: r.recipe_ingredients.map((ing: any) => ({
        id: ing.ingredient_id?.id || '',
        name: ing.ingredient_id?.name || 'Unknown',
        quantity: ing.quantity_per_batch,
        unit: ing.unit,
      })),
      estimatedTime: 20,
    }));

    setRecipes(formatted);

    const mealLogMap = new Map<string, number>();

    if (mealLogData) {
      mealLogData.forEach((log) => {
        if (!mealLogMap.has(log.recipe_id)) {
          mealLogMap.set(log.recipe_id, log.manualOverrideServings ?? 0);
        }
      });
    }

    console.log('🧪 mealLogMap keys', Array.from(mealLogMap.keys()));

    const generatedTasks: PrepTask[] = formatted.map((recipe) => {
      const recipeSuggestion = suggestionData?.find(
        (s) => s.recipe_id === recipe.id && s.weekday_type === weekdayType
      );
      const targetQuantity = recipeSuggestion?.suggested_quantity || 0;

      const currentMealStock =
        Array.from(mealLogMap.entries()).find(([id]) => id === recipe.id)?.[1] || 0;

      console.log('🧪 Matching:', {
        recipeId: recipe.id,
        currentMealStock,
      });

      const plannedPrep = Math.max(targetQuantity - currentMealStock, 0);
      const shortagesRaw = checkIngredientShortages(recipe, plannedPrep, inventoryData || []);
      const shortages = convertShortages(shortagesRaw);
      const prepInfo = calculateNecessaryPrepAmount(recipe, plannedPrep, inventoryData || []);

      return {
        id: recipe.id,
        recipeId: recipe.id,
        recipeName: recipe.name,
        ingredientName: '',
        quantity: targetQuantity,
        unit: 'batch',
        estimatedTime: recipe.estimatedTime,
        isCompleted: false,
        completedQuantity: 0,
        recipe,
        shortages,
        necessaryPrepInfo: prepInfo,
        currentMealStock,
        plannedPrepOverride: null,
      };
    });

    setTasks(generatedTasks);
  };

  const handleComplete = async (
    taskId: string,
    isCompleted: boolean,
    _completedQuantity: number
  ) => {
    if (!isCompleted) return;

    const recipe = recipes.find((r) => r.id === taskId);
    const task = tasks.find((t) => t.id === taskId);
    if (!recipe || !task) return;

    const completedQuantity = task.plannedPrepOverride ?? Math.max(task.quantity - task.currentMealStock, 0);

    for (const ing of recipe.ingredients) {
      const totalUsed = ing.quantity * completedQuantity;

      const { data: inventoryItem } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('name', ing.name)
        .single();

      if (!inventoryItem) continue;

      const newQuantity = inventoryItem.quantity - totalUsed;

      await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('name', ing.name);
    }

    const { error } = await supabase.from('meal_logs').insert({
      recipe_id: taskId,
      quantity: completedQuantity,
      manualOverrideServings: completedQuantity,
      notes: 'Manual override',
    });

    if (error) {
      Alert.alert('Error', 'Failed to log meal: ' + error.message);
    } else {
      Alert.alert('✅ Success', `${recipe.name} logged as ${completedQuantity} batch(es)`);
      setTasks((prev) =>
        prev.map((t) =>
          t.recipeId === taskId ? { ...t, isCompleted: true } : t
        )
      );
    }
  };

  const handleQuantityChange = (taskId: string, newQty: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, plannedPrepOverride: newQty } : t
      )
    );
  };

  const totalTime = tasks.reduce(
    (acc, task) => acc + (task.isCompleted ? 0 : task.estimatedTime),
    0
  );
  const completedTasks = tasks.filter((task) => task.isCompleted).length;
  const totalTasks = tasks.length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Today's Prep Sheet</Text>

          <Text style={styles.commentLabel}>📝 Daily Comment:</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="e.g., Tomatoes arrived late. Use older batch first."
            multiline
            value={comment}
            onChangeText={saveComment}
          />
        </View>

        <PrepSheetSummary
          totalTasks={totalTasks}
          completedTasks={completedTasks}
          totalTimeInMinutes={totalTime}
          selectedDate={selectedDate}
        />

        <View style={styles.tasksContainer}>
          <Text style={styles.tasksTitle}>Prep Tasks</Text>

          {tasks.map(
            (task) =>
              !task.isCompleted && (
                <RecipePrepTaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onQuantityChange={handleQuantityChange}
                />
              )
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  commentLabel: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  commentInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    minHeight: 60,
    marginTop: 6,
  },
  tasksContainer: {
    marginTop: 24,
  },
  tasksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});
