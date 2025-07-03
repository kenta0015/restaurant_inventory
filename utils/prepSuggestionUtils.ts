import { MealLog, Recipe, PrepSuggestion, InventoryItem, IngredientShortage } from '../types/types';

// Get the day of the week for a given date
export function getWeekday(dateString: string): string {
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

// Get numeric weekday (0 = Sun, 6 = Sat)
function getWeekdayNumber(date: Date): number {
  return date.getDay();
}

// Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Calculate the suggested prep quantity based on historical data minus current stock
export function calculateSuggestedPrepQuantity(
  recipe: Recipe,
  mealLogs: MealLog[],
  targetDate: Date = new Date()
): number {
  const weekdayNumber = getWeekdayNumber(targetDate);

  const relevantLogs = mealLogs
    .filter(log => {
      const logDate = new Date(log.date);
      const isSameRecipe = log.recipe.id === recipe.id;
      const isSameWeekday = logDate.getDay() === weekdayNumber;
      const isWithinLast3Weeks =
        targetDate.getTime() - logDate.getTime() <= 21 * 24 * 60 * 60 * 1000;
      return isSameRecipe && isSameWeekday && isWithinLast3Weeks;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const average = relevantLogs.length === 0
    ? 2
    : relevantLogs.reduce((sum, log) => sum + log.quantity, 0) / relevantLogs.length;

  // Subtract recent available stock (last 3 days)
  const recentAvailable = mealLogs
    .filter(log => {
      const isSameRecipe = log.recipe.id === recipe.id;
      const isRecent = targetDate.getTime() - new Date(log.date).getTime() <= 3 * 24 * 60 * 60 * 1000;
      return isSameRecipe && isRecent;
    })
    .reduce((sum, log) => sum + log.quantity, 0);

  return Math.max(0, Math.floor(average - recentAvailable));
}

// Check if there are any ingredient shortages for the suggested prep
export function checkIngredientShortages(
  recipe: Recipe,
  prepQuantity: number,
  inventory: InventoryItem[]
): IngredientShortage[] {
  const shortages: IngredientShortage[] = [];

  recipe.ingredients.forEach(ingredient => {
    const requiredAmount = ingredient.quantity * prepQuantity;
    const inventoryItem = inventory.find(item => item.name === ingredient.name);

    if (!inventoryItem) {
      shortages.push({
        ingredientName: ingredient.name,
        required: requiredAmount,
        available: 0,
        unit: ingredient.unit
      });
    } else if (inventoryItem.quantity < requiredAmount) {
      shortages.push({
        ingredientName: ingredient.name,
        required: requiredAmount,
        available: inventoryItem.quantity,
        unit: ingredient.unit
      });
    }
  });

  return shortages;
}

// Calculate necessary prep amount (suggested - current stock)
export function calculateNecessaryPrepAmount(
  recipe: Recipe,
  suggestedQuantity: number,
  inventory: InventoryItem[]
): {
  necessaryIngredients: Array<{
    name: string;
    necessaryAmount: number;
    unit: string;
    currentStock: number;
  }>;
  canPrepWithCurrentStock: boolean;
} {
  const necessaryIngredients = recipe.ingredients.map(ingredient => {
    const totalRequired = ingredient.quantity * suggestedQuantity;
    const inventoryItem = inventory.find(item => item.name === ingredient.name);
    const currentStock = inventoryItem ? inventoryItem.quantity : 0;
    const necessaryAmount = Math.max(0, totalRequired - currentStock);

    return {
      name: ingredient.name,
      necessaryAmount,
      unit: ingredient.unit,
      currentStock
    };
  });

  const canPrepWithCurrentStock = necessaryIngredients.every(
    ingredient => ingredient.necessaryAmount === 0
  );

  return {
    necessaryIngredients,
    canPrepWithCurrentStock
  };
}

// Generate prep suggestions for all recipes
export function generatePrepSuggestions(
  recipes: Recipe[],
  mealLogs: MealLog[],
  inventory: InventoryItem[],
  targetDate: Date = new Date()
): PrepSuggestion[] {
  const suggestions: PrepSuggestion[] = [];
  const weekday = getWeekday(targetDate.toISOString());
  const dateString = formatDate(targetDate);

  recipes.forEach(recipe => {
    const suggestedQuantity = calculateSuggestedPrepQuantity(recipe, mealLogs, targetDate);
    const shortages = checkIngredientShortages(recipe, suggestedQuantity, inventory);

    suggestions.push({
      id: `${recipe.id}-${dateString}`,
      recipeId: recipe.id,
      recipeName: recipe.name,
      suggestedQuantity,
      userQuantity: suggestedQuantity,
      weekday,
      date: dateString,
      status: 'pending',
      hasShortage: shortages.length > 0
    });
  });

  return suggestions;
}

// Calculate the impact on inventory if prep suggestions are approved
export function calculateInventoryImpact(
  prepSuggestions: PrepSuggestion[],
  recipes: Recipe[],
  inventory: InventoryItem[]
): InventoryItem[] {
  const updatedInventory = JSON.parse(JSON.stringify(inventory)) as InventoryItem[];

  prepSuggestions.forEach(suggestion => {
    if (suggestion.status !== 'approved') return;

    const recipe = recipes.find(r => r.id === suggestion.recipeId);
    if (!recipe) return;

    recipe.ingredients.forEach(ingredient => {
      const requiredAmount = ingredient.quantity * suggestion.userQuantity;
      const inventoryItemIndex = updatedInventory.findIndex(item => item.name === ingredient.name);

      if (inventoryItemIndex !== -1) {
        updatedInventory[inventoryItemIndex].quantity = Math.max(
          0,
          updatedInventory[inventoryItemIndex].quantity - requiredAmount
        );
      }
    });
  });

  return updatedInventory;
}
