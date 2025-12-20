
import React, { useState, useEffect } from 'react';
import { Home, BookOpen, Target, Settings, Check, Wallet } from 'lucide-react';
import { Container } from './components/UI';
import { AppState, UserProfile, DailyEntry, Transaction, Goal, Screen, AddictionLog } from './types';
import { generateId, formatDate } from './constants';

// Screens
import Onboarding from './screens/Onboarding';
import Dashboard from './screens/Dashboard';
import Journal from './screens/Journal';
import Goals from './screens/Goals';
import Finance from './screens/Finance';
import UserSettings from './screens/Settings';

const INITIAL_STATE: AppState = {
  profile: {
    name: '',
    startDate: new Date().toISOString(),
    intents: [],
    reminderMorning: '07:00',
    reminderNight: '22:00',
    isOnboarded: false,
    dailyBudget: 500,
    habitLimits: { 'Cigarettes': 2, 'Junk Food': 1 },
    habitOverrides: {}
  },
  entries: {},
  transactions: [],
  addictionLogs: [],
  goals: [],
  currentDate: formatDate(new Date()),
};

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('jagruk_journal_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure current date is always updated to actual today
      return { ...parsed, currentDate: formatDate(new Date()) };
    }
    return INITIAL_STATE;
  });

  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });

  // Persistence Engine
  useEffect(() => {
    localStorage.setItem('jagruk_journal_data', JSON.stringify(state));
  }, [state]);

  // Onboarding Protection
  useEffect(() => {
    if (!state.profile.isOnboarded) {
      setCurrentScreen('onboarding');
    }
  }, [state.profile.isOnboarded]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const updateEntry = (date: string, data: Partial<DailyEntry>) => {
    setState(prev => {
      const existing = prev.entries[date] || {
        date,
        todos: [],
        isLocked: false,
        rating: 5
      };
      return {
        ...prev,
        entries: {
          ...prev.entries,
          [date]: { ...existing, ...data }
        }
      };
    });
  };

  const addTransaction = (txn: Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string }) => {
    const newTxn: Transaction = {
      id: generateId(),
      timestamp: txn.timestamp || new Date().toISOString(),
      ...txn
    };
    setState(prev => ({
      ...prev,
      transactions: [newTxn, ...prev.transactions]
    }));
    showToast(`Logged: ${txn.category}`);
  };

  const addAddictionLog = (log: Omit<AddictionLog, 'id' | 'timestamp'>) => {
    const newLog: AddictionLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      ...log
    };
    setState(prev => ({
      ...prev,
      addictionLogs: [newLog, ...prev.addictionLogs]
    }));
  };

  const renderScreen = () => {
    if (!state.profile.isOnboarded) {
      return <Onboarding onComplete={(profileData) => {
        setState(prev => ({
          ...prev,
          profile: { ...prev.profile, ...profileData, isOnboarded: true }
        }));
        setCurrentScreen('home');
      }} />;
    }

    switch (currentScreen) {
      case 'home':
        return <Dashboard state={state} onNavigate={setCurrentScreen} onUpdateEntry={updateEntry} onAddTransaction={addTransaction} />;
      case 'journal':
        // Fix: Remove unused props onAddTransaction and onAddAddictionLog to match Journal component Props defined in Journal.tsx
        return <Journal state={state} onUpdateEntry={updateEntry} onNavigate={setCurrentScreen} />;
      case 'finance':
        return <Finance state={state} onAddTransaction={addTransaction} onAddAddictionLog={addAddictionLog} onUpdateProfile={(data) => setState(prev => ({ ...prev, profile: { ...prev.profile, ...data } }))} />;
      case 'goals':
        return <Goals state={state} onAddGoal={(g) => setState(prev => ({ ...prev, goals: [...prev.goals, g] }))} onToggleGoal={(id) => setState(prev => ({ ...prev, goals: prev.goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g) }))} onUpdateGoal={(id, data) => setState(prev => ({ ...prev, goals: prev.goals.map(g => g.id === id ? { ...g, ...data } : g) }))} />;
      case 'settings':
        return <UserSettings state={state} onReset={() => { if(confirm('Erase all data?')) { localStorage.clear(); window.location.reload(); } }} />;
      default:
        return <Dashboard state={state} onNavigate={setCurrentScreen} onUpdateEntry={updateEntry} onAddTransaction={addTransaction} />;
    }
  };

  return (
    <Container>
      <main className="flex-1 p-4 pb-24 overflow-y-auto scroll-smooth">
        {renderScreen()}
      </main>

      {toast.visible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
          <div className="bg-gold-500 text-dark-bg font-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-white/20">
            <Check size={18} /> {toast.message}
          </div>
        </div>
      )}

      {state.profile.isOnboarded && (
        <nav className="fixed bottom-0 left-0 right-0 bg-dark-bg/95 backdrop-blur-xl border-t border-dark-border p-2 z-50 max-w-md mx-auto">
          <div className="flex justify-around items-center">
            <NavBtn active={currentScreen === 'home'} icon={<Home size={22} />} label="Home" onClick={() => setCurrentScreen('home')} />
            <NavBtn active={currentScreen === 'journal'} icon={<BookOpen size={22} />} label="Journal" onClick={() => setCurrentScreen('journal')} />
            <NavBtn active={currentScreen === 'finance'} icon={<Wallet size={22} />} label="Finance" onClick={() => setCurrentScreen('finance')} />
            <NavBtn active={currentScreen === 'goals'} icon={<Target size={22} />} label="Vision" onClick={() => setCurrentScreen('goals')} />
            <NavBtn active={currentScreen === 'settings'} icon={<Settings size={22} />} label="System" onClick={() => setCurrentScreen('settings')} />
          </div>
        </nav>
      )}
    </Container>
  );
}

const NavBtn = ({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 px-3 py-1.5 rounded-2xl transition-all duration-300 ${active ? 'text-gold-500 bg-gold-500/10' : 'text-dark-muted hover:text-dark-text'}`}>
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`}>{icon}</div>
    <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);
