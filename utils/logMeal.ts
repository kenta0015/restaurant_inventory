import { supabase } from "../supabaseClient";

export async function logMeal({
  recipeId,
  batchCount,
  comment,
  overrideCount,
}: {
  recipeId: string;
  batchCount: number;
  comment?: string;
  overrideCount?: number;
}): Promise<{
  success: boolean;
  error?: string;
  shortages?: { ingredientId: string; required: number; available: number }[];
}> {
  try {
    const { data, error } = await supabase.rpc("log_meal_transaction", {
      p_recipe_id: recipeId,
      p_batch_count: batchCount,
      p_actual_batch_count: overrideCount ?? batchCount,
      p_comment: comment ?? "",
    });

    if (error) {
      console.error("❌ Supabase RPC Error:", error.message);

      // Check for out-of-stock error pattern
      const match = error.message.match(
        /ingredient ID (\w+).*batch count = (\d+)/
      );

      if (match) {
        return {
          success: false,
          error: error.message,
          shortages: [
            {
              ingredientId: match[1],
              required: parseFloat(match[2]),
              available: 0,
            },
          ],
        };
      }

      return { success: false, error: error.message || "RPC failed." };
    }

    console.log("✅ Supabase RPC Success:", data);
    return { success: true };
  } catch (err: any) {
    console.error("❌ Exception during logMeal:", err);
    return { success: false, error: "Unexpected error occurred." };
  }
}
