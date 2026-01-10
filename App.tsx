
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, BookOpen, Target, Settings, Check, Wallet, ListTodo, WifiOff } from 'lucide-react';
import { Container } from './components/UI';
import { AppState, UserProfile, DailyEntry, Transaction, Goal, Screen } from './types';
import { generateId, formatDate, DEFAULT_HABITS } from './constants';

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
    habits: DEFAULT_HABITS,
    xp: 0,
    level: 1
  },
  entries: {},
  transactions: [],
  addictionLogs: [],
  goals: [],
  currentDate: formatDate(new Date()),
};

export default function App() {
  const isImporting = useRef(false);
  // Fix: Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout to resolve "Cannot find namespace 'NodeJS'" in browser environments.
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load state with error recovery
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('jagruk_journal_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed || typeof parsed !== 'object' || !parsed.profile) return INITIAL_STATE;
        
        // Ensure defaults for missing keys (Data Migration)
        return { 
          ...INITIAL_STATE, 
          ...parsed, 
          profile: { ...INITIAL_STATE.profile, ...parsed.profile },
          currentDate: formatDate(new Date()) 
        };
      }
    } catch (e) {
      console.error("Storage Error: System data corrupted. Reverting to safe defaults.");
    }
    return INITIAL_STATE;
  });

  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('jagruk_theme') as 'light' | 'dark') || 'dark');

  // Handle Online/Offline Status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Theme
  useEffect(() => {
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('jagruk_theme', theme);
  }, [theme]);

  // DEBOUNCED SAVE: Increases speed by reducing disk writes
  useEffect(() => { 
    if (isImporting.current) return;
    if (state?.profile?.isOnboarded) {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        try {
          localStorage.setItem('jagruk_journal_data', JSON.stringify(state));
        } catch (e) {
          console.error("Disk Write Failed: Storage likely full.");
        }
      }, 1000); // Save only after 1 second of inactivity
    }
  }, [state]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const updateEntry = useCallback((date: string, data: Partial<DailyEntry>) => {
    setState(prev => {
      const existing = prev.entries[date] || { date, todos: [], isLocked: false, rating: 0 };
      return { ...prev, entries: { ...prev.entries, [date]: { ...existing, ...data } } };
    });
  }, []);

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setState(prev => ({ ...prev, profile: { ...prev.profile, ...data } }));
  }, []);

  const addTransaction = (txn: Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: string }) => {
    const newTxn: Transaction = { id: generateId(), timestamp: txn.timestamp || new Date().toISOString(), ...txn };
    setState(prev => ({ ...prev, transactions: [newTxn, ...prev.transactions] }));
    showToast(`Logged: ${txn.category}`);
  };

  // --- HARDENED SYSTEM RESTORE ---
  const handleImportData = (newData: any) => {
    try {
      // 1. Basic validation to prevent null pointer crashes
      if (!newData || typeof newData !== 'object' || !newData.profile) {
         throw new Error("The file is not a valid Jagruk System Backup.");
      }

      isImporting.current = true;
      
      // 2. Data Cleaning - ensure we aren't importing garbage that crashes the render
      const cleanState: AppState = {
        ...INITIAL_STATE,
        ...newData,
        profile: {
          ...INITIAL_STATE.profile,
          ...newData.profile,
          isOnboarded: true
        },
        entries: newData.entries || {},
        transactions: Array.isArray(newData.transactions) ? newData.transactions : [],
        goals: Array.isArray(newData.goals) ? newData.goals : [],
        currentDate: formatDate(new Date())
      };

      // 3. Size check before write
      const serialized = JSON.stringify(cleanState);
      if (serialized.length > 5000000) { // ~5MB limit
          throw new Error("Backup file exceeds system memory limits.");
      }

      // 4. Atomic storage update
      localStorage.removeItem('jagruk_journal_data');
      localStorage.setItem('jagruk_journal_data', serialized);
      
      alert("SUCCESS: System state restored. Rebooting...");
      window.location.reload();
    } catch (e: any) {
      isImporting.current = false;
      alert(`RESTORE FAILED: ${e.message}`);
    }
  };

  const renderScreen = () => {
    if (!state.profile.isOnboarded) {
      return <Onboarding onComplete={(profileData) => {
        setState(prev => ({ ...prev, profile: { ...prev.profile, ...profileData, isOnboarded: true } }));
        setCurrentScreen('home');
      }} />;
    }

    switch (currentScreen) {
      case 'home': return <Dashboard state={state} onNavigate={setCurrentScreen} onUpdateEntry={updateEntry} onUpdateProfile={updateProfile} onAddTransaction={addTransaction} currentTheme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />;
      case 'journal': return <Journal state={state} onUpdateEntry={updateEntry} onNavigate={setCurrentScreen} />;
      case 'finance': return <Finance state={state} onAddTransaction={addTransaction} onAddAddictionLog={() => {}} onUpdateProfile={updateProfile} />;
      case 'goals': return <Goals state={state} onAddGoal={(g) => setState(p => ({...p, goals: [...p.goals, g]}))} onUpdateGoal={(id, d) => setState(p => ({...p, goals: p.goals.map(g => g.id === id ? {...g, ...d} : g)}))} onToggleGoal={(id) => setState(p => ({...p, goals: p.goals.map(g => g.id === id ? {...g, completed: !g.completed} : g)}))} onUpdateEntry={updateEntry} onNavigate={setCurrentScreen} />;
      case 'habits': return <Habits state={state} onUpdateEntry={updateEntry} onUpdateProfile={updateProfile} />;
      case 'settings': return <UserSettings state={state} onImport={handleImportData} onNavigate={setCurrentScreen} onReset={() => { if(confirm('Factory Reset?')) { localStorage.clear(); window.location.reload(); } }} />;
      default: return null;
    }
  };

  return (
    <Container>
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-4 flex items-center justify-center gap-2 z-[110]">
          <WifiOff size={12} /> System Offline - No Internet Detected
        </div>
      )}
      
      <main className="flex-1 p-4 pb-20 overflow-y-auto scroll-smooth">
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
  <button onClick={onClick} className={`flex-1 flex flex-col items-center gap-1.5 py-1.5 rounded-2xl transition-all ${active ? 'text-gold-500 bg-gold-500/10' : 'text-dark-muted'}`}>
    {icon}
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);
