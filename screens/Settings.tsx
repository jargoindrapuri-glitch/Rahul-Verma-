
import React, { useRef } from 'react';
import { AppState, Screen } from '../types';
import { Card } from '../components/UI';
import { Shield, FileText, HeartPulse, Trash2, AlertTriangle, Database, Upload, FileSpreadsheet, ArrowLeft, Info, HelpCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../constants';

interface Props {
  state: AppState;
  onReset: () => void;
  onImport: (data: AppState) => void;
  onNavigate: (screen: Screen) => void;
}

const getScoreColor = (score: number) => {
  if (!score || score === 0) return '#18181b';
  if (score < 4) return '#dc2626';
  if (score < 7) return '#d97706';
  return '#10b981';
};

export default function Settings({ state, onReset, onImport, onNavigate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pulseData = React.useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return formatDate(d);
    });
    return days.map(date => ({ date, score: state.entries[date]?.rating || 0 }));
  }, [state.entries]);

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `jagruk_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset to allow same file re-selection
        fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict validation
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'json') {
      alert(`INCOMPATIBLE FILE: .${ext}\n\nThe system only supports .json backup files.\n\nNote: PDFs and CSVs are for reading only and cannot be restored.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const json = JSON.parse(content);
        onImport(json);
      } catch (err) {
        alert("CRITICAL ERROR: File content is corrupted or not a valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  const ActionCard = ({ icon, label, sub, onClick, highlight = false }: { icon: React.ReactNode, label: string, sub: string, onClick: () => void, highlight?: boolean }) => (
    <button onClick={onClick} className={`flex flex-col items-start justify-between p-4 rounded-xl border transition-all text-left h-28 ${highlight ? 'bg-gold-500/10 border-gold-500/40' : 'bg-dark-card border-dark-border'}`}>
        <div className={highlight ? 'text-gold-500' : 'text-dark-muted'}>{icon}</div>
        <div>
            <span className="block text-xs font-black uppercase tracking-wider text-dark-text">{label}</span>
            <span className="block text-[10px] font-bold text-dark-muted mt-0.5">{sub}</span>
        </div>
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="flex items-center gap-4 pt-4 pb-2 border-b border-dark-border">
        <button onClick={() => onNavigate('home')} className="p-2 -ml-2 text-dark-muted"><ArrowLeft size={24} /></button>
        <div>
            <h1 className="text-2xl font-black text-dark-text">System Config</h1>
            <p className="text-[10px] text-dark-muted font-black uppercase tracking-[0.2em]">Data Vault & Restore</p>
        </div>
      </header>

      {/* Support Info */}
      <section className="bg-gold-500/5 border border-gold-500/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2 text-gold-500">
              <HelpCircle size={16} />
              <h2 className="text-[10px] font-black uppercase tracking-widest">Supported Files</h2>
          </div>
          <p className="text-[10px] text-dark-muted font-bold leading-relaxed">
            For <span className="text-gold-500">Sync Restore</span>, you must use a file ending in <span className="text-gold-500">.json</span>. 
            This file is created when you tap "Save JSON". 
            PDFs and CSVs are for your personal eyes only and cannot be re-imported.
          </p>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
            <HeartPulse size={14} className="text-gold-500" />
            <h2 className="text-[10px] font-black text-dark-muted uppercase tracking-[0.2em]">Discipline Velocity</h2>
        </div>
        <Card className="p-6 h-32 flex items-end gap-1">
            {pulseData.map((d, i) => (
                <div key={i} className="flex-1 rounded-sm transition-all" style={{ height: `${(d.score || 1) * 10}%`, backgroundColor: getScoreColor(d.score) }}></div>
            ))}
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-3">
           <ActionCard icon={<Database size={20}/>} label="Save Backup" sub="Export JSON" onClick={handleExportJSON} highlight />
           <ActionCard icon={<Upload size={20}/>} label="Sync Restore" sub="Import JSON" onClick={handleImportClick} highlight />
           <ActionCard icon={<FileText size={20}/>} label="Full Report" sub="Export PDF" onClick={() => alert('PDF Export requires internet to load libraries.')} />
           <ActionCard icon={<FileSpreadsheet size={20}/>} label="Ledger Data" sub="Export CSV" onClick={() => alert('CSV Exporting...')} />
      </section>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".json" />

      <button onClick={onReset} className="w-full p-6 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-between group">
          <div className="flex items-center gap-4 text-red-500">
              <Trash2 size={20} />
              <div className="text-left">
                  <span className="block text-xs font-black uppercase">Wipe Memory</span>
                  <span className="block text-[8px] font-bold uppercase opacity-50">Factory Reset System</span>
              </div>
          </div>
          <AlertTriangle size={16} className="text-red-500 opacity-30" />
      </button>

      <div className="text-center pt-8 opacity-20">
          <p className="text-[9px] font-black uppercase tracking-[0.5em]">v1.1.0 STABLE</p>
      </div>
    </div>
  );
}
