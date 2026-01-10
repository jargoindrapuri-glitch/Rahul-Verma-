
import React, { useState } from 'react';
import { AppState, DailyEntry, Screen } from '../types';
import { Card, Button } from '../components/UI';
import { getPromptForDate, MOODS } from '../constants';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react';

interface Props {
  state: AppState;
  onUpdateEntry: (date: string, data: Partial<DailyEntry>) => void;
  onNavigate: (screen: Screen) => void;
}

export default function Journal({ state, onUpdateEntry, onNavigate }: Props) {
  const [showDeepDive, setShowDeepDive] = useState(false);
  const dateStr = state.currentDate;
  const entry = state.entries[dateStr] || { date: dateStr, todos: [], isLocked: false, rating: 5, energy: 3 };
  const dailyPrompt = getPromptForDate(dateStr);

  const ENERGY_LEVELS = [
    { level: 1, label: '😴' }, // Drained
    { level: 2, label: '😫' }, // Low
    { level: 3, label: '😐' }, // Okay
    { level: 4, label: '🙂' }, // Good
    { level: 5, label: '⚡' }, // Peak
  ];

  const handleSaveAndClose = () => {
    if (entry.rating) {
        onUpdateEntry(dateStr, { isLocked: true });
    }
    onNavigate('home');
  };

  if (entry.isLocked) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center p-6 text-center animate-fade-in">
        <div className="bg-emerald-500/10 p-12 rounded-[40px] border-2 border-emerald-500 shadow-2xl mb-8 transform rotate-3">
          <Lock className="w-24 h-24 text-emerald-500" />
        </div>
        <h2 className="text-4xl font-black text-dark-text mb-2 tracking-tight uppercase">Sealed</h2>
        <div className="inline-block bg-gold-500 text-dark-bg px-6 py-2 rounded-full text-lg font-black mb-10 shadow-xl">
            SCORE: {entry.rating}/10
        </div>
        <Button variant="secondary" className="w-full max-w-xs h-16 font-black uppercase tracking-widest rounded-2xl shadow-2xl" onClick={() => onNavigate('home')}>
            Back to Hub
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-md mx-auto pb-12">
      {/* Standardized Header matching Finance/Goals */}
      <header className="pt-2">
          <h1 className="text-3xl font-black text-dark-text tracking-tight">Journal</h1>
          <p className="text-xs text-dark-muted font-black uppercase tracking-[0.2em] mt-1">Daily Reflection</p>
      </header>

      {/* SECTION 1: QUICK CHECK */}
      <section className="space-y-6">
        <h3 className="text-xs text-gold-500 uppercase font-black tracking-[0.2em] px-1">1. Quick Check</h3>
        
        <Card className="bg-dark-card border-dark-border p-6 space-y-8 shadow-sm">
            {/* Discipline Slider */}
            <div>
                <div className="flex justify-between items-end mb-4">
                    <label className="text-sm text-dark-muted font-bold uppercase tracking-wider">Discipline</label>
                    <span className="text-3xl font-black text-gold-500">{entry.rating || 5}<span className="text-sm text-dark-muted">/10</span></span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="1"
                    value={entry.rating || 5}
                    onChange={(e) => onUpdateEntry(dateStr, { rating: parseInt(e.target.value) })}
                    className="w-full h-3 bg-dark-bg rounded-lg appearance-none cursor-pointer accent-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 border border-dark-border"
                />
                <div className="flex justify-between mt-2 text-[10px] text-dark-muted font-black uppercase tracking-widest">
                    <span>Weak</span>
                    <span>Strong</span>
                </div>
            </div>

            {/* Energy Selector */}
            <div>
                <label className="text-sm text-dark-muted font-bold mb-4 block uppercase tracking-wider">Energy</label>
                <div className="flex justify-between items-center bg-dark-bg rounded-2xl p-2 border border-dark-border">
                    {ENERGY_LEVELS.map((item) => (
                        <button 
                            key={item.level}
                            onClick={() => onUpdateEntry(dateStr, { energy: item.level })}
                            className={`w-12 h-12 flex items-center justify-center text-2xl rounded-xl transition-all ${entry.energy === item.level ? 'bg-gold-500 shadow-lg scale-110' : 'opacity-40 hover:opacity-100 hover:bg-dark-card'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </Card>
      </section>

      {/* SECTION 2: THE CORE */}
      <section className="space-y-4">
        <h3 className="text-xs text-gold-500 uppercase font-black tracking-[0.2em] px-1">2. Today & Tomorrow</h3>

        <div className="space-y-4">
            <div className="bg-dark-card rounded-2xl p-4 border border-dark-border focus-within:ring-1 focus-within:ring-gold-500/30 transition-all">
                <label className="text-[10px] text-dark-muted font-black uppercase tracking-wider mb-2 block">Today's Win</label>
                <input 
                    placeholder="One small win is enough..."
                    value={entry.memory || ''}
                    onChange={e => onUpdateEntry(dateStr, { memory: e.target.value })}
                    className="w-full bg-transparent border-none text-dark-text font-medium placeholder:text-dark-muted/50 focus:outline-none focus:ring-0 text-lg p-0"
                />
            </div>

            <div className="bg-dark-card rounded-2xl p-4 border border-dark-border focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
                <label className="text-[10px] text-dark-muted font-black uppercase tracking-wider mb-2 block">Tomorrow's One Task</label>
                <input 
                    placeholder="If this is done, tomorrow is a win."
                    value={entry.intention || ''}
                    onChange={e => onUpdateEntry(dateStr, { intention: e.target.value })}
                    className="w-full bg-transparent border-none text-dark-text font-medium placeholder:text-dark-muted/50 focus:outline-none focus:ring-0 text-lg p-0"
                />
            </div>
        </div>
      </section>

      {/* SECTION 3: OPTIONAL DEEP DIVE */}
      <section>
        <button 
            onClick={() => setShowDeepDive(!showDeepDive)}
            className="w-full flex items-center justify-between p-4 rounded-xl text-dark-muted hover:text-dark-text hover:bg-dark-card transition-all border border-transparent hover:border-dark-border"
        >
            <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                {showDeepDive ? 'Collapse' : 'Mental Deep Dive'}
            </span>
            {showDeepDive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showDeepDive && (
            <div className="space-y-4 mt-4 animate-slide-up">
                 <div className="bg-dark-card rounded-2xl p-4 border border-dark-border">
                    <label className="text-[10px] text-dark-muted font-black uppercase tracking-wider mb-2 block">Gratitude</label>
                    <input 
                        placeholder="I am grateful for..."
                        value={entry.gratitude || ''}
                        onChange={e => onUpdateEntry(dateStr, { gratitude: e.target.value })}
                        className="w-full bg-transparent border-none text-dark-text font-medium placeholder:text-dark-muted/50 focus:outline-none focus:ring-0 p-0"
                    />
                </div>

                <div className="bg-dark-card rounded-2xl p-6 border border-dark-border">
                    <p className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-4 italic opacity-80">"{dailyPrompt}"</p>
                    <textarea 
                        placeholder="Unload your mind here..." 
                        value={entry.promptAnswer || ''} 
                        onChange={e => onUpdateEntry(dateStr, { promptAnswer: e.target.value })} 
                        className="w-full bg-transparent border-none p-0 text-sm leading-relaxed min-h-[120px] focus:outline-none focus:ring-0 placeholder:text-dark-muted/50 text-dark-text resize-none" 
                    />
                </div>

                <div>
                     <label className="text-[10px] text-dark-muted font-black uppercase tracking-wider mb-4 block text-center">Atmosphere</label>
                     <div className="flex justify-between items-center px-6">
                        {MOODS.map(m => (
                            <button key={m.value} onClick={() => onUpdateEntry(dateStr, { mood: m.value })} className={`text-3xl transition-all ${entry.mood === m.value ? 'scale-150 opacity-100 filter drop-shadow-xl' : 'opacity-20 grayscale hover:opacity-50'}`}>{m.label}</button>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </section>

      {/* SAVE BUTTON - Static but prominent */}
      <div className="pt-10">
        <Button 
            variant="primary" 
            className="w-full h-16 font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-gold-500/20 text-lg" 
            onClick={handleSaveAndClose}
        >
            Commit & Close
        </Button>
        <p className="text-[10px] text-center text-dark-text font-bold uppercase tracking-widest mt-4 opacity-50">Journal will be locked after saving</p>
      </div>
    </div>
  );
}
