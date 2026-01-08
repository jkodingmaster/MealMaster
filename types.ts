export interface Ingredient {
  name: string;
  amount: string;
  isMissing: boolean;
  isEssential?: boolean; // New property to distinguish core ingredients
  estimatedPrice?: string;
  imageTerm?: string;
}

export interface RecipeSource {
  title: string;
  uri: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  calories: number;
  ingredients: Ingredient[];
  instructions: string[];
  sources?: RecipeSource[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: string;
  checked: boolean;
  recipeRef?: string;
  estimatedPrice?: string;
  imageTerm?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface DayPlan {
  breakfast: Recipe | null;
  lunch: Recipe | null;
  dinner: Recipe | null;
}

export interface MealPlan {
  [day: string]: DayPlan;
}

export interface Person {
  id: string;
  name: string;
}

export interface PersonMealPlans {
  [personId: string]: MealPlan;
}

export type AppView = 'home' | 'chat' | 'results' | 'shopping-list' | 'cookbook';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}