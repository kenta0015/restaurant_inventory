import { supabase } from "../supabaseClient";

export async function updateInventoryByDelta(recipeId: string, delta: number) {
  const { data: ingredients, error } = await supabase
    .from("recipe_ingredients")
    .select("ingredient_id, quantity_per_batch")
    .eq("recipe_id", recipeId);

  if (error || !ingredients) {
    console.error("❌ Error fetching ingredients:", error?.message);
    return;
  }

  for (const item of ingredients) {
    const totalChange = item.quantity_per_batch * delta;

    const { data: currentInv } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("id", item.ingredient_id)
      .single();

    if (!currentInv) {
      console.warn(`No inventory found for ingredient ${item.ingredient_id}`);
      continue;
    }

    const newQuantity = currentInv.quantity - totalChange;

    const { error: updateError } = await supabase
      .from("inventory")
      .update({ quantity: newQuantity })
      .eq("id", item.ingredient_id);

    if (updateError) {
      console.error("❌ Failed to update inventory:", updateError.message);
    }
  }
}
