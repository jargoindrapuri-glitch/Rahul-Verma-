
export type Screen = 'onboarding' | 'home' | 'journal' | 'finance' | 'goals' | 'settings' | 'habits';

export type BudgetMode = 'none' | 'daily' | 'weekly' | 'monthly';

export interface CategoryDef {
  id: string;
  label: string; // e.g. "Cigarette"
  icon: string; // e.g. "🚬"
  price: number; // Default price
  color?: string;
}

export interface HabitDef {
  id: string;
  title: string;
  type: 'positive' | 'negative'; // positive = build (Gym), negative = quit (Smoking)
  icon: string;
}

export interface UserProfile {
  name: string;
  startDate: string; // ISO Date
  intents: string[];
  reminderMorning: string;
  isOnboarded: boolean;
  
  // Gamification
  xp: number;
  level: number;

  // Finance Settings
  dailyBudget?: number;
  budgetMode?: BudgetMode;
  customCategories?: CategoryDef[];
  
  // Habits
  habits?: HabitDef[];
  habitLimits?: Record<string, number>; // e.g. { "Cigarettes": 2 }
  habitOverrides?: Record<string, number>; // ID -> New Price mapping
}

export type Mood = 'happy' | 'good' | 'neutral' | 'sad' | 'angry';

export type TaskPriority = 'High' | 'Medium' | 'Low' | 'Critical';

export interface ToDoItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: TaskPriority;
  category?: string;
  linkedGoalId?: string; // Dependency Tree Link
}

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  rating?: number; // 1-10 scale
  energy?: number; // 1-5 scale (New)
  
  // Core Journal Fields
  intention?: string;
  memory?: string; // Used for "The Win" or Highlight
  todos: ToDoItem[];
  promptAnswer?: string;
  
  // Mood & Music
  mood?: Mood;
  moodReasons?: string[];
  songTitle?: string;
  songArtist?: string;
  songReason?: string;
  
  // Embedded Tracking (Day Summary)
  financeLog?: {
    amount: number;
    category: string;
    impulse: boolean;
    isLogged: boolean;
  };

  // Binary Habit Tracking
  habitStatus?: Record<string, boolean>; // id -> true (done/occurred)

  gratitude?: string;
  isLocked: boolean;
}

// FinTrace & Habit Types
export type HabitType = 'Cigarettes' | 'Weed' | 'Alcohol' | 'Coffee' | 'Food' | 'Travel' | 'Other';
export type UnitType = 'stick' | 'g' | 'drink' | 'cup' | 'unit';

export interface Transaction {
  id: string;
  timestamp: string; // ISO
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  category: string; // e.g., "Food", "Rent", or HabitType
  isHabit: boolean;
  unitQuantity?: number;
  unitType?: UnitType;
  mood?: Mood;
  note?: string;
}

export interface AddictionLog {
  id: string;
  timestamp: string;
  type: string; // e.g., 'Cigarettes'
  trigger: string;
  moodBefore: Mood;
  moodAfter: Mood;
}

export interface QuickAddPreset {
  id: string;
  label: HabitType;
  price: number;
  unit: UnitType;
  icon: string;
}

export interface Goal {
  id: string;
  title: string;
  reason: string;
  action: string;
  progress: number; // 0-100
  type: 'career' | 'bucket';
  completed: boolean;
}

export interface AppState {
  profile: UserProfile;
  entries: Record<string, DailyEntry>; // Keyed by YYYY-MM-DD
  transactions: Transaction[];
  addictionLogs: AddictionLog[];
  goals: Goal[];
  currentDate: string; // YYYY-MM-DD
}

export interface NightReflection {
  mood: Mood;
  followedFocus: boolean;
  win: string;
  regret: string;
  gratitude: string;
  smokedToday: boolean;
  impulseBuy: boolean;
  resistedCraving: boolean;
  regretSpendAmount?: number;
}
