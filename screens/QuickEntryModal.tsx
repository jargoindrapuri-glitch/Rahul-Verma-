import React, { useState } from 'react';
import { Transaction, QuickAddPreset, AppState } from '../types';
import { Card, Button, Input } from '../components/UI';
import { X, Plus, Minus, Check, Calendar } from 'lucide-react';
import { formatDate } from '../constants';

interface Props {
  preset: QuickAddPreset;
  state: AppState;
  onClose: () => void;
  onSave: (txn: Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string }) => void;
}

export default function QuickEntryModal({ preset, state, onClose, onSave }: Props) {
  const defaultPrice = state.profile.habitOverrides?.[preset.id] ?? preset.price;
  const [amount, setAmount] = useState<number>(defaultPrice);
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(formatDate(new Date()));

  const handleSave = () => {
    // Construct ISO string for the selected date at the current local time or start of day
    const selectedDate = new Date(date);
    const now = new Date();
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    onSave({
      amount: amount * quantity,
      type: 'EXPENSE',
      category: preset.label,
      isHabit: true,
      unitQuantity: quantity,
      unitType: preset.unit,
      note: note || `Logged ${quantity} ${preset.label}`,
      timestamp: selectedDate.toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <Card className="w-full max-w-sm bg-dark-bg border-gold-500/50 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-dark-muted hover:text-white transition-colors">
          <X size={24} />
        </button>
        
        <div className="flex flex-col items-center mb-6 pt-4">
            <div className="w-20 h-20 rounded-3xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-4xl mb-4">
                {preset.icon === 'cigarette' ? '🚬' : preset.icon === 'burger' ? '🍔' : preset.icon === 'coffee' ? '☕' : '🚕'}
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-[0.2em]">{preset.label}</h2>
            <p className="text-[10px] text-dark-muted font-bold tracking-widest mt-1 uppercase">Adjust & Confirm</p>
        </div>

        <div className="space-y-6">
          {/* Date Selector */}
          <div className="space-y-3">
            <label className="text-[10px] text-dark-muted uppercase font-black tracking-widest flex items-center gap-2">
              <Calendar size={12} className="text-gold-500" /> Transaction Date
            </label>
            <Input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-zinc-900 border-dark-border text-center font-bold"
            />
          </div>

          {/* Amount Adjust */}
          <div className="space-y-3">
            <label className="text-[10px] text-dark-muted uppercase font-black tracking-widest">Price per {preset.unit} (₹)</label>
            <Input 
                type="number" 
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="text-center text-2xl font-black text-gold-500"
            />
          </div>

          {/* Quantity Adjust */}
          <div className="space-y-3">
            <label className="text-[10px] text-dark-muted uppercase font-black tracking-widest">Quantity</label>
            <div className="flex items-center gap-4">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center text-white active:scale-90 transition-all hover:border-gold-500/30"
                >
                    <Minus size={20} />
                </button>
                <div className="flex-1 text-center text-3xl font-black text-white">{quantity}</div>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center text-white active:scale-90 transition-all hover:border-gold-500/30"
                >
                    <Plus size={20} />
                </button>
            </div>
          </div>

          {/* Total Display */}
          <div className="bg-dark-card/50 border border-dark-border rounded-2xl p-4 flex justify-between items-center">
              <span className="text-xs font-bold text-dark-muted uppercase tracking-widest">Final Total</span>
              <span className="text-2xl font-black text-white">₹{(amount * quantity).toLocaleString()}</span>
          </div>

          <Button className="w-full h-14 font-black uppercase tracking-[0.2em] text-base" onClick={handleSave}>
            <Check size={20} /> Log Transaction
          </Button>
        </div>
      </Card>
    </div>
  );
}