
import React, { useRef } from 'react';
import { AppState, Screen } from '../types';
import { Card, Button } from '../components/UI';
import { Shield, FileText, HeartPulse, Trash2, AlertTriangle, Database, Upload, FileSpreadsheet, ArrowLeft, ChevronRight } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../constants';

interface Props {
  state: AppState;
  onReset: () => void;
  onImport: (data: AppState) => void;
  onNavigate: (screen: Screen) => void;
}

// 1-10 Color Scale (Red -> Yellow -> Green)
const SCORE_COLORS = {
  1: '#7f1d1d', // Dark Red
  2: '#dc2626', // Red
  3: '#f87171', // Light Red
  4: '#c2410c', // Dark Orange/Yellow
  5: '#d97706', // Dark Yellow
  6: '#eab308', // Yellow
  7: '#facc15', // Light Yellow
  8: '#84cc16', // Light Green
  9: '#22c55e', // Green
  10: '#10b981' // Bright Green/Emerald
};

const getScoreColor = (score: number) => {
  if (!score || score === 0) return 'var(--bg-card)';
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  return (SCORE_COLORS as any)[clamped];
};

export default function Settings({ state, onReset, onImport, onNavigate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Life Pulse Data Calculation ---
  const pulseData = React.useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return formatDate(d);
    });

    return days.map(date => {
      const entry = state.entries[date];
      const score = entry?.rating || 0;
      const color = score > 0 ? getScoreColor(score) : 'var(--border-color)';
      return { date, score, color };
    });
  }, [state.entries]);

  const averageScore = React.useMemo(() => {
    const scores = Object.values(state.entries).map(e => e.rating || 0).filter(r => r > 0);
    if (scores.length === 0) return 0;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  }, [state.entries]);

  // --- Export Functions ---
  const handleExportCSV = () => {
    const headers = ["Date", "Category", "Type", "Amount", "Note"];
    const rows = state.transactions.map(t => [
      new Date(t.timestamp).toLocaleDateString(),
      t.category,
      t.type,
      t.amount,
      t.note || ""
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Jagruk_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "jagruk_backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (confirm("Restore this backup? This will overwrite all current system data.")) {
          onImport(json);
        }
      } catch (err) {
        alert("Invalid backup file. Could not parse JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    
    const addSectionTitle = (title: string, y: number) => {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(245, 158, 11);
        doc.text(title.toUpperCase(), margin, y);
        doc.setDrawColor(245, 158, 11);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
    };

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("JAGRUK JOURNAL", margin, 20);
    doc.setFontSize(10);
    doc.text(`System Report | ${new Date().toLocaleDateString()}`, margin, 26);

    let currentY = 40;
    addSectionTitle("Operational Profile", currentY);
    currentY += 10;
    doc.setFontSize(10);
    doc.text(`Operator: ${state.profile.name}`, margin, currentY);
    doc.text(`Deployment: ${new Date(state.profile.startDate).toLocaleDateString()}`, margin, currentY + 6);
    currentY += 20;

    addSectionTitle("Recent Ledger", currentY);
    const financeData = state.transactions.slice(0, 20).map(t => [
        new Date(t.timestamp).toLocaleDateString(),
        t.category,
        t.type,
        `INR ${t.amount}`
    ]);
    autoTable(doc, {
        startY: currentY + 5,
        head: [['Date', 'Category', 'Type', 'Amount']],
        body: financeData,
    });

    doc.save(`Jagruk_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Helper Component for Grid Buttons
  const ActionCard = ({ icon, label, sub, onClick, highlight = false }: { icon: React.ReactNode, label: string, sub: string, onClick: () => void, highlight?: boolean }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-start justify-between p-4 rounded-xl border transition-all duration-300 group active:scale-95 text-left h-28 ${highlight ? 'bg-gold-500/10 border-gold-500/40 hover:bg-gold-500/20' : 'bg-dark-card border-dark-border hover:border-zinc-500'}`}
    >
        <div className={`${highlight ? 'text-gold-500' : 'text-dark-muted group-hover:text-dark-text'}`}>
            {icon}
        </div>
        <div>
            <span className={`block text-xs font-black uppercase tracking-wider ${highlight ? 'text-dark-text' : 'text-dark-text'}`}>{label}</span>
            <span className="block text-[9px] font-bold text-dark-muted mt-0.5">{sub}</span>
        </div>
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-28">
      {/* Header */}
      <header className="flex items-center gap-4 pt-4 pb-2 border-b border-dark-border px-1">
        <button onClick={() => onNavigate('home')} className="p-2 -ml-2 rounded-full text-dark-muted hover:text-dark-text transition-colors">
            <ArrowLeft size={24} />
        </button>
        <div>
            <h1 className="text-2xl font-black text-dark-text tracking-tight">System Config</h1>
            <p className="text-dark-muted text-[10px] font-black uppercase tracking-[0.2em]">OS Settings & Data Vault</p>
        </div>
      </header>

      {/* LIFE PULSE VISUALIZATION */}
      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
            <HeartPulse size={14} className="text-gold-500" />
            <h2 className="text-[10px] font-black text-dark-muted uppercase tracking-[0.2em]">Life Pulse Index (30D)</h2>
        </div>
        <Card className="bg-dark-card border-dark-border p-6 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-end mb-6 relative z-10">
                <div>
                    <span className="text-[9px] text-dark-muted font-black uppercase tracking-widest block mb-1">Global Discipline</span>
                    <span className="text-4xl font-black text-dark-text tracking-tighter">{averageScore}<span className="text-lg text-dark-muted">/10</span></span>
                </div>
                <div className="text-right space-y-1">
                    <div className="flex items-center justify-end gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span className="text-[9px] text-dark-muted font-bold uppercase">Peak</span></div>
                    <div className="flex items-center justify-end gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div><span className="text-[9px] text-dark-muted font-bold uppercase">Nominal</span></div>
                    <div className="flex items-center justify-end gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-600"></div><span className="text-[9px] text-dark-muted font-bold uppercase">Critical</span></div>
                </div>
            </div>
            
            <div className="flex items-end justify-between h-24 gap-1 relative z-10">
                {pulseData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                        <div 
                            className="w-full rounded-sm transition-all duration-300 opacity-80 group-hover:opacity-100 hover:scale-y-110 origin-bottom" 
                            style={{ height: `${d.score ? (d.score * 10) : 5}%`, backgroundColor: d.color }}
                        ></div>
                    </div>
                ))}
            </div>
            {/* Background Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-bg/10 to-transparent pointer-events-none"></div>
        </Card>
      </section>

      {/* DATA VAULT */}
      <section>
          <div className="flex items-center gap-2 mb-3 px-1">
              <Shield size={14} className="text-blue-500" />
              <h2 className="text-[10px] font-black text-dark-muted uppercase tracking-[0.2em]">System Data Vault</h2>
          </div>
          
          <Card className="bg-transparent border-none p-0 shadow-none space-y-6">
              {/* Grid Actions */}
              <div className="grid grid-cols-2 gap-3">
                   <ActionCard 
                        icon={<FileText size={20}/>} 
                        label="Report PDF" 
                        sub="Printable View" 
                        onClick={handleExportPDF} 
                   />
                   <ActionCard 
                        icon={<FileSpreadsheet size={20}/>} 
                        label="Export CSV" 
                        sub="Excel Format" 
                        onClick={handleExportCSV} 
                   />
                   <ActionCard 
                        icon={<Database size={20}/>} 
                        label="Backup" 
                        sub="Save .JSON File" 
                        onClick={handleExportJSON} 
                        highlight
                   />
                   <ActionCard 
                        icon={<Upload size={20}/>} 
                        label="Restore" 
                        sub="Load .JSON File" 
                        onClick={handleImportClick} 
                        highlight
                   />
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".json"
              />

              {/* Danger Zone */}
              <div className="pt-6 border-t border-dark-border/50">
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-1">
                      <button 
                        onClick={onReset}
                        className="w-full h-14 rounded-xl flex items-center justify-between px-6 hover:bg-red-500/10 transition-colors group"
                      >
                          <div className="flex items-center gap-3">
                              <Trash2 size={18} className="text-red-500" />
                              <div className="text-left">
                                  <span className="block text-xs font-black text-red-500 uppercase tracking-wider">Wipe System Memory</span>
                                  <span className="block text-[9px] text-red-500/60 font-bold">Factory Reset</span>
                              </div>
                          </div>
                          <AlertTriangle size={16} className="text-red-500 opacity-50 group-hover:opacity-100" />
                      </button>
                  </div>
              </div>
          </Card>
      </section>
      
      <div className="text-center pt-8 opacity-40">
          <p className="text-[8px] text-dark-muted font-black uppercase tracking-[0.4em]">Jagruk OS v1.02 // Alpha</p>
      </div>
    </div>
  );
}
