import React from 'react';
import { AppState } from '../types';
import { Card, Button } from '../components/UI';
import { User, RefreshCcw, LogOut, Shield } from 'lucide-react';

interface Props {
  state: AppState;
  onReset: () => void;
}

export default function Settings({ state, onReset }: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <header className="border-b border-dark-border pb-4">
        <h1 className="text-2xl font-bold text-gold-500">Settings</h1>
        <p className="text-dark-muted text-sm">Control Center</p>
      </header>

      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center text-dark-bg font-bold text-xl">
            {state.profile.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-dark-text">{state.profile.name}</h3>
            <p className="text-xs text-dark-muted">Joined {new Date(state.profile.startDate).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {state.profile.intents.map(i => (
            <span key={i} className="px-2 py-1 bg-dark-bg rounded text-xs border border-dark-border text-gold-500">
              {i}
            </span>
          ))}
        </div>
      </Card>

      <section className="space-y-3">
        <Button variant="secondary" className="w-full justify-start text-red-400 border-red-900/30 hover:bg-red-900/10" onClick={onReset}>
          <RefreshCcw size={18} /> Reset All Data
        </Button>
        <div className="text-center text-xs text-dark-muted pt-8">
            <p>Jagruk Journal v1.0</p>
            <p className="mt-2 flex items-center justify-center gap-1"><Shield size={12}/> Local Storage Only</p>
        </div>
      </section>
    </div>
  );
}