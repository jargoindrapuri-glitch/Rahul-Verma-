
import React, { useState } from 'react';
import { HabitDef } from '../types';
import { Card } from './UI';
import { CheckCircle2, AlertCircle, Flame, Calendar, TrendingUp, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

interface TrendDay {
  date: string;
  status: boolean;
}

interface HabitCardProps {
  habit: HabitDef;
  isDone: boolean;
  streak: number;
  weeklyCount: number;
  trend: TrendDay[];
  onToggle: () => void;
  onDelete?: () => void;
  todayStr: string; // Used to highlight today in the grid
}

// Helper for consistent Red -> Yellow -> Green scale based on streak
const getStreakColor = (streak: number) => {
  if (streak < 3) return '#ef4444'; // Red (Low)
  if (streak < 7) return '#f59e0b'; // Yellow/Orange (Building)
  return '#10b981'; // Green (Established)
};

export const HabitCard: React.FC<HabitCardProps> = ({ 
  habit, 
  isDone, 
  streak, 
  weeklyCount, 
  trend, 
  onToggle, 
  onDelete,
  todayStr 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPositive = habit.type === 'positive';
  const streakColor = getStreakColor(streak);

  return (
    <Card 
        className={`bg-dark-card border-dark-border transition-all duration-300 ${isDone ? (isPositive ? 'border-emerald-500/30' : 'border-red-500/30') : ''}`}
    >
        {/* Main Card View */}
        <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-4">
                <div className="text-3xl filter drop-shadow-md">{habit.icon}</div>
                <div>
                    <h3 className="text-sm font-black text-dark-text uppercase tracking-wider">{habit.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        {/* Updated Streak Pill: Light background, Dark text, Colored Flame */}
                        <span className="text-[9px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-900 px-2 py-1 rounded-full flex items-center gap-1 shadow-sm border border-zinc-200">
                            <Flame size={12} color={streakColor} fill="currentColor" />
                            {streak} Day Streak
                        </span>
                    </div>
                </div>
            </div>

            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 active:scale-95 border ${
                    isDone 
                    ? (isPositive 
                        ? 'bg-emerald-500 text-dark-bg border-emerald-500' 
                        : 'bg-red-500 text-white border-red-500')
                    : 'bg-transparent text-dark-muted border-dark-border hover:border-dark-text'
                }`}
            >
                {isDone ? (
                    <>
                        {isPositive ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        {isPositive ? 'Completed' : 'Indulged'}
                    </>
                ) : (
                    <>
                        <div className="w-3.5 h-3.5 rounded-sm border border-current opacity-50"></div>
                        Mark Done
                    </>
                )}
            </button>
        </div>

        {/* Expand Toggle */}
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center pt-2 mt-2 border-t border-dark-border/50 text-dark-muted hover:text-dark-text transition-colors"
        >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Analytics Expansion */}
        {isExpanded && (
            <div className="pt-4 pb-2 px-2 animate-slide-up space-y-4">
                
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-dark-bg p-3 rounded-xl border border-dark-border">
                        <div className="flex items-center gap-2 mb-1 text-gold-500">
                            <Calendar size={14} />
                            <span className="text-[8px] font-black uppercase tracking-widest text-dark-muted">Weekly Count</span>
                        </div>
                        <span className="text-xl font-black text-dark-text">{weeklyCount} <span className="text-[10px] text-dark-muted">/ 7</span></span>
                    </div>
                    <div className="bg-dark-bg p-3 rounded-xl border border-dark-border">
                        <div className="flex items-center gap-2 mb-1 text-blue-400">
                            <TrendingUp size={14} />
                            <span className="text-[8px] font-black uppercase tracking-widest text-dark-muted">Current Streak</span>
                        </div>
                        <span className="text-xl font-black text-dark-text">{streak} <span className="text-[10px] text-dark-muted">Days</span></span>
                    </div>
                </div>

                {/* Monthly Trend Grid */}
                <div>
                    <h4 className="text-[9px] text-dark-muted font-black uppercase tracking-widest mb-2">30-Day Trend</h4>
                    <div className="flex flex-wrap gap-1">
                        {trend.map((day, i) => {
                            // Color Logic:
                            // Positive Habit: Done = Green (Good), Not Done = Gray (Neutral/Missed)
                            // Negative Habit: Done = Red (Bad), Not Done = Zinc-800/Green-Tint (Good)
                            let bg = 'bg-dark-bg border border-dark-border';
                            if (isPositive) {
                                if (day.status) bg = 'bg-emerald-500 border border-emerald-500';
                            } else {
                                if (day.status) bg = 'bg-red-500 border border-red-500';
                                else bg = 'bg-dark-bg border border-dark-border'; // Clean days for negative habits are neutral/good
                            }
                            
                            // Highlight today
                            const isToday = day.date === todayStr;

                            return (
                                <div 
                                    key={day.date} 
                                    className={`w-[9%] aspect-square rounded-sm ${bg} ${isToday ? 'ring-2 ring-gold-500' : ''}`}
                                    title={day.date}
                                />
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-1 text-[8px] text-dark-muted font-bold uppercase">
                        <span>30 Days Ago</span>
                        <span>Today</span>
                    </div>
                </div>

                {/* Delete Action */}
                {onDelete && (
                    <div className="pt-2 border-t border-dark-border mt-2">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if(confirm("Are you sure you want to delete this habit? History will remain but the tracker will be removed.")) {
                                    onDelete();
                                }
                            }}
                            className="flex items-center gap-2 text-[10px] text-red-500 font-black uppercase tracking-widest hover:text-red-400"
                        >
                            <Trash2 size={12} /> Delete Habit
                        </button>
                    </div>
                )}
            </div>
        )}
    </Card>
  );
};
