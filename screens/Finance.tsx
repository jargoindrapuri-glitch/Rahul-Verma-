
import React, { useState, useMemo } from 'react';
import { AppState, Transaction, AddictionLog, UserProfile, QuickAddPreset } from '../types';
import { Card, Button, Input, ProgressBar } from '../components/UI';
import { DEFAULT_QUICK_ADDS, formatDate } from '../constants';
import { Wallet, Settings2, X, Plus, History, Activity, TrendingUp, BarChart3, Edit3, Calendar } from 'lucide-react';
import QuickEntryModal from './QuickEntryModal';
import ManualEntryModal from './ManualEntryModal';

interface Props {
  state: AppState;
  onAddTransaction: (txn: Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  onAddAddictionLog: (log: Omit<AddictionLog, 'id' | 'timestamp'>) => void;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
}

export default function Finance({ state, onAddTransaction, onUpdateProfile }: Props) {
  const [activeView, setActiveView] = useState<'log' | 'analytics'>('log');
  const [showSettings, setShowSettings] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [selectedQuickAdd, setSelectedQuickAdd] = useState<QuickAddPreset | null>(null);
  const today = formatDate(new Date());

  const todayTransactions = state.transactions.filter(t => t.timestamp.startsWith(today));
  const todaySpend = todayTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  const budget = state.profile.dailyBudget || 500;
  const budgetLeft = budget - todaySpend;
  const spendProgress = Math.min(100, (todaySpend / budget) * 100);

  // Group transactions by date for the ledger
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    // Sort transactions by date descending
    const sorted = [...state.transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Take last 30 transactions or last 7 days of data
    sorted.slice(0, 30).forEach(t => {
      const date = formatDate(new Date(t.timestamp));
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    return groups;
  }, [state.transactions]);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return formatDate(d);
  });

  const chartData = last7Days.map(date => {
    const dayTxns = state.transactions.filter(t => t.timestamp.startsWith(date) && t.type === 'EXPENSE');
    return {
      date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
      spend: dayTxns.reduce((sum, t) => sum + t.amount, 0),
    };
  });

  const maxSpend = Math.max(...chartData.map(d => d.spend), 100);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="flex flex-col gap-4 border-b border-dark-border pb-4">
        <div className="flex justify-between items-center">
            <div><h1 className="text-2xl font-black text-white">Finance</h1><p className="text-dark-muted text-xs font-bold uppercase tracking-widest">Tactical Ledger</p></div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShowSettings(true)}><Settings2 size={16} /></Button>
            </div>
        </div>
        <div className="flex bg-dark-card rounded-xl p-1 border border-dark-border">
            <button onClick={() => setActiveView('log')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeView === 'log' ? 'bg-gold-500 text-dark-bg shadow-lg' : 'text-dark-muted'}`}>Log</button>
            <button onClick={() => setActiveView('analytics')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeView === 'analytics' ? 'bg-indigo-500 text-white shadow-lg' : 'text-dark-muted'}`}>Insights</button>
        </div>
      </header>

      {activeView === 'log' ? (
        <div className="space-y-6">
            <Card className="bg-gradient-to-br from-zinc-900 to-black border-gold-500/20 shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-gold-500/10 rounded-2xl text-gold-500"><Wallet size={24} /></div>
                    <div className="text-right">
                        <span className="text-[10px] text-dark-muted uppercase font-bold tracking-widest">Today's Remaining</span>
                        <div className={`text-3xl font-black ${budgetLeft < 0 ? 'text-red-500' : 'text-white'}`}>₹{budgetLeft}</div>
                    </div>
                </div>
                <ProgressBar progress={spendProgress} color={budgetLeft < 0 ? 'bg-red-500' : 'bg-gold-500'} />
            </Card>

            <div className="grid grid-cols-4 gap-3">
                {DEFAULT_QUICK_ADDS.map(item => (
                    <button key={item.id} onClick={() => setSelectedQuickAdd(item)} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-dark-card border border-dark-border hover:border-gold-500/30 active:scale-95 transition-all">
                        <span className="text-xl">{item.icon === 'cigarette' ? '🚬' : item.icon === 'burger' ? '🍔' : item.icon === 'coffee' ? '☕' : '🚕'}</span>
                        <span className="text-[8px] font-black text-white">₹{state.profile.habitOverrides?.[item.id] ?? item.price}</span>
                    </button>
                ))}
                <button 
                  onClick={() => setShowManual(true)}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-gold-500/5 border border-dashed border-gold-500/30 hover:border-gold-500/60 active:scale-95 transition-all text-gold-500"
                >
                  <Edit3 size={20} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Manual</span>
                </button>
            </div>

            <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-[10px] text-dark-muted uppercase tracking-[0.2em] font-black flex items-center gap-2">
                        <History size={12} /> Transaction Pulse
                    </h3>
                </div>
                
                <div className="space-y-6">
                    {/* Fix: Explicitly cast Object.entries to provide the correct type for 'txns' array */}
                    {(Object.entries(groupedTransactions) as [string, Transaction[]][]).map(([date, txns]) => (
                        <div key={date} className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                                <Calendar size={10} className="text-dark-muted" />
                                <span className="text-[9px] font-black text-dark-muted uppercase tracking-widest">
                                    {date === today ? 'Today' : new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {txns.map(t => (
                                    <div key={t.id} className="flex justify-between items-center p-4 bg-dark-card rounded-2xl border border-dark-border group hover:border-zinc-700 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="text-xs">
                                                <p className="font-black text-white uppercase tracking-wider">{t.category}</p>
                                                {t.note && <p className="text-[9px] text-dark-muted font-bold truncate max-w-[150px]">{t.note}</p>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-sm font-black ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {t.type === 'INCOME' ? '+' : '-'}₹{t.amount}
                                            </span>
                                            <p className="text-[8px] text-dark-muted font-bold uppercase">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {state.transactions.length === 0 && (
                        <div className="text-center py-20 text-dark-muted text-[10px] uppercase font-bold tracking-widest border border-dashed border-dark-border rounded-3xl">
                            Empty Ledger. Log your first unit.
                        </div>
                    )}
                </div>
            </section>
        </div>
      ) : (
        <div className="space-y-6">
            <Card className="bg-zinc-900 shadow-xl">
                <div className="flex items-center gap-2 mb-6"><BarChart3 size={16} className="text-gold-500" /><h3 className="text-[10px] text-dark-muted uppercase font-black">Spending Velocity</h3></div>
                <div className="flex items-end gap-2 h-40 w-full px-2">
                    {chartData.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="w-full bg-gold-500/20 rounded-t-lg relative hover:bg-gold-500 transition-all cursor-pointer" style={{ height: `${(d.spend / maxSpend) * 100}%` }}></div>
                            <span className="text-[9px] font-black text-dark-muted uppercase">{d.date}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
      )}

      {selectedQuickAdd && (
          <QuickEntryModal preset={selectedQuickAdd} state={state} onClose={() => setSelectedQuickAdd(null)} onSave={(txn) => { onAddTransaction(txn); setSelectedQuickAdd(null); }} />
      )}

      {showManual && (
          <ManualEntryModal onClose={() => setShowManual(false)} onSave={(txn) => { onAddTransaction(txn); setShowManual(false); }} />
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
           <Card className="w-full max-w-sm relative bg-zinc-950 border border-gold-500 shadow-2xl p-8 rounded-[32px]">
               <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-dark-muted hover:text-white transition-colors"><X size={24}/></button>
               <h2 className="text-lg font-black text-white mb-8 flex items-center gap-2 uppercase tracking-widest">OS Config</h2>
               <div className="space-y-6">
                   <div className="space-y-3">
                       <label className="text-[10px] text-dark-muted uppercase font-black tracking-widest">Daily Budget Cap (₹)</label>
                       <Input type="number" value={state.profile.dailyBudget} onChange={(e) => onUpdateProfile({ dailyBudget: parseFloat(e.target.value) || 0 })} />
                   </div>
               </div>
               <Button className="w-full mt-10 h-14 font-black uppercase tracking-widest" onClick={() => setShowSettings(false)}>Apply Settings</Button>
           </Card>
        </div>
      )}
    </div>
  );
}
