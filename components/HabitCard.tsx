
import React, { useState, useEffect, useRef } from 'react';
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
  todayStr: string;
}

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
  const [animateBump, setAnimateBump] = useState(false);
  const isMounted = useRef(false);

  const isPositive = habit.type === 'positive';

  useEffect(() => {
    if (isMounted.current) {
      setAnimateBump(true);
      const timer = setTimeout(() => setAnimateBump(false), 300);
      return () => clearTimeout(timer);
    }
    isMounted.current = true;
  }, [isDone]);

  return (
    <Card 
        className={`bg-dark-card border-dark-border transition-all duration-500 ${isDone ? (isPositive ? 'border-emerald-500/30 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]' : 'border-red-500/30 shadow-[0_0_15px_-3px_rgba(239,68,68,0.1)]') : ''}`}
    >
        <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-4">
                <div className={`text-3xl filter drop-shadow-md transition-transform duration-500 ${isDone ? 'scale-110' : 'scale-100'}`}>{habit.icon}</div>
                <div>
                    <h3 className="text-sm font-black text-dark-text uppercase tracking-wider">{habit.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        {/* Neutral, distinct streak display */}
                        <span className="text-[10px] font-black uppercase tracking-widest bg-dark-bg/80 text-dark-muted px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-dark-border shadow-inner">
                            <Flame size={12} className="text-gold-500/60" />
                            {streak} {streak === 1 ? 'Day' : 'Days'}
                        </span>
                    </div>
                </div>
            </div>

            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 flex items-center gap-2 active:scale-95 border ${
                    animateBump ? 'scale-110' : 'scale-100'
                } ${
                    isDone 
                    ? (isPositive 
                        ? 'bg-emerald-500 text-dark-bg border-emerald-500 shadow-lg shadow-emerald-500/20' 
                        : 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20')
                    : 'bg-transparent text-dark-muted border-dark-border hover:border-dark-text hover:bg-dark-bg'
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
                        {isPositive ? 'Mark Done' : 'No Indulgence'}
                    </>
                )}
            </button>
        </div>

        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center pt-2 mt-2 border-t border-dark-border/50 text-dark-muted hover:text-dark-text transition-colors"
        >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isExpanded && (
            <div className="pt-4 pb-2 px-2 animate-slide-up space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-dark-bg p-3 rounded-xl border border-dark-border">
                        <div className="flex items-center gap-2 mb-1 text-gold-500">
                            <Calendar size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-dark-muted">7-Day Log</span>
                        </div>
                        <span className="text-xl font-black text-dark-text">{weeklyCount} <span className="text-[10px] text-dark-muted">/ 7</span></span>
                    </div>
                    <div className="bg-dark-bg p-3 rounded-xl border border-dark-border">
                        <div className="flex items-center gap-2 mb-1 text-blue-400">
                            <TrendingUp size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-dark-muted">Streak Index</span>
                        </div>
                        <span className="text-xl font-black text-dark-text">{streak}</span>
                    </div>
                </div>

                <div>
                    <h4 className="text-[10px] text-dark-muted font-black uppercase tracking-widest mb-2 px-1">30-Day Protocol Performance</h4>
                    <div className="flex flex-wrap gap-1 bg-dark-bg/50 p-2 rounded-lg border border-dark-border/50">
                        {trend.map((day, i) => {
                            let bg = 'bg-dark-card border border-dark-border/30';
                            if (isPositive) {
                                if (day.status) bg = 'bg-emerald-500 border border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
                            } else {
                                if (day.status) bg = 'bg-red-500 border border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]';
                                else bg = 'bg-emerald-500/20 border border-emerald-500/20'; 
                            }
                            
                            const isToday = day.date === todayStr;

                            return (
                                <div 
                                    key={day.date} 
                                    className={`w-[9%] aspect-square rounded-[3px] transition-all duration-300 ${bg} ${isToday ? 'ring-1 ring-gold-500 ring-offset-1 ring-offset-dark-bg scale-110' : ''}`}
                                    title={day.date}
                                />
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-2 px-1 text-[8px] text-dark-muted font-black uppercase tracking-widest opacity-60">
                        <span>Month T-30</span>
                        <span>Today</span>
                    </div>
                </div>

                {onDelete && (
                    <div className="pt-2 border-t border-dark-border mt-2">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if(confirm("Are you sure you want to delete this habit? Statistics will be wiped.")) {
                                    onDelete();
                                }
                            }}
                            className="flex items-center gap-2 text-[10px] text-red-500/60 font-black uppercase tracking-widest hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={12} /> Wipe Protocol Data
                        </button>
                    </div>
                )}
            </div>
        )}
    </Card>
  );
};
