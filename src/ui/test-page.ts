export function getTestPageHtml(port: number, apiKey: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MapsScraper Pro — B2B Lead Engine & Google Sheets Sync</title>
  
  <!-- Inter & Geist Mono Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            mono: ['Geist Mono', 'monospace'],
          },
          colors: {
            brand: {
              50: '#f0f9ff',
              100: '#e0f2fe',
              200: '#bae6fd',
              300: '#7dd3fc',
              400: '#38bdf8',
              500: '#0ea5e9',
              600: '#0284c7',
              700: '#0369a1',
              800: '#075985',
              900: '#0c4a6e',
              950: '#082f49',
            },
            slate: {
              850: '#111827',
              900: '#0f172a',
              950: '#020617',
            }
          },
          animation: {
            'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            'shimmer': 'shimmer 2s infinite linear',
          },
          keyframes: {
            shimmer: {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' },
            }
          }
        }
      }
    };
  </script>

  <!-- React 18 & ReactDOM via CDN -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <!-- Babel for inline JSX compilation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <style>
    body {
      background-color: #020617;
      color: #f8fafc;
      font-family: 'Inter', system-ui, sans-serif;
      overflow-x: hidden;
    }
    /* Subtle custom scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0b0f19; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: #334155; }
    
    /* React Bits background canvas */
    #ambient-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      opacity: 0.6;
    }
    
    .glass-panel {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(51, 65, 85, 0.4);
    }
    .glass-card {
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(51, 65, 85, 0.45);
    }
    .glass-card:hover {
      border-color: rgba(56, 189, 248, 0.4);
    }
  </style>
</head>
<body class="min-h-screen selection:bg-brand-500/30 selection:text-brand-200">
  <!-- React Bits Canvas Background -->
  <canvas id="ambient-canvas"></canvas>

  <!-- Root React Mount Container -->
  <div id="root" class="relative z-10"></div>

  <!-- React Application Logic -->
  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo } = React;

    // --- Embedded Lucide Icons (Pure SVG for high performance & reliability) ---
    const Icons = {
      Search: (props) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
      MapPin: (props) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>,
      Building: (props) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>,
      Globe: (props) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/></svg>,
      Linkedin: (props) => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74V9.93H5.06v8.57z"/></svg>,
      Sheet: (props) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8M8 17h8M10 9h4"/></svg>,
      CheckCircle2: (props) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
      AlertCircle: (props) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
      Copy: (props) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
      Download: (props) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
      ExternalLink: (props) => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>,
      Play: (props) => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" {...props}><polygon points="6 3 20 12 6 21 6 3"/></svg>,
      Square: (props) => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" {...props}><rect width="18" height="18" x="3" y="3" rx="2"/></svg>,
      RefreshCw: (props) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>,
      Sliders: (props) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/></svg>,
      Sparkles: (props) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>,
      Terminal: (props) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>,
      History: (props) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
      Code: (props) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    };

    function App() {
      // Configuration & Authentication
      const [apiKey, setApiKey] = useState('${apiKey}');
      const [query, setQuery] = useState('software companies');
      const [location, setLocation] = useState('Nagpur');
      const [limit, setLimit] = useState(25);
      const [googleSheet, setGoogleSheet] = useState('https://docs.google.com/spreadsheets/d/1OZwLheM2N6AaTC2_-_tP7N4iwDPNuOtQawYQAOst0gQ/edit');
      const [sheetName, setSheetName] = useState('Sheet1');
      const [enrichLinkedin, setEnrichLinkedin] = useState(true);
      const [syncSheet, setSyncSheet] = useState(true);

      // Scraper Live State
      const [isScraping, setIsScraping] = useState(false);
      const [progress, setProgress] = useState({ stage: 'idle', message: 'Ready to scrape', collected: 0, target: 25 });
      const [leads, setLeads] = useState([]);
      const [logs, setLogs] = useState([]);
      const [stats, setStats] = useState({ totalScraped: 0, verified: 0, withLinkedin: 0, skippedDuplicates: 0 });
      const [activeTab, setActiveTab] = useState('results'); // 'results' | 'activity' | 'history' | 'api'
      const [history, setHistory] = useState([]);
      const [filterText, setFilterText] = useState('');
      const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'website' | 'linkedin' | 'verified'
      const [copiedId, setCopiedId] = useState(null);
      const [elapsedSeconds, setElapsedSeconds] = useState(0);

      const eventSourceRef = useRef(null);
      const timerRef = useRef(null);
      const logsEndRef = useRef(null);

      // Load History on mount
      useEffect(() => {
        try {
          const saved = localStorage.getItem('leadpulse_history');
          if (saved) setHistory(JSON.parse(saved));
        } catch {}
      }, []);

      // Auto scroll terminal logs
      useEffect(() => {
        if (logsEndRef.current) {
          logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, [logs]);

      // Stop Scraper function
      const stopScraper = () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsScraping(false);
        addLog('warn', 'Scraping process halted by user.');
      };

      const addLog = (type, text) => {
        const time = new Date().toLocaleTimeString();
        setLogs((prev) => [...prev, { time, type, text }]);
      };

      // Start Scraper
      const startScraper = () => {
        if (isScraping) return;
        setIsScraping(true);
        setLeads([]);
        setElapsedSeconds(0);
        setProgress({ stage: 'navigating', message: 'Starting extraction...', collected: 0, target: limit });
        setLogs([]);
        addLog('info', \`🚀 Initiating scraper for "\${query}" in "\${location}" (Target: \${limit} leads)...\`);

        // Start elapsed timer
        const startTimestamp = Date.now();
        timerRef.current = setInterval(() => {
          setElapsedSeconds(Math.floor((Date.now() - startTimestamp) / 1000));
        }, 1000);

        const targetSheet = syncSheet && googleSheet ? googleSheet.trim() : '';
        const params = new URLSearchParams({
          query,
          location,
          limit: limit.toString(),
          enrich_linkedin: enrichLinkedin.toString(),
          sheet_name: sheetName,
          token: apiKey,
          api_key: apiKey,
        });
        if (targetSheet) params.append('google_sheet', targetSheet);

        const streamUrl = \`/api/scrape/stream?\${params.toString()}\`;
        addLog('info', 'Connecting to real-time engine stream...');

        const es = new EventSource(streamUrl);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'progress') {
              setProgress({
                stage: data.stage || 'scraping',
                message: data.message || 'Processing...',
                collected: data.collected || 0,
                target: data.target || limit,
              });
              addLog('info', data.message);

              // If lead arrived live
              if (data.currentLead) {
                setLeads((prev) => {
                  if (prev.some((l) => l.company_name === data.currentLead.company_name)) return prev;
                  return [...prev, data.currentLead];
                });
              }
            } else if (data.type === 'done') {
              const res = data.result;
              setIsScraping(false);
              clearInterval(timerRef.current);
              es.close();

              if (res && res.results) {
                setLeads(res.results);
                setStats({
                  totalScraped: res.total_found || res.results.length,
                  verified: res.companies_with_website || 0,
                  withLinkedin: res.companies_with_linkedin || 0,
                  skippedDuplicates: res.duplicates_skipped || 0,
                });

                addLog('success', \`🎉 Done! \${res.results.length} companies extracted in \${elapsedSeconds}s.\`);
                if (res.added_to_google_sheet > 0) {
                  addLog('success', \`📊 Added \${res.added_to_google_sheet} new rows to Google Sheet.\`);
                }

                // Save to history
                const newHistoryItem = {
                  id: Date.now(),
                  timestamp: new Date().toLocaleString(),
                  query,
                  location,
                  totalFound: res.results.length,
                  leads: res.results,
                  sheetUrl: res.google_sheet_url,
                };
                setHistory((prev) => {
                  const updated = [newHistoryItem, ...prev.slice(0, 19)];
                  try { localStorage.setItem('leadpulse_history', JSON.stringify(updated)); } catch {}
                  return updated;
                });
              }
            } else if (data.type === 'error') {
              addLog('error', \`Error: \${data.error}\`);
              setIsScraping(false);
              clearInterval(timerRef.current);
              es.close();
            }
          } catch (err) {
            console.error('Failed to parse SSE event:', err);
          }
        };

        es.onerror = (err) => {
          console.error('EventSource error:', err);
          addLog('warn', 'Stream connection ended or reconnecting...');
          setIsScraping(false);
          clearInterval(timerRef.current);
          es.close();
        };
      };

      // Copy text helper
      const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      };

      // Export CSV helper
      const downloadCSV = () => {
        if (!leads.length) return;
        const headers = ['Company Name', 'LinkedIn', 'Website', 'Source'];
        const rows = leads.map((l) => [
          \`"\${(l.company_name || '').replace(/"/g, '""')}"\`,
          \`"\${(l.linkedin || '').replace(/"/g, '""')}"\`,
          \`"\${(l.website || '').replace(/"/g, '""')}"\`,
          \`"\${(l.linkedin_source || '').replace(/"/g, '""')}"\`,
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', \`leads_\${query.replace(/\\s+/g, '_')}_\${location.replace(/\\s+/g, '_')}.csv\`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      // Copy TSV for Spreadsheet paste
      const copyTSV = () => {
        if (!leads.length) return;
        const tsv = leads.map((l) => \`\${l.company_name || ''}\\t\${l.linkedin || ''}\\t\${l.website || ''}\`).join('\\n');
        navigator.clipboard.writeText(tsv);
        setCopiedId('tsv_all');
        setTimeout(() => setCopiedId(null), 2000);
      };

      // Filtered leads
      const filteredLeads = useMemo(() => {
        return leads.filter((l) => {
          const matchesText = !filterText || (l.company_name || '').toLowerCase().includes(filterText.toLowerCase()) || (l.website || '').toLowerCase().includes(filterText.toLowerCase());
          if (!matchesText) return false;
          if (filterCategory === 'website') return !!l.website;
          if (filterCategory === 'linkedin') return !!l.linkedin;
          if (filterCategory === 'verified') return !!l.website && !!l.linkedin;
          return true;
        });
      }, [leads, filterText, filterCategory]);

      // Category chips
      const categoryChips = ['Software Companies', 'Lawyers', 'Dentists', 'Marketing Agencies', 'Real Estate', 'Solar Companies'];

      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Header (Untitled UI Brand Topbar) */}
          <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-bold text-xl">
                  📍
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    LeadPulse Pro
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      v2.5 Enterprise
                    </span>
                  </h1>
                  <p className="text-sm text-slate-400">
                    High-throughput Google Maps B2B lead discovery, LinkedIn verification & Google Sheets sync.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Status Indicator */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Playwright Cgroup Engine Active
              </div>

              {googleSheet && (
                <a
                  href={googleSheet}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                >
                  <Icons.Sheet />
                  Target Sheet
                  <Icons.ExternalLink />
                </a>
              )}
            </div>
          </header>

          {/* Metric Stat Cards (Untitled UI Pattern) */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Total Extracted</span>
                <Icons.Building className="text-brand-400" />
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {leads.length > 0 ? leads.length : stats.totalScraped}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                Target: <span className="text-slate-300 font-semibold">{limit} leads</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Verified Websites</span>
                <Icons.Globe className="text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                {leads.filter((l) => !!l.website).length}
              </div>
              <div className="text-xs text-slate-500">
                {leads.length ? \`\${Math.round((leads.filter((l) => !!l.website).length / leads.length) * 100)}% verified\` : 'Clean normalized URLs'}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>LinkedIn Companies</span>
                <Icons.Linkedin className="text-sky-400" />
              </div>
              <div className="text-3xl font-extrabold text-sky-400 tracking-tight">
                {leads.filter((l) => !!l.linkedin).length}
              </div>
              <div className="text-xs text-slate-500">
                Official /company/ pages
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Duplicates Skipped</span>
                <Icons.CheckCircle2 className="text-indigo-400" />
              </div>
              <div className="text-3xl font-extrabold text-indigo-400 tracking-tight">
                {stats.skippedDuplicates}
              </div>
              <div className="text-xs text-slate-500">
                Zero duplicates written
              </div>
            </div>
          </section>

          {/* Main 2-Column Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Control Center (SaaS Form) */}
            <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Icons.Sliders className="text-brand-400" />
                  Scraper Parameters
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Target: {limit} leads
                </span>
              </div>

              {/* Form Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Business Category / Query
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g. software companies, dentists, lawyers"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 transition"
                    />
                  </div>
                  {/* Quick Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {categoryChips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setQuery(chip)}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Location / City / Region
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Nagpur, Austin, TX, London"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 transition"
                    />
                  </div>
                </div>

                {/* Target Count Presets */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Target Lead Count
                    </label>
                    <span className="text-xs text-brand-400 font-bold">{limit} Companies</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                    className="w-full accent-brand-500 cursor-pointer"
                  />
                  <div className="flex justify-between gap-2 mt-2">
                    {[10, 25, 50, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setLimit(val)}
                        className={\`flex-1 py-1 text-xs font-semibold rounded-lg border transition \${limit === val ? 'bg-brand-500 text-slate-950 border-brand-400 shadow-md shadow-brand-500/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}\`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles (Untitled UI Switch Component) */}
                <div className="pt-2 border-t border-slate-800/80 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-800/40 transition">
                    <div>
                      <div className="text-sm font-medium text-white">5-Tier LinkedIn Verification</div>
                      <div className="text-xs text-slate-400">Validate official company pages; reject /in/ personal URLs</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enrichLinkedin}
                      onChange={(e) => setEnrichLinkedin(e.target.checked)}
                      className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-800/40 transition">
                    <div>
                      <div className="text-sm font-medium text-white">Google Sheets Sync</div>
                      <div className="text-xs text-slate-400">Append 3 columns [Company | LinkedIn | Website]</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={syncSheet}
                      onChange={(e) => setSyncSheet(e.target.checked)}
                      className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Google Sheet URL (Conditional) */}
                {syncSheet && (
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <label className="block text-xs font-medium text-slate-300">
                      Google Sheet URL or Spreadsheet ID
                    </label>
                    <input
                      type="text"
                      value={googleSheet}
                      onChange={(e) => setGoogleSheet(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition font-mono"
                    />
                  </div>
                )}

                {/* Authentication Key / Token */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Security Access Token
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter PLAYWRIGHT_MCP_EXTENSION_TOKEN"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 transition font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                {!isScraping ? (
                  <button
                    type="button"
                    onClick={startScraper}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-brand-500 to-sky-400 hover:from-brand-600 hover:to-sky-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition active:scale-[0.98]"
                  >
                    <Icons.Play />
                    Start Lead Scraper
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopScraper}
                    className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition active:scale-[0.98]"
                  >
                    <Icons.Square />
                    Halt Extraction ({elapsedSeconds}s)
                  </button>
                )}
              </div>
            </div>

            {/* Right Pane: Live Progress, Tabs & Results Table */}
            <div className="lg:col-span-7 space-y-6">

              {/* Live Progress Bar (React Bits Wave Shimmer) */}
              {isScraping && (
                <div className="glass-panel rounded-2xl p-5 border border-brand-500/40 shadow-xl space-y-3 animate-pulse-slow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-ping"></span>
                      <span>Phase: <span className="text-brand-400 uppercase tracking-wider font-bold">{progress.stage}</span></span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      Elapsed: {elapsedSeconds}s
                    </span>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="w-full bg-slate-950 rounded-full h-3.5 overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="bg-gradient-to-r from-brand-600 via-sky-400 to-emerald-400 h-full rounded-full transition-all duration-300 relative overflow-hidden"
                      style={{
                        width: \`\${Math.min(100, Math.max(5, (progress.collected / Math.max(1, limit)) * 100))}%\`,
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="truncate max-w-sm text-slate-300">{progress.message}</span>
                    <span className="text-brand-300 font-bold whitespace-nowrap">
                      {progress.collected} / {limit} Leads
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Tabs (Untitled UI Segmented Tabs) */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl gap-1">
                  <button
                    onClick={() => setActiveTab('results')}
                    className={\`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition \${activeTab === 'results' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}\`}
                  >
                    <Icons.Building />
                    Leads Table ({leads.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={\`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition \${activeTab === 'activity' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}\`}
                  >
                    <Icons.Terminal />
                    Live Activity ({logs.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={\`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition \${activeTab === 'history' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}\`}
                  >
                    <Icons.History />
                    History ({history.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('api')}
                    className={\`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition \${activeTab === 'api' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}\`}
                  >
                    <Icons.Code />
                    MCP / API Docs
                  </button>
                </div>

                {/* Table Export Actions */}
                {activeTab === 'results' && leads.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyTSV}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
                    >
                      <Icons.Copy />
                      {copiedId === 'tsv_all' ? 'Copied TSV!' : 'Copy for Sheets'}
                    </button>
                    <button
                      onClick={downloadCSV}
                      className="px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Icons.Download />
                      Export CSV
                    </button>
                  </div>
                )}
              </div>

              {/* TAB 1: Leads Table (Untitled UI Table Design) */}
              {activeTab === 'results' && (
                <div className="space-y-4">
                  {/* Filter and Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        placeholder="Search company or domain..."
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                      />
                      <Icons.Search className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                      {['all', 'website', 'linkedin', 'verified'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setFilterCategory(cat)}
                          className={\`px-2.5 py-1 text-xs font-medium rounded-lg border capitalize whitespace-nowrap transition \${filterCategory === cat ? 'bg-slate-800 text-brand-400 border-brand-500/30 font-semibold' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'}\`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table Panel */}
                  <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto max-h-[560px]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-900/90 text-slate-400 sticky top-0 z-10 border-b border-slate-800 uppercase tracking-wider text-[11px] font-semibold">
                          <tr>
                            <th className="py-3 px-4 w-12 text-center">#</th>
                            <th className="py-3 px-4">Company Name</th>
                            <th className="py-3 px-4">Official Website</th>
                            <th className="py-3 px-4">LinkedIn Page</th>
                            <th className="py-3 px-4 text-center">Verification</th>
                            <th className="py-3 px-3 w-16 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-sans">
                          {filteredLeads.length > 0 ? (
                            filteredLeads.map((lead, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/40 transition group">
                                <td className="py-3 px-4 text-center font-mono text-slate-500">
                                  {idx + 1}
                                </td>
                                
                                <td className="py-3 px-4 font-semibold text-white">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[10px] text-brand-400 font-bold uppercase shrink-0">
                                      {lead.company_name ? lead.company_name[0] : 'C'}
                                    </div>
                                    <span className="truncate max-w-[200px]" title={lead.company_name}>
                                      {lead.company_name}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  {lead.website ? (
                                    <div className="flex items-center gap-1.5">
                                      <a
                                        href={lead.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-400 hover:underline truncate max-w-[170px] inline-flex items-center gap-1"
                                        title={lead.website}
                                      >
                                        <Icons.Globe className="shrink-0 w-3 h-3 text-slate-500" />
                                        {lead.website.replace(/^https?:\\/\\//, '')}
                                      </a>
                                    </div>
                                  ) : (
                                    <span className="text-slate-500 italic">No website</span>
                                  )}
                                </td>

                                <td className="py-3 px-4">
                                  {lead.linkedin ? (
                                    <a
                                      href={lead.linkedin}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition font-mono text-[11px]"
                                    >
                                      <Icons.Linkedin className="w-3 h-3" />
                                      /company/
                                    </a>
                                  ) : (
                                    <span className="text-slate-600 text-[11px]">null</span>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-center">
                                  <span className={\`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider \${
                                    lead.linkedin_source === 'maps'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                      : lead.linkedin_source === 'website'
                                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                      : lead.linkedin_source === 'web_search'
                                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                                  }\`}>
                                    {lead.linkedin_source || 'unverified'}
                                  </span>
                                </td>

                                <td className="py-3 px-3 text-center">
                                  <button
                                    onClick={() => copyToClipboard(\`\${lead.company_name}\\t\${lead.linkedin || ''}\\t\${lead.website || ''}\`, idx)}
                                    title="Copy 3-field row"
                                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                                  >
                                    <Icons.Copy className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="py-16 text-center text-slate-500 space-y-2">
                                <div className="text-3xl">🔍</div>
                                <div className="font-medium text-slate-400">No leads to display</div>
                                <div className="text-xs text-slate-600">Configure parameters on the left and click "Start Lead Scraper".</div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Live Activity Terminal */}
              {activeTab === 'activity' && (
                <div className="glass-panel rounded-2xl p-4 border border-slate-800 bg-slate-950/80 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Real-time Execution Stream
                    </span>
                    <button
                      onClick={() => setLogs([])}
                      className="text-[11px] hover:text-white transition"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-2">
                    {logs.length > 0 ? (
                      logs.map((log, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-slate-600 shrink-0">[{log.time}]</span>
                          <span className={\`\${
                            log.type === 'error' ? 'text-rose-400 font-semibold' :
                            log.type === 'warn' ? 'text-amber-400' :
                            log.type === 'success' ? 'text-emerald-400 font-semibold' :
                            'text-slate-300'
                          }\`}>
                            {log.text}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-600 py-8 text-center">Engine stream idle. Logs will appear here when a scrape begins.</div>
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              )}

              {/* TAB 3: History Drawer */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {history.length > 0 ? (
                    history.map((item) => (
                      <div key={item.id} className="glass-card rounded-xl p-4 border border-slate-800 space-y-2 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            "{item.query}" in {item.location}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-3">
                            <span>{item.timestamp}</span>
                            <span>•</span>
                            <span className="text-brand-400 font-medium">{item.totalFound} Leads</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setLeads(item.leads);
                              setActiveTab('results');
                            }}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition"
                          >
                            Load
                          </button>
                          {item.sheetUrl && (
                            <a
                              href={item.sheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                            >
                              <Icons.Sheet />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="glass-panel rounded-xl p-12 text-center text-slate-500 text-xs">
                      No previous scraping history found on this browser.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: MCP & API Integration Guide */}
              {activeTab === 'api' && (
                <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 text-xs font-mono">
                  <div className="text-sm font-bold text-white font-sans">MCP Server & API Integration</div>
                  <p className="text-slate-400 font-sans">
                    Connect this scraper tool directly to Claude Desktop, Cursor, or your custom agents via the Model Context Protocol endpoint:
                  </p>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-brand-300 break-all select-all">
                    https://google-maps-scraper-mcp.onrender.com/mcp?token={apiKey || 'YOUR_TOKEN'}
                  </div>

                  <div className="text-slate-300 font-bold font-sans pt-2">Claude Desktop Config (\`claude_desktop_config.json\`):</div>
                  <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto">
{\`{
  "mcpServers": {
    "google-maps-lead-scraper": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote-client",
        "https://google-maps-scraper-mcp.onrender.com/mcp?token=\${apiKey || 'YOUR_TOKEN'}"
      ]
    }
  }
}\`}
                  </pre>
                </div>
              )}

            </div>
          </div>

          {/* Footer */}
          <footer className="pt-8 border-t border-slate-800/80 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              Protected MCP Cloud Node • Render Oregon Free-Tier Memory Optimized (512MB Cgroup Safe)
            </div>
            <div className="flex items-center gap-4">
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                DOM Batching Active
              </span>
              <span>•</span>
              <span>Strict 3-Field Deduplication</span>
            </div>
          </footer>

        </div>
      );
    }

    // --- React Bits: Canvas Ambient Starfield / Grid Background ---
    function initAmbientCanvas() {
      const canvas = document.getElementById('ambient-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let width = (canvas.width = window.innerWidth);
      let height = (canvas.height = window.innerHeight);

      const dots = [];
      const numDots = Math.floor((width * height) / 12000);

      for (let i = 0; i < numDots; i++) {
        dots.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.2 + 0.4,
          alpha: Math.random() * 0.5 + 0.1,
          speed: Math.random() * 0.15 + 0.05,
        });
      }

      function draw() {
        ctx.clearRect(0, 0, width, height);

        // Subtle gradient background beam
        const grad = ctx.createRadialGradient(width / 2, height / 3, 50, width / 2, height / 3, width / 1.5);
        grad.addColorStop(0, 'rgba(14, 165, 233, 0.06)');
        grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Draw particle dots
        ctx.fillStyle = '#38bdf8';
        for (const dot of dots) {
          ctx.globalAlpha = dot.alpha;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
          ctx.fill();

          dot.y -= dot.speed;
          if (dot.y < 0) {
            dot.y = height;
            dot.x = Math.random() * width;
          }
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
      }

      draw();

      window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      });
    }

    // Mount Application
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
    initAmbientCanvas();
  </script>
</body>
</html>`;
}
