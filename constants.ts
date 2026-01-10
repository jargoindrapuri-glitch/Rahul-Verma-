
import { QuickAddPreset, HabitDef } from './types';
import { Cigarette, Cannabis, Beer, Coffee, Zap } from 'lucide-react';

export const INTENT_OPTIONS = [
  "Discipline",
  "Career",
  "Money",
  "Health",
  "Mindfulness"
];

export const DEFAULT_QUICK_ADDS: QuickAddPreset[] = [
  { id: 'qa1', label: 'Cigarettes', price: 18.00, unit: 'stick', icon: 'cigarette' },
  { id: 'qa2', label: 'Food', price: 80.00, unit: 'unit', icon: 'burger' },
  { id: 'qa3', label: 'Coffee', price: 20.00, unit: 'cup', icon: 'coffee' },
  { id: 'qa4', label: 'Travel', price: 50.00, unit: 'unit', icon: 'car' }
];

export const DEFAULT_HABITS: HabitDef[] = [
  { id: 'h1', title: 'Smoking', type: 'negative', icon: '🚬' },
  { id: 'h2', title: 'Alcohol', type: 'negative', icon: '🍺' },
  { id: 'h3', title: 'Gym', type: 'positive', icon: '💪' },
  { id: 'h4', title: 'Sleep < 12AM', type: 'positive', icon: '😴' },
];

export const ADDICTION_TRIGGERS = [
  "Stress",
  "Boredom",
  "Social",
  "Habit",
  "Craving"
];

export const MOODS = [
  { value: 'happy', label: '😄', color: 'text-green-400' },
  { value: 'good', label: '🙂', color: 'text-blue-400' },
  { value: 'neutral', label: '😐', color: 'text-gray-400' },
  { value: 'sad', label: '😔', color: 'text-indigo-400' },
  { value: 'angry', label: '😤', color: 'text-red-400' },
] as const;

export const DAILY_PROMPTS = [
  "Where did your time leak today?",
  "What is the one thing you are avoiding?",
  "Who did you help today?",
  "What would you do differently if you could restart today?",
  "What gave you energy today?",
  "What drained your energy today?"
];

export const getPromptForDate = (dateStr: string) => {
  const dayOfMonth = new Date(dateStr).getDate();
  return DAILY_PROMPTS[dayOfMonth % DAILY_PROMPTS.length];
};

export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
