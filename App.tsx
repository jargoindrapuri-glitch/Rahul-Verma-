
import React, { useState, useEffect } from 'react';
import { Home, BookOpen, Target, Settings, Check, Wallet, ListTodo } from 'lucide-react';
import { Container } from './components/UI';
import { AppState, UserProfile, DailyEntry, Transaction, Goal, Screen, AddictionLog } from './types';
import { generateId, formatDate, DEFAULT_HABITS } from './constants';

// Screens
import Onboarding from './screens/Onboarding';
import Dashboard from './screens/Dashboard';
import Journal from './screens/Journal';
import Goals from './screens/Goals';
import Finance from './screens/Finance';
import Habits from './screens/Habits';
import UserSettings from './screens/Settings';

const INITIAL_STATE: AppState = {
  profile: {
    name: '',
    startDate: new Date().toISOString(),
    intents: [],
    reminderMorning: '07:00',
    isOnboarded: false,
    dailyBudget: 500,
    habitLimits: { 'Cigarettes': 2, 'Junk Food': 1 },
    habitOverrides: {},
    habits: DEFAULT_HABITS
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
      if (!parsed.profile.habits) {
          parsed.profile.habits = DEFAULT_HABITS;
      }
      return { ...parsed, currentDate: formatDate(new Date()) };
    }
    return INITIAL_STATE;
  });

  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('jagruk_theme') as 'light' | 'dark') || 'dark';
  });

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('jagruk_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Persistence Engine
  useEffect(() => {
    localStorage.setItem('jagruk_journal_data', JSON.stringify(state));
  }, [state]);

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
        rating: 0
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

  const handleImportData = (newData: AppState) => {
    try {
      if (newData.profile && newData.entries && Array.isArray(newData.transactions)) {
        if (!newData.profile.habits) newData.profile.habits = DEFAULT_HABITS;
        setState({
          ...newData,
          currentDate: formatDate(new Date()) 
        });
        showToast("Backup Restored Successfully");
      } else {
        showToast("Error: Invalid Backup Structure");
      }
    } catch (e) {
      showToast("Import Failed");
    }
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
        return <Dashboard 
          state={state} 
          onNavigate={setCurrentScreen} 
          onUpdateEntry={updateEntry} 
          onAddTransaction={addTransaction}
          currentTheme={theme}
          onToggleTheme={toggleTheme}
        />;
      case 'journal':
        return <Journal state={state} onUpdateEntry={updateEntry} onNavigate={setCurrentScreen} />;
      case 'finance':
        return <Finance state={state} onAddTransaction={addTransaction} onAddAddictionLog={addAddictionLog} onUpdateProfile={(data) => setState(prev => ({ ...prev, profile: { ...prev.profile, ...data } }))} />;
      case 'goals':
        return <Goals state={state} onAddGoal={(g) => setState(prev => ({ ...prev, goals: [...prev.goals, g] }))} onToggleGoal={(id) => setState(prev => ({ ...prev, goals: prev.goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g) }))} onUpdateGoal={(id, data) => setState(prev => ({ ...prev, goals: prev.goals.map(g => g.id === id ? { ...g, ...data } : g) }))} />;
      case 'habits':
        return <Habits 
            state={state} 
            onUpdateEntry={updateEntry} 
            onUpdateProfile={(data) => setState(prev => ({ ...prev, profile: { ...prev.profile, ...data } }))}
        />;
      case 'settings':
        return <UserSettings 
          state={state} 
          onImport={handleImportData}
          onNavigate={setCurrentScreen}
          onReset={() => { if(confirm('Erase all data? This will factory reset the system.')) { localStorage.clear(); window.location.reload(); } }} 
        />;
      default:
        return <Dashboard 
          state={state} 
          onNavigate={setCurrentScreen} 
          onUpdateEntry={updateEntry} 
          onAddTransaction={addTransaction}
          currentTheme={theme}
          onToggleTheme={toggleTheme}
        />;
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
          <div className="flex justify-between items-center px-1">
            <NavBtn active={currentScreen === 'home'} icon={<Home size={20} />} label="Home" onClick={() => setCurrentScreen('home')} />
            <NavBtn active={currentScreen === 'habits'} icon={<ListTodo size={20} />} label="Habits" onClick={() => setCurrentScreen('habits')} />
            <NavBtn active={currentScreen === 'journal'} icon={<BookOpen size={20} />} label="Log" onClick={() => setCurrentScreen('journal')} />
            <NavBtn active={currentScreen === 'finance'} icon={<Wallet size={20} />} label="Finance" onClick={() => setCurrentScreen('finance')} />
            <NavBtn active={currentScreen === 'goals'} icon={<Target size={20} />} label="Vision" onClick={() => setCurrentScreen('goals')} />
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
