
import React, { useState, useMemo } from 'react';
import { AppState, Screen, DailyEntry, Transaction, QuickAddPreset, ToDoItem, CategoryDef, HabitType, UserProfile } from '../types';
import { Card, Button, Input } from '../components/UI';
import { formatDate, DEFAULT_QUICK_ADDS, MOODS, generateId, getPromptForDate } from '../constants';
import { 
  Flame, Wallet, Plus, ChevronRight, Target, Zap, X, ShieldCheck, 
  Activity, CheckCircle2, LayoutList, Layers, ArrowRight, Sun, Moon,
  ChevronLeft, Trash2, AlertTriangle
} from 'lucide-react';
import QuickEntryModal from './QuickEntryModal';

interface Props {
  state: AppState;
  onNavigate: (screen: Screen) => void;
  onUpdateEntry: (date: string, data: Partial<DailyEntry>) => void;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
  onAddTransaction: (txn: Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  currentTheme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const resolveCategories = (state: AppState) => {
    if (state.profile.customCategories && state.profile.customCategories.length > 0) {
        return state.profile.customCategories.map(c => ({
            id: c.id,
            label: c.label as HabitType,
            price: c.price,
            unit: 'unit',
            icon: c.icon
        } as QuickAddPreset));
    }
    return DEFAULT_QUICK_ADDS;
};

const SCORE_COLORS = {
  0: '#18181b',
  1: '#7f1d1d',
  2: '#dc2626',
  3: '#f87171',
  4: '#c2410c',
  5: '#d97706',
  6: '#eab308',
  7: '#facc15',
  8: '#84cc16',
  9: '#22c55e',
  10: '#10b981'
};

const getScoreColor = (score: number) => {
  if (!score || score === 0) return SCORE_COLORS[0];
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  return (SCORE_COLORS as any)[clamped];
};

export default function Dashboard({ state, onNavigate, onAddTransaction, onUpdateEntry, onUpdateProfile, currentTheme, onToggleTheme }: Props) {
  const [selectedQuickAdd, setSelectedQuickAdd] = useState<QuickAddPreset | null>(null);
  const [historyDay, setHistoryDay] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const todayStr = formatDate(new Date());

  const categories = resolveCategories(state);

  // --- XP SYSTEM ---
  const XP_PER_LEVEL = 100 * state.profile.level;
  const XP_PER_TASK = 10;
  
  const addXp = (amount: number) => {
      let newXp = state.profile.xp + amount;
      let newLevel = state.profile.level;
      const xpNeeded = 100 * newLevel;
      if (newXp >= xpNeeded) {
          newXp = newXp - xpNeeded;
          newLevel++;
      }
      onUpdateProfile({ xp: newXp, level: newLevel });
  };

  const getManualScore = (dateStr: string) => {
      const entry = state.entries[dateStr];
      return entry?.rating || 0;
  };

  const todayScore = getManualScore(todayStr);
  const todayColor = getScoreColor(todayScore);
  const todayEntry = state.entries[todayStr] || { date: todayStr, todos: [], isLocked: false, rating: 0 };
  const todos = todayEntry.todos || [];
  const primaryTask = todos[0];
  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const todayTxns = state.transactions.filter(t => {
      return formatDate(new Date(t.timestamp)) === todayStr;
  });
  const todaySpendAmount = todayTxns.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);

  // --- SYSTEM STATUS LOGIC ---
  const systemEnergy = todayEntry.energy || 3;
  const dailyBudget = state.profile.dailyBudget || 500;
  const isBudgetCritical = todaySpendAmount > dailyBudget;
  const isEnergyCritical = systemEnergy <= 1;
  const isSystemNominal = !isBudgetCritical && !isEnergyCritical;

  const getSystemStatusText = () => {
      if (isEnergyCritical) return "SYSTEM COMPROMISED: LOW ENERGY";
      if (isBudgetCritical) return "SYSTEM ALERT: OVERSPENDING";
      return "SYSTEM NOMINAL";
  };

  const getSystemStatusColor = () => {
      if (isEnergyCritical || isBudgetCritical) return "bg-red-500 animate-pulse";
      return "bg-emerald-500 animate-pulse";
  };

  const handleTaskAdd = () => {
    if (!newTaskText.trim()) return;
    const item: ToDoItem = { id: generateId(), text: newTaskText, completed: false, priority: 'Medium' };
    onUpdateEntry(todayStr, { todos: [...todos, item] });
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    const task = todos.find(t => t.id === id);
    if (task && !task.completed) {
        addXp(XP_PER_TASK);
    }
    onUpdateEntry(todayStr, { todos: todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t) });
  };

  const deleteTask = (id: string) => {
    onUpdateEntry(todayStr, { todos: todos.filter(t => t.id !== id) });
  };

  const pulseGrid = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let m = 0; m < 30; m++) {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const monthName = firstDayOfMonth.toLocaleString('default', { month: 'long' });
      const year = firstDayOfMonth.getFullYear();
      const lastDay = new Date(year, firstDayOfMonth.getMonth() + 1, 0).getDate();
      const paddingStart = firstDayOfMonth.getDay();
      const dayList = [];
      for (let p = 0; p < paddingStart; p++) dayList.push(null);
      for (let d = 1; d <= lastDay; d++) {
        dayList.push(formatDate(new Date(year, firstDayOfMonth.getMonth(), d)));
      }
      months.push({ name: monthName, year, days: dayList });
    }
    return months;
  }, []);

  const streak = useMemo(() => {
    let count = 0;
    const sortedDates = Object.keys(state.entries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    for (const d of sortedDates) {
      const score = state.entries[d]?.rating || 0;
      if (score >= 5) count++; 
      else break;
    }
    return count;
  }, [state.entries]);

  const getDayFinanceLegacy = (date: string) => {
    const txns = state.transactions.filter(t => t.timestamp.startsWith(date));
    const spend = txns.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    return { spend };
  };

  const getDayTransactions = (date: string) => {
      return state.transactions.filter(t => t.timestamp.startsWith(date));
  };

  const historyEntry = historyDay ? state.entries[historyDay] : null;
  const historyScore = historyDay ? getManualScore(historyDay) : 0;
  const historyColor = historyDay ? getScoreColor(historyScore) : '#333';

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="flex justify-between items-start pt-2">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-dark-bg font-black shadow-xl ring-1 ring-gold-500/20 cursor-pointer relative"
            onClick={() => onNavigate('settings')}
          >
            {state.profile.name?.charAt(0) || 'S'}
            {/* Level Badge */}
            <div className="absolute -bottom-2 -right-2 bg-dark-bg border border-gold-500 text-gold-500 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                {state.profile.level}
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black text-dark-text tracking-tight leading-none uppercase">{state.profile.name || 'Seeker'}</h1>
            
            {/* XP Bar */}
            <div className="w-24 h-1 bg-dark-card rounded-full mt-2 overflow-hidden">
                <div 
                    className="h-full bg-gold-500 transition-all duration-500" 
                    style={{ width: `${(state.profile.xp / XP_PER_LEVEL) * 100}%` }}
                />
            </div>

            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5 transition-colors ${!isSystemNominal ? 'text-red-500' : 'text-dark-muted'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${getSystemStatusColor()}`}></span> 
              {getSystemStatusText()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
             <button 
                onClick={onToggleTheme} 
                className="w-10 h-10 rounded-2xl border bg-dark-card border-dark-border text-dark-muted flex items-center justify-center transition-all hover:border-gold-500 hover:text-gold-500"
             >
                 {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
             </button>
            <div className="bg-dark-card border border-dark-border px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-lg h-10">
                <Flame size={16} className="text-gold-500 fill-gold-500" />
                <span className="text-dark-text font-black text-sm">{streak}</span>
            </div>
        </div>
      </header>
      
      <section className="animate-slide-up relative">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-xs text-dark-muted uppercase tracking-[0.3em] font-black flex items-center gap-2">
            <Activity size={12} className="text-gold-500" /> Life Pulse Archive
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-dark-muted font-black uppercase tracking-widest">
            <ChevronLeft size={10} /> Swipe Months <ChevronRight size={10} />
          </div>
        </div>
        
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide px-1">
          {pulseGrid.map((month, idx) => (
            <Card 
              key={`${month.name}-${month.year}-${idx}`} 
              className="min-w-[280px] w-[85%] snap-center bg-dark-card/50 border-dark-border p-5 shadow-2xl shrink-0"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col">
                  <p className="text-xs font-black text-gold-500 uppercase tracking-[0.2em]">{month.name}</p>
                  <p className="text-[10px] text-dark-muted font-bold uppercase mt-0.5">{month.year}</p>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {['S','M','T','W','T','F','S'].map((day, i) => (
                  <div key={i} className="text-[10px] text-dark-muted font-black text-center mb-1">{day}</div>
                ))}
                {month.days.map((date, dayIdx) => {
                  if (date === null) return <div key={`pad-${dayIdx}`} className="aspect-square opacity-0" />;
                  const score = getManualScore(date);
                  const color = getScoreColor(score);
                  const isFuture = date > todayStr;
                  const isToday = date === todayStr;
                  const hasScore = score > 0;
                  const dayNum = new Date(date).getDate();
                  
                  return (
                    <button 
                      key={date}
                      disabled={isFuture}
                      onClick={() => setHistoryDay(date)}
                      style={{ 
                          backgroundColor: isFuture ? 'transparent' : (hasScore ? color : 'transparent'),
                          borderColor: (isFuture || !hasScore) ? 'var(--border-color)' : color,
                          color: hasScore ? (score > 6 ? '#000' : '#fff') : 'var(--text-muted)'
                      }}
                      className={`aspect-square rounded-sm border transition-all duration-300 flex items-center justify-center relative
                        ${isFuture ? 'cursor-not-allowed border-transparent' : 'hover:scale-125 active:scale-95'} 
                        ${isToday ? 'ring-2 ring-gold-500 ring-offset-2 ring-offset-dark-bg scale-110 shadow-lg' : ''}
                      `}
                    >
                        <span className={`text-[10px] font-bold ${hasScore ? 'opacity-90' : 'opacity-40'}`}>{dayNum}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Card 
          className={`border-dark-border cursor-pointer active:scale-[0.97] transition-all p-5 shadow-xl hover:border-gold-500/30 ${isBudgetCritical ? 'bg-red-500/10 border-red-500/50' : 'bg-dark-card'}`}
          onClick={() => onNavigate('finance')}
        >
          <div className={`flex justify-between items-start mb-6 ${isBudgetCritical ? 'text-red-500' : 'text-gold-500'}`}>
             <div className={`p-1.5 rounded-lg border ${isBudgetCritical ? 'bg-red-500/20 border-red-500' : 'bg-gold-500/10 border-gold-500/20'}`}>
                 {isBudgetCritical ? <AlertTriangle size={16} /> : <Wallet size={16} />}
             </div>
             <ChevronRight size={14} className="text-dark-muted" />
          </div>
          <div className="text-2xl font-black tracking-tight text-dark-text">₹{todaySpendAmount}</div>
          <p className="text-[10px] text-dark-muted uppercase font-black tracking-[0.15em] mt-1.5">Today Spent</p>
        </Card>

        <Card 
          className="bg-dark-card border-dark-border cursor-pointer active:scale-[0.97] transition-all p-5 shadow-xl hover:border-white/30 relative overflow-hidden"
          onClick={() => onNavigate('journal')}
          style={{ borderColor: todayScore > 0 ? todayColor : 'var(--border-color)' }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gold-500/20 to-transparent opacity-10 rounded-full blur-xl -mr-4 -mt-4"></div>
          <div className="flex justify-between items-start mb-6" style={{ color: todayScore > 0 ? todayColor : 'var(--text-muted)' }}>
             <div className="p-1.5 bg-white/5 rounded-lg border border-white/10"><ShieldCheck size={16} /></div>
             <ChevronRight size={14} className="text-dark-muted" />
          </div>
          <div className="text-2xl font-black tracking-tight text-dark-text flex items-end gap-1">
            {todayScore > 0 ? todayScore : '-'} <span className="text-[10px] text-dark-muted font-bold opacity-60 mb-1">/ 10</span>
          </div>
          <p className="text-[10px] text-dark-muted uppercase font-black tracking-[0.15em] mt-1.5">Discipline Index</p>
        </Card>
      </div>
      
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs text-dark-muted uppercase tracking-[0.3em] font-black flex items-center gap-2">
            <LayoutList size={12} className="text-gold-500" /> Mission Objectives
          </h3>
          <span className="text-[10px] text-gold-500 font-bold uppercase tracking-widest">{completedCount}/{totalCount} Done</span>
        </div>

        <div className="w-full h-1 bg-dark-card rounded-full overflow-hidden">
            <div className="h-full bg-gold-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>

        {primaryTask ? (
            <Card 
                className={`relative overflow-hidden border border-gold-500/30 active:scale-[0.99] transition-all p-5 bg-gradient-to-br from-dark-card to-dark-bg group`}
            >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gold-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-gold-500/10 transition-colors"></div>
                <div className="flex items-start gap-4 relative z-10">
                    <button 
                        onClick={() => toggleTask(primaryTask.id)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 shadow-lg transition-all mt-1 ${primaryTask.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-white'}`}
                    >
                        {primaryTask.completed ? <CheckCircle2 size={16} /> : <Target size={16} />}
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap size={10} className="fill-gold-500 text-gold-500" /> 
                            <span className="text-[10px] text-gold-500 font-black uppercase tracking-[0.2em]">Commander's Intent</span>
                        </div>
                        <p className={`text-base font-bold leading-tight ${primaryTask.completed ? 'line-through text-dark-muted' : 'text-dark-text'}`}>
                            {primaryTask.text}
                        </p>
                        {primaryTask.completed && <p className="text-[10px] text-emerald-500 font-bold mt-1 uppercase tracking-widest">Objective Secured (+{XP_PER_TASK} XP)</p>}
                    </div>
                </div>
            </Card>
        ) : (
            <div className="py-8 border border-dashed border-dark-border rounded-2xl flex flex-col items-center justify-center text-dark-muted opacity-40">
                <Target size={24} className="mb-2" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Deploy Primary Mission</p>
            </div>
        )}

        <div className="space-y-2">
            {todos.slice(1).map(todo => (
                <div key={todo.id} className={`flex items-center gap-3 p-3 bg-dark-card border border-dark-border rounded-xl group transition-all ${todo.completed ? 'opacity-40' : 'hover:border-zinc-500'}`}>
                    <button 
                        onClick={() => toggleTask(todo.id)}
                        className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all ${todo.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-dark-muted bg-dark-bg group-hover:border-gold-500'}`}
                    >
                        {todo.completed && <CheckCircle2 size={10} />}
                    </button>
                    <span className={`flex-1 text-sm font-medium truncate ${todo.completed ? 'line-through text-dark-muted' : 'text-dark-text'}`}>{todo.text}</span>
                    <button onClick={() => deleteTask(todo.id)} className="opacity-0 group-hover:opacity-100 p-1 text-dark-muted hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                </div>
            ))}
            
            <div className="relative mt-2">
                <div className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-xl px-3 py-1 focus-within:border-gold-500/50 focus-within:ring-1 focus-within:ring-gold-500/20 transition-all">
                    <Plus size={16} className="text-dark-muted" />
                    <Input 
                        placeholder="Add new directive..." 
                        value={newTaskText} 
                        onChange={e => setNewTaskText(e.target.value)} 
                        onKeyPress={e => e.key === 'Enter' && handleTaskAdd()}
                        className="h-10 bg-transparent border-none text-sm placeholder:text-dark-muted/40 focus:ring-0 px-0"
                    />
                    {newTaskText.length > 0 && (
                        <button 
                            onClick={handleTaskAdd}
                            className="p-1.5 bg-gold-500 text-dark-bg rounded-lg hover:bg-gold-400 transition-colors"
                        >
                            <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
           <div>
              <h3 className="text-xs text-dark-muted uppercase tracking-[0.3em] font-black flex items-center gap-2">
                <Layers size={12} className="text-gold-500" /> Logistics
              </h3>
           </div>
           <button onClick={() => onNavigate('finance')} className="flex items-center gap-1 text-[10px] text-gold-500 font-black uppercase tracking-widest hover:text-dark-text transition-colors">
              Full Ledger <ChevronRight size={10} />
           </button>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {categories.slice(0, 7).map(item => {
            const price = state.profile.habitOverrides?.[item.id] ?? item.price;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedQuickAdd(item)}
                className="aspect-[4/5] bg-dark-card rounded-2xl border border-dark-border flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:border-gold-500/50 hover:bg-dark-bg group relative"
              >
                <div className="text-2xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {item.icon === 'cigarette' ? '🚬' : item.icon === 'burger' ? '🍔' : item.icon === 'coffee' ? '☕' : item.icon === 'car' ? '🚕' : item.icon}
                </div>
                
                <div className="text-center">
                    <span className="block text-[10px] font-black text-dark-text">₹{price}</span>
                    <span className="block text-[10px] font-bold text-dark-muted uppercase tracking-wider mt-0.5 truncate w-14">{item.label}</span>
                </div>
              </button>
            );
          })}
          
          <button 
             onClick={() => onNavigate('finance')}
             className="aspect-[4/5] bg-dark-card rounded-2xl border border-dashed border-dark-border flex flex-col items-center justify-center gap-2 active:scale-95 transition-all text-dark-muted hover:text-dark-text hover:border-zinc-500"
          >
            <div className="w-8 h-8 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center">
                <Plus size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Manual</span>
          </button>
        </div>
      </section>

      {historyDay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-md relative bg-dark-bg border border-dark-border rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="flex items-center justify-between p-6 border-b border-dark-border bg-dark-card/50 backdrop-blur-md z-20">
                 <div>
                    <h2 className="text-xl font-black text-dark-text uppercase tracking-tight">
                        {new Date(historyDay).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
                    </h2>
                    <p className="text-[10px] text-dark-muted font-bold uppercase tracking-widest opacity-60">
                        {new Date(historyDay).getFullYear()} Archive
                    </p>
                 </div>
                 <button onClick={() => setHistoryDay(null)} className="w-10 h-10 rounded-full bg-dark-card flex items-center justify-center text-dark-muted hover:text-dark-text transition-colors">
                    <X size={20}/>
                 </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-8 scrollbar-hide">
                <div className="flex items-center gap-6">
                     <div 
                        className="w-24 h-24 rounded-[30px] shrink-0 flex items-center justify-center text-4xl font-black shadow-2xl border-t border-white/20 transition-all"
                        style={{ backgroundColor: historyColor, textShadow: '0 2px 10px rgba(0,0,0,0.3)', color: historyScore > 6 ? '#000' : '#fff' }}
                     >
                        {historyScore > 0 ? historyScore : '-'}
                    </div>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                        <div className="bg-dark-card p-3 rounded-2xl border border-dark-border">
                             <span className="text-[10px] font-black uppercase text-dark-muted block mb-1">Energy</span>
                             <div className="flex gap-0.5 items-end h-4">
                                {[1,2,3,4,5].map(l => (
                                    <div key={l} className={`w-1 rounded-sm ${l <= (historyEntry?.energy || 0) ? 'bg-gold-500' : 'bg-dark-border'}`} style={{ height: `${l*20}%`}}></div>
                                ))}
                             </div>
                        </div>
                        <div className="bg-dark-card p-3 rounded-2xl border border-dark-border">
                             <span className="text-[10px] font-black uppercase text-dark-muted block mb-1">Spent</span>
                             <span className="text-lg font-black text-dark-text">₹{getDayFinanceLegacy(historyDay).spend}</span>
                        </div>
                        <div className="col-span-2 bg-dark-card p-3 rounded-2xl border border-dark-border flex items-center justify-between">
                             <span className="text-[10px] font-black uppercase text-dark-muted">Mood</span>
                             <span className="text-xl">{MOODS.find(m => m.value === historyEntry?.mood)?.label || '😶'}</span>
                        </div>
                    </div>
                </div>

                {/* Habits in Modal */}
                {state.profile.habits && state.profile.habits.length > 0 && (
                    <section>
                         <h3 className="text-[10px] text-dark-muted font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Flame size={12} className="text-gold-500"/> Habit Protocol
                         </h3>
                         <div className="grid grid-cols-2 gap-2">
                            {state.profile.habits.map(habit => {
                                const status = historyEntry?.habitStatus?.[habit.id];
                                const isPositive = habit.type === 'positive';
                                
                                let colorClass = 'bg-dark-card border-dark-border text-zinc-500';
                                let icon = null;

                                if (isPositive) {
                                    if (status) { colorClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'; icon = <CheckCircle2 size={14}/>; }
                                    else { colorClass = 'bg-dark-card border-dark-border text-zinc-400 opacity-60'; icon = <X size={14}/>; }
                                } else {
                                    if (status) { colorClass = 'bg-red-500/10 border-red-500/30 text-red-500'; icon = <Activity size={14}/>; } 
                                    else { colorClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'; icon = <ShieldCheck size={14}/>; }
                                }

                                return (
                                    <div key={habit.id} className={`flex items-center justify-between p-3 rounded-xl border ${colorClass}`}>
                                        <div className="flex items-center gap-2">
                                            <span>{habit.icon}</span>
                                            <span className="text-[10px] font-bold uppercase">{habit.title}</span>
                                        </div>
                                        {icon}
                                    </div>
                                )
                            })}
                         </div>
                    </section>
                )}
            </div>
          </div>
        </div>
      )}

      {selectedQuickAdd && (
          <QuickEntryModal preset={selectedQuickAdd} state={state} onClose={() => setSelectedQuickAdd(null)} onSave={(txn) => { onAddTransaction(txn); setSelectedQuickAdd(null); }} />
      )}
    </div>
  );
}
