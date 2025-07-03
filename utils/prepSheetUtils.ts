import {
  Recipe,
  InventoryItem,
  PrepTask,
  PrepSheet,
  PrepSuggestion,
  RecipePrepTask
} from '../types/types';
import { formatDate, getWeekday } from './prepSuggestionUtils';
import { v4 as uuidv4 } from 'uuid';


// ✅ Phase 4: Generate recipe-based batch tasks
export function generateRecipePrepTasks(
  suggestions: PrepSuggestion[],
  recipes: Recipe[]
): RecipePrepTask[] {
  return suggestions.map(suggestion => {
    const recipe = recipes.find(r => r.id === suggestion.recipeId);
    if (!recipe) return null;

    const totalWeight = recipe.ingredients.reduce((sum, ingredient) => {
      return sum + ingredient.quantity * suggestion.userQuantity;
    }, 0);

    return {
      id: uuidv4(),
      recipeId: suggestion.recipeId,
      recipeName: suggestion.recipeName,
      prepQuantity: suggestion.userQuantity,
      estimatedTime: estimatePrepTime(suggestion.recipeName),
      totalIngredientWeight: parseFloat(totalWeight.toFixed(2)),
      isCompleted: false
    };
  }).filter(Boolean) as RecipePrepTask[];
}

export function estimatePrepTime(recipeName: string): string {
  const map: Record<string, string> = {
    'Tomato Sauce': '20 min',
    'Caesar Dressing': '15 min',
    'Miso Soup': '10 min',
  };
  return map[recipeName] || '15 min';
}


// ✅ Original logic below – untouched

// Generate prep tasks from approved prep suggestions
export function generatePrepTasks(
  approvedSuggestions: PrepSuggestion[],
  recipes: Recipe[],
  inventory: InventoryItem[]
): PrepTask[] {
  const tasks: PrepTask[] = [];
  
  approvedSuggestions.forEach(suggestion => {
    const recipe = recipes.find(r => r.id === suggestion.recipeId);
    if (!recipe) return;
    
    recipe.ingredients.forEach(ingredient => {
      const totalRequired = ingredient.quantity * suggestion.userQuantity;
      const inventoryItem = inventory.find(item => item.name === ingredient.name);
      const currentStock = inventoryItem ? inventoryItem.quantity : 0;
      const necessaryAmount = Math.max(0, totalRequired - currentStock);
      
      if (necessaryAmount > 0) {
        const estimatedTime = calculateEstimatedTime(ingredient.name, necessaryAmount);
        
        tasks.push({
          id: `${suggestion.id}-${ingredient.id}`,
          recipeId: recipe.id,
          recipeName: recipe.name,
          ingredientName: ingredient.name,
          quantity: necessaryAmount,
          unit: ingredient.unit,
          estimatedTime,
          isCompleted: false,
          completedQuantity: 0
        });
      }
    });
  });
  
  return tasks;
}

function calculateEstimatedTime(ingredientName: string, quantity: number): number {
  const baseTimeMap: Record<string, number> = {
    'Tomatoes': 5,
    'Onions': 8,
    'Chicken Breasts': 12,
    'Rice': 5,
    'Carrots': 10,
    'Peas': 3,
    'Olive Oil': 1,
    'Salt': 1,
    'Black Pepper': 1,
    'Flour': 2
  };
  
  const baseTime = baseTimeMap[ingredientName] || 5;
  return Math.ceil(baseTime * quantity);
}

export function createPrepSheet(
  tasks: PrepTask[],
  date: Date = new Date()
): PrepSheet {
  const totalEstimatedTime = tasks.reduce((total, task) => total + task.estimatedTime, 0);
  
  return {
    id: date.getTime().toString(),
    date: formatDate(date),
    weekday: getWeekday(date.toISOString()),
    tasks,
    totalEstimatedTime,
    status: 'in-progress'
  };
}

export function updateTaskCompletion(
  prepSheet: PrepSheet,
  taskId: string,
  isCompleted: boolean,
  completedQuantity: number
): PrepSheet {
  const updatedTasks = prepSheet.tasks.map(task => {
    if (task.id === taskId) {
      return {
        ...task,
        isCompleted,
        completedQuantity: isCompleted ? completedQuantity : 0
      };
    }
    return task;
  });
  
  const allCompleted = updatedTasks.every(task => task.isCompleted);
  
  return {
    ...prepSheet,
    tasks: updatedTasks,
    status: allCompleted ? 'completed' : 'in-progress'
  };
}

export function updateInventoryFromCompletedTasks(
  inventory: InventoryItem[],
  completedTasks: PrepTask[]
): InventoryItem[] {
  const updatedInventory = JSON.parse(JSON.stringify(inventory)) as InventoryItem[];
  
  completedTasks.forEach(task => {
    if (!task.isCompleted || task.completedQuantity <= 0) return;
    
    const inventoryItemIndex = updatedInventory.findIndex(
      item => item.name === task.ingredientName
    );
    
    if (inventoryItemIndex !== -1) {
      updatedInventory[inventoryItemIndex].quantity += task.completedQuantity;
      updatedInventory[inventoryItemIndex].lastChecked = new Date().toISOString();
    } else {
      const newId = `new-${Date.now()}-${task.ingredientName}`;
      updatedInventory.push({
        id: newId,
        name: task.ingredientName,
        quantity: task.completedQuantity,
        unit: task.unit,
        alertLevel: task.completedQuantity * 0.2,
        expiryDate: null,
        lastChecked: new Date().toISOString()
      });
    }
  });
  
  return updatedInventory;
}

export function calculateRemainingTime(prepSheet: PrepSheet): number {
  const remainingTime = prepSheet.tasks
    .filter(task => !task.isCompleted)
    .reduce((total, task) => total + task.estimatedTime, 0);
  
  return remainingTime;
}

export function groupTasksByRecipe(tasks: PrepTask[]): Record<string, PrepTask[]> {
  const grouped: Record<string, PrepTask[]> = {};
  
  tasks.forEach(task => {
    if (!grouped[task.recipeId]) {
      grouped[task.recipeId] = [];
    }
    grouped[task.recipeId].push(task);
  });
  
  return grouped;
}

export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
}
