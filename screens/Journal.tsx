
import React from 'react';
import { AppState, DailyEntry, Screen } from '../types';
import { Card, Button, TextArea, Input } from '../components/UI';
import { getPromptForDate, MOODS } from '../constants';
import { Lock, ArrowLeft, ShieldCheck, Zap, BookOpen, MessageSquare, Battery, Trophy, Heart, Target } from 'lucide-react';

interface Props {
  state: AppState;
  onUpdateEntry: (date: string, data: Partial<DailyEntry>) => void;
  onNavigate: (screen: Screen) => void;
}

export default function Journal({ state, onUpdateEntry, onNavigate }: Props) {
  const dateStr = state.currentDate;
  const entry = state.entries[dateStr] || { date: dateStr, todos: [], isLocked: false, rating: 5, energy: 3 };
  const dailyPrompt = getPromptForDate(dateStr);

  const handleLockDay = () => {
    if (!entry.rating) return alert("Seal your day with a Discipline Rating first.");
    onUpdateEntry(dateStr, { isLocked: true });
  };

  const getBatteryColor = (level: number) => {
    if (level <= 1) return 'text-red-500';
    if (level <= 2) return 'text-orange-500';
    if (level <= 3) return 'text-gold-500';
    if (level <= 4) return 'text-emerald-400';
    return 'text-emerald-500';
  };

  if (entry.isLocked) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center p-6 text-center animate-fade-in">
        <div className="bg-emerald-500/10 p-12 rounded-[40px] border-2 border-emerald-500 shadow-2xl mb-8 transform rotate-3">
          <ShieldCheck className="w-24 h-24 text-emerald-500" />
        </div>
        <h2 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Day Sealed</h2>
        <div className="inline-block bg-gold-500 text-dark-bg px-6 py-2 rounded-full text-lg font-black mb-10 shadow-xl">DISCIPLINE: {entry.rating}/10</div>
        <Button variant="primary" className="w-full max-w-xs h-16 font-black uppercase tracking-widest rounded-2xl shadow-2xl" onClick={() => onNavigate('home')}>Return to Hub</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-40">
      <header className="flex justify-between items-center sticky top-0 bg-dark-bg/95 backdrop-blur-xl z-40 py-5 -mx-4 px-6 border-b border-dark-border">
        <button onClick={() => onNavigate('home')} className="p-2 -ml-2 text-dark-muted hover:text-white transition-all"><ArrowLeft size={24} /></button>
        <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">Tactical Journal</h2>
        <button onClick={handleLockDay} className="text-gold-500 p-2.5 bg-gold-500/10 rounded-2xl hover:bg-gold-500/20 transition-all border border-gold-500/20"><Lock size={20} /></button>
      </header>

      {/* SECTION 1: VITALS (Rating, Mood, Energy) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-1 px-1">
            <Zap size={14} className="text-red-400" />
            <h3 className="text-[10px] text-dark-muted uppercase font-black tracking-[0.2em]">Operator Vitals</h3>
        </div>
        
        <Card className="bg-zinc-950 border-gold-500/10 p-6 shadow-2xl space-y-8">
            {/* Discipline Slider */}
            <div>
                <label className="text-[9px] text-gold-500 font-black uppercase mb-4 block text-center tracking-[0.3em]">Discipline Rating</label>
                <div className="grid grid-cols-5 gap-3">
                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <button key={num} onClick={() => onUpdateEntry(dateStr, { rating: num })} className={`h-10 rounded-xl text-sm font-black transition-all border ${entry.rating === num ? 'bg-gold-500 text-dark-bg border-gold-500 scale-110 shadow-lg' : 'bg-dark-bg border-dark-border text-dark-muted hover:border-gold-500/30'}`}>{num}</button>
                    ))}
                </div>
            </div>

            {/* Energy Battery */}
            <div>
                <label className="text-[9px] text-blue-400 font-black uppercase mb-4 block text-center tracking-[0.3em] flex items-center justify-center gap-2">
                    <Battery size={12} /> Energy Levels
                </label>
                <div className="flex justify-between items-center px-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                        <button 
                            key={level}
                            onClick={() => onUpdateEntry(dateStr, { energy: level })}
                            className={`flex flex-col items-center gap-2 transition-all ${entry.energy === level ? 'scale-110 opacity-100' : 'opacity-30 hover:opacity-70'}`}
                        >
                            <div className={`w-8 h-12 rounded border-2 flex items-end p-0.5 ${entry.energy === level ? 'border-current' : 'border-zinc-700'}`}>
                                <div 
                                    className={`w-full rounded-sm transition-all duration-300 ${getBatteryColor(level)} bg-current`} 
                                    style={{ height: `${level * 20}%` }} 
                                />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Mood Selector */}
            <div className="pt-4 border-t border-dark-border">
                <div className="flex justify-between items-center px-2">
                    {MOODS.map(m => (
                        <button key={m.value} onClick={() => onUpdateEntry(dateStr, { mood: m.value })} className={`text-3xl transition-all ${entry.mood === m.value ? 'scale-150 opacity-100 filter drop-shadow-lg' : 'opacity-20 grayscale'}`}>{m.label}</button>
                    ))}
                </div>
            </div>
        </Card>
      </section>

      {/* SECTION 2: TACTICAL DEBRIEF (Wins, Gratitude, Focus) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-1 px-1">
            <Trophy size={14} className="text-gold-500" />
            <h3 className="text-[10px] text-dark-muted uppercase font-black tracking-[0.2em]">Tactical Debrief</h3>
        </div>

        <div className="grid gap-4">
            <Card className="bg-dark-card border-dark-border relative overflow-hidden group focus-within:border-gold-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-focus-within:opacity-20 transition-opacity"><Trophy size={40} /></div>
                <Input 
                    label="The Daily Victory"
                    placeholder="One specific win from today..."
                    value={entry.memory || ''}
                    onChange={e => onUpdateEntry(dateStr, { memory: e.target.value })}
                    className="bg-transparent border-none px-0 text-white font-medium focus:ring-0 placeholder:text-zinc-700"
                />
            </Card>

            <Card className="bg-dark-card border-dark-border relative overflow-hidden group focus-within:border-emerald-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-focus-within:opacity-20 transition-opacity"><Heart size={40} /></div>
                <Input 
                    label="Gratitude Protocol"
                    placeholder="I am grateful for..."
                    value={entry.gratitude || ''}
                    onChange={e => onUpdateEntry(dateStr, { gratitude: e.target.value })}
                    className="bg-transparent border-none px-0 text-white font-medium focus:ring-0 placeholder:text-zinc-700"
                />
            </Card>

            <Card className="bg-dark-card border-dark-border relative overflow-hidden group focus-within:border-blue-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-focus-within:opacity-20 transition-opacity"><Target size={40} /></div>
                <Input 
                    label="Tomorrow's Primary Focus"
                    placeholder="One absolute must-do..."
                    value={entry.intention || ''}
                    onChange={e => onUpdateEntry(dateStr, { intention: e.target.value })}
                    className="bg-transparent border-none px-0 text-white font-medium focus:ring-0 placeholder:text-zinc-700"
                />
            </Card>
        </div>
      </section>

      {/* SECTION 3: DEEP DIVE (Prompt) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-1 px-1"><BookOpen size={14} className="text-blue-400" /><h3 className="text-[10px] text-dark-muted uppercase font-black tracking-[0.2em]">Deep Dive</h3></div>
        <Card className="bg-dark-card border-dark-border p-6">
            <div className="flex items-start gap-3 mb-4">
                <MessageSquare size={16} className="text-blue-400 mt-1 shrink-0" />
                <p className="text-sm font-black text-white italic leading-relaxed opacity-90">"{dailyPrompt}"</p>
            </div>
            <TextArea placeholder="Unload your mind..." value={entry.promptAnswer || ''} onChange={e => onUpdateEntry(dateStr, { promptAnswer: e.target.value })} className="bg-zinc-900/50 border-dark-border rounded-2xl min-h-[140px] text-sm leading-relaxed" />
        </Card>
      </section>

      <div className="fixed bottom-24 left-6 right-6 max-w-md mx-auto flex gap-4 z-40">
        <Button variant="secondary" className="flex-1 shadow-2xl h-16 font-black uppercase tracking-widest rounded-2xl" onClick={() => onNavigate('home')}>Exit Flow</Button>
        <Button className="flex-1 bg-gold-500 text-dark-bg font-black shadow-2xl h-16 uppercase tracking-widest rounded-2xl" onClick={handleLockDay}><Lock size={20} className="mr-1" /> Seal Pulse</Button>
      </div>
    </div>
  );
}
