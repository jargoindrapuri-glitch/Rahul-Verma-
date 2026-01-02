
import React, { useState } from 'react';
import { AppState, DailyEntry, HabitDef, UserProfile } from '../types';
import { HabitCard } from '../components/HabitCard';
import { formatDate, generateId } from '../constants';
import { Plus, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';

interface Props {
  state: AppState;
  onUpdateEntry: (date: string, data: Partial<DailyEntry>) => void;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
}

export default function Habits({ state, onUpdateEntry, onUpdateProfile }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const todayStr = state.currentDate;
  const habits = state.profile.habits || [];
  const habitStatus = state.entries[todayStr]?.habitStatus || {};

  const toggleHabit = (id: string) => {
    const currentStatus = habitStatus[id];
    const newStatus = !currentStatus;
    
    onUpdateEntry(todayStr, {
      habitStatus: {
        ...habitStatus,
        [id]: newStatus
      }
    });
  };

  const handleAddHabit = (habit: Omit<HabitDef, 'id'>) => {
      const newHabit: HabitDef = {
          id: generateId(),
          ...habit
      };
      const updatedHabits = [...habits, newHabit];
      onUpdateProfile({ habits: updatedHabits });
      setShowAddModal(false);
  };

  const handleDeleteHabit = (id: string) => {
      const updatedHabits = habits.filter(h => h.id !== id);
      onUpdateProfile({ habits: updatedHabits });
  };

  // Analytics Helpers
  const getStreak = (habit: HabitDef) => {
    let streak = 0;
    // Check backwards from yesterday
    const d = new Date(todayStr);
    d.setDate(d.getDate() - 1);
    
    // Safety break loop
    for (let i = 0; i < 365; i++) {
        const dateKey = formatDate(d);
        const entry = state.entries[dateKey];
        const status = entry?.habitStatus?.[habit.id];

        if (habit.type === 'positive') {
            // Positive Streak: Consecutive days Done
            if (status) streak++;
            else break;
        } else {
            // Negative Streak: Consecutive days Not Done
            // Note: If entry doesn't exist, we assume "Not Done" (Good for negative habits)
            if (!status) streak++;
            else break;
        }
        d.setDate(d.getDate() - 1);
    }
    
    // Add today to streak if condition met
    const todayStatus = habitStatus[habit.id];
    if (habit.type === 'positive' && todayStatus) streak++;
    if (habit.type === 'negative' && !todayStatus) streak++;

    return streak;
  };

  const getWeeklyCount = (habitId: string) => {
      let count = 0;
      const d = new Date(todayStr);
      for(let i=0; i<7; i++) {
          const dateKey = formatDate(d);
          if (state.entries[dateKey]?.habitStatus?.[habitId]) count++;
          d.setDate(d.getDate() - 1);
      }
      return count;
  };

  const getMonthlyTrend = (habit: HabitDef) => {
      const days = [];
      const d = new Date(todayStr);
      // Get last 30 days reversed (oldest to newest)
      for(let i=0; i<30; i++) {
          const dateKey = formatDate(d);
          const status = state.entries[dateKey]?.habitStatus?.[habit.id];
          days.push({ date: dateKey, status: !!status }); // Ensure boolean
          d.setDate(d.getDate() - 1);
      }
      return days.reverse();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <header className="pt-2 flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-black text-dark-text tracking-tight">Habit Logs</h1>
            <p className="text-[10px] text-dark-muted font-black uppercase tracking-[0.2em] mt-1">Consistency Tracker</p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)} className="h-10 px-4 rounded-xl">
            <Plus size={18} /> New
        </Button>
      </header>

      <div className="space-y-4">
        {habits.map(habit => (
            <HabitCard 
                key={habit.id}
                habit={habit}
                isDone={!!habitStatus[habit.id]}
                onToggle={() => toggleHabit(habit.id)}
                onDelete={() => handleDeleteHabit(habit.id)}
                streak={getStreak(habit)}
                weeklyCount={getWeeklyCount(habit.id)}
                trend={getMonthlyTrend(habit)}
                todayStr={todayStr}
            />
        ))}

        {habits.length === 0 && (
            <div className="text-center py-10 opacity-50">
                <p className="text-dark-muted">No habits configured.</p>
            </div>
        )}
      </div>

      {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} onSave={handleAddHabit} />}
    </div>
  );
}

// Local Component for Adding Habit
function AddHabitModal({ onClose, onSave }: { onClose: () => void, onSave: (h: Omit<HabitDef, 'id'>) => void }) {
    const [data, setData] = useState<{ title: string, icon: string, type: 'positive' | 'negative' }>({
        title: '',
        icon: '⚡',
        type: 'positive'
    });

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <Card className="w-full max-w-sm bg-dark-bg border-gold-500 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-dark-muted hover:text-white"><X size={20} /></button>
                <h3 className="text-lg font-black text-dark-text uppercase tracking-widest mb-6">New Habit</h3>
                
                <div className="space-y-5">
                    <Input label="Habit Name" value={data.title} onChange={e => setData({...data, title: e.target.value})} autoFocus placeholder="e.g. Read Books" />
                    
                    <div>
                        <label className="block text-xs text-dark-muted mb-1.5 uppercase tracking-wider">Habit Type</label>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setData({...data, type: 'positive'})}
                                className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${data.type === 'positive' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-dark-card border-dark-border text-dark-muted'}`}
                             >
                                 <ArrowUpRight size={20} />
                                 <span className="text-[10px] font-black uppercase">Build (Do it)</span>
                             </button>
                             <button 
                                onClick={() => setData({...data, type: 'negative'})}
                                className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${data.type === 'negative' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-dark-card border-dark-border text-dark-muted'}`}
                             >
                                 <ArrowDownRight size={20} />
                                 <span className="text-[10px] font-black uppercase">Quit (Avoid it)</span>
                             </button>
                        </div>
                    </div>

                    <Input label="Emoji Icon" value={data.icon} onChange={e => setData({...data, icon: e.target.value})} maxLength={2} className="text-center text-2xl" placeholder="⚡" />
                    
                    <Button className="w-full mt-2" onClick={() => onSave(data)} disabled={!data.title}>
                        Create Habit
                    </Button>
                </div>
            </Card>
        </div>
    );
}
