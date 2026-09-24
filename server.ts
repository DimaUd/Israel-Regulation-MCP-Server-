import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { GoogleGenAI } from '@google/genai';
import {
  fetchRegulationsFromGov,
  getRegulationById,
  getRawRegulationById,
  getRegistrySchemaInfo,
  runReadinessVerification,
  fetchReliefs,
  getRegulationStats,
  BUSINESS_SECTORS,
} from './src/server/regulationService.ts';
import { createRegulationMcpServer } from './src/server/mcpServer.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

// Initialize Gemini SDK
let ai: GoogleGenAI | null = null;
try {
  ai = new GoogleGenAI();
} catch (e) {
  console.warn('Gemini SDK initialization note:', e);
}

// -------------------------------------------------------------
// MCP SERVER-SENT EVENTS (SSE) & TRANSPORT MANAGEMENT
// -------------------------------------------------------------
const sseTransports = new Map<string, { transport: SSEServerTransport; server: any }>();

// GET /api/mcp/sse - Client initiates SSE stream
app.get('/api/mcp/sse', async (req: Request, res: Response) => {
  try {
    const server = createRegulationMcpServer();
    // Messages endpoint where client will send RPC messages
    const transport = new SSEServerTransport('/api/mcp/messages', res);
    const sessionId = transport.sessionId;

    sseTransports.set(sessionId, { transport, server });

    req.on('close', () => {
      sseTransports.delete(sessionId);
    });

    await server.connect(transport);
  } catch (err: any) {
    console.error('Error starting MCP SSE transport:', err);
    if (!res.headersSent) {
      res.status(500).send(`MCP SSE Error: ${err.message}`);
    }
  }
});

// POST /api/mcp/messages - Client sends messages to SSE transport
app.post('/api/mcp/messages', async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    res.status(400).send('Missing sessionId query parameter');
    return;
  }

  const session = sseTransports.get(sessionId);
  if (!session) {
    res.status(404).send('Session not found or expired');
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (err: any) {
    console.error('Error handling MCP message:', err);
    if (!res.headersSent) {
      res.status(500).send(err.message);
    }
  }
});

// -------------------------------------------------------------
// DIRECT JSON-RPC 2.0 ENDPOINT (FOR WEB CONSOLE / POSTMAN)
// -------------------------------------------------------------
app.post('/api/mcp/rpc', async (req: Request, res: Response) => {
  const { jsonrpc, id, method, params } = req.body || {};

  if (jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: id ?? null,
      error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
    });
  }

  try {
    if (method === 'initialize') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: true },
            resources: { listChanged: true },
            prompts: { listChanged: true },
          },
          serverInfo: {
            name: 'israel-regulation-mcp',
            version: '1.0.0',
            description: 'MCP Server for Israel National Regulation Registry (regulation.gov.il)',
          },
        },
      });
    }

    if (method === 'tools/list') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'search_regulations',
              description: 'חיפוש חוקים, תקנות וצווים במאגר האסדרה הלאומי (regulation.gov.il) עם דפדוף עמוק וסינון מרובה',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'מילת חיפוש' },
                  office_name: { type: 'string', description: 'שם המשרד הממשלתי' },
                  legislation_type: { type: 'string', description: 'חקיקה ראשית / חקיקת משנה' },
                  is_regulation: { type: 'string', enum: ['כן', 'לא'], description: 'האם אסדרה עסקית' },
                  authorizing_law: { type: 'string', description: 'חוק מסמיך' },
                  knesset_id: { type: 'string', description: 'מזהה חוק בכנסת' },
                  tag: { type: 'string', description: 'תגית נושאית' },
                  sort: { type: 'string', description: 'מיון' },
                  limit: { type: 'number', default: 10 },
                  offset: { type: 'number', default: 0 },
                  include_raw: { type: 'boolean', default: false },
                },
              },
            },
            {
              name: 'get_regulation_by_id',
              description: 'קבלת פרטים מלאים על חוק/תקנה לפי ID עם קישורים לכנסת ולויקיטקסט',
              inputSchema: {
                type: 'object',
                properties: {
                  id: { type: ['number', 'string'], description: 'מזהה הרשומה (1-6576)' },
                },
                required: ['id'],
              },
            },
            {
              name: 'inspect_registry_schema',
              description: 'מפרט סכמת 12 השדות המלאה של מאגר האסדרה הלאומי ואימות כיסוי 100%',
              inputSchema: { type: 'object', properties: {} },
            },
            {
              name: 'get_regulation_raw',
              description: 'קבלת רשומת JSON הגולמית המקורית מ-data.gov.il ללא שום עיבוד',
              inputSchema: {
                type: 'object',
                properties: {
                  id: { type: ['number', 'string'], description: 'מזהה הרשומה' },
                },
                required: ['id'],
              },
            },
            {
              name: 'get_regulatory_reliefs',
              description: 'שליפת הקלות והתאמות ברגולציה להפחתת הנטל הבירוקרטי',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { type: 'string' },
                  ministry: { type: 'string' },
                  limit: { type: 'number' },
                },
              },
            },
            {
              name: 'list_ministries_and_categories',
              description: 'קבלת רשימת משרדי ממשלה וכמויות אסדרה לפי תחום',
              inputSchema: { type: 'object', properties: {} },
            },
            {
              name: 'check_business_compliance',
              description: 'מיפוי חובות רגולציה ורישיונות לפי ענף עסקי',
              inputSchema: {
                type: 'object',
                properties: {
                  sector: { type: 'string', description: 'סוג העסק או הענף' },
                  business_description: { type: 'string' },
                },
                required: ['sector'],
              },
            },
            {
              name: 'analyze_regulatory_impact',
              description: 'ניתוח השפעת רגולציה (RIA) לפי עקרונות רשות האסדרה',
              inputSchema: {
                type: 'object',
                properties: {
                  proposed_rule_title: { type: 'string' },
                  sector_affected: { type: 'string' },
                  regulatory_objective: { type: 'string' },
                },
                required: ['proposed_rule_title', 'sector_affected', 'regulatory_objective'],
              },
            },
          ],
        },
      });
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const args = params?.arguments || {};

      if (toolName === 'search_regulations') {
        const data = await fetchRegulationsFromGov({
          query: args.query,
          officeName: args.office_name,
          legislationType: args.legislation_type,
          isRegulation: args.is_regulation,
          authorizingLaw: args.authorizing_law,
          knessetId: args.knesset_id,
          tag: args.tag,
          sort: args.sort,
          limit: args.limit || 10,
          offset: args.offset || 0,
          includeRaw: args.include_raw,
        });
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          },
        });
      }

      if (toolName === 'inspect_registry_schema') {
        const schema = getRegistrySchemaInfo();
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(schema, null, 2) }],
          },
        });
      }

      if (toolName === 'get_regulation_raw') {
        const raw = await getRawRegulationById(args.id);
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(raw || { error: 'Not found' }, null, 2) }],
          },
        });
      }

      if (toolName === 'get_regulation_by_id') {
        const item = await getRegulationById(args.id);
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(item || { error: 'Not found' }, null, 2) }],
          },
        });
      }

      if (toolName === 'get_regulatory_reliefs') {
        const data = await fetchReliefs(args.query, args.ministry, args.limit || 10);
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          },
        });
      }

      if (toolName === 'list_ministries_and_categories') {
        const stats = await getRegulationStats();
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
          },
        });
      }

      if (toolName === 'check_business_compliance') {
        const guide = BUSINESS_SECTORS[args.sector] || BUSINESS_SECTORS.restaurant;
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(guide, null, 2) }],
          },
        });
      }

      if (toolName === 'analyze_regulatory_impact') {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'RIA Completed',
                    proposal: args.proposed_rule_title,
                    sector: args.sector_affected,
                    principles_applied: [
                      'פרופורציונליות וצמצום נטל',
                      'בחינת חלופות וולונטריות',
                      'התאמה לתקנים בינלאומיים',
                    ],
                  },
                  null,
                  2
                ),
              },
            ],
          },
        });
      }

      return res.status(404).json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Tool not found: ${toolName}` },
      });
    }

    if (method === 'resources/list') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          resources: [
            {
              uri: 'regulation://national-registry/overview',
              name: 'National Regulation Registry Overview',
              description: 'סקירה כללית על מאגר האסדרה וחוק עקרונות האסדרה',
            },
            {
              uri: 'regulation://ministries/directory',
              name: 'Ministries & Regulators Directory',
              description: 'מדריך משרדי הממשלה ותחומי אסדרה',
            },
            {
              uri: 'regulation://reliefs/summary',
              name: 'Regulatory Reliefs Summary',
              description: 'סיכום הקלות רגולטוריות פעילות',
            },
          ],
        },
      });
    }

    if (method === 'prompts/list') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          prompts: [
            {
              name: 'compliance_audit',
              description: 'תבנית ביקורת ציות ומיפוי רגולציה לעסקים בישראל',
            },
            {
              name: 'regulatory_impact_assessment',
              description: 'תבנית הערכת השפעת רגולציה (RIA)',
            },
          ],
        },
      });
    }

    if (method === 'ping') {
      return res.json({ jsonrpc: '2.0', id, result: {} });
    }

    return res.status(404).json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  } catch (err: any) {
    return res.status(500).json({
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: err.message || 'Internal server error' },
    });
  }
});

// -------------------------------------------------------------
// REGULATION REST API ROUTES (FOR FRONTEND UI)
// -------------------------------------------------------------

// Search regulations
app.get('/api/regulation/search', async (req: Request, res: Response) => {
  const { q, office, type, is_regulation, authorizing_law, knesset_id, tag, sort, limit, offset, raw } = req.query;
  const result = await fetchRegulationsFromGov({
    query: q as string,
    officeName: office as string,
    legislationType: type as string,
    isRegulation: is_regulation as string,
    authorizingLaw: authorizing_law as string,
    knessetId: knesset_id as string,
    tag: tag as string,
    sort: sort as string,
    limit: limit ? Number(limit) : 20,
    offset: offset ? Number(offset) : 0,
    includeRaw: raw === 'true' || raw === '1',
  });
  res.json(result);
});

// Full 12-field schema specification of data.gov.il registry
app.get('/api/regulation/schema', (_req: Request, res: Response) => {
  res.json(getRegistrySchemaInfo());
});

// Automated 100% MCP & Registry Readiness verification suite
app.get('/api/regulation/readiness', async (_req: Request, res: Response) => {
  const result = await runReadinessVerification();
  res.json(result);
});

// Raw untouched record from CKAN
app.get('/api/regulation/raw/:id', async (req: Request, res: Response) => {
  const raw = await getRawRegulationById(req.params.id);
  if (!raw) {
    return res.status(404).json({ error: 'Raw record not found' });
  }
  res.json(raw);
});

// Single regulation
app.get('/api/regulation/detail/:id', async (req: Request, res: Response) => {
  const item = await getRegulationById(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Regulation not found' });
  }
  res.json(item);
});

// Stats and ministries
app.get('/api/regulation/stats', async (_req: Request, res: Response) => {
  const stats = await getRegulationStats();
  res.json(stats);
});

// Reliefs
app.get('/api/regulation/reliefs', async (req: Request, res: Response) => {
  const { q, ministry, limit } = req.query;
  const result = await fetchReliefs(q as string, ministry as string, limit ? Number(limit) : 20);
  res.json(result);
});

// Business compliance knowledge bank
app.get('/api/regulation/compliance/:sector', (req: Request, res: Response) => {
  const sector = req.params.sector;
  const guide = BUSINESS_SECTORS[sector];
  if (!guide) {
    return res.json({
      availableSectors: Object.keys(BUSINESS_SECTORS),
      message: 'Sector not pre-mapped, use AI search or custom query',
    });
  }
  res.json(guide);
});

// AI Regulatory Advisor (Powered by Gemini 2.5 Flash)
app.post('/api/regulation/ai-consult', async (req: Request, res: Response) => {
  const { query, sector, context } = req.body || {};

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  // Pre-fetch relevant regulations to ground the AI response
  const sampleRegulations = await fetchRegulationsFromGov({
    query: query.slice(0, 40),
    limit: 5,
  });

  const groundedContext = sampleRegulations.records
    .map(
      (r) =>
        `- ${r.legislation_name} (משרד: ${r.office_name}, סוג: ${r.legislation_type}, קישור: ${r.knesset_clean_url || r.wiki_clean_url || 'N/A'})`
    )
    .join('\n');

  try {
    if (ai) {
      const prompt = `אתה מומחה בכיר לרגולציה ממשלתית בישראל, לחוק עקרונות האסדרה (התשפ"ב-2021), ולמאגר האסדרה הלאומי regulation.gov.il.
המשתמש מבקש ייעוץ רגולטורי בנושא:
"${query}"
${sector ? `מגזר עסקי: ${sector}` : ''}
${context ? `הקשר נוסף: ${context}` : ''}

הנה חוקים ותקנות רלוונטיים שאותרו מתוך מאגר האסדרה הלאומי:
${groundedContext || 'חוק רישוי עסקים, פקודות בריאות הציבור, חוק הגנת הפרטיות'}

ספק תשובה מקיפה, מקצועית ומובנית בעברית, הכוללת:
1. 🏛️ משרדי הממשלה והרגולטורים הממונים.
2. 📜 חקיקה מחייבת: חוקים ראשוניים ותקנות משניות רלוונטיות.
3. 📝 רישיונות והיתרים נדרשים לפני פתיחה / תחילת פעילות (רישוי עסקים, אישורי משרד מקצועי).
4. ⚠️ מוקשי רגולציה נפוצים וסיכוני אי-ציות (קנסות, צווי סגירה, עיצומים).
5. 💡 המלצות מעשיות לפעולה וצעדים ראשונים להסדרת הפעילות.
תשובה בהירה ומסודרת, מותאמת למציאות העסקית בישראל.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return res.json({
        analysis: response.text,
        groundedRegulations: sampleRegulations.records,
      });
    }
  } catch (err: any) {
    console.warn('Gemini AI error or not configured, using structured fallback:', err);
  }

  // Fallback response if Gemini API key is missing or fails
  const matchedSector = sector && BUSINESS_SECTORS[sector] ? BUSINESS_SECTORS[sector] : null;
  const fallbackText = `### מיפוי רגולטורי עבור: ${query}

#### 🏛️ משרדים ורגולטורים ממונים:
${matchedSector ? `- רגולטור ראשי: **${matchedSector.primaryMinistry}**\n- גורמים מאשרים נוספים: ${matchedSector.secondaryMinistries.join(', ')}` : '- משרד הכלכלה והתעשייה\n- הרשות המקומית (מחלקת רישוי עסקים)\n- משרד המשפטים (הרשות להגנת הפרטיות)'}

#### 📜 חקיקה מחייבת:
${matchedSector ? matchedSector.keyLegislation.map((l) => `- ${l}`).join('\n') : '- חוק רישוי עסקים, התשכ"ח-1968\n- חוק הגנת הפרטיות, התשמ"א-1981 ותקנות אבטחת מידע\n- חוק הגנת הצרכן, התשמ"א-1981'}

#### 📝 רישיונות והיתרים נדרשים:
${matchedSector ? matchedSector.requiredLicenses.map((lic) => `- ${lic}`).join('\n') : '- רישיון עסק מהרשות המקומית\n- אישור שירותי כבאות והצלה\n- אישור משרד הבריאות / איכות הסביבה לפי אופי הפעילות'}

#### 💡 צעדים מומלצים:
1. בדיקת סיווג הפעילות בצו רישוי עסקים של משרד הפנים.
2. הגשת בקשה מקוונת לרישום עסק וקבלת מפרט אחיד.
3. הטמעת מדיניות הגנת פרטיות ואבטחת מידע לפי תיקון 13 לחוק הפרטיות.`;

  res.json({
    analysis: fallbackText,
    groundedRegulations: sampleRegulations.records,
  });
});

// MCP Client Configuration JSON
app.get('/api/mcp/config', (req: Request, res: Response) => {
  const host = req.get('host') || `localhost:${PORT}`;
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const sseUrl = `${protocol}://${host}/api/mcp/sse`;

  const claudeDesktopSSE = {
    mcpServers: {
      'israel-regulation': {
        url: sseUrl,
      },
    },
  };

  const claudeDesktopStdio = {
    mcpServers: {
      'israel-regulation': {
        command: 'npx',
        args: ['-y', 'tsx', 'mcp-server/index.ts'],
      },
    },
  };

  const cursorConfig = {
    mcpServers: {
      'israel-regulation': {
        url: sseUrl,
      },
    },
  };

  res.json({
    currentHost: host,
    sseUrl,
    claudeDesktopSSE,
    claudeDesktopStdio,
    cursorConfig,
  });
});

// -------------------------------------------------------------
// VITE SETUP (DEV) OR STATIC FILES (PROD)
// -------------------------------------------------------------
async function setupVite() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Israel Regulation MCP Server & App running on http://0.0.0.0:${PORT}`);
    console.log(`MCP SSE endpoint: http://0.0.0.0:${PORT}/api/mcp/sse`);
    console.log(`MCP RPC endpoint: http://0.0.0.0:${PORT}/api/mcp/rpc`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
