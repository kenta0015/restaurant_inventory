// types.ts

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  alertLevel: number;
  expiryDate: string | null;
  lastChecked: string;
  category?: string;
  comment?: string;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeSummary {
  id: string;
  name: string;
  category: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  category: string;
  ingredients: RecipeIngredient[];
  createdAt: string;
  estimatedTime: number;
}

export interface MealLog {
  id: string;
  recipe: RecipeSummary;
  date: string;
  quantity: number;
  manualOverrideServings: number | null;
  notes: string | null;
}

export interface PrepSuggestion {
  id: string;
  recipeId: string;
  recipeName: string;
  suggestedQuantity: number;
  userQuantity: number;
  weekday: string;
  date: string;
  status: 'pending' | 'approved' | 'completed';
  hasShortage: boolean;
}

export interface IngredientShortage {
  ingredientName: string;
  required: number;
  available: number;
  unit: string;
}

// 🔁 Original PrepTask (still used for ingredient-based workflows)
export interface PrepTask {
  id: string;
  recipeId: string;
  recipeName: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  estimatedTime: number;
  isCompleted: boolean;
  completedQuantity: number;

  recipe: Recipe;
  shortages: Array<{
    name: string;
    necessaryAmount: number;
    unit: string;
    currentStock: number;
  }>;
  necessaryPrepInfo: {
    necessaryIngredients: Array<{
      name: string;
      necessaryAmount: number;
      unit: string;
      currentStock: number;
    }>;
    canPrepWithCurrentStock: boolean;
  };

  currentMealStock: number;
  plannedPrepOverride?: number | null;
}

export interface RecipePrepTask {
  id: string;
  recipeId: string;
  recipeName: string;
  prepQuantity: number;
  estimatedTime: number;
  totalIngredientWeight: number;
  isCompleted: boolean;
}

export interface PrepSheet {
  id: string;
  date: string;
  weekday: string;
  tasks: PrepTask[];
  totalEstimatedTime: number;
  status: 'in-progress' | 'completed';
}

// ✅ OCR item structure (used before full parsing/validation)
export interface OCRItem {
  name: string;
  quantity: number;
  unit: string;
  price?: number;
  note?: string;
  sourceText?: string;
  extraFields?: { [key: string]: string };
  _newExtraKey?: string;
  _newExtraValue?: string;
}

// ✅ Fully parsed item (used in ParsedItemCard, etc.)
export type ParsedItemStatus = 'tracked' | 'new' | 'unknown' | 'pending';

export interface ParsedItem extends OCRItem {
  correctedName: string;
  status: ParsedItemStatus;
  category: string;
  showNewCategoryInput: boolean;
}
