import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  Pressable,
} from "react-native";
import { supabase } from "../supabaseClient";
import { Recipe } from "../types/types";
import { logMeal } from "../utils/logMeal";

interface AddMealLogModalProps {
  visible: boolean;
  onClose: () => void;
  onLogSuccess: () => void;
}

const AddMealLogModal: React.FC<AddMealLogModalProps> = ({
  visible,
  onClose,
  onLogSuccess,
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [batchCount, setBatchCount] = useState("1");
  const [outOfStockIngredients, setOutOfStockIngredients] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      fetchRecipes();
      setBatchCount("1");
      setSelectedRecipeId("");
      setOutOfStockIngredients([]);
    }
  }, [visible]);

  const fetchRecipes = async () => {
    const { data, error } = await supabase.from("recipes").select("*");
    if (error) {
      Alert.alert("Error", "Failed to fetch recipes");
    } else {
      setRecipes(data);
    }
  };

  const checkStock = async (
    recipeId: string,
    batchCount: number
  ): Promise<boolean> => {
    const { data, error } = await supabase
      .from("recipe_ingredients")
      .select("ingredient_id, quantity_per_batch")
      .eq("recipe_id", recipeId);

    if (error || !data) {
      console.error("❌ Failed to check ingredients:", error);
      return false;
    }

    const insufficient: string[] = [];

    for (const row of data) {
      const { data: inv, error: invError } = await supabase
        .from("inventory")
        .select("name, quantity")
        .eq("id", row.ingredient_id)
        .single();

      if (invError || !inv) continue;

      const totalRequired = row.quantity_per_batch * batchCount;
      if (inv.quantity < totalRequired) {
        insufficient.push(inv.name);
      }
    }

    setOutOfStockIngredients(insufficient);
    return insufficient.length === 0;
  };

  const handleSubmit = async () => {
    if (!selectedRecipeId || selectedRecipeId.trim() === "") {
      Alert.alert("Missing Info", "Please select a recipe.");
      return;
    }

    const parsedBatches = parseInt(batchCount.trim());

    if (isNaN(parsedBatches) || parsedBatches <= 0) {
      Alert.alert("Invalid Input", "Batch count must be a positive number.");
      return;
    }

    const hasStock = await checkStock(selectedRecipeId, parsedBatches);
    if (!hasStock) {
      Alert.alert(
        "Inventory Alert",
        `Not enough stock for: ${outOfStockIngredients.join(", ")}`
      );
      return;
    }

    const result = await logMeal({
      recipeId: selectedRecipeId,
      batchCount: parsedBatches,
    });

    if (!result.success) {
      Alert.alert("Logging Failed", result.error || "Unknown error.");
      return;
    }

    Alert.alert("Success", `✅ Logged ${parsedBatches} batches.`);
    onLogSuccess();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Log New Meal</Text>

        <Text style={styles.label}>Select a Recipe</Text>
        <View style={styles.dropdown}>
          {recipes.map((recipe) => (
            <Pressable
              key={recipe.id}
              onPress={() => setSelectedRecipeId(recipe.id)}
              style={[
                styles.dropdownItem,
                recipe.id === selectedRecipeId && styles.selectedItem,
              ]}
            >
              <Text>{recipe.name}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Number of Batches</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={batchCount}
          onChangeText={setBatchCount}
        />

        {outOfStockIngredients.length > 0 && (
          <Text style={styles.warning}>
            ❗ Not enough stock for: {outOfStockIngredients.join(", ")}
          </Text>
        )}

        <View style={styles.buttonRow}>
          <Button title="Cancel" onPress={onClose} />
          <Button title="Log Meal" onPress={handleSubmit} />
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 6,
    marginBottom: 8,
  },
  dropdownItem: {
    padding: 8,
  },
  selectedItem: {
    backgroundColor: "#eef",
  },
  warning: {
    marginTop: 12,
    color: "red",
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
});

export default AddMealLogModal;
