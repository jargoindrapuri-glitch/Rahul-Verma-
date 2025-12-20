import React, { useState } from 'react';
import { NightReflection, Mood } from '../types';
import { Card, Button, Input, TextArea } from '../components/UI';
import { MOODS } from '../constants';
import { X, Check, X as XIcon } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSave: (data: NightReflection) => void;
}

export default function NightReportModal({ onClose, onSave }: Props) {
  const [data, setData] = useState<Partial<NightReflection>>({
    followedFocus: false,
    win: '',
    regret: '',
    gratitude: '',
    smokedToday: false,
    impulseBuy: false,
    resistedCraving: false,
    regretSpendAmount: 0
  });
  const [selectedMood, setSelectedMood] = useState<Mood | undefined>();

  const handleSubmit = () => {
    if (!selectedMood) return alert("Please select a mood.");
    onSave({
      mood: selectedMood,
      followedFocus: data.followedFocus || false,
      win: data.win || '',
      regret: data.regret || '',
      gratitude: data.gratitude || '',
      smokedToday: data.smokedToday,
      impulseBuy: data.impulseBuy,
      resistedCraving: data.resistedCraving,
      regretSpendAmount: data.regretSpendAmount
    });
  };

  const Toggle = ({ label, value, onChange }: { label: string, value: boolean | undefined, onChange: (val: boolean) => void }) => (
    <div className="flex items-center justify-between p-3 bg-dark-card rounded-lg border border-dark-border">
        <span className="text-sm font-medium text-dark-text">{label}</span>
        <div className="flex gap-2">
            <button 
                onClick={() => onChange(true)}
                className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${value === true ? 'bg-gold-500 text-dark-bg' : 'bg-dark-bg text-dark-muted border border-dark-border'}`}
            >
                <Check size={14} />
            </button>
            <button 
                onClick={() => onChange(false)}
                className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${value === false ? 'bg-dark-bg text-dark-text border border-dark-border' : 'bg-dark-bg text-dark-muted border border-dark-border'}`}
            >
                <XIcon size={14} />
            </button>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-dark-bg border border-gold-500 relative pb-20">
        <button onClick={onClose} className="absolute top-4 right-4 text-dark-muted hover:text-white">
          <X size={24} />
        </button>
        
        <h2 className="text-xl font-bold text-gold-500 mb-6 text-center">🌙 Night Report</h2>

        <div className="space-y-4">
          {/* Mood */}
          <div>
            <label className="block text-xs text-dark-muted uppercase tracking-wider mb-3 text-center">Mood Today?</label>
            <div className="flex justify-between px-2">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setSelectedMood(m.value)}
                  className={`text-2xl transition-transform ${selectedMood === m.value ? 'scale-125' : 'opacity-40 grayscale'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-dark-border my-2"></div>

          {/* Quick Checks */}
          <Toggle label="Followed Focus?" value={data.followedFocus} onChange={v => setData({...data, followedFocus: v})} />
          <Toggle label="Smoked Today?" value={data.smokedToday} onChange={v => setData({...data, smokedToday: v})} />
          <Toggle label="Resisted a Craving?" value={data.resistedCraving} onChange={v => setData({...data, resistedCraving: v})} />
          <Toggle label="Any Impulse Buy?" value={data.impulseBuy} onChange={v => setData({...data, impulseBuy: v})} />
          
          {data.impulseBuy && (
             <Input 
                label="Regret Spend Amount (₹)" 
                type="number"
                value={data.regretSpendAmount || ''}
                onChange={e => setData({...data, regretSpendAmount: Number(e.target.value)})}
             />
          )}

          <div className="h-px bg-dark-border my-2"></div>

          <Input 
            label="🏆 One Win" 
            value={data.win} 
            onChange={e => setData({...data, win: e.target.value})}
          />
          <Input 
            label="😞 One Regret" 
            value={data.regret} 
            onChange={e => setData({...data, regret: e.target.value})}
          />
          <TextArea 
            label="🙏 Gratitude" 
            className="h-20 min-h-[80px]"
            value={data.gratitude} 
            onChange={e => setData({...data, gratitude: e.target.value})}
          />

          <Button className="w-full mt-4 mb-2" onClick={handleSubmit}>Save & Sleep</Button>
        </div>
      </Card>
    </div>
  );
}