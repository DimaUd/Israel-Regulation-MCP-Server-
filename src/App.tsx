import React, { useState, useEffect } from 'react';
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
  HelpCircle,
  Globe,
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'mcp' | 'console' | 'explorer' | 'reliefs' | 'advisor' | 'prompts'>('mcp');

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

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Config URLs
  const [sseUrl, setSseUrl] = useState('');

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
        setToolParamsJson('{\n  "sector": "restaurant",\n  "business_description": "מסעדה עם מטבח חם וישיבה בחוץ"\n}');
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0c3058]">תגובת JSON-RPC 2.0 משרת ה-MCP:</span>
                  {consoleResult && (
                    <button
                      onClick={() => handleCopy(JSON.stringify(consoleResult, null, 2), 'console-res')}
                      className="text-xs text-[#0068f5] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      {copiedId === 'console-res' ? <Check className="w-3.5 h-3.5 text-[#499522]" /> : <Copy className="w-3.5 h-3.5" />}
                      העתק תוצאה
                    </button>
                  )}
                </div>

                <div className="h-[520px] bg-white rounded-[8px] border border-[#c2d4ec] p-4 overflow-auto font-mono text-xs text-[#0c3058] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                  {consoleLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-[#5878a4] gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#0068f5]" />
                      <span>שולף נתונים ממאגר האסדרה הלאומי...</span>
                    </div>
                  )}

                  {!consoleLoading && !consoleResult && (
                    <div className="h-full flex flex-col items-center justify-center text-[#5878a4] text-center px-4">
                      <Terminal className="w-10 h-10 mb-2 text-[#0068f5]/40" />
                      <p className="font-semibold text-sm text-[#0c3058]">קונסולת ה-MCP מוכנה להרצה</p>
                      <p className="text-xs mt-1 text-[#5878a4]">
                        בחר כלי, התאם פרמטרים ולחץ על "בצע tools/call" לצפייה בתגובה התקנית
                      </p>
                    </div>
                  )}

                  {!consoleLoading && consoleResult && (
                    <pre dir="ltr" className="text-[#0c3058] whitespace-pre-wrap">
                      {JSON.stringify(consoleResult, null, 2)}
                    </pre>
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
                    <option value="">חקיקה ראשית ומשנית</option>
                    <option value="חקיקה ראשית">חקיקה ראשית (חוקי כנסת)</option>
                    <option value="חקיקה משנית">חקיקה משנית (תקנות, צווים וכללים)</option>
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

            {/* Results Counter Bar */}
            <div className="flex items-center justify-between text-xs text-[#5878a4] px-1">
              <span>
                נמצאו <strong className="text-[#0c3058] font-bold">{totalCount.toLocaleString()}</strong> רשומות במאגר האסדרה
                {searchQuery && <span> עבור החיפוש: <strong>"{searchQuery}"</strong></span>}
              </span>
              {loadingRegulations && (
                <span className="flex items-center gap-1.5 text-[#0068f5]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> טוען נתונים...
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
              <div className="bg-white p-12 rounded-[8px] border border-[#c2d4ec] text-center space-y-2">
                <AlertCircle className="w-10 h-10 text-[#5878a4] mx-auto" />
                <p className="text-[#0c3058] font-bold text-sm">לא נמצאו חוקים או תקנות התואמים את החיפוש</p>
                <p className="text-xs text-[#5878a4]">נסה מילת מפתח כללית יותר או נקה את הסינון המשרדי.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regulations.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedRegulation(item)}
                    className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] hover:border-[#0068f5] hover:shadow-[0_3px_6px_rgba(0,104,245,0.12)] transition-all flex flex-col justify-between cursor-pointer group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-[100px] bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] font-semibold">
                          {item.office_name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-[100px] font-semibold ${
                            item.legislation_type === 'חקיקה ראשית'
                              ? 'bg-[#fff9e6] text-[#997012] border border-[#e6c15c]'
                              : 'bg-[#f1f5fb] text-[#0c3058] border border-[#c2d4ec]'
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

                      {item.tags_list && item.tags_list.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.tags_list.slice(0, 3).map((t, idx) => (
                            <span key={idx} className="text-[10px] bg-[#f1f5fb] text-[#5878a4] px-2 py-0.5 rounded-[4px] border border-[#e1ecfa]">
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
              <div className="fixed inset-0 z-50 bg-[#0c3058]/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white border border-[#c2d4ec] rounded-[8px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-[0_4px_12px_rgba(12,48,88,0.18)]">
                  <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#ebf3ff]">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs px-2.5 py-0.5 rounded-[100px] bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] font-semibold">
                          {selectedRegulation.office_name}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-[100px] bg-[#f1f5fb] text-[#0c3058] border border-[#c2d4ec] font-medium">
                          {selectedRegulation.legislation_type}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-[#0c3058] leading-tight">
                        {selectedRegulation.legislation_name}
                      </h2>
                    </div>
                    <button
                      onClick={() => setSelectedRegulation(null)}
                      className="p-1.5 rounded-[6px] text-[#5878a4] hover:text-[#0c3058] bg-[#f1f5fb] hover:bg-[#ebf3ff] cursor-pointer"
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
                      <span className="text-[#5878a4] block mb-0.5">תאריך עדכון אחרון ברשומות</span>
                      <span className="text-[#0c3058] font-mono">{selectedRegulation.last_update || 'עדכני'}</span>
                    </div>
                  </div>

                  {selectedRegulation.tags_list && (
                    <div>
                      <span className="text-xs text-[#5878a4] block mb-1.5 font-bold">תגיות נושא:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRegulation.tags_list.map((t, idx) => (
                          <span key={idx} className="text-xs bg-[#ebf3ff] text-[#0068f5] px-2.5 py-1 rounded-[6px] font-medium border border-[#c2d4ec]">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Direct Official Links */}
                  <div className="pt-2 border-t border-[#ebf3ff] space-y-2.5">
                    <span className="text-xs text-[#5878a4] block font-bold">קישורים רשמיים ומאגרי חקיקה:</span>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedRegulation.knesset_clean_url && (
                        <a
                          href={selectedRegulation.knesset_clean_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-[8px] bg-[#0068f5] hover:bg-[#0057cc] text-white text-xs font-semibold flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> מאגר החקיקה הלאומי (הכנסת)
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
                          const jsonPayload = JSON.stringify(selectedRegulation, null, 2);
                          handleCopy(jsonPayload, 'modal-json');
                        }}
                        className="px-4 py-2 rounded-[8px] bg-white hover:bg-[#f1f5fb] text-[#0c3058] border border-[#c2d4ec] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedId === 'modal-json' ? <Check className="w-3.5 h-3.5 text-[#499522]" /> : <Copy className="w-3.5 h-3.5 text-[#0068f5]" />}
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
        {/* TAB 4: REGULATORY RELIEFS (הקלות והתאמות ברגולציה) */}
        {/* ========================================================= */}
        {activeTab === 'reliefs' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-3">
              <span className="px-3 py-1 rounded-[100px] bg-[#eef8e8] text-[#499522] border border-[#7ad94a] text-xs font-semibold inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> הקלת הנטל הממשלתי והבירוקרטי
              </span>
              <h2 className="text-2xl font-bold text-[#0c3058]">הקלות והתאמות ברגולציה ממשרדי הממשלה</h2>
              <p className="text-[#5878a4] text-xs leading-relaxed max-w-3xl">
                מאגר הקלות החירום והפחתת הנטל הרגולטורי שפורסמו על ידי משרדי הממשלה ("חרבות ברזל" ורפורמות הפחתת יוקר המחיה).
                ההקלות כוללות הארכת תוקף רישיונות, פטורים מתקינה כפולה, גמישות בהעסקת עובדים, והקלות על יבואנים.
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
                  <Search className="w-4 h-4" /> חפש הקלות
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
              <div className="bg-white p-8 rounded-[8px] border border-[#c2d4ec] text-center text-[#5878a4]">
                לא נמצאו הקלות התואמות את החיפוש.
              </div>
            ) : (
              <div className="space-y-4">
                {reliefs.map((relief) => (
                  <div key={relief._id} className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] hover:border-[#0068f5] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-0.5 rounded-[100px] bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] font-semibold">
                          {relief.ministry}
                        </span>
                        {relief.unit && (
                          <span className="text-xs px-2 py-0.5 rounded-[100px] bg-[#f1f5fb] text-[#0c3058] border border-[#c2d4ec]">
                            {relief.unit}
                          </span>
                        )}
                      </div>
                      {relief.update && (
                        <span className="text-xs text-[#5878a4] font-mono">תאריך עדכון: {relief.update}</span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[#0c3058]">{relief.title}</h3>
                    <p className="text-xs text-[#5878a4] leading-relaxed whitespace-pre-line">{relief.details}</p>

                    {relief.tags && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {relief.tags.split(';').map((t, idx) => (
                          <span key={idx} className="text-[10px] bg-[#f1f5fb] text-[#5878a4] px-2 py-0.5 rounded-[4px] border border-[#e1ecfa]">
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
                          הוראת המשרד המלאה באתר gov.il <ExternalLink className="w-3 h-3" />
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
            <div className="bg-white p-6 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-3">
              <span className="px-3 py-1 rounded-[100px] bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] text-xs font-semibold inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0068f5]" />
                מופעל על ידי Gemini 2.5 Flash ומקורקע במאגר האסדרה הלאומי
              </span>
              <h2 className="text-2xl font-bold text-[#0c3058]">יועץ ציות ורגולציה מבוסס AI</h2>
              <p className="text-[#5878a4] text-xs leading-relaxed max-w-3xl">
                הזן כל מיזם עסקי, שירות חדש או תחום פעילות, והמערכת תמפה עבורך את הרגולטורים הממונים, הרישיונות הנדרשים, מוקשי הציות, והחוקים המחייבים מתוך מאגר האסדרה הלאומי.
              </p>

              {/* Fast Presets */}
              <div className="pt-2">
                <span className="text-xs text-[#5878a4] block mb-2 font-bold">ענפים מובילים לבדיקה מהירה:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setAdvisorSector('aviation');
                      setAdvisorQuery('הפעלת שירותי תעופה מסחרית, השכרת כלי טיס והפעלת רחפנים');
                      handleAskAdvisor('הפעלת שירותי תעופה מסחרית, השכרת כלי טיס והפעלת רחפנים', 'aviation');
                    }}
                    className="px-3 py-1.5 rounded-[8px] bg-[#ebf3ff] hover:bg-[#0068f5] hover:text-white text-[#0c3058] text-xs font-semibold border border-[#c2d4ec] cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    ✈️ שירותי תעופה וכלי טיס
                  </button>
                  <button
                    onClick={() => {
                      setAdvisorSector('restaurant');
                      setAdvisorQuery('פתיחת מסעדה ובית קפה עם ישיבה בחוץ, מטבח חם ומכירת אלכוהול');
                      handleAskAdvisor('פתיחת מסעדה ובית קפה עם ישיבה בחוץ, מטבח חם ומכירת אלכוהול', 'restaurant');
                    }}
                    className="px-3 py-1.5 rounded-[8px] bg-[#f1f5fb] hover:bg-[#ebf3ff] text-[#0c3058] text-xs font-semibold border border-[#c2d4ec] cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    🍽️ מסעדות ובתי אוכל
                  </button>
                  <button
                    onClick={() => {
                      setAdvisorSector('fintech');
                      setAdvisorQuery('הקמת סטארטאפ תשלומים, ארנקים דיגיטליים וייזום תשלומים');
                      handleAskAdvisor('הקמת סטארטאפ תשלומים, ארנקים דיגיטליים וייזום תשלומים', 'fintech');
                    }}
                    className="px-3 py-1.5 rounded-[8px] bg-[#f1f5fb] hover:bg-[#ebf3ff] text-[#0c3058] text-xs font-semibold border border-[#c2d4ec] cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    💳 פינטק ושירותי תשלום
                  </button>
                  <button
                    onClick={() => {
                      setAdvisorSector('ai_cyber');
                      setAdvisorQuery('פיתוח פלטפורמת בינה מלאכותית (LLM) לניתוח נתוני לקוחות רגישים בענן');
                      handleAskAdvisor('פיתוח פלטפורמת בינה מלאכותית (LLM) לניתוח נתוני לקוחות רגישים בענן', 'ai_cyber');
                    }}
                    className="px-3 py-1.5 rounded-[8px] bg-[#f1f5fb] hover:bg-[#ebf3ff] text-[#0c3058] text-xs font-semibold border border-[#c2d4ec] cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    🤖 בינה מלאכותית ופרטיות
                  </button>
                  <button
                    onClick={() => {
                      setAdvisorSector('solar_energy');
                      setAdvisorQuery('התקנת מערכות סולאריות מסחריות על גגות מבני תעשייה עם אגירת חשמל');
                      handleAskAdvisor('התקנת מערכות סולאריות מסחריות על גגות מבני תעשייה עם אגירת חשמל', 'solar_energy');
                    }}
                    className="px-3 py-1.5 rounded-[8px] bg-[#f1f5fb] hover:bg-[#ebf3ff] text-[#0c3058] text-xs font-semibold border border-[#c2d4ec] cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    ☀️ אנרגיה מתחדשת וסולארית
                  </button>
                  <button
                    onClick={() => {
                      setAdvisorSector('import_export');
                      setAdvisorQuery('ייבוא מוצרי חשמל ביתיים ומכשירי תקשורת אלחוטיים במסלול אירופי');
                      handleAskAdvisor('ייבוא מוצרי חשמל ביתיים ומכשירי תקשורת אלחוטיים במסלול אירופי', 'import_export');
                    }}
                    className="px-3 py-1.5 rounded-[8px] bg-[#f1f5fb] hover:bg-[#ebf3ff] text-[#0c3058] text-xs font-semibold border border-[#c2d4ec] cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    🚢 יבוא וסחר ("מה שטוב לאירופה")
                  </button>
                </div>
              </div>
            </div>

            {/* Input Box */}
            <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-3">
              <label className="text-xs font-bold text-[#0c3058] block">תיאור הפעילות העסקית או השאלה הרגולטורית:</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={advisorQuery}
                  onChange={(e) => setAdvisorQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAdvisor()}
                  placeholder="תאר את הפעילות העסקית המתוכננת בישראל..."
                  className="flex-1 bg-[#f1f5fb] border border-[#c2d4ec] focus:border-[#0068f5] focus:bg-white rounded-[8px] px-4 py-2.5 text-sm text-[#0c3058] placeholder-[#5878a4]"
                />
                <button
                  onClick={() => handleAskAdvisor()}
                  disabled={advisorLoading}
                  className="px-6 py-2.5 rounded-[8px] bg-[#0068f5] hover:bg-[#0057cc] active:bg-[#0045a3] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer transition-colors"
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

            {/* Results Area */}
            {advisorLoading && (
              <div className="bg-white p-12 rounded-[8px] border border-[#c2d4ec] flex flex-col items-center justify-center text-[#5878a4] gap-3">
                <Sparkles className="w-8 h-8 animate-spin text-[#0068f5]" />
                <p className="text-sm font-semibold text-[#0c3058]">מאחזר חוקים ממאגר האסדרה הלאומי ומבצע הערכת ציות בבינה מלאכותית...</p>
              </div>
            )}

            {!advisorLoading && advisorResult && (
              <div className="bg-white p-6 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#ebf3ff]">
                  <h3 className="font-bold text-[#0c3058] text-base flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#499522]" />
                    דוח מיפוי רגולציה וציות עסקי
                  </h3>
                  <button
                    onClick={() => handleCopy(advisorResult, 'advisor-report')}
                    className="text-xs text-[#0068f5] hover:underline flex items-center gap-1.5 font-semibold"
                  >
                    {copiedId === 'advisor-report' ? <Check className="w-3.5 h-3.5 text-[#499522]" /> : <Copy className="w-3.5 h-3.5" />}
                    העתק דוח
                  </button>
                </div>

                <div className="text-sm text-[#0c3058] leading-relaxed whitespace-pre-wrap space-y-4">
                  {advisorResult}
                </div>

                {groundedLaws.length > 0 && (
                  <div className="pt-4 border-t border-[#ebf3ff] space-y-2.5">
                    <span className="text-xs font-bold text-[#5878a4] block">חוקים ותקנות שאותרו מתוך regulation.gov.il:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {groundedLaws.map((law, idx) => (
                        <div key={idx} className="p-3 rounded-[6px] bg-[#f1f5fb] border border-[#c2d4ec] text-xs flex items-center justify-between">
                          <span className="font-bold text-[#0c3058] truncate max-w-[75%]">{law.legislation_name}</span>
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
            <div className="bg-white p-6 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-2">
              <h2 className="text-xl font-bold text-[#0c3058] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#0068f5]" />
                ספריית משאבים (Resources) ותבניות הנחיה (Prompts) של ה-MCP
              </h2>
              <p className="text-xs text-[#5878a4]">
                פרוטוקול MCP מאפשר למודלי שפה לא רק לקרוא לכלים (Tools), אלא גם לגשת למשאבי ידע סטטיים ולתבניות מובנות לביצוע ביקורת ציות והערכת השפעת רגולציה (RIA).
              </p>
            </div>

            {/* Resources Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#0c3058]">משאבי MCP זמינים (Resources):</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-2">
                  <div className="text-xs font-mono text-[#0068f5] font-semibold" dir="ltr">regulation://national-registry/overview</div>
                  <h4 className="font-bold text-[#0c3058] text-sm">סקירת מאגר האסדרה הלאומי</h4>
                  <p className="text-xs text-[#5878a4]">מבנה המאגר, סעיף 37 לחוק עקרונות האסדרה, וסטטיסטיקות רגולציה בישראל.</p>
                </div>

                <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-2">
                  <div className="text-xs font-mono text-[#0068f5] font-semibold" dir="ltr">regulation://ministries/directory</div>
                  <h4 className="font-bold text-[#0c3058] text-sm">מדריך משרדי הממשלה והרגולטורים</h4>
                  <p className="text-xs text-[#5878a4]">רשימת 25+ משרדי הממשלה, מספר החוקים והתקנות תחת כל משרד.</p>
                </div>

                <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-2">
                  <div className="text-xs font-mono text-[#499522] font-semibold" dir="ltr">regulation://reliefs/summary</div>
                  <h4 className="font-bold text-[#0c3058] text-sm">סיכום הקלות רגולטוריות פעילות</h4>
                  <p className="text-xs text-[#5878a4]">תקציר כלל הפטורים וההקלות הפעילות להורדת הנטל הבירוקרטי.</p>
                </div>
              </div>
            </div>

            {/* Prompts Grid */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-[#0c3058]">תבניות הנחיה מובנות (Prompts):</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#0068f5] font-bold" dir="ltr">compliance_audit</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-[100px] bg-[#f1f5fb] text-[#0c3058] border border-[#c2d4ec]">תבנית ציות</span>
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
                    className="text-xs text-[#0068f5] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    הפעל בדיקה בקונסולה <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white p-5 rounded-[8px] border border-[#c2d4ec] shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#0068f5] font-bold" dir="ltr">regulatory_impact_assessment</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-[100px] bg-[#f1f5fb] text-[#0c3058] border border-[#c2d4ec]">מתודולוגיית RIA</span>
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
                    className="text-xs text-[#0068f5] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    הפעל בדיקת RIA <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* IGDS 2.0 OFFICIAL ISRAEL GOVERNMENT FOOTER */}
      {/* ========================================================= */}
      <footer className="border-t border-[#c2d4ec] bg-white py-5 text-xs text-[#5878a4] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[#0c3058]">מאגר האסדרה הלאומי של מדינת ישראל</span>
            <span>|</span>
            <a
              href="https://regulation.gov.il/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0068f5] font-semibold hover:underline flex items-center gap-1"
            >
              regulation.gov.il <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span>|</span>
            <a
              href="https://data.gov.il"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0068f5] hover:underline"
            >
              data.gov.il
            </a>
          </div>
          <div className="text-[#5878a4] flex items-center gap-2">
            <span>מערכת תואמת עיצוב IGDS 2.0 &amp; תקן Model Context Protocol</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
