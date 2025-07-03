import { InventoryItem, Recipe, MealLog, PrepSuggestion, IngredientShortage, PrepTask, PrepSheet } from '../types/types';

// Inventory Data
export const inventoryData: InventoryItem[] = [
  { id: '1', name: 'Tomatoes', quantity: 5, unit: 'kg', alertLevel: 2, expiryDate: '2025-04-10', lastChecked: '2025-03-15T10:30:00Z' },
  { id: '2', name: 'Onions', quantity: 3, unit: 'kg', alertLevel: 1, expiryDate: '2025-05-20', lastChecked: '2025-03-15T10:30:00Z' },
  { id: '3', name: 'Chicken Breasts', quantity: 1.5, unit: 'kg', alertLevel: 2, expiryDate: '2025-03-20', lastChecked: '2025-03-15T10:30:00Z' },
  { id: '4', name: 'Flour', quantity: 10, unit: 'kg', alertLevel: 3, expiryDate: '2025-09-15', lastChecked: '2025-03-15T10:30:00Z' },
  { id: '5', name: 'Olive Oil', quantity: 0.8, unit: 'l', alertLevel: 1, expiryDate: '2025-12-30', lastChecked: '2025-03-15T10:30:00Z' },
  { id: '6', name: 'Salt', quantity: 1.2, unit: 'kg', alertLevel: 0.5, expiryDate: null, lastChecked: '2025-03-15T10:30:00Z' },
  { id: '7', name: 'Black Pepper', quantity: 0.3, unit: 'kg', alertLevel: 0.1, expiryDate: null, lastChecked: '2025-03-15T10:30:00Z' },
  { id: '8', name: 'Rice', quantity: 8, unit: 'kg', alertLevel: 3, expiryDate: '2025-08-15', lastChecked: '2025-03-15T10:30:00Z' },
  { id: '9', name: 'Carrots', quantity: 2, unit: 'kg', alertLevel: 1, expiryDate: '2025-03-25', lastChecked: '2025-03-15T10:30:00Z' },
  { id: '10', name: 'Peas', quantity: 1.5, unit: 'kg', alertLevel: 0.5, expiryDate: '2025-04-05', lastChecked: '2025-03-15T10:30:00Z' },
];

// Recipe Data
export const recipeData: Recipe[] = [
  {
    id: '1',
    name: 'Tomato Sauce',
    description: 'Classic Italian tomato sauce for pasta',
    category: 'Sauces',
    ingredients: [
      { id: '1', name: 'Tomatoes', quantity: 2, unit: 'kg' },
      { id: '2', name: 'Onions', quantity: 0.5, unit: 'kg' },
      { id: '3', name: 'Olive Oil', quantity: 0.05, unit: 'l' },
      { id: '4', name: 'Salt', quantity: 0.02, unit: 'kg' },
      { id: '5', name: 'Black Pepper', quantity: 0.005, unit: 'kg' },
    ],
    createdAt: '2025-02-20T14:30:00Z',
  },
  {
    id: '2',
    name: 'Grilled Chicken',
    description: 'Simple grilled chicken breast with herbs',
    category: 'Main Course',
    ingredients: [
      { id: '1', name: 'Chicken Breasts', quantity: 0.5, unit: 'kg' },
      { id: '2', name: 'Olive Oil', quantity: 0.03, unit: 'l' },
      { id: '3', name: 'Salt', quantity: 0.01, unit: 'kg' },
      { id: '4', name: 'Black Pepper', quantity: 0.002, unit: 'kg' },
    ],
    createdAt: '2025-02-25T10:15:00Z',
  },
  {
    id: '3',
    name: 'Fried Rice',
    description: 'Quick and easy fried rice with vegetables',
    category: 'Side Dish',
    ingredients: [
      { id: '1', name: 'Rice', quantity: 0.4, unit: 'kg' },
      { id: '2', name: 'Onions', quantity: 0.1, unit: 'kg' },
      { id: '3', name: 'Carrots', quantity: 0.1, unit: 'kg' },
      { id: '4', name: 'Peas', quantity: 0.1, unit: 'kg' },
      { id: '5', name: 'Salt', quantity: 0.005, unit: 'kg' },
    ],
    createdAt: '2025-03-01T16:45:00Z',
  },
];

// Meal Log Data
export const mealLogData: MealLog[] = [
  { id: '1', recipe: recipeData[0], date: '2025-03-14T18:30:00Z', quantity: 2, manualOverrideServings: null, notes: 'Made for dinner service, used with pasta' },
  { id: '2', recipe: recipeData[1], date: '2025-03-14T12:15:00Z', quantity: 4, manualOverrideServings: null, notes: 'Lunch special' },
  { id: '3', recipe: recipeData[2], date: '2025-03-13T19:00:00Z', quantity: 3, manualOverrideServings: null, notes: 'Evening side dish' },
  { id: '4', recipe: recipeData[0], date: '2025-03-12T17:45:00Z', quantity: 1, manualOverrideServings: null, notes: null },
  { id: '5', recipe: recipeData[1], date: '2025-03-11T12:30:00Z', quantity: 3, manualOverrideServings: null, notes: 'Staff meal' },
  { id: '6', recipe: recipeData[2], date: '2025-03-11T18:15:00Z', quantity: 2, manualOverrideServings: null, notes: null },
  { id: '7', recipe: recipeData[0], date: '2025-03-10T17:30:00Z', quantity: 2, manualOverrideServings: null, notes: 'For pasta night' },
  { id: '8', recipe: recipeData[1], date: '2025-03-10T12:00:00Z', quantity: 5, manualOverrideServings: null, notes: 'Catering order' },
  { id: '9', recipe: recipeData[2], date: '2025-03-09T18:45:00Z', quantity: 4, manualOverrideServings: null, notes: 'Weekend special' },
  { id: '10', recipe: recipeData[0], date: '2025-03-08T17:15:00Z', quantity: 3, manualOverrideServings: null, notes: 'Saturday dinner rush' },
];


// Prep Suggestions
export const prepSuggestionsData: PrepSuggestion[] = [
  { id: '1', recipeId: '1', recipeName: 'Tomato Sauce', suggestedQuantity: 2, userQuantity: 2, weekday: 'Monday', date: '2025-03-17', status: 'pending', hasShortage: false },
  { id: '2', recipeId: '2', recipeName: 'Grilled Chicken', suggestedQuantity: 3, userQuantity: 3, weekday: 'Monday', date: '2025-03-17', status: 'pending', hasShortage: true },
  { id: '3', recipeId: '3', recipeName: 'Fried Rice', suggestedQuantity: 2, userQuantity: 2, weekday: 'Monday', date: '2025-03-17', status: 'pending', hasShortage: false },
];

// Ingredient Shortages
export const ingredientShortagesData: Record<string, IngredientShortage[]> = {
  '2': [
    {
      ingredientName: 'Chicken Breasts',
      required: 1.5,
      available: 1.5,
      unit: 'kg',
    },
  ],
};

// Prep Tasks
export const prepTasksData: PrepTask[] = [
  { id: '1', recipeId: '1', recipeName: 'Tomato Sauce', ingredientName: 'Tomatoes', quantity: 4, unit: 'kg', estimatedTime: 15, isCompleted: false, completedQuantity: 0 },
  { id: '2', recipeId: '1', recipeName: 'Tomato Sauce', ingredientName: 'Onions', quantity: 1, unit: 'kg', estimatedTime: 10, isCompleted: false, completedQuantity: 0 },
  { id: '3', recipeId: '2', recipeName: 'Grilled Chicken', ingredientName: 'Chicken Breasts', quantity: 1.5, unit: 'kg', estimatedTime: 20, isCompleted: false, completedQuantity: 0 },
  { id: '4', recipeId: '3', recipeName: 'Fried Rice', ingredientName: 'Rice', quantity: 0.8, unit: 'kg', estimatedTime: 25, isCompleted: false, completedQuantity: 0 },
  { id: '5', recipeId: '3', recipeName: 'Fried Rice', ingredientName: 'Carrots', quantity: 0.2, unit: 'kg', estimatedTime: 10, isCompleted: false, completedQuantity: 0 },
  { id: '6', recipeId: '3', recipeName: 'Fried Rice', ingredientName: 'Peas', quantity: 0.2, unit: 'kg', estimatedTime: 5, isCompleted: false, completedQuantity: 0 },
];

// Prep Sheet
export const prepSheetData: PrepSheet = {
  id: '1',
  date: '2025-03-17',
  weekday: 'Monday',
  tasks: prepTasksData,
  totalEstimatedTime: 85,
  status: 'in-progress',
};
