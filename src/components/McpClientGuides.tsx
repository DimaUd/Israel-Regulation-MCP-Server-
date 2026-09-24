import React, { useState } from 'react';
import {
  Copy,
  Check,
  Terminal,
  Code2,
  Laptop,
  Monitor,
  ExternalLink,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  FileCode,
  Globe,
  SlidersHorizontal,
  Search,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Tooltip, InfoTooltip } from './Tooltip';

interface McpClientGuidesProps {
  sseUrl: string;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  onTestInConsole?: (tool: string, params: string) => void;
}

type ClientCategory = 'all' | 'terminal' | 'ide' | 'desktop' | 'webui' | 'api';

interface ClientItem {
  id: string;
  name: string;
  category: 'terminal' | 'ide' | 'desktop' | 'webui' | 'api';
  badge?: string;
  badgeColor?: string;
  iconText: string;
  description: string;
  configFile: string;
  paths?: {
    windows?: string;
    macos?: string;
    linux?: string;
  };
  cliCommand?: string;
  configJson: string;
  localStdioConfig?: string;
  quickTestPrompt: string;
  notes?: string[];
}

export const McpClientGuides: React.FC<McpClientGuidesProps> = ({
  sseUrl,
  onCopy,
  copiedId,
  onTestInConsole,
}) => {
  const activeSseUrl = sseUrl || 'https://ais-dev-s4gnwdsamdhgmjwkei6eub-108733651766.europe-west3.run.app/api/mcp/sse';
  const rpcUrl = activeSseUrl.replace('/api/mcp/sse', '/api/mcp/rpc');

  const [activeCategory, setActiveCategory] = useState<ClientCategory>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('opencode');
  const [configMode, setConfigMode] = useState<'sse' | 'stdio'>('sse');

  // Client definitions
  const clients: ClientItem[] = [
    {
      id: 'opencode',
      name: 'OpenCode',
      category: 'terminal',
      badge: 'מומלץ לקוד פתוח 🚀',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      iconText: 'OC',
      description: 'כלי פיתוח ו-CLI מודרני בקוד פתוח עם תמיכה מובנית ב-MCP מרוחק ומקומי.',
      configFile: 'opencode.json / ~/.config/opencode/config.json',
      paths: {
        windows: '%USERPROFILE%\\.config\\opencode\\config.json',
        macos: '~/.config/opencode/config.json',
        linux: '~/.config/opencode/config.json',
      },
      cliCommand: `opencode mcp add israel-regulation --url ${activeSseUrl}`,
      configJson: JSON.stringify(
        {
          $schema: 'https://opencode.ai/config.json',
          mcp: {
            'israel-regulation': {
              type: 'remote',
              url: activeSseUrl,
            },
          },
        },
        null,
        2
      ),
      localStdioConfig: JSON.stringify(
        {
          $schema: 'https://opencode.ai/config.json',
          mcp: {
            'israel-regulation': {
              type: 'local',
              command: ['npx', '-y', 'tsx', 'mcp-server/index.ts'],
            },
          },
        },
        null,
        2
      ),
      quickTestPrompt: 'opencode "שלוף לי ממאגר האסדרה את חוק רישוי שירותי התעופה"',
      notes: [
        'ניתן להוסיף ישירות עם פקודת ה-CLI המהירה ללא עריכת קבצים ידנית.',
        'ניתן להגדיר ברמת הפרויקט בתוך opencode.json או גלובלית ב-config.json.',
        'תומך בשליפת נתונים ישירה ללא תלות במודל AI ספציפי.',
      ],
    },
    {
      id: 'claude-desktop',
      name: 'Claude Desktop',
      category: 'desktop',
      badge: 'הפופולרי ביותר 🌟',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      iconText: 'CD',
      description: 'אפליקציית שולחן העבודה הרשמית של Anthropic עם תמיכה מלאה בהפעלת כלים רגולטוריים.',
      configFile: 'claude_desktop_config.json',
      paths: {
        windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
        macos: '~/Library/Application Support/Claude/claude_desktop_config.json',
        linux: '~/.config/Claude/claude_desktop_config.json',
      },
      configJson: JSON.stringify(
        {
          mcpServers: {
            'israel-regulation': {
              url: activeSseUrl,
            },
          },
        },
        null,
        2
      ),
      localStdioConfig: JSON.stringify(
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
      ),
      quickTestPrompt: 'שלוף לי ממאגר האסדרה את חוק רישוי שירותי התעופה ואת התקנות שהותקנו מכוחו',
      notes: [
        'לאחר שמירת הקובץ, יש להפעיל מחדש את Claude Desktop.',
        'יופיע אייקון פטיש (🛠️) בפינה התחתונה המעיד על זמינות כלי החקיקה.',
        'חיבור SSE פועל ישירות בענן ללא צורך בהתקנת Node.js מקומית.',
      ],
    },
    {
      id: 'cursor',
      name: 'Cursor IDE',
      category: 'ide',
      badge: 'סביבת פיתוח מובילה ⚡',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      iconText: 'CR',
      description: 'סביבת הפיתוח המתקדמת מבוססת VS Code עם תמיכה מלאה ב-MCP בתוך חלונית ה-Composer וה-Chat.',
      configFile: '.cursor/mcp.json',
      paths: {
        macos: 'פרויקט נוכחי: .cursor/mcp.json (או Cursor Settings > Features > MCP)',
        windows: 'פרויקט נוכחי: .cursor\\mcp.json (או Cursor Settings > Features > MCP)',
        linux: 'פרויקט נוכחי: .cursor/mcp.json',
      },
      configJson: JSON.stringify(
        {
          mcpServers: {
            'israel-regulation': {
              url: activeSseUrl,
            },
          },
        },
        null,
        2
      ),
      localStdioConfig: JSON.stringify(
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
      ),
      quickTestPrompt: 'מהן דרישות הרישוי בישראל לפתיחת עסק מזון והגשת אלכוהול לפי מאגר האסדרה?',
      notes: [
        'ניתן להוסיף דרך ממשק המשתמש: Settings > Features > MCP > Add New MCP Server.',
        'בחר ב-Type: sse והזן את הכתובת הישירה.',
        'הסוכן ב-Cursor Composer יקרא אוטומטית לכלים בכל שאילתה משפטית/עסקית.',
      ],
    },
    {
      id: 'windsurf',
      name: 'Windsurf (Codeium)',
      category: 'ide',
      badge: 'סביבת Cascade AI 🌊',
      badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      iconText: 'WS',
      description: 'עורך הקוד החדשני של Codeium עם סוכן Cascade לתכנות רב-שלבי.',
      configFile: '~/.codeium/windsurf/mcp_config.json',
      paths: {
        windows: '%USERPROFILE%\\.codeium\\windsurf\\mcp_config.json',
        macos: '~/.codeium/windsurf/mcp_config.json',
        linux: '~/.codeium/windsurf/mcp_config.json',
      },
      configJson: JSON.stringify(
        {
          mcpServers: {
            'israel-regulation': {
              serverUrl: activeSseUrl,
            },
          },
        },
        null,
        2
      ),
      localStdioConfig: JSON.stringify(
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
      ),
      quickTestPrompt: 'בדוק אילו הקלות רגולטוריות קיימות עבור יבוא מוצרים ומזון בישראל',
      notes: [
        'שים לב: ב-Windsurf שדה הכתובת נקרא serverUrl (או url בגרסאות חדשות).',
        'הפעל מחדש את Windsurf לאחר שמירת ההגדרות.',
      ],
    },
    {
      id: 'cline-roo',
      name: 'VS Code (Cline / Roo Code)',
      category: 'ide',
      badge: 'תוסף VS Code פופולרי 🧩',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      iconText: 'CL',
      description: 'סוכני קוד אוטונומיים פופולריים בתוך Visual Studio Code (Roo Code, Cline, Claude Dev).',
      configFile: 'cline_mcp_settings.json',
      paths: {
        windows: '%APPDATA%\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json',
        macos: '~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json',
        linux: '~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json',
      },
      configJson: JSON.stringify(
        {
          mcpServers: {
            'israel-regulation': {
              url: activeSseUrl,
              autoApprove: ['search_regulations', 'get_regulation_by_id', 'get_regulatory_reliefs'],
            },
          },
        },
        null,
        2
      ),
      localStdioConfig: JSON.stringify(
        {
          mcpServers: {
            'israel-regulation': {
              command: 'npx',
              args: ['-y', 'tsx', 'mcp-server/index.ts'],
              autoApprove: ['search_regulations'],
            },
          },
        },
        null,
        2
      ),
      quickTestPrompt: 'שלוף מזהה רשומה 6212 במאגר האסדרה והצג את הקישורים הרשמיים',
      notes: [
        'ניתן לפתוח דרך לחיצה על אייקון MCP בחלונית של Cline בתוך VS Code.',
        'שדה autoApprove מאפשר קריאה מיידית לחיפושים ללא צורך באישור ידני בכל פעם.',
      ],
    },
    {
      id: 'claude-code',
      name: 'Claude Code CLI',
      category: 'terminal',
      badge: 'טרמינל רשמי של Anthropic 💻',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      iconText: 'CC',
      description: 'הסוכן הטרמינלי הרשמי של Anthropic למפתחים. חיבור בשורה אחת!',
      configFile: 'claude.json / הגדרה ישירה ב-CLI',
      cliCommand: `claude mcp add --transport sse israel-regulation ${activeSseUrl}`,
      configJson: JSON.stringify(
        {
          mcpServers: {
            'israel-regulation': {
              url: activeSseUrl,
            },
          },
        },
        null,
        2
      ),
      localStdioConfig: `claude mcp add israel-regulation -- npx -y tsx mcp-server/index.ts`,
      quickTestPrompt: 'claude "מהם החוקים והתקנות שבאחריות משרד הכלכלה והתעשייה בנושא יבוא?"',
      notes: [
        'הפעלת פקודת claude mcp add מוסיפה את השרת באופן קבוע לפרופיל המשתמש שלך.',
        'ניתן לבדוק את הסטטוס בכל רגע עם הפקודה claude mcp list.',
      ],
    },
    {
      id: 'continue-dev',
      name: 'Continue.dev',
      category: 'ide',
      badge: 'קוד פתוח ל-VS Code & JetBrains 🔄',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      iconText: 'CT',
      description: 'תוסף בינה מלאכותית בקוד פתוח עבור Visual Studio Code, IntelliJ, PyCharm ו-JetBrains IDEs.',
      configFile: '~/.continue/config.json',
      paths: {
        windows: '%USERPROFILE%\\.continue\\config.json',
        macos: '~/.continue/config.json',
        linux: '~/.continue/config.json',
      },
      configJson: JSON.stringify(
        {
          experimental: {
            modelContextProtocolServers: [
              {
                transport: {
                  type: 'sse',
                  url: activeSseUrl,
                },
              },
            ],
          },
        },
        null,
        2
      ),
      quickTestPrompt: 'חפש חוקים ותקנות בנושא הגנת הסביבה ושפכי תעשייה',
      notes: [
        'הדבק תחת המפתח experimental.modelContextProtocolServers בקובץ config.json.',
        'פועל גם בסביבות JetBrains (WebStorm, GoLand, PyCharm).',
      ],
    },
    {
      id: 'zed',
      name: 'Zed Editor',
      category: 'ide',
      badge: 'עורך קוד סופר-מהיר ⚡',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      iconText: 'ZD',
      description: 'עורך הקוד המהיר שנכתב ב-Rust עם תמיכה מובנית ב-Context Servers (MCP).',
      configFile: '~/.config/zed/settings.json',
      paths: {
        windows: '%APPDATA%\\Zed\\settings.json',
        macos: '~/.config/zed/settings.json',
        linux: '~/.config/zed/settings.json',
      },
      configJson: JSON.stringify(
        {
          context_servers: {
            'israel-regulation': {
              url: activeSseUrl,
            },
          },
        },
        null,
        2
      ),
      quickTestPrompt: 'בדוק את חוק עקרונות האסדרה, התשפ"ב-2021',
      notes: [
        'פתח את הגדרות Zed עם Cmd+, (macOS) או Ctrl+, (Windows/Linux).',
        'הוסף תחת context_servers.',
      ],
    },
    {
      id: 'librechat',
      name: 'LibreChat / Open WebUI',
      category: 'webui',
      badge: 'ממשק שיחה עצמאי 🌐',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
      iconText: 'LC',
      description: 'ממשקי צ\'אט ארגוניים ועצמאיים (Self-Hosted) בקוד פתוח עם תמיכה ישירה בשרתי MCP מרוחקים.',
      configFile: 'librechat.yaml',
      paths: {
        linux: 'נתיב בשרת: librechat.yaml',
        macos: 'librechat.yaml',
        windows: 'librechat.yaml',
      },
      configJson: `mcpServers:
  israel-regulation:
    type: sse
    url: "${activeSseUrl}"`,
      quickTestPrompt: 'הצג את כל משרדי הממשלה וכמויות החוקים שבאחריותם',
      notes: [
        'הגדר את הבלוק תחת mcpServers בקובץ librechat.yaml והפעל מחדש את הקונטיינר.',
        'כל משתמשי המערכת יוכלו לתשאל את מאגר האסדרה הישראלי.',
      ],
    },
    {
      id: 'curl-python',
      name: 'cURL & Python / Node.js API',
      category: 'api',
      badge: 'למפתחים ומערכות חיצוניות 🛠️',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      iconText: 'API',
      description: 'גישה ישירה ודטרמיניסטית בפרוטוקול JSON-RPC 2.0 ללא צורך בלקוח MCP מיוחד.',
      configFile: 'HTTP POST /api/mcp/rpc',
      cliCommand: `curl -X POST "${rpcUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_regulations","arguments":{"query":"שירותי תעופה","limit":5}}}'`,
      configJson: `# דוגמת קוד Python לשליפת נתונים ישירה:
import requests

url = "${rpcUrl}"
payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "search_regulations",
        "arguments": {
            "query": "חוק רישוי שירותי התעופה",
            "limit": 5
        }
    }
}

response = requests.post(url, json=payload)
data = response.json()
print("נמצאו רשומות:", len(data.get("result", {}).get("records", [])))`,
      quickTestPrompt: 'curl -X POST /api/mcp/rpc (JSON-RPC 2.0 Pure Retrieval)',
      notes: [
        'תקן JSON-RPC 2.0 סטנדרטי ללא מודל שפה באמצע – מהיר ודטרמיניסטי.',
        'מתאים לאוטומציות, סקריפטים של חברות עורכי דין, מערכות ERP ו-CI/CD.',
      ],
    },
  ];

  // Filtering
  const filteredClients = clients.filter((c) => {
    const matchesCategory = activeCategory === 'all' || c.category === activeCategory;
    const matchesSearch =
      searchFilter === '' ||
      c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.configFile.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const currentConfigSnippet =
    configMode === 'stdio' && selectedClient.localStdioConfig
      ? selectedClient.localStdioConfig
      : selectedClient.configJson;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Selector */}
      <div className="bg-white rounded-[8px] border border-[#c2d4ec] p-6 shadow-[0_1px_3px_rgba(12,48,88,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ebf3ff] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-[100px] bg-[#ebf3ff] text-[#0068f5] text-xs font-bold border border-[#c2d4ec] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> 10 אפשרויות חיבור נתמכות
              </span>
              <span className="px-2 py-0.5 rounded-[100px] bg-[#eef8e8] text-[#499522] text-[11px] font-medium border border-[#7ad94a]">
                חדש: תמיכה מלאה ב-OpenCode
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0c3058]">
              מדריך התחברות מהיר לסוכני AI, IDEs וקוד פתוח
            </h2>
            <p className="text-xs sm:text-sm text-[#5878a4] mt-1 max-w-2xl">
              בחר את הכלי המועדף עליך (OpenCode, Claude, Cursor, Windsurf, Cline ועוד) וקבל הגדרות מוכנות בלחיצת כפתור אחת.
            </p>
          </div>

          {/* Quick SSE Copy Badge */}
          <div className="bg-[#f1f5fb] p-3 rounded-[8px] border border-[#c2d4ec] flex items-center gap-3">
            <div>
              <span className="text-[11px] text-[#5878a4] block font-medium">כתובת ה-SSE הראשית (ענן):</span>
              <span className="text-xs font-mono font-bold text-[#0068f5] select-all break-all" dir="ltr">
                {activeSseUrl}
              </span>
            </div>
            <button
              onClick={() => onCopy(activeSseUrl, 'main-sse')}
              className="px-3 py-1.5 rounded-[6px] bg-[#0068f5] hover:bg-[#0057cc] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="העתק כתובת SSE"
            >
              {copiedId === 'main-sse' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedId === 'main-sse' ? 'הועתק!' : 'העתק'}
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'כל הכלים (10)', tip: 'הצגת כל 10 סביבות העבודה, ה-IDEs והטרמינלים הנתמכים' },
              { id: 'terminal', label: 'טרמינל ו-CLI (OpenCode, Claude)', tip: 'כלי מסוף ו-CLI: OpenCode, Claude Code CLI ו-cURL' },
              { id: 'ide', label: 'סביבות IDE (Cursor, Windsurf, VS Code, Zed)', tip: 'סביבות פיתוח: Cursor, Windsurf, VS Code (Cline/Roo), Continue.dev ו-Zed' },
              { id: 'desktop', label: 'שולחן עבודה (Claude Desktop)', tip: 'יישומי שולחן עבודה: Claude Desktop הרשמי של Anthropic' },
              { id: 'webui', label: 'ממשקי Web (LibreChat)', tip: 'ממשקי צ\'אט פתוחים ומערכות ארגוניות כגון LibreChat' },
              { id: 'api', label: 'מפתחים ו-API (cURL, Python)', tip: 'סקריפטים ואוטומציות באמצעות Python SDK וקריאות HTTP ישירות' },
            ].map((cat) => (
              <Tooltip key={cat.id} content={cat.tip} position="bottom">
                <button
                  onClick={() => setActiveCategory(cat.id as ClientCategory)}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-[#0068f5] text-white font-bold shadow-sm'
                      : 'bg-[#f1f5fb] text-[#5878a4] hover:bg-[#ebf3ff] hover:text-[#0c3058]'
                  }`}
                >
                  {cat.label}
                </button>
              </Tooltip>
            ))}
          </div>

          {/* Search Input */}
          <Tooltip content="הקלד שם כלי או עורך כדי לסנן במהירות (למשל: opencode, cursor, vscode, zed)" position="bottom">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#5878a4] absolute right-2.5 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="סינון לפי שם כלי (למשל: opencode)..."
                className="w-full pr-8 pl-3 py-1.5 text-xs rounded-[6px] bg-white border border-[#c2d4ec] focus:outline-none focus:border-[#0068f5] text-[#0c3058]"
              />
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Two Column Layout: Client Grid on Left/Right, Detailed Config on Main */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Client Selector Cards (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-2.5">
          <span className="text-xs font-bold text-[#5878a4] block px-1">
            בחר סביבה להצגת הגדרות ({filteredClients.length}):
          </span>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredClients.map((client) => {
              const isSelected = selectedClient.id === client.id;
              return (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`w-full text-right p-3.5 rounded-[8px] border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-white border-[#0068f5] shadow-[0_2px_8px_rgba(0,104,245,0.15)] ring-2 ring-[#0068f5]/20'
                      : 'bg-white border-[#c2d4ec] hover:border-[#5878a4] hover:bg-[#f1f5fb]/60 shadow-sm'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-[6px] flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected
                        ? 'bg-[#0068f5] text-white shadow-sm'
                        : 'bg-[#ebf3ff] text-[#0068f5]'
                    }`}
                  >
                    {client.iconText}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-sm text-[#0c3058] truncate">
                        {client.name}
                      </span>
                      {client.badge && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap ${
                            client.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {client.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5878a4] line-clamp-1 mt-0.5">
                      {client.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#5878a4] mt-1 font-mono">
                      <FileCode className="w-3 h-3 text-[#0068f5]" />
                      <span className="truncate">{client.configFile}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Detailed Config & Instructions (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white rounded-[8px] border border-[#c2d4ec] p-6 shadow-[0_1px_3px_rgba(12,48,88,0.08)] space-y-5">
            {/* Header for Selected Client */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebf3ff] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[8px] bg-[#0068f5] text-white flex items-center justify-center font-bold text-sm shadow-[0_2px_4px_rgba(0,104,245,0.25)]">
                  {selectedClient.iconText}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-[#0c3058]">
                      התחברות באמצעות {selectedClient.name}
                    </h3>
                    {selectedClient.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${selectedClient.badgeColor}`}>
                        {selectedClient.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5878a4] mt-0.5">
                    {selectedClient.description}
                  </p>
                </div>
              </div>

              {/* Mode Toggle (SSE Remote vs Stdio Local if supported) */}
              {selectedClient.localStdioConfig && (
                <div className="flex items-center bg-[#f1f5fb] p-1 rounded-[6px] border border-[#c2d4ec] text-xs">
                  <Tooltip content="חיבור ענן מרוחק ללא שום התקנת קבצים מקומית - עובד מיידית!" position="bottom">
                    <button
                      onClick={() => setConfigMode('sse')}
                      className={`px-3 py-1 rounded-[4px] font-semibold transition-colors cursor-pointer ${
                        configMode === 'sse'
                          ? 'bg-[#0068f5] text-white shadow-sm'
                          : 'text-[#5878a4] hover:text-[#0c3058]'
                      }`}
                    >
                      SSE ענן (ללא התקנה)
                    </button>
                  </Tooltip>
                  <Tooltip content="הרצה מקומית על המחשב שלך באמצעות Node.js ו-npx ללא תלות ברשת חיצונית" position="bottom">
                    <button
                      onClick={() => setConfigMode('stdio')}
                      className={`px-3 py-1 rounded-[4px] font-semibold transition-colors cursor-pointer ${
                        configMode === 'stdio'
                          ? 'bg-[#0068f5] text-white shadow-sm'
                          : 'text-[#5878a4] hover:text-[#0c3058]'
                      }`}
                    >
                      Stdio מקומי (Node.js)
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>

            {/* Quick CLI Command (if available, e.g. for OpenCode or Claude Code) */}
            {selectedClient.cliCommand && (
              <div className="p-4 rounded-[8px] bg-[#0c3058] text-white space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-300 font-bold flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    פקודת CLI מהירה בשורה אחת (הכי קל ומומלץ!)
                  </span>
                  <span className="text-[11px] text-slate-300 font-mono">Terminal / Bash / PowerShell</span>
                </div>
                <div className="relative">
                  <pre
                    dir="ltr"
                    className="bg-slate-950 p-3 rounded-[6px] border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto select-all"
                  >
                    {selectedClient.cliCommand}
                  </pre>
                  <Tooltip content="מעתיק את הפקודה ללוח להדבקה בטרמינל שלך" position="top">
                    <button
                      onClick={() => onCopy(selectedClient.cliCommand!, `cli-${selectedClient.id}`)}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-[4px] bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer border border-slate-700"
                    >
                      {copiedId === `cli-${selectedClient.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copiedId === `cli-${selectedClient.id}` ? 'הועתק!' : 'העתק פקודה'}
                    </button>
                  </Tooltip>
                </div>
              </div>
            )}

            {/* File Paths for Different Operating Systems */}
            {selectedClient.paths && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#0c3058] flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#0068f5]" />
                  מיקום קובץ ההגדרות לפי מערכת הפעלה:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedClient.paths.windows && (
                    <div className="bg-[#f1f5fb] p-2.5 rounded-[6px] border border-[#c2d4ec] flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="text-[10px] font-bold text-[#5878a4] block">Windows</span>
                        <span className="font-mono text-[#0c3058] select-all truncate block" dir="ltr">
                          {selectedClient.paths.windows}
                        </span>
                      </div>
                      <button
                        onClick={() => onCopy(selectedClient.paths!.windows!, `path-win-${selectedClient.id}`)}
                        className="p-1 rounded bg-white hover:bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] shrink-0 cursor-pointer"
                        title="העתק נתיב"
                      >
                        {copiedId === `path-win-${selectedClient.id}` ? (
                          <Check className="w-3 h-3 text-[#499522]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {selectedClient.paths.macos && (
                    <div className="bg-[#f1f5fb] p-2.5 rounded-[6px] border border-[#c2d4ec] flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="text-[10px] font-bold text-[#5878a4] block">macOS</span>
                        <span className="font-mono text-[#0c3058] select-all truncate block" dir="ltr">
                          {selectedClient.paths.macos}
                        </span>
                      </div>
                      <button
                        onClick={() => onCopy(selectedClient.paths!.macos!, `path-mac-${selectedClient.id}`)}
                        className="p-1 rounded bg-white hover:bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] shrink-0 cursor-pointer"
                        title="העתק נתיב"
                      >
                        {copiedId === `path-mac-${selectedClient.id}` ? (
                          <Check className="w-3 h-3 text-[#499522]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {selectedClient.paths.linux && (
                    <div className="bg-[#f1f5fb] p-2.5 rounded-[6px] border border-[#c2d4ec] flex items-center justify-between gap-2 sm:col-span-2">
                      <div className="truncate">
                        <span className="text-[10px] font-bold text-[#5878a4] block">Linux</span>
                        <span className="font-mono text-[#0c3058] select-all truncate block" dir="ltr">
                          {selectedClient.paths.linux}
                        </span>
                      </div>
                      <button
                        onClick={() => onCopy(selectedClient.paths!.linux!, `path-lin-${selectedClient.id}`)}
                        className="p-1 rounded bg-white hover:bg-[#ebf3ff] text-[#0068f5] border border-[#c2d4ec] shrink-0 cursor-pointer"
                        title="העתק נתיב"
                      >
                        {copiedId === `path-lin-${selectedClient.id}` ? (
                          <Check className="w-3 h-3 text-[#499522]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Code Configuration Snippet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0c3058] flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-[#0068f5]" />
                  קוד התצורה להדבקה בקובץ ({selectedClient.configFile}):
                </span>
                <span className="text-[11px] text-[#5878a4] font-mono">
                  {configMode === 'sse' ? 'Remote SSE Protocol' : 'Local Stdio'}
                </span>
              </div>

              <div className="relative">
                <pre
                  dir="ltr"
                  className="bg-[#f1f5fb] p-4 rounded-[6px] border border-[#c2d4ec] text-xs font-mono text-[#0c3058] overflow-x-auto leading-relaxed select-all"
                >
                  {currentConfigSnippet}
                </pre>
                <button
                  onClick={() => onCopy(currentConfigSnippet, `cfg-${selectedClient.id}-${configMode}`)}
                  className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-[6px] bg-white hover:bg-[#ebf3ff] border border-[#c2d4ec] text-[#0068f5] text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {copiedId === `cfg-${selectedClient.id}-${configMode}` ? (
                    <Check className="w-3.5 h-3.5 text-[#499522]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedId === `cfg-${selectedClient.id}-${configMode}` ? 'התצורה הועתקה!' : 'העתק תצורה'}
                </button>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="bg-[#f1f5fb] p-4 rounded-[8px] border border-[#c2d4ec] space-y-3">
              <h4 className="text-xs font-bold text-[#0c3058] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#499522]" />
                איך להפעיל ב-3 צעדים פשוטים:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3 rounded-[6px] border border-[#c2d4ec] space-y-1">
                  <span className="w-5 h-5 rounded-full bg-[#0068f5] text-white flex items-center justify-center font-bold text-[10px]">
                    1
                  </span>
                  <strong className="block text-[#0c3058]">פתח את קובץ ההגדרות</strong>
                  <p className="text-[#5878a4] text-[11px]">
                    גש לקובץ <code className="text-[#0068f5] font-mono">{selectedClient.configFile.split(' ')[0]}</code> במחשבך.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-[6px] border border-[#c2d4ec] space-y-1">
                  <span className="w-5 h-5 rounded-full bg-[#0068f5] text-white flex items-center justify-center font-bold text-[10px]">
                    2
                  </span>
                  <strong className="block text-[#0c3058]">הדבק ושמור</strong>
                  <p className="text-[#5878a4] text-[11px]">
                    הדבק את קוד התצורה ושמור את הקובץ. הפעל מחדש את היישום.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-[6px] border border-[#c2d4ec] space-y-1">
                  <span className="w-5 h-5 rounded-full bg-[#499522] text-white flex items-center justify-center font-bold text-[10px]">
                    3
                  </span>
                  <strong className="block text-[#0c3058]">שאל בעברית</strong>
                  <p className="text-[#5878a4] text-[11px]">
                    פתח שיחה חדשה ושאל כל שאלה משפטית, רגולטורית או עסקית.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Test Prompt & Action */}
            <div className="bg-[#eef8e8] p-4 rounded-[8px] border border-[#7ad94a] flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#499522] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> דוגמה מוכנה לבדיקת החיבור בשיחה:
                </span>
                <p className="text-xs font-semibold text-[#0c3058]">
                  "{selectedClient.quickTestPrompt}"
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onCopy(selectedClient.quickTestPrompt, `prompt-${selectedClient.id}`)}
                  className="px-3 py-1.5 rounded-[6px] bg-white hover:bg-slate-50 text-[#0c3058] border border-[#7ad94a] text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  {copiedId === `prompt-${selectedClient.id}` ? (
                    <Check className="w-3.5 h-3.5 text-[#499522]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  העתק שאלה
                </button>

                {onTestInConsole && (
                  <button
                    onClick={() =>
                      onTestInConsole(
                        'search_regulations',
                        '{\n  "query": "חוק רישוי שירותי התעופה",\n  "limit": 5\n}'
                      )
                    }
                    className="px-3 py-1.5 rounded-[6px] bg-[#0068f5] hover:bg-[#0057cc] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    בדוק כלי בקונסולה <ArrowRight className="w-3 h-3 rotate-180" />
                  </button>
                )}
              </div>
            </div>

            {/* Helpful Notes */}
            {selectedClient.notes && selectedClient.notes.length > 0 && (
              <div className="border-t border-[#ebf3ff] pt-3">
                <span className="text-[11px] font-bold text-[#5878a4] block mb-1">
                  💡 טיפים ודגשים עבור {selectedClient.name}:
                </span>
                <ul className="list-disc list-inside text-xs text-[#5878a4] space-y-1">
                  {selectedClient.notes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
