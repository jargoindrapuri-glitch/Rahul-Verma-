import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Button, Input, Container } from '../components/UI';
import { INTENT_OPTIONS } from '../constants';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface Props {
  onComplete: (data: Partial<UserProfile>) => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<UserProfile>>({
    name: '',
    intents: [],
    reminderMorning: '07:00',
    reminderNight: '22:00',
  });

  const toggleIntent = (intent: string) => {
    const current = data.intents || [];
    if (current.includes(intent)) {
      setData({ ...data, intents: current.filter(i => i !== intent) });
    } else {
      setData({ ...data, intents: [...current, intent] });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8 mt-20">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/30">
              <span className="text-4xl font-bold text-dark-bg">JJ</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gold-500 mb-2">Jagruk Journal</h1>
              <p className="text-dark-muted">Your 365 Days of Discipline & Clarity</p>
            </div>
            <div className="w-full pt-10">
                <Input 
                    placeholder="What should we call you?" 
                    value={data.name}
                    onChange={(e) => setData({...data, name: e.target.value})}
                    className="text-center"
                />
            </div>
            <Button className="w-full mt-10" onClick={() => { if(data.name) setStep(1) }}>
              Start My Journey <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col h-full mt-10">
            <h2 className="text-2xl font-bold text-dark-text mb-2">What do you want to improve?</h2>
            <p className="text-dark-muted mb-8">Select all that apply.</p>
            
            <div className="space-y-3 flex-1">
              {INTENT_OPTIONS.map(intent => {
                const isSelected = data.intents?.includes(intent);
                return (
                  <button
                    key={intent}
                    onClick={() => toggleIntent(intent)}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                      isSelected 
                        ? 'border-gold-500 bg-gold-500/10 text-gold-500' 
                        : 'border-dark-border bg-dark-card text-dark-text'
                    }`}
                  >
                    <span className="font-medium">{intent}</span>
                    {isSelected && <CheckCircle2 className="w-5 h-5" />}
                  </button>
                )
              })}
            </div>
            <Button className="w-full mt-6" onClick={() => setStep(2)} disabled={!data.intents?.length}>
              Continue
            </Button>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col h-full mt-10">
            <h2 className="text-2xl font-bold text-dark-text mb-2">Set your daily rhythm</h2>
            <p className="text-dark-muted mb-8">Consistency is your daily dose.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gold-500 mb-2 font-medium">☀️ Morning Check-in</label>
                <input 
                  type="time" 
                  value={data.reminderMorning}
                  onChange={(e) => setData({...data, reminderMorning: e.target.value})}
                  className="w-full bg-dark-card border border-dark-border rounded-xl p-4 text-xl text-center text-dark-text focus:border-gold-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-indigo-400 mb-2 font-medium">🌙 Night Reflection</label>
                <input 
                  type="time" 
                  value={data.reminderNight}
                  onChange={(e) => setData({...data, reminderNight: e.target.value})}
                  className="w-full bg-dark-card border border-dark-border rounded-xl p-4 text-xl text-center text-dark-text focus:border-gold-500 outline-none"
                />
              </div>
            </div>

            <div className="flex-1"></div>
            <Button className="w-full mt-6" onClick={() => onComplete(data)}>
              Save & Begin
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Container>
      <div className="p-6 h-full min-h-screen flex flex-col">
        {renderStep()}
      </div>
    </Container>
  );
}