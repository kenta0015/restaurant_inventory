import { supabase } from "../../supabaseClient";

const testRecipeId = "d05a98b6-e438-4d77-b3f9-929212918714"; // tomato sauce
const testBatchCount = 3;

export async function devTestLogMeal() {
  console.log("▶️ devTestLogMeal() called");

  // Step 1: Fetch recipe
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", testRecipeId)
    .single();

  if (recipeError || !recipe) {
    console.error("❌ Failed to fetch recipe:", recipeError?.message);
    return;
  }
  console.log("✅ Recipe fetched:", recipe.name);

  // Step 2: Fetch ingredients for this recipe
  const { data: ingredients, error: ingredientError } = await supabase
    .from("recipe_ingredients")
    .select("ingredient_id, quantity_per_batch")
    .eq("recipe_id", testRecipeId);

  if (ingredientError || !ingredients?.length) {
    console.error("❌ Failed to fetch ingredients:", ingredientError?.message);
    return;
  }
  console.log("✅ Ingredients fetched:", ingredients.length);

  // Step 3: Deduct from inventory
  for (const ingredient of ingredients) {
    const { data: invData, error: invError } = await supabase
      .from("inventory")
      .select("*")
      .eq("id", ingredient.ingredient_id)
      .single();

    if (invError || !invData) {
      console.error(`❌ Inventory fetch failed for ${ingredient.ingredient_id}:`, invError?.message);
      return;
    }

    const usedQty = ingredient.quantity_per_batch * testBatchCount;
    const remainingQty = invData.quantity - usedQty;

    if (remainingQty < 0) {
      console.error(`❌ Not enough stock for ${invData.name}. Needed: ${usedQty}, Available: ${invData.quantity}`);
      return;
    }

    const { error: updateError } = await supabase
      .from("inventory")
      .update({ quantity: remainingQty })
      .eq("id", ingredient.ingredient_id);

    if (updateError) {
      console.error(`❌ Failed to update inventory for ${invData.name}:`, updateError.message);
      return;
    }

    console.log(`✅ Deducted ${usedQty} from ${invData.name}. Remaining: ${remainingQty}`);
  }

  // Step 4: Log meal
  const { error: insertError } = await supabase.from("meal_logs").insert([
    {
      date: new Date().toISOString(),
      recipe_id: testRecipeId,
      quantity: testBatchCount,
      manualOverrideServings: null,
    },
  ]);

  if (insertError) {
    console.error("❌ Failed to insert meal log:", insertError.message);
    return;
  }

  console.log("✅ Meal log inserted successfully.");
}
