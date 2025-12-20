import React, { useState } from 'react';
import { AppState, Transaction, UserProfile } from '../types';
import { Card, Button, Input } from '../components/UI';
import { DEFAULT_QUICK_ADDS, formatDate } from '../constants';
import { TrendingUp, Settings2, X, IndianRupee, BarChart } from 'lucide-react';

interface Props {
  state: AppState;
  onAddTransaction: (txn: Omit<Transaction, 'id' | 'timestamp'>) => void;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
}

export default function Tracker({ state, onAddTransaction, onUpdateProfile }: Props) {
  const [showSettings, setShowSettings] = useState(false);

  // Helper: Get price (override or default)
  const getPrice = (presetId: string, defaultPrice: number) => {
    return state.profile.habitOverrides?.[presetId] ?? defaultPrice;
  };

  // --- Analytics Data ---
  
  // Last 7 days dates
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return formatDate(d);
  });

  // Data for Charts
  const chartData = last7Days.map(date => {
    const dayTxns = state.transactions.filter(t => t.timestamp.startsWith(date) && t.type === 'EXPENSE');
    const daySpend = dayTxns.reduce((sum, t) => sum + t.amount, 0);
    const dayHabitCount = dayTxns.filter(t => t.isHabit).reduce((sum, t) => sum + (t.unitQuantity || 0), 0);
    return {
      date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
      spend: daySpend,
      habitCount: dayHabitCount
    };
  });

  const maxSpend = Math.max(...chartData.map(d => d.spend), 100); // Avoid div by zero
  const maxHabit = Math.max(...chartData.map(d => d.habitCount), 5);

  // Aggregates
  const totalSpent = state.transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const getHabitCount = (habitLabel: string) => {
    return state.transactions
      .filter(t => t.isHabit && t.category === habitLabel)
      .reduce((acc, curr) => acc + (curr.unitQuantity || 0), 0);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <header className="border-b border-dark-border pb-4 flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gold-500">Tracker</h1>
           <p className="text-dark-muted text-sm">Visual Analytics</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowSettings(true)}>
          <Settings2 size={18} /> Config
        </Button>
      </header>

      {/* Total Spend Card */}
      <Card className="bg-gradient-to-r from-dark-card to-zinc-900 border-gold-500/30">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gold-500/10 rounded-full text-gold-500">
            <IndianRupee size={24} />
          </div>
          <span className="text-dark-muted uppercase tracking-wider text-xs">Total Expenses</span>
        </div>
        <div className="text-3xl font-bold text-white">₹{totalSpent.toLocaleString()}</div>
      </Card>

      {/* Chart: Weekly Spending */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
           <BarChart size={16} className="text-gold-500" />
           <h3 className="text-xs text-dark-muted uppercase tracking-wider">Spending (Last 7 Days)</h3>
        </div>
        <div className="flex items-end gap-2 h-32 w-full">
            {chartData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div 
                        className="w-full bg-gold-500/20 rounded-t relative hover:bg-gold-500/40 transition-all" 
                        style={{ height: `${(d.spend / maxSpend) * 100}%` }}
                    >
                        {d.spend > 0 && (
                             <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-dark-bg border border-dark-border text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                ₹{d.spend}
                             </div>
                        )}
                    </div>
                    <span className="text-[10px] text-dark-muted">{d.date}</span>
                </div>
            ))}
        </div>
      </Card>

       {/* Chart: Habit Frequency */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
           <TrendingUp size={16} className="text-red-400" />
           <h3 className="text-xs text-dark-muted uppercase tracking-wider">Habit Frequency (Units)</h3>
        </div>
        <div className="flex items-end gap-2 h-24 w-full">
            {chartData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div 
                        className="w-full bg-red-500/20 rounded-t relative hover:bg-red-500/40 transition-all" 
                        style={{ height: `${(d.habitCount / maxHabit) * 100}%` }}
                    >
                         {d.habitCount > 0 && (
                             <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-dark-bg border border-dark-border text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                {d.habitCount}
                             </div>
                        )}
                    </div>
                    <span className="text-[10px] text-dark-muted">{d.date}</span>
                </div>
            ))}
        </div>
      </Card>

      {/* Quick Add Grid */}
      <section>
        <h3 className="text-xs text-dark-muted uppercase tracking-wider mb-3">Quick Add</h3>
        <div className="grid grid-cols-2 gap-3">
          {DEFAULT_QUICK_ADDS.map(preset => {
            const currentPrice = getPrice(preset.id, preset.price);
            return (
              <Button 
                key={preset.id} 
                variant="secondary"
                onClick={() => onAddTransaction({
                  amount: currentPrice,
                  type: 'EXPENSE',
                  category: preset.label,
                  isHabit: true,
                  unitQuantity: 1,
                  unitType: preset.unit
                })}
                className="flex flex-col items-center justify-center py-4 h-auto border-gold-500/10 hover:border-gold-500/50"
              >
                <div className="font-bold text-lg text-gold-500">{preset.label}</div>
                <div className="text-xs text-dark-muted">₹{currentPrice} / {preset.unit}</div>
              </Button>
            );
          })}
        </div>
      </section>

      {/* Settings Modal for Changing Prices */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
           <Card className="w-full max-w-sm relative bg-dark-bg border border-gold-500">
               <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-dark-muted hover:text-white"><X size={20}/></button>
               <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Settings2 size={20} /> Configure Costs</h2>
               <div className="space-y-4">
                   {DEFAULT_QUICK_ADDS.map(preset => (
                       <div key={preset.id} className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded bg-dark-card border border-dark-border flex items-center justify-center text-lg">
                                {preset.icon === 'cigarette' ? '🚬' : preset.icon === 'burger' ? '🍔' : preset.icon === 'coffee' ? '☕' : '🚕'}
                           </div>
                           <div className="flex-1">
                               <div className="text-sm font-medium">{preset.label}</div>
                               <div className="text-xs text-dark-muted">Default: ₹{preset.price}</div>
                           </div>
                           <div className="w-24">
                               <Input 
                                  type="number" 
                                  value={getPrice(preset.id, preset.price)} 
                                  onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      onUpdateProfile({ 
                                          habitOverrides: { 
                                              ...state.profile.habitOverrides, 
                                              [preset.id]: val 
                                          } 
                                      });
                                  }}
                                  className="py-1 px-2 h-8 text-sm"
                               />
                           </div>
                       </div>
                   ))}
               </div>
               <Button className="w-full mt-6" onClick={() => setShowSettings(false)}>Done</Button>
           </Card>
        </div>
      )}
    </div>
  );
}