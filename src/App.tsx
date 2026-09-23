import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Scale,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Building2,
  Sparkles,
  RefreshCw,
  Code2,
  AlertCircle,
  Layers,
  SlidersHorizontal,
  ChevronLeft,
  X,
  Send,
  Zap,
  CheckCircle2,
  Plane,
  FileText,
  Play,
  Pause,
  RotateCcw,
  Monitor,
  Laptop,
  Globe,
  Share2,
  ArrowRight,
  Info,
  Download,
  FileCode,
  Eye,
} from 'lucide-react';
import { MarkdownViewer } from './components/MarkdownViewer';
import { convertToolResultToMarkdown, extractTags } from './utils/markdownFormatter';

interface RegulationItem {
  _id: number;
  is_regulation: string;
  office_name: string;
  legislation_type: string;
  legislation_name: string;
  primary_authorizing_legislation?: string;
  publication_date?: string;
  last_update?: string;
  primary_law_knesset_id?: string;
  wiki_clean_url?: string;
  knesset_clean_url?: string;
  tags_list?: string[];
  tags?: string;
}

interface ReliefItem {
  _id: number;
  ministry: string;
  unit?: string;
  title: string;
  details: string;
  additional_information?: string;
  tags?: string;
  update?: string;
}

interface StatsData {
  totalCount: number;
  ministries: { name: string; count: number }[];
  legislationTypes: { type: string; count: number }[];
  topTags: { tag: string; count: number }[];
  isRegulationBreakdown: { isRegulation: string; count: number };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'mcp' | 'console' | 'explorer' | 'reliefs' | 'advisor' | 'prompts'>('quickstart');

  // Stats
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Explorer state
  const [regulations, setRegulations] = useState<RegulationItem[]>([]);
  const [loadingRegulations, setLoadingRegulations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRegulation, setSelectedRegulation] = useState<RegulationItem | null>(null);

  // Reliefs state
  const [reliefs, setReliefs] = useState<ReliefItem[]>([]);
  const [loadingReliefs, setLoadingReliefs] = useState(false);
  const [reliefSearch, setReliefSearch] = useState('');

  // AI Advisor state
  const [advisorQuery, setAdvisorQuery] = useState('הפעלת שירותי תעופה מסחרית והשכרת כלי טיס בישראל');
  const [advisorSector, setAdvisorSector] = useState('aviation');
  const [advisorResult, setAdvisorResult] = useState<string | null>(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [groundedLaws, setGroundedLaws] = useState<RegulationItem[]>([]);

  // MCP Console state
  const [selectedTool, setSelectedTool] = useState('search_regulations');
  const [toolParamsJson, setToolParamsJson] = useState('{\n  "query": "חוק רישוי שירותי התעופה",\n  "limit": 5\n}');
  const [consoleResult, setConsoleResult] = useState<any>(null);
  const [consoleLoading, setConsoleLoading] = useState(false);
  const [consoleLatency, setConsoleLatency] = useState<number | null>(null);
  const [resultFormat, setResultFormat] = useState<'preview' | 'markdown' | 'json'>('preview');

  // Normalized Markdown representation for any MCP tool result
  const normalizedMarkdown = useMemo(() => {
    if (!consoleResult) return '';
    let parsedArgs: any = {};
    try {
      parsedArgs = JSON.parse(toolParamsJson);
    } catch {
      parsedArgs = {};
    }
    return convertToolResultToMarkdown(selectedTool, parsedArgs, consoleResult);
  }, [consoleResult, selectedTool, toolParamsJson]);

  const handleDownloadMarkdown = (content: string, filename = `${selectedTool}_result.md`) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Config URLs
  const [sseUrl, setSseUrl] = useState('');

  // Interactive Video / Walkthrough Player State
  const [videoStep, setVideoStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-play the simulated video walkthrough
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setVideoStep((prev) => (prev >= 4 ? 1 : prev + 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Fetch initial stats & sample regulations
  useEffect(() => {
    fetchStats();
    fetchRegulations();
    fetchReliefsList();

    const protocol = window.location.protocol;
    const host = window.location.host;
    setSseUrl(`${protocol}//${host}/api/mcp/sse`);
  }, []);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/regulation/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRegulations = async (query = searchQuery, ministry = selectedMinistry, type = selectedType, tag = selectedTag) => {
    setLoadingRegulations(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (ministry) params.append('office', ministry);
      if (type) params.append('type', type);
      if (tag) params.append('tag', tag);
      params.append('limit', '24');

      const res = await fetch(`/api/regulation/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRegulations(data.records || []);
        setTotalCount(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRegulations(false);
    }
  };

  const fetchReliefsList = async (q = reliefSearch) => {
    setLoadingReliefs(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append('q', q);
      params.append('limit', '20');

      const res = await fetch(`/api/regulation/reliefs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReliefs(data.records || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReliefs(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExecuteTool = async () => {
    setConsoleLoading(true);
    setConsoleResult(null);
    const startTime = performance.now();

    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(toolParamsJson);
      } catch (err) {
        setConsoleResult({ error: 'שגיאה במבנה ה-JSON של הפרמטרים' });
        setConsoleLoading(false);
        return;
      }

      const res = await fetch('/api/mcp/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: selectedTool,
            arguments: parsedParams,
          },
        }),
      });

      const data = await res.json();
      const endTime = performance.now();
      setConsoleLatency(Math.round(endTime - startTime));
      setConsoleResult(data);
    } catch (e: any) {
      setConsoleResult({ error: e.message || 'שגיאת תקשורת' });
    } finally {
      setConsoleLoading(false);
    }
  };

  const handleToolPresetChange = (toolName: string) => {
    setSelectedTool(toolName);
    switch (toolName) {
      case 'search_regulations':
        setToolParamsJson('{\n  "query": "חוק רישוי שירותי התעופה",\n  "limit": 5\n}');
        break;
      case 'get_regulation_by_id':
        setToolParamsJson('{\n  "id": 6212\n}');
        break;
      case 'get_regulatory_reliefs':
        setToolParamsJson('{\n  "query": "יבוא",\n  "limit": 5\n}');
        break;
      case 'list_ministries_and_categories':
        setToolParamsJson('{}');
        break;
      case 'check_business_compliance':
        setToolParamsJson('{\n  "sector": "aviation",\n  "business_description": "הפעלת טיסות מסחריות והשכרת כלי טיס"\n}');
        break;
      case 'analyze_regulatory_impact':
        setToolParamsJson('{\n  "proposed_rule_title": "חובת הצבת עמדות טעינה מהירה לרכב חשמלי בכל חניון מעל 50 מקומות",\n  "sector_affected": "בעלי נכסים מסחריים וקניונים",\n  "regulatory_objective": "עידוד מעבר לרכב חשמלי והפחתת פליטות פחמן"\n}');
        break;
    }
  };

  const handleAskAdvisor = async (customQuery?: string, sectorKey?: string) => {
    const q = customQuery !== undefined ? customQuery : advisorQuery;
    const s = sectorKey !== undefined ? sectorKey : advisorSector;
    if (!q) return;

    setAdvisorLoading(true);
    setAdvisorResult(null);

    try {
      const res = await fetch('/api/regulation/ai-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, sector: s }),
      });

      if (res.ok) {
        const data = await res.json();
        setAdvisorResult(data.analysis || 'לא התקבל פירוט.');
        setGroundedLaws(data.groundedRegulations || []);
      }
    } catch (e: any) {
      setAdvisorResult(`שגיאה בקבלת תשובה: ${e.message}`);
    } finally {
      setAdvisorLoading(false);
    }
  };

  // MCP configuration templates
  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        'israel-regulation': {
          url: sseUrl || 'https://<your-app-url>/api/mcp/sse',
        },
      },
    },
    null,
    2
  );

  const claudeDesktopLocalConfig = JSON.stringify(
    {
      mcpServers: {
        'israel-regulation': {
          command: 'npx',
          args: ['-y', 'tsx', 'mcp-server/index.ts'],
        },
      },
    },
    null,
    2
  );

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        'israel-regulation': {
          url: sseUrl || 'https://<your-app-url>/api/mcp/sse',
        },
      },
    },
    null,
    2
  );

  return (
    <div dir="rtl" className="min-h-screen bg-[#ebf3ff] text-[#0c3058] flex flex-col font-sans">
      {/* ========================================================= */}
      {/* IGDS 2.0 OFFICIAL ISRAEL GOVERNMENT HEADER BAR */}
      {/* ========================================================= */}
      <header className="bg-white border-b border-[#c2d4ec] sticky top-0 z-50 shadow-[0_1px_3px_rgba(12,48,88,0.08)]">
        {/* Top Ministry Strip */}
        <div className="bg-[#0c3058] text-white text-xs py-1.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide">מדינת ישראל</span>
              <span className="text-[#5878a4]">|</span>
              <span className="text-slate-200">מערך הדיגיטל הלאומי &amp; רשות האסדרה במשרד ראש הממשלה</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-300">
              <span className="inline-flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#7ad94a]" /> אתר שירות ממשלתי רשמי (Gov.il)
              </span>
              <span>•</span>
              <span>חוק עקרונות האסדרה, התשפ"ב-2021</span>
            </div>
          </div>
        </div>

        {/* Main Service Brand & Metrics */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[8px] bg-[#0068f5] flex items-center justify-center text-white shadow-[0_2px_4px_rgba(0,104,245,0.25)]">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#0c3058] tracking-tight">
                  מאגר האסדרה והחקיקה הלאומי
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-[100px] bg-[#eef8e8] text-[#499522] border border-[#7ad94a] font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#499522] animate-pulse"></span>
                  MCP חי וזמין
                </span>
              </div>
              <p className="text-xs text-[#5878a4] mt-0.5">
                ממשק Model Context Protocol (MCP) רשמי עבור סוכני בינה מלאכותית, Claude Desktop ו-Cursor
              </p>
            </div>
          </div>

          {/* IGDS Metrics Badges */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className="bg-[#f1f5fb] px-3.5 py-1.5 rounded-[8px] border border-[#c2d4ec] text-[#0c3058] flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#0068f5]" />
              <span className="text-[#5878a4]">חוקים ותקנות:</span>
              <span className="font-bold text-[#0c3058]">6,576+</span>
            </div>
            <div className="hidden sm:flex bg-[#f1f5fb] px-3.5 py-1.5 rounded-[8px] border border-[#c2d4ec] text-[#0c3058] items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#0068f5]" />
              <span className="text-[#5878a4]">משרדי ממשלה:</span>
              <span className="font-bold text-[#0c3058]">25+</span>
            </div>
            <div className="bg-[#eef8e8] px-3.5 py-1.5 rounded-[8px] border border-[#7ad94a] text-[#499522] flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#499522]" />
              <span>הקלות פעילות: 192</span>
            </div>
          </div>
        </div>

        {/* IGDS Tabs Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2 border-t border-[#ebf3ff]">
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`px-4 py-3 text-sm font-medium border-b-[3px] flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'quickstart'
                ? 'border-[#0068f5] text-[#0068f5] font-bold bg-[#ebf3ff]/60'
                : 'border-transparent text-[#5878a4] hover:text-[#0c3058] hover:bg-[#f1f5fb]'
            }`}
          >
            <Play className="w-4 h-4 text-[#0068f5]" />
            התחלה מהירה וסרטון הדגמה
          </button>

          <button
            onClick={() => setActiveTab('mcp')}
            className={`px-4 py-3 text-sm font-medium border-b-[3px] flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'mcp'
                ? 'border-[#0068f5] text-[#0068f5] font-bold bg-[#ebf3ff]/60'
                : 'border-transparent text-[#5878a4] hover:text-[#0c3058] hover:bg-[#f1f5fb]'
            }`}
          >
            <Code2 className="w-4 h-4" />
            התחברות ל-MCP (Claude &amp; Cursor)
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`px-4 py-3 text-sm font-medium border-b-[3px] flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'console'
                ? 'border-[#0068f5] text-[#0068f5] font-bold bg-[#ebf3ff]/60'
                : 'border-transparent text-[#5878a4] hover:text-[#0c3058] hover:bg-[#f1f5fb]'
            }`}
          >
            <Terminal className="w-4 h-4" />
            קונסולת בדיקה ובודק כלים
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`px-4 py-3 text-sm font-medium border-b-[3px] flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'explorer'
                ? 'border-[#0068f5] text-[#0068f5] font-bold bg-[#ebf3ff]/60'
                : 'border-transparent text-[#5878a4] hover:text-[#0c3058] hover:bg-[#f1f5fb]'
            }`}
          >
            <Search className="w-4 h-4" />
            מאגר החקיקה והתקנות (6,500+)
          </button>

          <button
            onClick={() => setActiveTab('reliefs')}
            className={`px-4 py-3 text-sm font-medium border-b-[3px] flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'reliefs'
                ? 'border-[#0068f5] text-[#0068f5] font-bold bg-[#ebf3ff]/60'
                : 'border-transparent text-[#5878a4] hover:text-[#0c3058] hover:bg-[#f1f5fb]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            הקלות והתאמות ברגולציה
          </button>

          <button
            onClick={() => setActiveTab('advisor')}
            className={`px-4 py-3 text-sm font-medium border-b-[3px] flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'advisor'
                ? 'border-[#0068f5] text-[#0068f5] font-bold bg-[#ebf3ff]/60'
                : 'border-transparent text-[#5878a4] hover:text-[#0c3058] hover:bg-[#f1f5fb]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#0068f5]" />
            יועץ ציות ורגולציה AI
          </button>

          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-4 py-3 text-sm font-medium border-b-[3px] flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'prompts'
                ? 'border-[#0068f5] text-[#0068f5] font-bold bg-[#ebf3ff]/60'
                : 'border-transparent text-[#5878a4] hover:text-[#0c3058] hover:bg-[#f1f5fb]'
            }`}
          >
            <Layers className="w-4 h-4" />
            משאבי MCP ותבניות RIA
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTAINER */}
      {/* ========================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ========================================================= */}
        {/* TAB 0: QUICKSTART, VIDEO DEMO & SCREENSHOTS */}
        {/* ========================================================= */}
        {activeTab === 'quickstart' && (
          <div className="space-y-6">
            {/* Header Hero */}
            <div className="bg-white rounded-[8px] border border-[#c2d4ec] p-6 shadow-[0_1px_3px_rgba(12,48,88,0.08)] flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-3xl space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[100px] bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] text-xs font-semibold">
                  <Play className="w-3.5 h-3.5" /> מדריך אינטראקטיבי והדגמה חיה
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0c3058]">
                  התחלה מהירה: חיבור ושליפה ממאגר האסדרה ב-60 שניות
                </h2>
                <p className="text-sm text-[#5878a4] leading-relaxed">
                  צפה בסרטון ההסבר האינטראקטיבי המציג כיצד סוכן AI מפעיל את שרת ה-MCP, שולף את חוק רישוי שירותי התעופה, ומספק תשובה מנומקת עם קישורים ישירים לרשומות הרשמיות.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('console')}
                  className="px-4 py-2.5 rounded-[8px] bg-[#0068f5] hover:bg-[#0057cc] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Terminal className="w-4 h-4" />
                  הרץ שאילתה כעת בקונסולה
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* INTERACTIVE VIDEO WALKTHROUGH SIMULATOR */}
            {/* ========================================================= */}
            <div className="bg-white rounded-[8px] border-2 border-[#0068f5] shadow-[0_4px_12px_rgba(0,104,245,0.12)] overflow-hidden">
              {/* Player Top Bar */}
              <div className="bg-[#0c3058] text-white px-5 py-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#eb4a4b]"></span>
                  <span className="w-3 h-3 rounded-full bg-[#997012]"></span>
                  <span className="w-3 h-3 rounded-full bg-[#7ad94a]"></span>
                  <span className="text-xs font-mono font-medium mr-2 text-slate-200">
                    הדגמת וידאו אינטראקטיבית: Claude Desktop + Israel Regulation MCP
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-3 py-1 rounded-[6px] bg-[#0068f5] hover:bg-[#0057cc] text-white font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {isPlaying ? 'השהה הדגמה' : 'הפעל הדגמה'}
                  </button>
                  <button
                    onClick={() => setVideoStep(1)}
                    className="p-1.5 rounded-[6px] bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="התחל מחדש"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Steps Indicator */}
              <div className="grid grid-cols-4 bg-[#f1f5fb] border-b border-[#c2d4ec] text-xs divide-x divide-x-reverse divide-[#c2d4ec]">
                <button
                  onClick={() => setVideoStep(1)}
                  className={`p-2.5 text-right font-medium transition-colors cursor-pointer ${
                    videoStep === 1 ? 'bg-[#ebf3ff] text-[#0068f5] font-bold border-b-2 border-[#0068f5]' : 'text-[#5878a4]'
                  }`}
                >
                  <span className="block text-[10px] text-[#5878a4]">שלב 1</span>
                  חיבור השרת ב-Claude Desktop
                </button>
                <button
                  onClick={() => setVideoStep(2)}
                  className={`p-2.5 text-right font-medium transition-colors cursor-pointer ${
                    videoStep === 2 ? 'bg-[#ebf3ff] text-[#0068f5] font-bold border-b-2 border-[#0068f5]' : 'text-[#5878a4]'
                  }`}
                >
                  <span className="block text-[10px] text-[#5878a4]">שלב 2</span>
                  שאילתת משתמש בשפה חופשית
                </button>
                <button
                  onClick={() => setVideoStep(3)}
                  className={`p-2.5 text-right font-medium transition-colors cursor-pointer ${
                    videoStep === 3 ? 'bg-[#ebf3ff] text-[#0068f5] font-bold border-b-2 border-[#0068f5]' : 'text-[#5878a4]'
                  }`}
                >
                  <span className="block text-[10px] text-[#5878a4]">שלב 3</span>
                  קריאת MCP ושליפת 8 רשומות
                </button>
                <button
                  onClick={() => setVideoStep(4)}
                  className={`p-2.5 text-right font-medium transition-colors cursor-pointer ${
                    videoStep === 4 ? 'bg-[#ebf3ff] text-[#0068f5] font-bold border-b-2 border-[#0068f5]' : 'text-[#5878a4]'
                  }`}
                >
                  <span className="block text-[10px] text-[#5878a4]">שלב 4</span>
                  תשובה מובנית וקישורים חיים
                </button>
              </div>

              {/* Simulated Screen Stage */}
              <div className="p-6 bg-slate-900 text-white min-h-[340px] flex flex-col justify-center">
                {videoStep === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-2">
                        <Laptop className="w-4 h-4 text-blue-400" /> הגדרת חיבור בקובץ claude_desktop_config.json
                      </span>
                      <span className="text-emerald-400 font-mono">1. חיבור השרת</span>
                    </div>
                    <pre dir="ltr" className="bg-slate-950 p-4 rounded-[6px] text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800">
{`{
  "mcpServers": {
    "israel-regulation": {
      "url": "${sseUrl || 'https://ais-dev-.../api/mcp/sse'}"
    }
  }
}`}
                    </pre>
                    <p className="text-xs text-slate-300">
                      💡 <strong>איך זה עובד:</strong> ברגע שהוספת את הכתובת, Claude Desktop מתחבר מיידית ב-SSE לשרת האסדרה הלאומי ומזהה את כל 6 הכלים והמשאבים ללא צורך בהתקנת שום חבילה מקומית.
                    </p>
                  </div>
                )}

                {videoStep === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-amber-400" /> חלון שיחה ב-Claude Desktop / Cursor
                      </span>
                      <span className="text-amber-400 font-mono">2. שאילתת המשתמש</span>
                    </div>

                    <div className="bg-slate-800/80 p-4 rounded-[8px] border border-slate-700 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-blue-300 font-bold">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">אתה</span>
                        משתמש שואל:
                      </div>
                      <p className="text-sm font-semibold text-white pr-7">
                        "שלוף לי ממאגר האסדרה הלאומי את חוק רישוי שירותי התעופה, התשכ"ג-1963 ואת התקנות שהותקנו מכוחו."
                      </p>
                    </div>

                    <p className="text-xs text-slate-400">
                      סוכן ה-AI מזהה באופן אוטונומי שעליו לפנות לכלי <code className="text-blue-300 font-mono">search_regulations</code> של שרת ה-MCP הישראלי.
                    </p>
                  </div>
                )}

                {videoStep === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-emerald-400" /> הפעלת הכלי בפרוטוקול JSON-RPC 2.0
                      </span>
                      <span className="text-emerald-400 font-mono">3. קריאת הכלי ושליפת הנתונים</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-[6px] border border-slate-800 font-mono text-[11px] text-emerald-400 space-y-1" dir="ltr">
                      <p className="text-slate-400">// Calling tool: israel-regulation.search_regulations</p>
                      <p>POST /api/mcp/rpc - 200 OK (38ms)</p>
                      <p className="text-blue-300">&#123; "name": "search_regulations", "arguments": &#123; "query": "חוק רישוי שירותי התעופה" &#125; &#125;</p>
                      <p className="text-amber-300">&#10140; 8 records found in regulation.gov.il datastore</p>
                      <p className="text-slate-400">• _id: 6212 (חקיקה ראשית - רשות התעופה האזרחית)</p>
                      <p className="text-slate-400">• _id: 6245 (תקנות פטור מרישיון הפעלה מסחרית, 2018)</p>
                      <p className="text-slate-400">• _id: 5625 (תקנות רישוי שירותי תעופה - טיסות שכר, 2023)</p>
                    </div>

                    <p className="text-xs text-slate-300">
                      השרת מתשאל ישירות את ה-API הממשלתי ומחזיר קישורים חיים לנוסח החוק בכנסת ובוויקיטקסט.
                    </p>
                  </div>
                )}

                {videoStep === 4 && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" /> תשובת ה-AI הסופית
                      </span>
                      <span className="text-purple-400 font-mono">4. סיכום החוק ותקנות המשנה</span>
                    </div>

                    <div className="bg-slate-800/90 p-4 rounded-[8px] border border-slate-700 text-xs space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> אותרה רשומה מס' 6212 במאגר האסדרה הלאומי:
                      </div>
                      <div className="text-slate-200 leading-relaxed pr-6 space-y-1">
                        <p>• <strong>חוק רישוי שירותי התעופה, התשכ"ג-1963</strong> - רשות ממונה: רשות התעופה האזרחית (רת"א).</p>
                        <p>• <strong>קישור לכנסת:</strong> <span className="text-blue-400 underline font-mono">main.knesset.gov.il/Activity/Legislation/Laws...</span></p>
                        <p>• <strong>נוסח מלא בוויקיטקסט:</strong> <span className="text-blue-400 underline font-mono">he.wikisource.org/wiki/חוק_רישוי_שירותי_התעופה</span></p>
                        <p>• <strong>תקנות משנה שהותקנו:</strong> תקנות טיסות שכר (2023), פטור מהיתר הפעלה (2018), בתי ספר לטיס.</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">התהליך הושלם בתוך פחות מחצי שנייה!</span>
                      <button
                        onClick={() => {
                          setSelectedTool('search_regulations');
                          setToolParamsJson('{\n  "query": "חוק רישוי שירותי התעופה",\n  "limit": 5\n}');
                          setActiveTab('console');
                        }}
                        className="px-3 py-1.5 rounded-[6px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        נסה זאת עכשיו בקונסולה <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* SCREENSHOTS & SYSTEM ARCHITECTURE GALLERY */}
            {/* ========================================================= */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#0c3058] flex items-center gap-2">
                <Monitor className="w-5 h-5 text-[#0068f5]" />
                תצלומי מסך מובנים (Screenshots &amp; UI Walkthrough)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Screenshot 1 */}
                <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0068f5] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0068f5]"></span> תצלום 1: סייר החקיקה הלאומי (Explorer)
                    </span>
                    <span className="text-[11px] text-[#5878a4] font-mono">6,576 חוקים ותקנות</span>
                  </div>
                  <div className="bg-[#f1f5fb] p-4 rounded-[6px] border border-[#c2d4ec] space-y-2 text-xs">
                    <div className="flex items-center gap-2 bg-white p-2 rounded border border-[#c2d4ec]">
                      <Search className="w-4 h-4 text-[#0068f5]" />
                      <span className="text-[#0c3058] font-medium">חוק רישוי שירותי התעופה</span>
                      <span className="mr-auto text-[10px] bg-[#ebf3ff] text-[#0068f5] px-2 py-0.5 rounded">חקיקה ראשית</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-white rounded border border-[#c2d4ec]">
                        <span className="text-[#5878a4] block">משרד ממונה</span>
                        <strong className="text-[#0c3058]">רשות התעופה האזרחית</strong>
                      </div>
                      <div className="p-2 bg-white rounded border border-[#c2d4ec]">
                        <span className="text-[#5878a4] block">מספר רשומה</span>
                        <strong className="text-[#0c3058]">#6212</strong>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[#5878a4]">
                    מאפשר חיפוש חופשי, סינון לפי 25+ משרדי ממשלה, תגיות נושא, וצפייה בנוסח החוק המלא.
                  </p>
                </div>

                {/* Screenshot 2 */}
                <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#499522] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#499522]"></span> תצלום 2: קונסולת בדיקה לכלים (Tool Inspector)
                    </span>
                    <span className="text-[11px] text-[#5878a4] font-mono">JSON-RPC 2.0</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-[6px] text-[11px] font-mono text-emerald-400 space-y-1" dir="ltr">
                    <p className="text-slate-400">// Direct Tool Execution</p>
                    <p className="text-blue-300">Tool: check_business_compliance</p>
                    <p className="text-slate-300">&#123; "sector": "aviation", "status": "approved" &#125;</p>
                    <p className="text-amber-400">Response Latency: 42ms</p>
                  </div>
                  <p className="text-xs text-[#5878a4]">
                    הרצה ובדיקה אינטראקטיבית של כלי ה-MCP עם עורך JSON, מדידת ביצועים והצגת נתוני האמת.
                  </p>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* STEP-BY-STEP QUICKSTART GUIDE (60 SECONDS) */}
            {/* ========================================================= */}
            <div className="bg-white p-6 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-5">
              <h3 className="text-lg font-bold text-[#0c3058] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#499522]" />
                מדריך התקנה מהיר בשלושה שלבים פשוטים
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-[8px] bg-[#f1f5fb] border border-[#c2d4ec] space-y-2">
                  <div className="w-7 h-7 rounded-full bg-[#0068f5] text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h4 className="font-bold text-[#0c3058] text-sm">העתק את כתובת ה-SSE</h4>
                  <p className="text-xs text-[#5878a4]">
                    אין צורך להוריד קבצים או לקמפל קוד. השרת פועל בענן עם כתובת מרוחקת מאובטחת.
                  </p>
                  <button
                    onClick={() => handleCopy(sseUrl, 'step-sse')}
                    className="w-full py-1.5 rounded-[6px] bg-white hover:bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'step-sse' ? <Check className="w-3.5 h-3.5 text-[#499522]" /> : <Copy className="w-3.5 h-3.5" />}
                    העתק קישור SSE
                  </button>
                </div>

                <div className="p-4 rounded-[8px] bg-[#f1f5fb] border border-[#c2d4ec] space-y-2">
                  <div className="w-7 h-7 rounded-full bg-[#0068f5] text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h4 className="font-bold text-[#0c3058] text-sm">הדבק בהגדרות Claude / Cursor</h4>
                  <p className="text-xs text-[#5878a4]">
                    פתח את <code className="font-mono text-[#0068f5]">claude_desktop_config.json</code> או <code className="font-mono text-[#0068f5]">.cursor/mcp.json</code> והדבק את הבלוק.
                  </p>
                  <button
                    onClick={() => handleCopy(claudeDesktopConfig, 'step-claude')}
                    className="w-full py-1.5 rounded-[6px] bg-white hover:bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'step-claude' ? <Check className="w-3.5 h-3.5 text-[#499522]" /> : <Copy className="w-3.5 h-3.5" />}
                    העתק תצורת JSON
                  </button>
                </div>

                <div className="p-4 rounded-[8px] bg-[#f1f5fb] border border-[#c2d4ec] space-y-2">
                  <div className="w-7 h-7 rounded-full bg-[#499522] text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h4 className="font-bold text-[#0c3058] text-sm">שאל בעברית טבעית!</h4>
                  <p className="text-xs text-[#5878a4]">
                    שאל על כל חוק בישראל, חובות רישוי עסקים, דרישות תברואה או הקלות רגולציה פעילות.
                  </p>
                  <div className="text-[11px] p-2 bg-white rounded border border-[#c2d4ec] font-mono text-[#0c3058]">
                    "שלוף את חוק רישוי שירותי התעופה"
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: MCP CONNECTION & CLIENT SETUP */}
        {/* ========================================================= */}
        {activeTab === 'mcp' && (
          <div className="space-y-6">
            {/* Hero Government Card */}
            <div className="bg-white rounded-[8px] border border-[#c2d4ec] p-6 shadow-[0_1px_3px_rgba(12,48,88,0.08)] relative overflow-hidden">
              <div className="max-w-3xl space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[100px] bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] text-xs font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  תקן Model Context Protocol (Anthropic) לשירות המדינה
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0c3058] tracking-tight">
                  שרת MCP למאגר האסדרה הלאומי (regulation.gov.il)
                </h2>
                <p className="text-[#5878a4] text-sm leading-relaxed">
                  השרת מעניק לסוכני בינה מלאכותית (Claude, Cursor, Windsurf) גישה אוטומטית וישירה לכלל החקיקה הראשית, תקנות המשנה, חובות הרישוי, וההקלות הרגולטוריות של מדינת ישראל.
                  המידע מסונכרן בזמן אמת מול מערכות רשות האסדרה במשרד ראש הממשלה ו-data.gov.il.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('console')}
                    className="px-5 py-2.5 rounded-[8px] bg-[#0068f5] hover:bg-[#0057cc] active:bg-[#0045a3] text-white text-sm font-semibold flex items-center gap-2 shadow-[0_1px_3px_rgba(0,104,245,0.3)] transition-colors cursor-pointer"
                  >
                    <Terminal className="w-4 h-4" />
                    קונסולת בדיקה לכלים
                  </button>
                  <button
                    onClick={() => setActiveTab('explorer')}
                    className="px-5 py-2.5 rounded-[8px] bg-[#f1f5fb] hover:bg-[#ebf3ff] text-[#0c3058] border border-[#c2d4ec] text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-[#0068f5]" />
                    חיפוש במאגר החקיקה (6,500+)
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Aviation Example Callout Card */}
            <div className="bg-[#ebf3ff] rounded-[8px] border-2 border-[#0068f5] p-5 shadow-[0_1px_3px_rgba(0,104,245,0.12)] space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[6px] bg-[#0068f5] text-white flex items-center justify-center">
                    <Plane className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0c3058] text-sm">
                      דוגמה מובילה: שליפת חוק רישוי שירותי התעופה, התשכ"ג-1963
                    </h3>
                    <p className="text-xs text-[#5878a4]">
                      רשומה מס' 6212 במאגר האסדרה יחד עם 7 תקנות משנה מוסמכות
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedTool('search_regulations');
                    setToolParamsJson('{\n  "query": "חוק רישוי שירותי התעופה",\n  "limit": 5\n}');
                    setActiveTab('console');
                  }}
                  className="px-4 py-2 rounded-[8px] bg-[#0068f5] hover:bg-[#0057cc] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  הרץ שאילתה זו בקונסולה
                </button>
              </div>
            </div>

            {/* Endpoints & Connection Methods */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#5878a4] mb-1.5">
                    <span className="font-semibold text-[#0c3058]">Remote SSE Endpoint</span>
                    <span className="px-2 py-0.5 rounded-[100px] bg-[#eef8e8] text-[#499522] border border-[#7ad94a] text-[11px] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#499522]"></span> פעיל
                    </span>
                  </div>
                  <div className="text-xs font-mono text-[#0068f5] bg-[#f1f5fb] p-2.5 rounded-[6px] border border-[#c2d4ec] select-all break-all" dir="ltr">
                    {sseUrl || '/api/mcp/sse'}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(sseUrl, 'sse')}
                  className="mt-4 w-full py-2 px-3 rounded-[8px] bg-[#0068f5] hover:bg-[#0057cc] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedId === 'sse' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  {copiedId === 'sse' ? 'הועתק בהצלחה!' : 'העתק כתובת SSE לחיבור מרוחק'}
                </button>
              </div>

              <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#5878a4] mb-1.5">
                    <span className="font-semibold text-[#0c3058]">פקודת Stdio מקומית</span>
                    <span className="text-[#0068f5] font-mono text-[11px]">Node.js / npx</span>
                  </div>
                  <div className="text-xs font-mono text-[#0c3058] bg-[#f1f5fb] p-2.5 rounded-[6px] border border-[#c2d4ec] select-all break-all" dir="ltr">
                    npx -y tsx mcp-server/index.ts
                  </div>
                </div>
                <button
                  onClick={() => handleCopy('npx -y tsx mcp-server/index.ts', 'npx')}
                  className="mt-4 w-full py-2 px-3 rounded-[8px] bg-[#f1f5fb] hover:bg-[#ebf3ff] text-[#0c3058] border border-[#c2d4ec] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedId === 'npx' ? <Check className="w-4 h-4 text-[#499522]" /> : <Copy className="w-4 h-4 text-[#0068f5]" />}
                  {copiedId === 'npx' ? 'הועתק!' : 'העתק פקודת Stdio'}
                </button>
              </div>

              <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#5878a4] mb-1.5">
                    <span className="font-semibold text-[#0c3058]">JSON-RPC 2.0 API</span>
                    <span className="text-[#997012] font-mono text-[11px]">HTTP POST</span>
                  </div>
                  <div className="text-xs font-mono text-[#0c3058] bg-[#f1f5fb] p-2.5 rounded-[6px] border border-[#c2d4ec] select-all break-all" dir="ltr">
                    /api/mcp/rpc
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(`${window.location.origin}/api/mcp/rpc`, 'rpc')}
                  className="mt-4 w-full py-2 px-3 rounded-[8px] bg-[#f1f5fb] hover:bg-[#ebf3ff] text-[#0c3058] border border-[#c2d4ec] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedId === 'rpc' ? <Check className="w-4 h-4 text-[#499522]" /> : <Copy className="w-4 h-4 text-[#0068f5]" />}
                  {copiedId === 'rpc' ? 'הועתק!' : 'העתק כתובת API'}
                </button>
              </div>
            </div>

            {/* Software Integration Guides */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#0c3058] flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#0068f5]" />
                הוראות חיבור מהירות לתוכנות AI
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Claude Desktop */}
                <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[6px] bg-[#ebf3ff] text-[#0068f5] flex items-center justify-center font-bold text-xs">
                        C
                      </div>
                      <h4 className="font-bold text-[#0c3058] text-sm">Claude Desktop</h4>
                    </div>
                    <span className="text-[11px] text-[#5878a4] font-mono">claude_desktop_config.json</span>
                  </div>
                  <p className="text-xs text-[#5878a4]">
                    הדבק בקובץ ההגדרות תחת מפתח <code className="text-[#0068f5] font-mono">mcpServers</code>:
                  </p>
                  <div className="relative">
                    <pre dir="ltr" className="bg-[#f1f5fb] p-3 rounded-[6px] border border-[#c2d4ec] text-xs font-mono text-[#0c3058] overflow-x-auto">
                      {claudeDesktopConfig}
                    </pre>
                    <button
                      onClick={() => handleCopy(claudeDesktopConfig, 'claude')}
                      className="absolute top-2 right-2 p-1.5 rounded-[6px] bg-white hover:bg-[#ebf3ff] border border-[#c2d4ec] text-[#0068f5] text-xs flex items-center gap-1 cursor-pointer"
                      title="העתק"
                    >
                      {copiedId === 'claude' ? <Check className="w-3.5 h-3.5 text-[#499522]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Cursor & Windsurf */}
                <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[6px] bg-[#ebf3ff] text-[#0068f5] flex items-center justify-center font-bold text-xs">
                        ⚡
                      </div>
                      <h4 className="font-bold text-[#0c3058] text-sm">Cursor &amp; Windsurf IDE</h4>
                    </div>
                    <span className="text-[11px] text-[#5878a4] font-mono">.cursor/mcp.json</span>
                  </div>
                  <p className="text-xs text-[#5878a4]">
                    הוסף לקובץ <code className="text-[#0068f5] font-mono">.cursor/mcp.json</code> בפרויקט שלך:
                  </p>
                  <div className="relative">
                    <pre dir="ltr" className="bg-[#f1f5fb] p-3 rounded-[6px] border border-[#c2d4ec] text-xs font-mono text-[#0c3058] overflow-x-auto">
                      {cursorConfig}
                    </pre>
                    <button
                      onClick={() => handleCopy(cursorConfig, 'cursor')}
                      className="absolute top-2 right-2 p-1.5 rounded-[6px] bg-white hover:bg-[#ebf3ff] border border-[#c2d4ec] text-[#0068f5] text-xs flex items-center gap-1 cursor-pointer"
                      title="העתק"
                    >
                      {copiedId === 'cursor' ? <Check className="w-3.5 h-3.5 text-[#499522]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* MCP Tools Catalog Table */}
            <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-4">
              <h3 className="text-base font-bold text-[#0c3058] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#0068f5]" />
                מפרט כלי ה-MCP הזמינים (Tools)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f1f5fb] border-b border-[#c2d4ec] text-[#0c3058] font-bold">
                      <th className="py-2.5 px-3">שם הכלי (Tool Name)</th>
                      <th className="py-2.5 px-3">תיאור בעברית</th>
                      <th className="py-2.5 px-3">פרמטרים</th>
                      <th className="py-2.5 px-3 text-center">בדיקה</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebf3ff] text-xs">
                    <tr className="hover:bg-[#f1f5fb]/80">
                      <td className="py-3 px-3 font-mono font-bold text-[#0068f5]" dir="ltr">search_regulations</td>
                      <td className="text-[#0c3058]">חיפוש חוקים, תקנות והוראות ניהול במאגר האסדרה הלאומי</td>
                      <td className="font-mono text-[#5878a4]" dir="ltr">query, office_name, legislation_type, tag, limit</td>
                      <td className="text-center">
                        <button
                          onClick={() => {
                            handleToolPresetChange('search_regulations');
                            setActiveTab('console');
                          }}
                          className="px-2.5 py-1 rounded-[6px] bg-[#ebf3ff] hover:bg-[#0068f5] hover:text-white text-[#0068f5] font-semibold transition-colors cursor-pointer"
                        >
                          הרץ
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#f1f5fb]/80">
                      <td className="py-3 px-3 font-mono font-bold text-[#0068f5]" dir="ltr">get_regulation_by_id</td>
                      <td className="text-[#0c3058]">קבלת פרטים מלאים על חוק/תקנה ספציפיים וקישורים ישירים לכנסת</td>
                      <td className="font-mono text-[#5878a4]" dir="ltr">id (מספר רשומה)</td>
                      <td className="text-center">
                        <button
                          onClick={() => {
                            handleToolPresetChange('get_regulation_by_id');
                            setActiveTab('console');
                          }}
                          className="px-2.5 py-1 rounded-[6px] bg-[#ebf3ff] hover:bg-[#0068f5] hover:text-white text-[#0068f5] font-semibold transition-colors cursor-pointer"
                        >
                          הרץ
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#f1f5fb]/80">
                      <td className="py-3 px-3 font-mono font-bold text-[#0068f5]" dir="ltr">get_regulatory_reliefs</td>
                      <td className="text-[#0c3058]">שליפת הקלות, פטורים והתאמות רגולציה ממשרדי הממשלה</td>
                      <td className="font-mono text-[#5878a4]" dir="ltr">query, ministry, limit</td>
                      <td className="text-center">
                        <button
                          onClick={() => {
                            handleToolPresetChange('get_regulatory_reliefs');
                            setActiveTab('console');
                          }}
                          className="px-2.5 py-1 rounded-[6px] bg-[#ebf3ff] hover:bg-[#0068f5] hover:text-white text-[#0068f5] font-semibold transition-colors cursor-pointer"
                        >
                          הרץ
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#f1f5fb]/80">
                      <td className="py-3 px-3 font-mono font-bold text-[#0068f5]" dir="ltr">check_business_compliance</td>
                      <td className="text-[#0c3058]">מיפוי רגולטורי לפי ענף (תעופה, מסעדות, פינטק, אנרגיה סולארית, יבוא, AI...)</td>
                      <td className="font-mono text-[#5878a4]" dir="ltr">sector, business_description</td>
                      <td className="text-center">
                        <button
                          onClick={() => {
                            handleToolPresetChange('check_business_compliance');
                            setActiveTab('console');
                          }}
                          className="px-2.5 py-1 rounded-[6px] bg-[#ebf3ff] hover:bg-[#0068f5] hover:text-white text-[#0068f5] font-semibold transition-colors cursor-pointer"
                        >
                          הרץ
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#f1f5fb]/80">
                      <td className="py-3 px-3 font-mono font-bold text-[#0068f5]" dir="ltr">analyze_regulatory_impact</td>
                      <td className="text-[#0c3058]">הערכת השפעת רגולציה (RIA) ובחינת חלופות לפי חוק עקרונות האסדרה</td>
                      <td className="font-mono text-[#5878a4]" dir="ltr">proposed_rule_title, sector_affected, regulatory_objective</td>
                      <td className="text-center">
                        <button
                          onClick={() => {
                            handleToolPresetChange('analyze_regulatory_impact');
                            setActiveTab('console');
                          }}
                          className="px-2.5 py-1 rounded-[6px] bg-[#ebf3ff] hover:bg-[#0068f5] hover:text-white text-[#0068f5] font-semibold transition-colors cursor-pointer"
                        >
                          הרץ
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: INTERACTIVE MCP TOOL INSPECTOR & PLAYGROUND */}
        {/* ========================================================= */}
        {activeTab === 'console' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0c3058] flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[#0068f5]" />
                  קונסולת בדיקה אינטראקטיבית ל-MCP (JSON-RPC 2.0)
                </h2>
                <p className="text-xs text-[#5878a4]">
                  הרץ שאילתות ישירות מול כלי השרת וצפה בפלט ה-JSON המדויק שמקבל מודל השפה (LLM).
                </p>
              </div>

              {consoleLatency !== null && (
                <div className="px-3 py-1 rounded-[100px] bg-[#eef8e8] border border-[#7ad94a] text-[#499522] text-xs font-mono font-medium">
                  זמן תגובה: {consoleLatency}ms
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Form: Tool & Parameters */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-[#0c3058] block mb-1">בחר כלי לבדיקה:</label>
                    <select
                      value={selectedTool}
                      onChange={(e) => handleToolPresetChange(e.target.value)}
                      className="w-full bg-white border border-[#c2d4ec] focus:border-[#0068f5] rounded-[8px] p-2.5 text-xs text-[#0c3058] font-mono"
                    >
                      <option value="search_regulations">search_regulations (חיפוש חוקים ותקנות)</option>
                      <option value="get_regulation_by_id">get_regulation_by_id (פרטי חוק לפי ID)</option>
                      <option value="get_regulatory_reliefs">get_regulatory_reliefs (הקלות רגולציה)</option>
                      <option value="check_business_compliance">check_business_compliance (ציות לענפים)</option>
                      <option value="analyze_regulatory_impact">analyze_regulatory_impact (ניתוח RIA)</option>
                      <option value="list_ministries_and_categories">list_ministries_and_categories (משרדים)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#0c3058]">פרמטרים (JSON arguments):</label>
                      <button
                        onClick={() => handleToolPresetChange(selectedTool)}
                        className="text-[11px] text-[#0068f5] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> איפוס לברירת מחדל
                      </button>
                    </div>
                    <textarea
                      dir="ltr"
                      rows={8}
                      value={toolParamsJson}
                      onChange={(e) => setToolParamsJson(e.target.value)}
                      className="w-full bg-[#f1f5fb] border border-[#c2d4ec] focus:border-[#0068f5] rounded-[8px] p-3 text-xs font-mono text-[#0c3058]"
                    />
                  </div>

                  <button
                    onClick={handleExecuteTool}
                    disabled={consoleLoading}
                    className="w-full py-2.5 px-4 rounded-[8px] bg-[#0068f5] hover:bg-[#0057cc] active:bg-[#0045a3] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_1px_3px_rgba(0,104,245,0.3)] disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {consoleLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> מריץ קריאת MCP...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> בצע tools/call
                      </>
                    )}
                  </button>
                </div>

                {/* One-click Aviation & Quick Presets */}
                <div className="bg-white p-4 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-2.5">
                  <span className="text-xs font-bold text-[#5878a4] block">שאילתות מומלצות לבדיקה מיידית:</span>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedTool('search_regulations');
                        setToolParamsJson('{\n  "query": "חוק רישוי שירותי התעופה",\n  "limit": 5\n}');
                      }}
                      className="p-2.5 rounded-[8px] bg-[#ebf3ff] hover:bg-[#0068f5] hover:text-white text-[#0c3058] border border-[#c2d4ec] text-xs text-right transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-semibold">✈️ חוק רישוי שירותי התעופה, התשכ"ג-1963</span>
                      <span className="text-[11px] font-mono">search_regulations</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTool('get_regulation_by_id');
                        setToolParamsJson('{\n  "id": 6212\n}');
                      }}
                      className="p-2.5 rounded-[8px] bg-[#ebf3ff] hover:bg-[#0068f5] hover:text-white text-[#0c3058] border border-[#c2d4ec] text-xs text-right transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-semibold">📑 שליפת רשומה 6212 (חוק התעופה המלא)</span>
                      <span className="text-[11px] font-mono">get_regulation_by_id</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTool('search_regulations');
                        setToolParamsJson('{\n  "query": "רישוי עסקים מזון",\n  "limit": 3\n}');
                      }}
                      className="p-2.5 rounded-[8px] bg-[#f1f5fb] hover:bg-[#ebf3ff] text-[#0c3058] border border-[#c2d4ec] text-xs text-right transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>🍽️ רישוי עסקים - מזון ובריאות הציבור</span>
                      <span className="text-[11px] font-mono">search_regulations</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Response Viewer */}
              <div className="lg:col-span-7 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Format Selector Tabs */}
                  <div className="inline-flex rounded-[6px] bg-[#f1f5fb] p-0.5 border border-[#c2d4ec]">
                    <button
                      onClick={() => setResultFormat('preview')}
                      className={`px-3 py-1.5 rounded-[5px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        resultFormat === 'preview'
                          ? 'bg-[#0068f5] text-white shadow-xs'
                          : 'text-[#5878a4] hover:text-[#0c3058]'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      תצוגת MD מעוצבת
                    </button>
                    <button
                      onClick={() => setResultFormat('markdown')}
                      className={`px-3 py-1.5 rounded-[5px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        resultFormat === 'markdown'
                          ? 'bg-[#0068f5] text-white shadow-xs'
                          : 'text-[#5878a4] hover:text-[#0c3058]'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      קוד MD גולמי
                    </button>
                    <button
                      onClick={() => setResultFormat('json')}
                      className={`px-3 py-1.5 rounded-[5px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        resultFormat === 'json'
                          ? 'bg-[#0068f5] text-white shadow-xs'
                          : 'text-[#5878a4] hover:text-[#0c3058]'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      JSON-RPC 2.0
                    </button>
                  </div>

                  {/* Actions (Copy / Download) */}
                  {consoleResult && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadMarkdown(normalizedMarkdown, `${selectedTool}_result.md`)}
                        className="px-2.5 py-1 rounded-[6px] bg-white hover:bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        title="הורד קובץ Markdown למחשב"
                      >
                        <Download className="w-3.5 h-3.5" />
                        הורד MD
                      </button>

                      <button
                        onClick={() => {
                          const textToCopy =
                            resultFormat === 'json'
                              ? JSON.stringify(consoleResult, null, 2)
                              : normalizedMarkdown;
                          handleCopy(textToCopy, 'console-res');
                        }}
                        className="px-2.5 py-1 rounded-[6px] bg-[#0068f5] hover:bg-[#0057cc] text-white text-xs font-medium flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                      >
                        {copiedId === 'console-res' ? (
                          <Check className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {resultFormat === 'json' ? 'העתק JSON' : 'העתק Markdown'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="h-[530px] bg-white rounded-[8px] border border-[#c2d4ec] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.06)] flex flex-col">
                  {consoleLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-[#5878a4] gap-2 p-6">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#0068f5]" />
                      <span className="text-sm font-medium">שולף נתונים ממאגר האסדרה הלאומי ומנרמל ל-Markdown...</span>
                    </div>
                  )}

                  {!consoleLoading && !consoleResult && (
                    <div className="h-full flex flex-col items-center justify-center text-[#5878a4] text-center px-4 p-6">
                      <Terminal className="w-10 h-10 mb-2 text-[#0068f5]/40" />
                      <p className="font-semibold text-sm text-[#0c3058]">קונסולת ה-MCP מוכנה להרצה</p>
                      <p className="text-xs mt-1 text-[#5878a4]">
                        בחר כלי, התאם פרמטרים ולחץ על "בצע tools/call" לצפייה בתגובת Markdown מעוצבת ו-JSON
                      </p>
                    </div>
                  )}

                  {!consoleLoading && consoleResult && (
                    <div className="flex-1 overflow-auto p-5">
                      {resultFormat === 'preview' && (
                        <div className="bg-white">
                          <div className="mb-3 pb-2 border-b border-[#c2d4ec] flex items-center justify-between text-xs text-[#5878a4]">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#499522]"></span>
                              תצוגת Markdown מנורמלת ומועשרת בקישורים ישירים לכנסת ולוויקיטקסט
                            </span>
                            <span className="font-mono text-[11px] bg-[#ebf3ff] text-[#0068f5] px-2 py-0.5 rounded">
                              {selectedTool}
                            </span>
                          </div>
                          <MarkdownViewer content={normalizedMarkdown} />
                        </div>
                      )}

                      {resultFormat === 'markdown' && (
                        <div className="relative">
                          <pre dir="ltr" className="text-xs font-mono select-all text-[#0c3058] whitespace-pre-wrap bg-[#fafcff] p-4 rounded-[6px] border border-[#c2d4ec] leading-relaxed">
                            {normalizedMarkdown}
                          </pre>
                        </div>
                      )}

                      {resultFormat === 'json' && (
                        <pre dir="ltr" className="text-xs font-mono select-all text-[#0c3058] whitespace-pre-wrap bg-[#fafcff] p-4 rounded-[6px] border border-[#c2d4ec] leading-relaxed">
                          {JSON.stringify(consoleResult, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: NATIONAL REGULATION EXPLORER (6,500+) */}
        {/* ========================================================= */}
        {activeTab === 'explorer' && (
          <div className="space-y-6">
            {/* Search and Filters Card */}
            <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#5878a4] absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="חפש חוק, תקנה או נושא (למשל: רישוי שירותי התעופה, בריאות הציבור, מזון, כבאות, חשמל, סייבר)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchRegulations(searchQuery, selectedMinistry, selectedType, selectedTag)}
                    className="w-full bg-[#f1f5fb] border border-[#c2d4ec] focus:border-[#0068f5] focus:bg-white rounded-[8px] pr-10 pl-4 py-2.5 text-sm text-[#0c3058] placeholder-[#5878a4]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        fetchRegulations('', selectedMinistry, selectedType, selectedTag);
                      }}
                      className="absolute left-3 top-3 text-[#5878a4] hover:text-[#0c3058]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => fetchRegulations(searchQuery, selectedMinistry, selectedType, selectedTag)}
                  className="px-6 py-2.5 rounded-[8px] bg-[#0068f5] hover:bg-[#0057cc] active:bg-[#0045a3] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Search className="w-4 h-4" /> חפש במאגר
                </button>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-[#5878a4] block mb-1">סינון לפי משרד ממשלתי:</label>
                  <select
                    value={selectedMinistry}
                    onChange={(e) => {
                      setSelectedMinistry(e.target.value);
                      fetchRegulations(searchQuery, e.target.value, selectedType, selectedTag);
                    }}
                    className="w-full bg-white border border-[#c2d4ec] focus:border-[#0068f5] rounded-[8px] p-2 text-xs text-[#0c3058]"
                  >
                    <option value="">כל המשרדים הממשלתיים</option>
                    {stats?.ministries.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} ({m.count})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5878a4] block mb-1">סוג חקיקה:</label>
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      fetchRegulations(searchQuery, selectedMinistry, e.target.value, selectedTag);
                    }}
                    className="w-full bg-white border border-[#c2d4ec] focus:border-[#0068f5] rounded-[8px] p-2 text-xs text-[#0c3058]"
                  >
                    <option value="">כל סוגי החקיקה</option>
                    <option value="חקיקה ראשית">חקיקה ראשית (חוקי כנסת)</option>
                    <option value="חקיקת משנה">חקיקת משנה (תקנות, צווים וכללים)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5878a4] block mb-1">תגית נושא:</label>
                  <select
                    value={selectedTag}
                    onChange={(e) => {
                      setSelectedTag(e.target.value);
                      fetchRegulations(searchQuery, selectedMinistry, selectedType, e.target.value);
                    }}
                    className="w-full bg-white border border-[#c2d4ec] focus:border-[#0068f5] rounded-[8px] p-2 text-xs text-[#0c3058]"
                  >
                    <option value="">כל התגיות</option>
                    {stats?.topTags.map((t) => (
                      <option key={t.tag} value={t.tag}>
                        {t.tag} ({t.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Results Count & Status */}
            <div className="flex items-center justify-between text-xs text-[#5878a4] px-1">
              <span>
                נמצאו <strong className="text-[#0c3058] font-mono">{totalCount.toLocaleString()}</strong> רשומות במאגר האסדרה
                {searchQuery && <span> עבור: "{searchQuery}"</span>}
              </span>
              {loadingRegulations && (
                <span className="flex items-center gap-1.5 text-[#0068f5]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> טוען נתונים ממאגר הממשלה...
                </span>
              )}
            </div>

            {/* Regulation Cards Grid */}
            {loadingRegulations ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-44 rounded-[8px] bg-white border border-[#c2d4ec] animate-pulse p-4"></div>
                ))}
              </div>
            ) : regulations.length === 0 ? (
              <div className="p-12 rounded-[8px] bg-white border border-[#c2d4ec] text-center space-y-2">
                <AlertCircle className="w-10 h-10 text-[#5878a4] mx-auto" />
                <p className="text-[#0c3058] font-bold text-sm">לא נמצאו תוצאות לחיפוש זה</p>
                <p className="text-xs text-[#5878a4]">נסה להרחיב את מילות החיפוש או לבחור משרד ממשלתי אחר.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regulations.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedRegulation(item)}
                    className="p-5 rounded-[8px] bg-white hover:bg-[#f1f5fb] border border-[#c2d4ec] hover:border-[#0068f5] transition-all flex flex-col justify-between cursor-pointer group shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_3px_6px_rgba(0,104,245,0.12)]"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-[100px] bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] font-medium">
                          {item.office_name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-[100px] font-mono ${
                            item.legislation_type === 'חקיקה ראשית'
                              ? 'bg-[#fef8e7] text-[#997012] border border-[#997012]/30'
                              : 'bg-[#ebf3ff] text-[#0c3058] border border-[#c2d4ec]'
                          }`}
                        >
                          {item.legislation_type}
                        </span>
                      </div>

                      <h3 className="font-bold text-[#0c3058] text-sm leading-snug group-hover:text-[#0068f5] transition-colors line-clamp-2">
                        {item.legislation_name}
                      </h3>

                      {item.primary_authorizing_legislation && (
                        <p className="text-xs text-[#5878a4] line-clamp-1">
                          <span className="font-semibold text-[#0c3058]">חוק מסמיך:</span> {item.primary_authorizing_legislation}
                        </p>
                      )}

                      {extractTags(item).length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {extractTags(item).slice(0, 3).map((t, idx) => (
                            <span key={idx} className="text-[10px] bg-[#f1f5fb] text-[#5878a4] border border-[#c2d4ec] px-1.5 py-0.5 rounded-[4px]">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#ebf3ff] flex items-center justify-between text-xs text-[#5878a4]">
                      <span className="font-mono text-[11px]">עדכון: {item.last_update ? item.last_update.slice(0, 10) : 'עדכני'}</span>
                      <span className="text-[#0068f5] font-semibold flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform">
                        פרטים מלאים <ChevronLeft className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Regulation Detail Modal */}
            {selectedRegulation && (
              <div className="fixed inset-0 z-50 bg-[#0c3058]/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white border border-[#c2d4ec] rounded-[8px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-[0_4px_12px_rgba(12,48,88,0.2)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs px-2.5 py-0.5 rounded-[100px] bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] font-semibold">
                          {selectedRegulation.office_name}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-[100px] bg-[#f1f5fb] text-[#0c3058] border border-[#c2d4ec]">
                          {selectedRegulation.legislation_type}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-[#0c3058] leading-tight">
                        {selectedRegulation.legislation_name}
                      </h2>
                    </div>
                    <button
                      onClick={() => setSelectedRegulation(null)}
                      className="p-1.5 rounded-[6px] text-[#5878a4] hover:text-[#0c3058] hover:bg-[#f1f5fb] cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-[6px] bg-[#f1f5fb] border border-[#c2d4ec]">
                      <span className="text-[#5878a4] block mb-0.5">חוק מסמיך</span>
                      <span className="text-[#0c3058] font-bold">{selectedRegulation.primary_authorizing_legislation || 'חקיקה ראשית'}</span>
                    </div>
                    <div className="p-3 rounded-[6px] bg-[#f1f5fb] border border-[#c2d4ec]">
                      <span className="text-[#5878a4] block mb-0.5">הוראות אסדרה מחייבות</span>
                      <span className="text-[#499522] font-bold">{selectedRegulation.is_regulation === 'כן' ? 'כן (מחייב)' : 'לא'}</span>
                    </div>
                    <div className="p-3 rounded-[6px] bg-[#f1f5fb] border border-[#c2d4ec]">
                      <span className="text-[#5878a4] block mb-0.5">תאריך פרסום רשמי</span>
                      <span className="text-[#0c3058] font-mono">{selectedRegulation.publication_date || 'לא צוין'}</span>
                    </div>
                    <div className="p-3 rounded-[6px] bg-[#f1f5fb] border border-[#c2d4ec]">
                      <span className="text-[#5878a4] block mb-0.5">תאריך עדכון אחרון</span>
                      <span className="text-[#0c3058] font-mono">{selectedRegulation.last_update || 'עדכני'}</span>
                    </div>
                  </div>

                  {extractTags(selectedRegulation).length > 0 && (
                    <div>
                      <span className="text-xs text-[#0c3058] block mb-1.5 font-bold">תגיות נושא:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {extractTags(selectedRegulation).map((t, idx) => (
                          <span key={idx} className="text-xs bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] px-2.5 py-1 rounded-[6px] font-medium">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Direct Official Links */}
                  <div className="pt-3 border-t border-[#ebf3ff] space-y-2">
                    <span className="text-xs text-[#0c3058] block font-bold">קישורים רשמיים ומאגרי חקיקה:</span>
                    <div className="flex flex-wrap gap-3">
                      {selectedRegulation.knesset_clean_url && (
                        <a
                          href={selectedRegulation.knesset_clean_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-[8px] bg-[#0068f5] hover:bg-[#0057cc] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> מאגר החקיקה הלאומי (אתר הכנסת)
                        </a>
                      )}
                      {selectedRegulation.wiki_clean_url && (
                        <a
                          href={selectedRegulation.wiki_clean_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-[8px] bg-[#f1f5fb] hover:bg-[#ebf3ff] text-[#0c3058] border border-[#c2d4ec] text-xs font-semibold flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#0068f5]" /> נוסח מלא בויקיטקסט
                        </a>
                      )}
                      <button
                        onClick={() => {
                          const md = convertToolResultToMarkdown('get_regulation_by_id', { id: selectedRegulation._id }, selectedRegulation);
                          handleCopy(md, 'modal-md');
                        }}
                        className="px-4 py-2 rounded-[8px] bg-[#0068f5] hover:bg-[#0057cc] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {copiedId === 'modal-md' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                        העתק כ-Markdown
                      </button>
                      <button
                        onClick={() => {
                          const jsonPayload = JSON.stringify(selectedRegulation, null, 2);
                          handleCopy(jsonPayload, 'modal-json');
                        }}
                        className="px-4 py-2 rounded-[8px] bg-[#f1f5fb] hover:bg-[#ebf3ff] text-[#0c3058] border border-[#c2d4ec] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedId === 'modal-json' ? <Check className="w-3.5 h-3.5 text-[#499522]" /> : <Copy className="w-3.5 h-3.5" />}
                        העתק רשומת JSON
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: REGULATORY RELIEFS (הקלות והתאמות) */}
        {/* ========================================================= */}
        {activeTab === 'reliefs' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_3px_rgba(12,48,88,0.08)] space-y-3">
              <span className="px-3 py-1 rounded-[100px] bg-[#eef8e8] text-[#499522] border border-[#7ad94a] text-xs font-semibold inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> הקלת הנטל הממשלתי והבירוקרטי
              </span>
              <h2 className="text-2xl font-bold text-[#0c3058]">הקלות והתאמות ברגולציה ממשרדי הממשלה</h2>
              <p className="text-[#5878a4] text-xs leading-relaxed max-w-3xl">
                מאגר הקלות החירום והפחתת הנטל הרגולטורי שהוכרזו על ידי משרדי הממשלה. הקלות אלו כוללות הארכת תוקף רישיונות, פטורים מתקינה כפולה, הקלות ליבואנים, גמישות בהעסקת עובדים זרים, וקיצור הליכי רישוי.
              </p>

              {/* Search Reliefs */}
              <div className="mt-4 flex gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#5878a4] absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="חפש הקלה (למשל: ייבוא, עובדים זרים, רישוי, חקלאות, בטיחות)..."
                    value={reliefSearch}
                    onChange={(e) => setReliefSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchReliefsList(reliefSearch)}
                    className="w-full bg-[#f1f5fb] border border-[#c2d4ec] focus:border-[#0068f5] focus:bg-white rounded-[8px] pr-10 pl-4 py-2.5 text-sm text-[#0c3058] placeholder-[#5878a4]"
                  />
                </div>
                <button
                  onClick={() => fetchReliefsList(reliefSearch)}
                  className="px-6 py-2.5 rounded-[8px] bg-[#0068f5] hover:bg-[#0057cc] text-white font-semibold text-sm flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Search className="w-4 h-4" /> חפש
                </button>
              </div>
            </div>

            {/* Reliefs Cards List */}
            {loadingReliefs ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-[8px] bg-white border border-[#c2d4ec] animate-pulse"></div>
                ))}
              </div>
            ) : reliefs.length === 0 ? (
              <div className="p-8 rounded-[8px] bg-white border border-[#c2d4ec] text-center text-[#5878a4]">
                לא נמצאו הקלות התואמות את החיפוש.
              </div>
            ) : (
              <div className="space-y-4">
                {reliefs.map((relief) => (
                  <div key={relief._id} className="p-5 rounded-[8px] bg-white border border-[#c2d4ec] hover:border-[#0068f5] transition-all space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-0.5 rounded-[100px] bg-[#eef8e8] text-[#499522] border border-[#7ad94a] font-semibold">
                          {relief.ministry}
                        </span>
                        {relief.unit && (
                          <span className="text-xs px-2 py-0.5 rounded-[100px] bg-[#f1f5fb] text-[#0c3058] border border-[#c2d4ec]">
                            {relief.unit}
                          </span>
                        )}
                      </div>
                      {relief.update && (
                        <span className="text-xs text-[#5878a4] font-mono">תאריך: {relief.update}</span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[#0c3058]">{relief.title}</h3>
                    <p className="text-xs text-[#5878a4] leading-relaxed whitespace-pre-line">{relief.details}</p>

                    {relief.tags && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {relief.tags.split(';').map((t, idx) => (
                          <span key={idx} className="text-[10px] bg-[#f1f5fb] text-[#5878a4] border border-[#c2d4ec] px-2 py-0.5 rounded-[4px]">
                            #{t.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {relief.additional_information && relief.additional_information.startsWith('http') && (
                      <div className="pt-2">
                        <a
                          href={relief.additional_information.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#0068f5] font-semibold hover:underline"
                        >
                          מידע נוסף באתר gov.il <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: AI REGULATORY ADVISOR (GEMINI 2.5 FLASH) */}
        {/* ========================================================= */}
        {activeTab === 'advisor' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_3px_rgba(12,48,88,0.08)] space-y-3">
              <span className="px-3 py-1 rounded-[100px] bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] text-xs font-semibold inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0068f5]" />
                מופעל על ידי Gemini ומקורקע בחוקי מדינת ישראל
              </span>
              <h2 className="text-2xl font-bold text-[#0c3058]">יועץ ציות ורגולציה מבוסס AI למאגר האסדרה</h2>
              <p className="text-[#5878a4] text-xs leading-relaxed max-w-3xl">
                הזן כל מיזם, עסק או מוצר מתוכנן, והיועץ ימפה עבורך את הרגולטורים הממונים, הרישיונות הנדרשים, מוקשי הציות, והחוקים המחייבים מתוך מאגר האסדרה הלאומי regulation.gov.il.
              </p>

              {/* Industry Presets */}
              <div className="pt-2">
                <span className="text-xs text-[#0c3058] block mb-2 font-bold">ענפים מובילים לבדיקה מהירה:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setAdvisorSector('aviation');
                      setAdvisorQuery('הפעלת שירותי תעופה מסחרית והשכרת כלי טיס בישראל');
                      handleAskAdvisor('הפעלת שירותי תעופה מסחרית והשכרת כלי טיס בישראל', 'aviation');
                    }}
                    className="px-3 py-1.5 rounded-[8px] bg-[#ebf3ff] hover:bg-[#0068f5] hover:text-white text-[#0068f5] text-xs font-semibold border border-[#c2d4ec] cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    ✈️ תעופה, השכרת מטוסים ורחפנים
                  </button>
                  <button
                    onClick={() => {
                      setAdvisorSector('restaurant');
                      setAdvisorQuery('פתיחת מסעדה ובית קפה עם ישיבה בחוץ, מטבח חם ומכירת אלכוהול');
                      handleAskAdvisor('פתיחת מסעדה ובית קפה עם ישיבה בחוץ, מטבח חם ומכירת אלכוהול', 'restaurant');
                    }}
                    className="px-3 py-1.5 rounded-[8px] bg-[#f1f5fb] hover:bg-[#ebf3ff] text-[#0c3058] text-xs font-medium border border-[#c2d4ec] cursor-pointer flex items-center gap-1.5"
                  >
                    🍽️ מסעדות ובתי אוכל
                  </button>
                  <button
                    onClick={() => {
                      setAdvisorSector('fintech');
                      setAdvisorQuery('הקמת סטארטאפ תשלומים, ארנקים דיגיטליים וייזום תשלומים');
                      handleAskAdvisor('הקמת סטארטאפ תשלומים, ארנקים דיגיטליים וייזום תשלומים', 'fintech');
                    }}
                    className="px-3 py-1.5 rounded-[8px] bg-[#f1f5fb] hover:bg-[#ebf3ff] text-[#0c3058] text-xs font-medium border border-[#c2d4ec] cursor-pointer flex items-center gap-1.5"
                  >
                    💳 פינטק ושירותי תשלום
                  </button>
                  <button
                    onClick={() => {
                      setAdvisorSector('ai_cyber');
                      setAdvisorQuery('פיתוח פלטפורמת בינה מלאכותית לניתוח נתוני לקוחות רגישים בענן');
                      handleAskAdvisor('פיתוח פלטפורמת בינה מלאכותית לניתוח נתוני לקוחות רגישים בענן', 'ai_cyber');
                    }}
                    className="px-3 py-1.5 rounded-[8px] bg-[#f1f5fb] hover:bg-[#ebf3ff] text-[#0c3058] text-xs font-medium border border-[#c2d4ec] cursor-pointer flex items-center gap-1.5"
                  >
                    🤖 בינה מלאכותית וסייבר
                  </button>
                </div>
              </div>
            </div>

            {/* Input Box */}
            <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-3">
              <label className="text-xs font-bold text-[#0c3058] block">תיאור הפעילות העסקית או השאלה הרגולטורית:</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={advisorQuery}
                  onChange={(e) => setAdvisorQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAdvisor()}
                  placeholder="תאר את הפעילות העסקית המתוכננת..."
                  className="flex-1 bg-[#f1f5fb] border border-[#c2d4ec] focus:border-[#0068f5] focus:bg-white rounded-[8px] px-4 py-3 text-sm text-[#0c3058] placeholder-[#5878a4]"
                />
                <button
                  onClick={() => handleAskAdvisor()}
                  disabled={advisorLoading}
                  className="px-6 py-3 rounded-[8px] bg-[#0068f5] hover:bg-[#0057cc] text-white font-bold text-sm flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {advisorLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> מנתח רגולציה...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> בצע ניתוח ציות
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Result Area */}
            {advisorLoading && (
              <div className="p-12 rounded-[8px] bg-white border border-[#c2d4ec] flex flex-col items-center justify-center text-[#5878a4] gap-3">
                <Sparkles className="w-8 h-8 animate-spin text-[#0068f5]" />
                <p className="text-sm font-semibold text-[#0c3058]">מאחזר חוקים ממאגר האסדרה הלאומי ומבצע הערכת ציות בבינה מלאכותית...</p>
              </div>
            )}

            {!advisorLoading && advisorResult && (
              <div className="bg-white p-6 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_3px_rgba(12,48,88,0.08)] space-y-5">
                <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#ebf3ff] gap-2">
                  <h3 className="font-bold text-[#0c3058] text-base flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#499522]" />
                    דוח מיפוי רגולציה וציות עסקי (תצוגת Markdown מעוצבת)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadMarkdown(advisorResult, 'regulatory_compliance_report.md')}
                      className="px-2.5 py-1 rounded-[6px] bg-white hover:bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      הורד MD
                    </button>
                    <button
                      onClick={() => handleCopy(advisorResult, 'advisor-report')}
                      className="px-2.5 py-1 rounded-[6px] bg-[#0068f5] hover:bg-[#0057cc] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {copiedId === 'advisor-report' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      העתק Markdown
                    </button>
                  </div>
                </div>

                <div className="bg-[#fafcff] p-5 rounded-[8px] border border-[#c2d4ec]">
                  <MarkdownViewer content={advisorResult} />
                </div>

                {groundedLaws.length > 0 && (
                  <div className="pt-4 border-t border-[#ebf3ff] space-y-2">
                    <span className="text-xs font-bold text-[#5878a4] block">חוקים ותקנות שאותרו מתוך regulation.gov.il:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {groundedLaws.map((law, idx) => (
                        <div key={idx} className="p-3 rounded-[6px] bg-[#f1f5fb] border border-[#c2d4ec] text-xs flex items-center justify-between">
                          <span className="font-semibold text-[#0c3058] truncate max-w-[80%]">{law.legislation_name}</span>
                          <span className="text-[#0068f5] text-[11px] font-mono">{law.office_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: MCP RESOURCES & PROMPTS LIBRARY */}
        {/* ========================================================= */}
        {activeTab === 'prompts' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-2">
              <h2 className="text-xl font-bold text-[#0c3058] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#0068f5]" />
                ספריית משאבים (Resources) והנחיות מובנות (Prompts) של ה-MCP
              </h2>
              <p className="text-xs text-[#5878a4]">
                פרוטוקול ה-MCP כולל לא רק כלים לפעולה, אלא גם משאבי נתונים (Resources) ותבניות הנחיה (Prompts) עבור סוכני בינה מלאכותית.
              </p>
            </div>

            {/* Resources List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#0c3058]">משאבי MCP זמינים (Resources):</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-[8px] border border-[#c2d4ec] space-y-2 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                  <div className="text-xs font-mono text-[#0068f5]" dir="ltr">regulation://national-registry/overview</div>
                  <h4 className="font-bold text-[#0c3058] text-sm">סקירת מאגר האסדרה הלאומי</h4>
                  <p className="text-xs text-[#5878a4]">מבנה המאגר, סעיף 37 לחוק עקרונות האסדרה, וסטטיסטיקות רגולציה בישראל.</p>
                </div>

                <div className="bg-white p-4 rounded-[8px] border border-[#c2d4ec] space-y-2 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                  <div className="text-xs font-mono text-[#0068f5]" dir="ltr">regulation://ministries/directory</div>
                  <h4 className="font-bold text-[#0c3058] text-sm">מדריך משרדי הממשלה והרגולטורים</h4>
                  <p className="text-xs text-[#5878a4]">רשימת 25+ משרדי הממשלה, מספר החוקים והתקנות תחת כל משרד.</p>
                </div>

                <div className="bg-white p-4 rounded-[8px] border border-[#c2d4ec] space-y-2 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                  <div className="text-xs font-mono text-[#499522]" dir="ltr">regulation://reliefs/summary</div>
                  <h4 className="font-bold text-[#0c3058] text-sm">סיכום הקלות רגולטוריות פעילות</h4>
                  <p className="text-xs text-[#5878a4]">תקציר כלל הפטורים וההקלות הפעילות להורדת הנטל הבירוקרטי.</p>
                </div>
              </div>
            </div>

            {/* Prompts List */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-[#0c3058]">תבניות הנחיה מוכנות (Prompts):</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#0068f5] font-bold" dir="ltr">compliance_audit</span>
                    <span className="text-[11px] text-[#5878a4]">תבנית מובנית</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#0c3058]">סקר סיכונים ומיפוי ציות לעסק חדש</h4>
                  <p className="text-xs text-[#5878a4]">
                    הנחיה מוכנה לסוכן AI המפעילה בדיקה רב-שלבית: איתור רישיונות נדרשים, חוקים מחייבים, דרישות אבטחת מידע ופרטיות, וגורמים מאשרים.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedTool('check_business_compliance');
                      setActiveTab('console');
                    }}
                    className="text-xs text-[#0068f5] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    הפעל בדיקה בקונסולה <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#0068f5] font-bold" dir="ltr">regulatory_impact_assessment</span>
                    <span className="text-[11px] text-[#5878a4]">מתודולוגיית RIA</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#0c3058]">הערכת השפעת רגולציה (RIA)</h4>
                  <p className="text-xs text-[#5878a4]">
                    תבנית להכנת קובץ RIA מלא לפי דרישות רשות האסדרה: הגדרת כשל השוק, בחינת חלופות וולונטריות, בדיקת התאמה ל-OECD ואירופה, ואומדן עלויות לעסקים קטנים.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedTool('analyze_regulatory_impact');
                      setActiveTab('console');
                    }}
                    className="text-xs text-[#0068f5] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    הפעל בדיקת RIA <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#c2d4ec] bg-white py-4 text-xs text-[#5878a4] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>פרויקט שרת MCP עבור מאגר האסדרה הלאומי</span>
            <span className="text-[#c2d4ec]">|</span>
            <a
              href="https://regulation.gov.il/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0068f5] font-semibold hover:underline flex items-center gap-1"
            >
              regulation.gov.il <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="text-[#5878a4]">
            תואם תקן IGDS 2.0 ומפרט Model Context Protocol (Anthropic) 2024-11-05
          </div>
        </div>
      </footer>
    </div>
  );
}
