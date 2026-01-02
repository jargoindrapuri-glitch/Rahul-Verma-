
import React, { useState, useMemo } from 'react';
import { AppState, Transaction, AddictionLog, UserProfile, CategoryDef, BudgetMode, QuickAddPreset, HabitType } from '../types';
import { Card, Button, Input, ProgressBar } from '../components/UI';
import { formatDate, generateId } from '../constants';
import { Wallet, Settings2, X, Plus, Activity, BarChart3, PieChart, ArrowDownRight, ArrowUpRight, Edit2, Trash2, Zap, Clock } from 'lucide-react';
import ManualEntryModal from './ManualEntryModal';
import QuickEntryModal from './QuickEntryModal';

interface Props {
  state: AppState;
  onAddTransaction: (txn: Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  onAddAddictionLog: (log: Omit<AddictionLog, 'id' | 'timestamp'>) => void;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
}

// Default categories if user has none
const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: 'c1', label: 'Cigarette', icon: '🚬', price: 18 },
  { id: 'c2', label: 'Food', icon: '🍔', price: 80 },
  { id: 'c3', label: 'Tea', icon: '☕', price: 20 },
  { id: 'c4', label: 'Travel', icon: '🚕', price: 50 },
];

export default function Finance({ state, onAddTransaction, onUpdateProfile }: Props) {
  const [activeView, setActiveView] = useState<'log' | 'analytics'>('log');
  const [showManual, setShowManual] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<QuickAddPreset | null>(null);
  
  // For editing category definitions
  const [editingCategory, setEditingCategory] = useState<CategoryDef | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  // Resolve categories: Use profile custom categories or fall back to defaults
  const categories = state.profile.customCategories && state.profile.customCategories.length > 0 
    ? state.profile.customCategories 
    : DEFAULT_CATEGORIES;

  // --- Logic: Budget & Spend (LOCAL TIME FIX) ---
  const now = new Date();
  const todayTransactions = state.transactions.filter(t => {
      const tDate = new Date(t.timestamp);
      return tDate.getDate() === now.getDate() &&
             tDate.getMonth() === now.getMonth() &&
             tDate.getFullYear() === now.getFullYear();
  });
  
  const todaySpend = todayTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

  // --- Handlers ---

  const handleCategoryTap = (cat: CategoryDef) => {
    // Convert CategoryDef to QuickAddPreset for the modal
    const preset: QuickAddPreset = {
        id: cat.id,
        label: cat.label as HabitType,
        price: cat.price,
        unit: 'unit',
        icon: cat.icon
    };
    setSelectedPreset(preset);
  };

  const handleUpdateCategory = (updated: CategoryDef) => {
    let newCategories = [...categories];
    if (newCategories.find(c => c.id === updated.id)) {
        newCategories = newCategories.map(c => c.id === updated.id ? updated : c);
    } else {
        newCategories.push(updated);
    }
    onUpdateProfile({ customCategories: newCategories });
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    const newCategories = categories.filter(c => c.id !== id);
    onUpdateProfile({ customCategories: newCategories });
    setEditingCategory(null);
  };

  const handleAddNewCategory = (newCat: Partial<CategoryDef>) => {
    if (!newCat.label || !newCat.price) return;
    const cat: CategoryDef = {
        id: generateId(),
        label: newCat.label,
        icon: newCat.icon || '📦',
        price: Number(newCat.price),
        color: newCat.color
    };
    const newCategories = [...categories, cat];
    onUpdateProfile({ customCategories: newCategories });
    setIsAddingCategory(false);
  };

  // --- Grouping for Ledger ---
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    const sorted = [...state.transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    sorted.slice(0, 30).forEach(t => {
      const date = formatDate(new Date(t.timestamp));
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    return groups;
  }, [state.transactions]);

  // --- Analytics Calculation ---
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return formatDate(d);
  });
  const chartData = last7Days.map(date => {
    const dayTxns = state.transactions.filter(t => t.timestamp.startsWith(date) && t.type === 'EXPENSE');
    return {
      dateShort: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
      spend: dayTxns.reduce((sum, t) => sum + t.amount, 0),
    };
  });
  const maxSpend = Math.max(...chartData.map(d => d.spend), 100);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthTxns = state.transactions.filter(t => {
        const d = new Date(t.timestamp);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const totalExpense = monthTxns.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + t.amount, 0);
    const totalIncome = monthTxns.filter(t => t.type === 'INCOME').reduce((a, t) => a + t.amount, 0);
    
    const categoryTotals: Record<string, number> = {};
    monthTxns.filter(t => t.type === 'EXPENSE').forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    const cats = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .map(([cat, amount], idx) => ({
            category: cat,
            amount,
            percentage: totalExpense ? (amount / totalExpense) * 100 : 0,
            color: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#a855f7'][idx % 5]
        }));
    return { totalExpense, totalIncome, categories: cats };
  }, [state.transactions]);
  
  const pieGradient = useMemo(() => {
    if (monthlyStats.totalExpense === 0) return 'conic-gradient(var(--border-color) 0% 100%)'; 
    let currentDeg = 0;
    return 'conic-gradient(' + monthlyStats.categories.map(cat => {
        const deg = (cat.percentage / 100) * 360;
        const str = `${cat.color} ${currentDeg}deg ${currentDeg + deg}deg`;
        currentDeg += deg;
        return str;
    }).join(', ') + ')';
  }, [monthlyStats]);


  // --- Render ---

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <header className="pt-2">
            <h1 className="text-3xl font-black text-dark-text tracking-tight">Finance</h1>
            <p className="text-[10px] text-dark-muted font-black uppercase tracking-[0.2em] mt-1">Tactical Ledger</p>
      </header>

      {/* Tabs */}
      <div className="flex bg-dark-card rounded-xl p-1 border border-dark-border">
          <button onClick={() => setActiveView('log')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeView === 'log' ? 'bg-gold-500 text-dark-bg shadow-lg' : 'text-dark-muted'}`}>Log Action</button>
          <button onClick={() => setActiveView('analytics')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeView === 'analytics' ? 'bg-indigo-500 text-white shadow-lg' : 'text-dark-muted'}`}>Visual Data</button>
      </div>

      {activeView === 'log' ? (
        <div className="space-y-8">
            
            {/* 1. HERO CARD: TODAY SPENT */}
            <Card className="bg-dark-card border-dark-border p-6 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-gold-500/10 transition-colors"></div>
                 
                 <div className="flex items-center justify-between relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-gold-500/10 rounded-md">
                                <Wallet size={14} className="text-gold-500" />
                            </div>
                            <span className="text-[10px] text-dark-muted font-black uppercase tracking-widest">Today Spent</span>
                        </div>
                        <span className="text-4xl font-black text-dark-text tracking-tighter">₹{todaySpend}</span>
                    </div>
                    <div className="text-right">
                         <span className="text-[10px] text-dark-muted font-black uppercase tracking-widest block mb-2">Entries</span>
                         <span className="text-4xl font-black text-dark-muted/50">{todayTransactions.length}</span>
                    </div>
                </div>
            </Card>

            {/* 2. QUICK ADD GRID */}
            <section>
                <div className="grid grid-cols-4 gap-3">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryTap(cat)}
                            onContextMenu={(e) => { e.preventDefault(); setEditingCategory(cat); }}
                            className="aspect-[4/5] bg-dark-card rounded-2xl border border-dark-border flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:border-gold-500/50 hover:bg-dark-bg group relative"
                        >
                            <span className="text-2xl filter drop-shadow-lg group-hover:scale-110 transition-transform">{cat.icon}</span>
                            <div className="text-center">
                                <span className="block text-[9px] font-black text-dark-text">₹{cat.price}</span>
                                <span className="block text-[7px] font-bold text-dark-muted uppercase tracking-wider mt-0.5">{cat.label}</span>
                            </div>
                        </button>
                    ))}
                    
                    {/* Custom Button */}
                     <button 
                        onClick={() => setShowManual(true)}
                        className="aspect-[4/5] bg-dark-bg rounded-2xl border border-dashed border-dark-border flex flex-col items-center justify-center gap-2 active:scale-95 transition-all text-dark-muted hover:text-dark-text hover:border-dark-text/30"
                    >
                        <Edit2 size={20} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Custom</span>
                    </button>

                    {/* Add Category Button */}
                    <button 
                        onClick={() => setIsAddingCategory(true)}
                        className="aspect-[4/5] bg-dark-bg rounded-2xl border border-dashed border-dark-border flex flex-col items-center justify-center gap-2 active:scale-95 transition-all text-dark-muted hover:text-dark-text hover:border-dark-text/30"
                    >
                        <Plus size={20} />
                        <span className="text-[8px] font-black uppercase tracking-widest">New</span>
                    </button>
                </div>
            </section>

            {/* 3. TRANSACTION PULSE */}
            <section className="space-y-4">
                 <div className="flex items-center gap-2 px-1">
                    <Activity size={12} className="text-gold-500" />
                    <h3 className="text-[10px] text-dark-muted uppercase tracking-[0.3em] font-black">Transaction Pulse</h3>
                 </div>
                 
                 <div className="space-y-3">
                    {(Object.entries(groupedTransactions) as [string, Transaction[]][]).map(([date, txns]) => (
                        <div key={date} className="space-y-3">
                             <div className="sticky top-0 bg-dark-bg/95 backdrop-blur-sm z-10 py-2 border-b border-dark-border/50">
                                <span className="text-[9px] font-black text-dark-muted uppercase tracking-widest pl-1">
                                    {date === formatDate(new Date()) ? 'Today' : new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                            {txns.map(t => (
                                <div key={t.id} className="bg-dark-card border border-dark-border rounded-2xl p-4 flex items-center justify-between group active:scale-[0.99] transition-transform">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border shadow-inner ${t.type === 'INCOME' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-dark-bg border-dark-border text-gold-500'}`}>
                                            {/* Use category icon if matches, else generic Zap/Arrow */}
                                            {categories.find(c => c.label === t.category)?.icon || (t.type === 'INCOME' ? <ArrowDownRight size={18} /> : <Zap size={18} fill="currentColor" />)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-dark-text uppercase tracking-wide">{t.category}</p>
                                            <p className="text-[9px] text-dark-muted font-medium mt-0.5">
                                                {t.note || (t.isHabit ? `Logged ${t.unitQuantity || 1} ${t.unitType || 'unit'}` : 'Manual Entry')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-black ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-dark-text'}`}>
                                            {t.type === 'INCOME' ? '+' : '-'}₹{t.amount}
                                        </p>
                                        <p className="text-[9px] text-dark-muted font-bold flex items-center justify-end gap-1 mt-0.5 opacity-60">
                                            <Clock size={8} /> {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                    
                    {state.transactions.length === 0 && (
                        <div className="text-center py-12 opacity-30">
                            <Wallet size={32} className="mx-auto mb-2 text-dark-text" />
                            <p className="text-[10px] uppercase font-black tracking-widest text-dark-muted">No Activity Yet</p>
                        </div>
                    )}
                 </div>
            </section>
        </div>
      ) : (
        /* ANALYTICS VIEW */
        <div className="space-y-6">
            <Card className="bg-dark-card border-dark-border">
                <div className="flex items-center gap-2 mb-4">
                    <Activity size={16} className="text-gold-500" />
                    <h3 className="text-[10px] text-dark-muted uppercase font-black tracking-widest">Month Net Flow</h3>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex-1 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest block mb-1">In</span>
                        <span className="text-lg font-black text-dark-text">₹{monthlyStats.totalIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex-1 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <span className="text-[9px] text-red-500 font-black uppercase tracking-widest block mb-1">Out</span>
                        <span className="text-lg font-black text-dark-text">₹{monthlyStats.totalExpense.toLocaleString()}</span>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-dark-border flex justify-between items-center">
                    <span className="text-[10px] text-dark-muted font-black uppercase">Net Balance</span>
                    <span className={`text-sm font-black ${monthlyStats.totalIncome - monthlyStats.totalExpense >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                         {monthlyStats.totalIncome - monthlyStats.totalExpense >= 0 ? '+' : ''}₹{(monthlyStats.totalIncome - monthlyStats.totalExpense).toLocaleString()}
                    </span>
                </div>
            </Card>

            <Card className="bg-dark-card shadow-xl border-dark-border">
                <div className="flex items-center gap-2 mb-6"><BarChart3 size={16} className="text-blue-400" /><h3 className="text-[10px] text-dark-muted uppercase font-black tracking-widest">7-Day Velocity</h3></div>
                <div className="flex items-end gap-2 h-40 w-full px-2 pb-2">
                    {chartData.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="w-full relative flex items-end">
                                 <div 
                                    className="w-full bg-blue-500 rounded-t-sm opacity-60 group-hover:opacity-100 transition-all cursor-pointer" 
                                    style={{ height: `${d.spend > 0 ? Math.max((d.spend / maxSpend) * 100, 5) : 2}px` }} 
                                 ></div>
                                 {d.spend > 0 && (
                                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-white bg-dark-bg px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                         {d.spend}
                                     </div>
                                 )}
                            </div>
                            <span className="text-[8px] font-black text-dark-muted uppercase">{d.dateShort}</span>
                        </div>
                    ))}
                </div>
            </Card>

            <Card className="bg-dark-card shadow-xl border-dark-border">
                <div className="flex items-center gap-2 mb-6"><PieChart size={16} className="text-gold-500" /><h3 className="text-[10px] text-dark-muted uppercase font-black tracking-widest">Expense Distribution</h3></div>
                <div className="flex items-start gap-6">
                    <div className="relative w-32 h-32 shrink-0 self-center">
                        <div className="w-full h-full rounded-full transition-all duration-1000" style={{ background: pieGradient }} />
                        <div className="absolute inset-4 bg-dark-card rounded-full flex items-center justify-center flex-col shadow-inner">
                             <span className="text-[7px] text-dark-muted uppercase font-black tracking-widest">Total Out</span>
                             <span className="text-[10px] font-black text-dark-text">₹{monthlyStats.totalExpense.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-3">
                        {monthlyStats.categories.slice(0, 4).map((cat, i) => (
                            <div key={cat.category} className="flex items-center justify-between pb-2 border-b border-dark-border/50 last:border-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                    <div className="flex flex-col"><span className="text-[9px] font-bold text-dark-text uppercase">{cat.category}</span></div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[9px] font-black text-dark-text">₹{cat.amount.toLocaleString()}</span>
                                    <span className="block text-[8px] text-dark-muted">{cat.percentage.toFixed(0)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
      )}

      {/* QUICK ENTRY MODAL (Triggered by Grid Tap) */}
      {selectedPreset && (
          <QuickEntryModal
             preset={selectedPreset}
             state={state}
             onClose={() => setSelectedPreset(null)}
             onSave={(txn) => { onAddTransaction(txn); setSelectedPreset(null); }}
          />
      )}

      {/* MANUAL ENTRY MODAL */}
      {showManual && (
          <ManualEntryModal onClose={() => setShowManual(false)} onSave={(txn) => { onAddTransaction(txn); setShowManual(false); }} />
      )}

      {/* EDIT CATEGORY MODAL */}
      {editingCategory && (
        <EditCategoryModal 
            category={editingCategory} 
            onClose={() => setEditingCategory(null)} 
            onSave={handleUpdateCategory} 
            onDelete={handleDeleteCategory}
        />
      )}

      {/* ADD CATEGORY MODAL */}
      {isAddingCategory && (
        <AddCategoryModal 
            onClose={() => setIsAddingCategory(false)} 
            onSave={handleAddNewCategory} 
        />
      )}
    </div>
  );
}

// --- Sub-Components for Modals ---

function EditCategoryModal({ category, onClose, onSave, onDelete }: { category: CategoryDef, onClose: () => void, onSave: (c: CategoryDef) => void, onDelete: (id: string) => void }) {
    const [data, setData] = useState(category);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <Card className="w-full max-w-sm bg-dark-bg border-gold-500 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-dark-muted hover:text-white"><X size={20} /></button>
                <h3 className="text-lg font-black text-dark-text uppercase tracking-widest mb-6">Edit Habit</h3>
                
                <div className="space-y-4">
                    <Input label="Label" value={data.label} onChange={e => setData({...data, label: e.target.value})} />
                    <Input label="Emoji Icon" value={data.icon} onChange={e => setData({...data, icon: e.target.value})} maxLength={2} className="text-center text-2xl" />
                    <Input label="Default Price (₹)" type="number" value={data.price} onChange={e => setData({...data, price: parseFloat(e.target.value) || 0})} />
                    
                    <div className="flex gap-3 pt-4">
                        <Button variant="danger" className="flex-1" onClick={() => { if(confirm('Delete this category?')) onDelete(data.id); }}>
                            <Trash2 size={18} />
                        </Button>
                        <Button className="flex-[3]" onClick={() => onSave(data)}>Save Changes</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function AddCategoryModal({ onClose, onSave }: { onClose: () => void, onSave: (c: Partial<CategoryDef>) => void }) {
    const [data, setData] = useState<Partial<CategoryDef>>({ label: '', icon: '⚡', price: 0 });

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <Card className="w-full max-w-sm bg-dark-bg border-dark-border shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-dark-muted hover:text-white"><X size={20} /></button>
                <h3 className="text-lg font-black text-dark-text uppercase tracking-widest mb-6">New Category</h3>
                
                <div className="space-y-4">
                    <Input label="Label (e.g. Gym)" value={data.label} onChange={e => setData({...data, label: e.target.value})} autoFocus />
                    <Input label="Emoji" value={data.icon} onChange={e => setData({...data, icon: e.target.value})} maxLength={2} className="text-center text-2xl" />
                    <Input label="Default Cost (₹)" type="number" value={data.price || ''} onChange={e => setData({...data, price: parseFloat(e.target.value) || 0})} />
                    
                    <Button className="w-full mt-4" onClick={() => onSave(data)} disabled={!data.label}>Create</Button>
                </div>
            </Card>
        </div>
    );
}
