
import React, { useState, useMemo } from 'react';
import { AppState, Screen, DailyEntry, Transaction, QuickAddPreset, ToDoItem } from '../types';
import { Card, Button, Input } from '../components/UI';
import { formatDate, DEFAULT_QUICK_ADDS, MOODS, generateId } from '../constants';
import { 
  Flame, Wallet, Plus, ChevronRight, Target, Zap, X, ShieldCheck, 
  Activity, CheckCircle2, IndianRupee, ChevronLeft, Trash2, LayoutList
} from 'lucide-react';
import QuickEntryModal from './QuickEntryModal';

interface Props {
  state: AppState;
  onNavigate: (screen: Screen) => void;
  onUpdateEntry: (date: string, data: Partial<DailyEntry>) => void;
  onAddTransaction: (txn: Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string }) => void;
}

export default function Dashboard({ state, onNavigate, onAddTransaction, onUpdateEntry }: Props) {
  const [selectedQuickAdd, setSelectedQuickAdd] = useState<QuickAddPreset | null>(null);
  const [historyDay, setHistoryDay] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const todayStr = formatDate(new Date());

  const getRatingStyle = (rating: number | undefined) => {
    if (!rating) return 'bg-zinc-800/10 border-zinc-800/30';
    if (rating <= 2) return 'bg-red-950 border-red-700 shadow-[inset_0_0_8px_rgba(153,27,27,0.4)]';
    if (rating <= 4) return 'bg-red-500/80 border-red-400';
    if (rating <= 6) return 'bg-amber-500/80 border-amber-400';
    if (rating <= 8) return 'bg-emerald-500/80 border-emerald-400';
    return 'bg-gold-500 border-gold-300 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-110 ring-1 ring-white/20 z-10';
  };

  const todayEntry = state.entries[todayStr] || { date: todayStr, todos: [], isLocked: false, rating: 5 };
  const todos = todayEntry.todos || [];
  const primaryTask = todos[0];

  const handleTaskAdd = () => {
    if (!newTaskText.trim()) return;
    const item: ToDoItem = { id: generateId(), text: newTaskText, completed: false, priority: 'Medium' };
    onUpdateEntry(todayStr, { todos: [...todos, item] });
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
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
      if (state.entries[d].isLocked) count++;
      else break;
    }
    return count;
  }, [state.entries]);

  const getDayFinance = (date: string) => {
    const txns = state.transactions.filter(t => t.timestamp.startsWith(date));
    const spend = txns.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    return { spend };
  };

  const todayFinance = getDayFinance(todayStr);
  const budgetLimit = state.profile.dailyBudget || 500;
  const budgetLeft = budgetLimit - todayFinance.spend;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <header className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-dark-bg font-black shadow-xl ring-1 ring-gold-500/20 cursor-pointer"
            onClick={() => onNavigate('settings')}
          >
            {state.profile.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">{state.profile.name || 'Seeker'}</h1>
            <p className="text-[9px] text-dark-muted font-bold uppercase tracking-[0.3em] mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> SYSTEM NOMINAL
            </p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-dark-border px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-lg">
          <Flame size={16} className="text-gold-500 fill-gold-500" />
          <span className="text-white font-black text-sm">{streak}</span>
        </div>
      </header>

      {/* Pulse Archive */}
      <section className="animate-slide-up relative">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-[10px] text-dark-muted uppercase tracking-[0.4em] font-black flex items-center gap-2">
            <Activity size={12} className="text-gold-500" /> Life Pulse Archive
          </h3>
          <div className="flex items-center gap-2 text-[8px] text-dark-muted font-black uppercase tracking-widest">
            <ChevronLeft size={10} /> Swipe Months <ChevronRight size={10} />
          </div>
        </div>
        
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide px-1">
          {pulseGrid.map((month, idx) => (
            <Card 
              key={`${month.name}-${month.year}-${idx}`} 
              className="min-w-[280px] w-[85%] snap-center bg-zinc-950/40 border-dark-border p-5 shadow-2xl shrink-0"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col">
                  <p className="text-xs font-black text-gold-500 uppercase tracking-[0.2em]">{month.name}</p>
                  <p className="text-[8px] text-zinc-700 font-bold uppercase mt-0.5">{month.year}</p>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {['S','M','T','W','T','F','S'].map((day, i) => (
                  <div key={i} className="text-[7px] text-zinc-800 font-black text-center mb-1">{day}</div>
                ))}
                {month.days.map((date, dayIdx) => {
                  if (date === null) return <div key={`pad-${dayIdx}`} className="aspect-square opacity-0" />;
                  const entry = state.entries[date];
                  const isFuture = new Date(date) > new Date();
                  const isToday = date === todayStr;
                  return (
                    <button 
                      key={date}
                      disabled={isFuture}
                      onClick={() => setHistoryDay(date)}
                      className={`aspect-square rounded-md border transition-all duration-300
                        ${getRatingStyle(entry?.rating)} 
                        ${isFuture ? 'opacity-5 cursor-not-allowed border-transparent' : 'hover:scale-110 active:scale-95'} 
                        ${isToday ? 'ring-1 ring-white ring-offset-2 ring-offset-dark-bg scale-105 shadow-[0_0_10px_rgba(255,255,255,0.2)]' : ''}`}
                    />
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Vitals */}
      <div className="grid grid-cols-2 gap-4">
        <Card 
          className="bg-zinc-950/50 border-dark-border cursor-pointer active:scale-[0.97] transition-all p-5 shadow-xl hover:border-gold-500/30"
          onClick={() => onNavigate('finance')}
        >
          <div className="flex justify-between items-start mb-6 text-gold-500">
             <div className="p-1.5 bg-gold-500/10 rounded-lg border border-gold-500/20"><Wallet size={16} /></div>
             <ChevronRight size={14} className="text-dark-muted" />
          </div>
          <div className={`text-2xl font-black tracking-tight ${budgetLeft < 0 ? 'text-red-500' : 'text-white'}`}>₹{budgetLeft}</div>
          <p className="text-[8px] text-dark-muted uppercase font-black tracking-[0.15em] mt-1.5">Ammo Remaining</p>
        </Card>

        <Card 
          className="bg-zinc-950/50 border-dark-border cursor-pointer active:scale-[0.97] transition-all p-5 shadow-xl hover:border-emerald-500/30"
          onClick={() => onNavigate('journal')}
        >
          <div className="flex justify-between items-start mb-6 text-emerald-400">
             <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><ShieldCheck size={16} /></div>
             <ChevronRight size={14} className="text-dark-muted" />
          </div>
          <div className="text-2xl font-black tracking-tight text-white">
            {todayEntry?.rating || '--'} <span className="text-[10px] text-dark-muted font-bold opacity-60">/ 10</span>
          </div>
          <p className="text-[8px] text-dark-muted uppercase font-black tracking-[0.15em] mt-1.5">Discipline Index</p>
        </Card>
      </div>

      {/* MISSION FOCUS & TODO LIST (Consolidated "Better Way") */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] text-dark-muted uppercase tracking-[0.3em] font-black flex items-center gap-2">
            <LayoutList size={12} className="text-gold-500" /> Mission Objectives
          </h3>
          <span className="text-[9px] text-gold-500 font-bold uppercase tracking-widest">{todos.filter(t => t.completed).length}/{todos.length} Done</span>
        </div>

        {/* Commander's Intent (First/Primary Task) */}
        {primaryTask ? (
            <Card 
                className={`relative overflow-hidden border-gold-500/30 active:scale-[0.98] transition-all p-6 bg-zinc-900/40 ${primaryTask.completed ? 'opacity-50' : 'ring-1 ring-gold-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]'}`}
            >
                <div className="flex items-center gap-5">
                    <button 
                        onClick={() => toggleTask(primaryTask.id)}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 shadow-lg transition-all ${primaryTask.completed ? 'bg-emerald-500 border-emerald-500 text-dark-bg' : 'bg-gold-500/5 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-dark-bg'}`}
                    >
                        {primaryTask.completed ? <CheckCircle2 size={24} /> : <Target size={24} />}
                    </button>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-[8px] text-gold-500 font-black uppercase tracking-[0.25em] mb-1.5 flex items-center gap-1.5">
                            <Zap size={10} className="fill-gold-500" /> Commander's Intent
                        </h4>
                        <p className={`text-lg font-black leading-tight truncate ${primaryTask.completed ? 'line-through text-dark-muted' : 'text-white'}`}>
                            {primaryTask.text}
                        </p>
                    </div>
                </div>
            </Card>
        ) : (
            <div className="py-12 border border-dashed border-dark-border rounded-[32px] flex flex-col items-center justify-center text-dark-muted opacity-30">
                <Target size={32} className="mb-2" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Deploy First Mission</p>
            </div>
        )}

        {/* Operational List */}
        <div className="space-y-2.5">
            {todos.slice(1).map(todo => (
                <div key={todo.id} className={`flex items-center gap-4 p-4 bg-zinc-950 border border-dark-border rounded-2xl group transition-all ${todo.completed ? 'opacity-40' : 'hover:border-zinc-700'}`}>
                    <button 
                        onClick={() => toggleTask(todo.id)}
                        className={`w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all ${todo.completed ? 'bg-emerald-500 border-emerald-500 text-dark-bg' : 'border-dark-border group-hover:border-gold-500'}`}
                    >
                        {todo.completed && <CheckCircle2 size={12} />}
                    </button>
                    <span className={`flex-1 text-sm font-bold truncate ${todo.completed ? 'line-through text-dark-muted' : 'text-white'}`}>{todo.text}</span>
                    <button onClick={() => deleteTask(todo.id)} className="opacity-0 group-hover:opacity-100 p-1 text-dark-muted hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                </div>
            ))}
            
            {/* Quick Add Mission */}
            <div className="flex gap-2 mt-4">
                <Input 
                    placeholder="New Objective..." 
                    value={newTaskText} 
                    onChange={e => setNewTaskText(e.target.value)} 
                    onKeyPress={e => e.key === 'Enter' && handleTaskAdd()}
                    className="h-12 bg-zinc-950 border-dark-border text-sm placeholder:text-dark-muted/40"
                />
                <button 
                    onClick={handleTaskAdd}
                    className="h-12 w-12 rounded-xl bg-gold-500 text-dark-bg flex items-center justify-center active:scale-90 transition-all shadow-xl shadow-gold-500/10"
                >
                    <Plus size={20} />
                </button>
            </div>
        </div>
      </section>

      {/* Log Action */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-[10px] text-dark-muted uppercase tracking-[0.3em] font-black">Log Action</h3>
          <button onClick={() => onNavigate('finance')} className="text-[9px] text-gold-500 font-black uppercase tracking-widest hover:underline">Full Ledger</button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
          {DEFAULT_QUICK_ADDS.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedQuickAdd(item)}
              className="flex-shrink-0 flex flex-col items-center gap-4 p-6 w-24 rounded-[40px] bg-zinc-950 border border-dark-border hover:border-gold-500/30 active:scale-95 transition-all shadow-xl"
            >
              <span className="text-3xl filter drop-shadow-md">{item.icon === 'cigarette' ? '🚬' : item.icon === 'burger' ? '🍔' : item.icon === 'coffee' ? '☕' : '🚕'}</span>
              <span className="text-[8px] font-black text-white uppercase tracking-[0.1em]">{item.label}</span>
            </button>
          ))}
          <button 
             onClick={() => onNavigate('finance')}
             className="flex-shrink-0 flex flex-col items-center justify-center p-6 w-24 rounded-[40px] bg-gold-500/5 border border-dashed border-gold-500/20 text-gold-500 active:scale-95 transition-all hover:bg-gold-500/10"
          >
            <Plus size={24} />
            <span className="text-[8px] font-black uppercase tracking-[0.1em] mt-2">More</span>
          </button>
        </div>
      </section>

      {/* History Modal */}
      {historyDay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/98 backdrop-blur-2xl animate-fade-in">
          <div className="w-full max-w-sm relative bg-zinc-950 border border-zinc-800 rounded-[48px] p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <button onClick={() => setHistoryDay(null)} className="absolute top-8 right-8 text-dark-muted hover:text-white transition-colors p-2 z-10"><X size={28}/></button>
            <div className="flex flex-col items-center text-center mb-8 relative z-10">
                <div className={`w-24 h-24 rounded-[36px] flex items-center justify-center text-4xl font-black mb-6 shadow-2xl border-t border-white/20 ${getRatingStyle(state.entries[historyDay]?.rating)}`}>
                    {state.entries[historyDay]?.rating || '--'}
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                    {new Date(historyDay).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
            </div>
            <div className="space-y-4 relative z-10">
                <Card className="bg-white/5 border-zinc-800 p-5 rounded-[24px]">
                    <p className="text-[9px] text-dark-muted font-black uppercase tracking-widest mb-2">Objectives Met</p>
                    <span className="text-xl font-black text-white">{state.entries[historyDay]?.todos?.filter(t => t.completed).length || 0} / {state.entries[historyDay]?.todos?.length || 0}</span>
                </Card>
                <Button variant="secondary" className="w-full h-14 mt-4 font-black uppercase tracking-[0.2em] rounded-[24px]" onClick={() => setHistoryDay(null)}>Close Archive</Button>
            </div>
          </div>
        </div>
      )}

      {selectedQuickAdd && (
          <QuickEntryModal
            preset={selectedQuickAdd} state={state} onClose={() => setSelectedQuickAdd(null)}
            onSave={(txn) => { onAddTransaction(txn); setSelectedQuickAdd(null); }}
          />
      )}
    </div>
  );
}
