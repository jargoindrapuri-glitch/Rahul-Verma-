
import React, { useRef } from 'react';
import { AppState } from '../types';
import { Card, Button } from '../components/UI';
import { Shield, FileText, Download, HeartPulse, Trash2, AlertTriangle, Database, Upload, FileSpreadsheet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../constants';

interface Props {
  state: AppState;
  onReset: () => void;
  onImport: (data: AppState) => void;
}

export default function Settings({ state, onReset, onImport }: Props) {
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
      let color = 'bg-zinc-800'; 
      
      if (score >= 8) color = 'bg-emerald-500';
      else if (score >= 5) color = 'bg-gold-500';
      else if (score > 0) color = 'bg-red-500';

      return { date, score, color };
    });
  }, [state.entries]);

  const averageScore = React.useMemo(() => {
    const scores = Object.values(state.entries).map(e => e.rating || 0).filter(r => r > 0);
    if (scores.length === 0) return 0;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  }, [state.entries]);

  // --- Export: CSV (Spreadsheet) ---
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

  // --- Export: JSON Backup ---
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "jagruk_backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- Import: JSON Restore ---
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
    // Reset input
    e.target.value = '';
  };

  // --- Export: PDF Report ---
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

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <header className="pb-4 border-b border-dark-border">
        <h1 className="text-2xl font-black text-white">System Configuration</h1>
        <p className="text-dark-muted text-xs font-bold uppercase tracking-widest">OS Settings & Data Vault</p>
      </header>

      {/* LIFE PULSE VISUALIZATION */}
      <section>
        <div className="flex items-center gap-2 mb-3">
            <HeartPulse size={16} className="text-red-500" />
            <h2 className="text-xs font-black text-dark-muted uppercase tracking-widest">Life Pulse Index (30D)</h2>
        </div>
        <Card className="bg-zinc-900 border-dark-border p-5">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <span className="text-[10px] text-dark-muted font-black uppercase tracking-widest block">Global Discipline</span>
                    <span className="text-3xl font-black text-white">{averageScore}</span>
                    <span className="text-sm text-dark-muted font-bold">/10</span>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[9px] text-dark-muted font-bold">Nominal</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gold-500"></div><span className="text-[9px] text-dark-muted font-bold">Stable</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[9px] text-dark-muted font-bold">Critical</span></div>
                </div>
            </div>
            <div className="flex items-end justify-between h-20 gap-1 mb-2">
                {pulseData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                        <div className={`w-full rounded-sm transition-all duration-300 ${d.color} opacity-70 group-hover:opacity-100`} style={{ height: `${d.score ? (d.score * 10) : 5}%` }}></div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-[8px] text-zinc-700 font-black uppercase">
                <span>-30 Days</span>
                <span>Active Today</span>
            </div>
        </Card>
      </section>

      {/* DATA VAULT */}
      <section className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-gold-500" />
              <h2 className="text-xs font-black text-dark-muted uppercase tracking-widest">System Data Vault</h2>
          </div>
          
          <Card className="bg-zinc-900 border-dark-border p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                   <Button onClick={handleExportPDF} variant="secondary" className="h-12 text-[10px] font-black uppercase">
                      <FileText size={16} /> Export PDF
                   </Button>
                   <Button onClick={handleExportCSV} variant="secondary" className="h-12 text-[10px] font-black uppercase">
                      <FileSpreadsheet size={16} /> Export CSV
                   </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                   <Button onClick={handleExportJSON} variant="secondary" className="h-12 text-[10px] font-black uppercase border-gold-500/20">
                      <Database size={16} /> Backup .JSON
                   </Button>
                   <Button onClick={handleImportClick} variant="secondary" className="h-12 text-[10px] font-black uppercase text-gold-500 bg-gold-500/5">
                      <Upload size={16} /> Restore
                   </Button>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".json"
              />

              <div className="pt-4 border-t border-dark-border">
                  <Button variant="danger" className="w-full h-12 text-[10px] font-black uppercase" onClick={onReset}>
                      <Trash2 size={16} /> Wipe System Memory
                  </Button>
                  <p className="text-[9px] text-dark-muted text-center mt-3 uppercase font-bold tracking-widest">
                      <AlertTriangle size={10} className="inline mr-1 text-red-500" />
                      Critical Operation
                  </p>
              </div>
          </Card>
      </section>
      
      <div className="text-center pb-8 pt-4">
          <p className="text-[9px] text-zinc-800 font-black uppercase tracking-[0.5em]">Jagruk OS v1.02 Build Alpha</p>
      </div>
    </div>
  );
}
