
import React, { useState } from 'react';
import { AppState, Goal, DailyEntry, Screen } from '../types';
import { Card, Button, Input } from '../components/UI';
import { Target, Plus, CheckCircle2, Rocket, ArrowRight, Minus, Zap, X, Trash2, Edit2 } from 'lucide-react';
import { generateId } from '../constants';

interface Props {
  state: AppState;
  onAddGoal: (g: Goal) => void;
  onUpdateGoal: (id: string, data: Partial<Goal>) => void;
  onToggleGoal: (id: string) => void;
  onUpdateEntry: (date: string, data: Partial<DailyEntry>) => void;
  onNavigate: (screen: Screen) => void;
}

export default function Goals({ state, onAddGoal, onUpdateGoal, onToggleGoal, onNavigate }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const goals = state.goals || [];

  const handleDelete = (id: string) => {
    if(confirm("Delete this objective?")) {
        // Since onDelete isn't passed, we filter in onUpdate or need a delete handler. 
        // For now, let's assume onUpdateGoal can handle archiving or we just hide it.
        // Or we can assume the parent handles it if we pass a special flag.
        // Actually, let's add a delete button functionality if possible or just hide it.
        // Given props, we can set progress to -1 or similar to signal deletion if API allowed, 
        // but let's just use onUpdateGoal to mark 'completed' effectively or ignore.
        // Ideally, App.tsx needs a delete handler. I'll simulate completion as archiving for now.
        onToggleGoal(id);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="pt-2 flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-black text-dark-text tracking-tight">Vision</h1>
           <p className="text-xs text-dark-muted font-black uppercase tracking-[0.2em] mt-1">Strategic Objectives</p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)} className="h-10 px-4 rounded-xl">
            <Plus size={18} /> New
        </Button>
      </header>

      {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50 space-y-4">
              <Rocket size={48} className="text-gold-500" />
              <p className="text-xs font-black uppercase tracking-widest text-dark-muted">No active missions deployed.</p>
          </div>
      ) : (
          <div className="space-y-6">
              {goals.map(goal => (
                  <Card key={goal.id} className="relative overflow-hidden group border-dark-border hover:border-gold-500/30 transition-all p-5">
                      <div className="flex items-start justify-between mb-4 relative z-10">
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl border ${goal.completed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-dark-bg border-dark-border text-gold-500'}`}>
                                  {goal.completed ? <CheckCircle2 size={24} /> : <Target size={24} />}
                              </div>
                              <div>
                                  <h3 className={`text-lg font-black uppercase tracking-wide ${goal.completed ? 'line-through text-dark-muted' : 'text-dark-text'}`}>{goal.title}</h3>
                                  <p className="text-xs text-dark-muted font-bold mt-1">{goal.type.toUpperCase()} • {goal.reason}</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingGoal(goal)} className="p-2 text-dark-muted hover:text-gold-500 transition-colors">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => onToggleGoal(goal.id)} className="p-2 text-dark-muted hover:text-emerald-500 transition-colors">
                                {goal.completed ? <Zap size={16} /> : <CheckCircle2 size={16} />}
                            </button>
                          </div>
                      </div>

                      <div className="relative z-10">
                          <div className="flex justify-between items-end mb-2">
                              <span className="text-xs font-black uppercase tracking-widest text-dark-muted">Progress Protocol</span>
                              <span className="text-sm font-black text-gold-500">{goal.progress}%</span>
                          </div>
                          <div className="h-4 w-full bg-dark-bg rounded-full overflow-hidden border border-dark-border relative">
                              <div 
                                className="h-full bg-gold-500 transition-all duration-500 relative"
                                style={{ width: `${goal.progress}%` }}
                              >
                                  <div className="absolute inset-0 bg-white/20 animate-pulse-slow"></div>
                              </div>
                          </div>
                          <input 
                            type="range" 
                            min="0" max="100" 
                            value={goal.progress}
                            onChange={(e) => onUpdateGoal(goal.id, { progress: parseInt(e.target.value) })}
                            className="w-full absolute inset-0 opacity-0 cursor-pointer"
                          />
                      </div>
                      
                      {goal.action && (
                          <div className="mt-4 pt-4 border-t border-dark-border/50 flex items-center gap-2">
                                <Zap size={12} className="text-gold-500" />
                                <span className="text-xs font-bold text-dark-muted uppercase tracking-wide">Next: {goal.action}</span>
                          </div>
                      )}
                  </Card>
              ))}
          </div>
      )}

      {(showAddModal || editingGoal) && (
          <GoalModal 
            initialData={editingGoal}
            onClose={() => { setShowAddModal(false); setEditingGoal(null); }} 
            onSave={(g) => {
                if (editingGoal) {
                    onUpdateGoal(editingGoal.id, g);
                } else {
                    onAddGoal({ ...g, id: generateId(), progress: 0, completed: false } as Goal);
                }
                setShowAddModal(false);
                setEditingGoal(null);
            }} 
          />
      )}
    </div>
  );
}

function GoalModal({ initialData, onClose, onSave }: { initialData?: Goal | null, onClose: () => void, onSave: (g: Partial<Goal>) => void }) {
    const [data, setData] = useState<Partial<Goal>>(initialData || {
        title: '',
        reason: '',
        action: '',
        type: 'career',
        progress: 0
    });

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <Card className="w-full max-w-sm bg-dark-bg border-gold-500 shadow-2xl relative p-6">
                <button onClick={onClose} className="absolute top-4 right-4 text-dark-muted hover:text-white"><X size={20} /></button>
                <h3 className="text-sm font-black text-dark-text uppercase tracking-[0.2em] mb-6">{initialData ? 'Edit Mission' : 'New Objective'}</h3>
                
                <div className="space-y-4">
                    <Input label="Objective Title" value={data.title} onChange={e => setData({...data, title: e.target.value})} autoFocus placeholder="e.g. Save ₹1 Lakh" />
                    
                    <div>
                        <label className="block text-xs text-dark-muted mb-1.5 uppercase tracking-wider">Type</label>
                        <div className="flex gap-2">
                             {(['career', 'bucket'] as const).map(t => (
                                 <button 
                                    key={t}
                                    onClick={() => setData({...data, type: t})}
                                    className={`flex-1 py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${data.type === t ? 'bg-gold-500 text-dark-bg border-gold-500' : 'bg-dark-card border-dark-border text-dark-muted'}`}
                                 >
                                     {t}
                                 </button>
                             ))}
                        </div>
                    </div>

                    <Input label=" The 'Why' (Motivation)" value={data.reason} onChange={e => setData({...data, reason: e.target.value})} placeholder="Freedom, Safety..." />
                    <Input label="Next Action Step" value={data.action} onChange={e => setData({...data, action: e.target.value})} placeholder="Open account..." />
                    
                    <Button className="w-full mt-4 h-12" onClick={() => onSave(data)} disabled={!data.title}>
                        {initialData ? 'Update Mission' : 'Deploy Mission'}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
