import React, { useState } from 'react';
import { AppState, Goal } from '../types';
import { Card, Button, Input, ProgressBar } from '../components/UI';
import { Target, Plus, CheckCircle2, Rocket, List, PiggyBank, ArrowRight, Minus, TrendingUp } from 'lucide-react';
import { generateId } from '../constants';

interface Props {
  state: AppState;
  onAddGoal: (goal: Goal) => void;
  onToggleGoal: (id: string) => void;
  onUpdateGoal: (id: string, data: Partial<Goal>) => void;
}

export default function Goals({ state, onAddGoal, onToggleGoal, onUpdateGoal }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'career' | 'bucket'>('career');
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({ title: '', reason: '' });

  const totalGoals = state.goals.length;
  const completedGoals = state.goals.filter(g => g.completed).length;
  const overallProgress = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);

  // --- Financial Context ---
  const habitTxns = state.transactions.filter(t => t.isHabit && t.type === 'EXPENSE');
  const totalHabitSpend = habitTxns.reduce((sum, t) => sum + t.amount, 0);

  const handleAdd = () => {
    if (!newGoal.title) return;
    onAddGoal({
      id: generateId(),
      title: newGoal.title!,
      reason: newGoal.reason || '',
      action: '',
      progress: 0,
      type: activeTab,
      completed: false,
    });
    setNewGoal({ title: '', reason: '' });
    setShowForm(false);
  };

  const adjustProgress = (e: React.MouseEvent, goal: Goal, delta: number) => {
      e.stopPropagation();
      const current = goal.progress || 0;
      const newProgress = Math.min(100, Math.max(0, current + delta));
      
      // Auto-complete at 100% if not already
      if (newProgress === 100 && !goal.completed) {
          onToggleGoal(goal.id);
      }
      // Re-open if decreased from 100%
      if (newProgress < 100 && goal.completed) {
          onToggleGoal(goal.id);
      }
      
      onUpdateGoal(goal.id, { progress: newProgress });
  };

  const filteredGoals = state.goals.filter(g => g.type === activeTab);

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <header className="flex justify-between items-end pt-2">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Vision</h1>
          <p className="text-[10px] text-dark-muted font-black uppercase tracking-[0.2em] mt-1">Goal Architecture</p>
        </div>
        <Button size="sm" className="rounded-xl h-10 px-4" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> New Goal
        </Button>
      </header>

      {/* Progress Dashboard */}
      <Card className="bg-zinc-900/50 border-dark-border p-5">
        <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-dark-bg" />
                    <circle 
                        cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" 
                        strokeDasharray={`${overallProgress}, 100`}
                        strokeLinecap="round"
                        className="text-gold-500 transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-black text-white">{overallProgress}%</span>
                    <span className="text-[7px] text-dark-muted font-black uppercase tracking-tighter">Total</span>
                </div>
            </div>
            <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-dark-muted font-black uppercase tracking-widest">Active Units</span>
                    <span className="text-xs font-black text-white">{totalGoals - completedGoals}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Mastered</span>
                    <span className="text-xs font-black text-emerald-500">{completedGoals}</span>
                </div>
                <div className="h-1 bg-dark-bg rounded-full overflow-hidden">
                    <div className="h-full bg-gold-500" style={{ width: `${overallProgress}%` }}></div>
                </div>
            </div>
        </div>
      </Card>

      {/* Financial Linkage */}
      {totalHabitSpend > 500 && (
          <div className="p-4 bg-gold-500/5 rounded-2xl border border-gold-500/20 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-500 shrink-0">
                  <PiggyBank size={20} />
              </div>
              <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gold-500 font-black uppercase tracking-widest mb-1">Redirection Alert</p>
                  <p className="text-xs text-dark-muted leading-tight">
                    ₹{totalHabitSpend.toLocaleString()} spent on leaks. Redirect this to fuel your vision.
                  </p>
              </div>
          </div>
      )}

      {/* Tabs */}
      <div className="flex bg-dark-card rounded-2xl p-1.5 border border-dark-border">
          <button 
             onClick={() => setActiveTab('career')}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'career' ? 'bg-gold-500 text-dark-bg shadow-xl' : 'text-dark-muted'}`}
          >
              <Rocket size={14} /> Focus
          </button>
          <button 
             onClick={() => setActiveTab('bucket')}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'bucket' ? 'bg-blue-500 text-white shadow-xl' : 'text-dark-muted'}`}
          >
              <List size={14} /> Bucket
          </button>
      </div>

      {showForm && (
        <Card className="animate-slide-up border-gold-500/30 bg-zinc-900">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-[10px] text-gold-500 font-black uppercase tracking-widest">Initialize New Objective</h3>
                <button onClick={() => setShowForm(false)} className="text-dark-muted hover:text-white transition-colors"><Plus size={20} className="rotate-45" /></button>
            </div>
            <Input 
              label="Goal Title" 
              placeholder="e.g., Master Data Structures" 
              value={newGoal.title} 
              onChange={e => setNewGoal({...newGoal, title: e.target.value})}
              className="bg-dark-bg"
            />
            <Input 
              label="The 'Why' (Motivation)" 
              placeholder="Why must you achieve this?" 
              value={newGoal.reason} 
              onChange={e => setNewGoal({...newGoal, reason: e.target.value})}
              className="bg-dark-bg"
            />
            <Button className="w-full h-12 font-black uppercase tracking-widest" onClick={handleAdd}>Commit to Vision</Button>
          </div>
        </Card>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.map(goal => (
          <div 
            key={goal.id} 
            className={`p-5 rounded-[24px] border transition-all duration-300 ${
              goal.completed 
                ? 'bg-emerald-500/5 border-emerald-500/20' 
                : 'bg-dark-card border-dark-border shadow-lg'
            }`}
          >
            <div className="flex items-start gap-4 mb-4">
                <button 
                    onClick={() => onToggleGoal(goal.id)}
                    className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 ${
                    goal.completed ? 'border-emerald-500 bg-emerald-500 text-dark-bg' : 'border-dark-muted hover:border-gold-500'
                }`}>
                    {goal.completed && <CheckCircle2 size={18} />}
                </button>
                
                <div className="flex-1 min-w-0">
                    <h3 className={`font-black text-sm uppercase tracking-wider truncate ${goal.completed ? 'text-emerald-500 line-through' : 'text-white'}`}>
                        {goal.title}
                    </h3>
                    {goal.reason && <p className="text-[10px] text-dark-muted font-bold mt-1 line-clamp-1 italic">"{goal.reason}"</p>}
                </div>
            </div>
            
            {/* Progress Interactive Section */}
            <div className="pl-11">
                <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-1.5">
                        <TrendingUp size={10} className={activeTab === 'career' ? 'text-gold-500' : 'text-blue-400'} />
                        <span className="text-[9px] text-dark-muted font-black uppercase tracking-widest">Momentum</span>
                    </div>
                    <span className="text-sm font-black text-white">{goal.progress || 0}%</span>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={(e) => adjustProgress(e, goal, -10)}
                        className="w-10 h-10 rounded-xl bg-dark-bg border border-dark-border flex items-center justify-center text-dark-muted hover:text-white transition-all active:scale-90"
                    >
                        <Minus size={14} />
                    </button>
                    
                    <div className="flex-1">
                        <ProgressBar 
                            progress={goal.progress || 0} 
                            color={activeTab === 'career' ? 'bg-gold-500' : 'bg-blue-500'} 
                        />
                    </div>
                    
                    <button 
                        onClick={(e) => adjustProgress(e, goal, 10)}
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all active:scale-90 ${activeTab === 'career' ? 'bg-gold-500/10 border-gold-500/30 text-gold-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>
          </div>
        ))}

        {filteredGoals.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
            <Target className="w-16 h-16 mb-4" />
            <p className="font-black uppercase tracking-widest text-xs">No active trajectories</p>
          </div>
        )}
      </div>
    </div>
  );
}
