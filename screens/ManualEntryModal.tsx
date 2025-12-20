import React, { useState } from 'react';
import { Transaction } from '../types';
import { Card, Button, Input } from '../components/UI';
import { X, Check, Calendar, Tag, IndianRupee } from 'lucide-react';
import { formatDate } from '../constants';

interface Props {
  onClose: () => void;
  onSave: (txn: Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string }) => void;
}

export default function ManualEntryModal({ onClose, onSave }: Props) {
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [date, setDate] = useState<string>(formatDate(new Date()));
  const [note, setNote] = useState<string>('');

  const handleSave = () => {
    if (!amount || !category) return alert("Please fill in Category and Amount.");
    
    const selectedDate = new Date(date);
    const now = new Date();
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    onSave({
      amount: parseFloat(amount),
      type,
      category,
      isHabit: false,
      note,
      timestamp: selectedDate.toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <Card className="w-full max-w-sm bg-dark-bg border-gold-500/50 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-dark-muted hover:text-white transition-colors">
          <X size={24} />
        </button>
        
        <div className="flex flex-col items-center mb-8 pt-4">
            <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500 mb-4">
                <IndianRupee size={32} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-[0.2em]">Manual Entry</h2>
            <p className="text-[10px] text-dark-muted font-bold tracking-widest mt-1 uppercase">Define the transaction</p>
        </div>

        <div className="space-y-6">
          {/* Type Selector */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-dark-border">
              <button 
                onClick={() => setType('EXPENSE')}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${type === 'EXPENSE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-dark-muted'}`}
              >
                  Expense
              </button>
              <button 
                onClick={() => setType('INCOME')}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-dark-muted'}`}
              >
                  Income
              </button>
          </div>

          {/* Date Selector */}
          <div className="space-y-3">
            <label className="text-[10px] text-dark-muted uppercase font-black tracking-widest flex items-center gap-2">
              <Calendar size={12} className="text-gold-500" /> Transaction Date
            </label>
            <Input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-zinc-900 border-dark-border font-bold"
            />
          </div>

          {/* Category */}
          <div className="space-y-3">
            <label className="text-[10px] text-dark-muted uppercase font-black tracking-widest flex items-center gap-2">
              <Tag size={12} className="text-gold-500" /> Category
            </label>
            <Input 
                placeholder="e.g., Grocery, Rent, Salary" 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="bg-zinc-900 border-dark-border"
            />
          </div>

          {/* Amount */}
          <div className="space-y-3">
            <label className="text-[10px] text-dark-muted uppercase font-black tracking-widest">Amount (₹)</label>
            <Input 
                type="number" 
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="text-center text-2xl font-black text-gold-500 bg-zinc-900"
            />
          </div>

          {/* Note */}
          <div className="space-y-3">
            <label className="text-[10px] text-dark-muted uppercase font-black tracking-widest">Memo (Optional)</label>
            <Input 
                placeholder="Add a note..." 
                value={note}
                onChange={e => setNote(e.target.value)}
                className="bg-zinc-900 border-dark-border text-xs"
            />
          </div>

          <Button className="w-full h-14 font-black uppercase tracking-[0.2em] text-base" onClick={handleSave}>
            <Check size={20} /> Commit to Ledger
          </Button>
        </div>
      </Card>
    </div>
  );
}