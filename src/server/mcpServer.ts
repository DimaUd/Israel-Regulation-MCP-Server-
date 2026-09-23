/**
 * Israel Regulation MCP Server
 * Model Context Protocol implementation for https://regulation.gov.il/
 * Provides tools, resources, and prompts for Israeli legislation, regulations, and RIA.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  fetchRegulationsFromGov,
  getRegulationById,
  fetchReliefs,
  getRegulationStats,
  BUSINESS_SECTORS,
  RegulationRecord,
} from './regulationService.ts';

export function createRegulationMcpServer() {
  const server = new McpServer({
    name: 'israel-regulation-mcp',
    version: '1.0.0',
  });

  // TOOL 1: search_regulations
  server.tool(
    'search_regulations',
    'חפש חוקים, תקנות, צווים ונהלים במאגר האסדרה הלאומי של ישראל (regulation.gov.il / data.gov.il). תומך בסינון לפי מילות מפתח, משרד ממשלתי, סוג חקיקה ותגיות.',
    {
      query: z
        .string()
        .optional()
        .describe('מילת חיפוש חופשית (למשל: "רישוי עסקים", "מזון", "בטיחות אש", "תקשורת", "סייבר", "אנרגיה מתחדשת", "ייבוא")'),
      office_name: z
        .string()
        .optional()
        .describe('שם המשרד הממשלתי (למשל: "משרד הכלכלה והתעשייה", "משרד הבריאות", "משרד האוצר", "משרד התחבורה והבטיחות בדרכים", "המשרד להגנת הסביבה", "משרד המשפטים")'),
      legislation_type: z
        .string()
        .optional()
        .describe('סוג החקיקה: "חקיקה ראשית" (חוקי כנסת) או "חקיקת משנה" (תקנות, צווים וכללים)'),
      tag: z
        .string()
        .optional()
        .describe('תגית נושאית (למשל: "רישוי עסקים", "בטיחות", "איכות הסביבה", "בריאות הציבור", "בנקאות וכספים", "ייבוא", "פרטיות")'),
      limit: z
        .number()
        .min(1)
        .max(50)
        .optional()
        .describe('מספר התוצאות המקסימלי להחזרה (ברירת מחדל: 10, מקסימום: 50)'),
      offset: z
        .number()
        .min(0)
        .optional()
        .describe('היסט תוצאות לדפדוף (ברירת מחדל: 0)'),
    },
    async ({ query, office_name, legislation_type, tag, limit = 10, offset = 0 }) => {
      try {
        const { records, total } = await fetchRegulationsFromGov({
          query,
          officeName: office_name,
          legislationType: legislation_type,
          tag,
          limit,
          offset,
        });

        const formatted = records.map((r) => ({
          id: r._id,
          name: r.legislation_name,
          type: r.legislation_type,
          ministry: r.office_name,
          is_regulation: r.is_regulation === 'כן',
          authorizing_law: r.primary_authorizing_legislation || 'לא צוין',
          publication_date: r.publication_date || '',
          last_update: r.last_update || '',
          tags: r.tags_list || [],
          knesset_url: r.knesset_clean_url || '',
          wikisource_url: r.wiki_clean_url || '',
        }));

        const resultPayload = {
          source: 'https://regulation.gov.il/ (מאגר האסדרה הלאומי)',
          total_matches: total,
          returned_records: formatted.length,
          query_applied: { query, office_name, legislation_type, tag, limit, offset },
          regulations: formatted,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(resultPayload, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `שגיאה בשליפת חקיקה ממאגר האסדרה: ${err.message || String(err)}`,
            },
          ],
        };
      }
    }
  );

  // TOOL 2: get_regulation_by_id
  server.tool(
    'get_regulation_by_id',
    'קבלת פרטים מלאים על חוק או תקנה ספציפיים לפי מזהה רשומה במאגר האסדרה, כולל קישורים ישירים למאגר החקיקה הלאומי של הכנסת ולנוסח המלא בויקיטקסט.',
    {
      id: z.union([z.number(), z.string()]).describe('מזהה הרשומה (ID) ממאגר האסדרה'),
    },
    async ({ id }) => {
      try {
        const item = await getRegulationById(id);
        if (!item) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `רשומה עם מזהה ${id} לא נמצאה במאגר האסדרה.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  id: item._id,
                  name: item.legislation_name,
                  type: item.legislation_type,
                  ministry: item.office_name,
                  is_regulation: item.is_regulation === 'כן',
                  authorizing_law: item.primary_authorizing_legislation || 'אין (חקיקה ראשית)',
                  publication_date: item.publication_date,
                  last_update: item.last_update,
                  knesset_law_id: item.primary_law_knesset_id,
                  knesset_url: item.knesset_clean_url,
                  wikisource_url: item.wiki_clean_url,
                  tags: item.tags_list,
                  regulatory_compliance_note:
                    'חוק זה מחייב עמידה בהוראות הפיקוח של המשרד הממונה. מומלץ לעיין בנוסח החוק העדכני במאגר החקיקה של הכנסת.',
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `שגיאה: ${err.message || String(err)}` }],
        };
      }
    }
  );

  // TOOL 3: get_regulatory_reliefs
  server.tool(
    'get_regulatory_reliefs',
    'שליפת הקלות, פטורים והתאמות ברגולציה שפורסמו על ידי משרדי הממשלה להפחתת הנטל הבירוקרטי (הקלות חירום, חרבות ברזל, ורפורמות הפחתת נטל רגולטורי).',
    {
      query: z.string().optional().describe('חיפוש חופשי בהקלות (למשל: "עובדים זרים", "יבוא", "רישוי", "בטיחות")'),
      ministry: z.string().optional().describe('סינון לפי שם המשרד הממשלתי'),
      limit: z.number().min(1).max(50).optional().describe('כמות תוצאות להחזרה (ברירת מחדל: 10)'),
    },
    async ({ query, ministry, limit = 10 }) => {
      try {
        const { records, total } = await fetchReliefs(query, ministry, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total_reliefs_found: total,
                  returned: records.length,
                  reliefs: records.map((r) => ({
                    id: r._id,
                    ministry: r.ministry,
                    unit: r.unit || 'כללי',
                    title: r.title,
                    details: r.details,
                    link: r.additional_information || '',
                    tags: r.tags ? r.tags.split(';').map((t) => t.trim()) : [],
                    update_date: r.update || '',
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `שגיאה בשליפת הקלות רגולטוריות: ${err.message}` }],
        };
      }
    }
  );

  // TOOL 4: list_ministries_and_categories
  server.tool(
    'list_ministries_and_categories',
    'קבלת רשימת כל משרדי הממשלה, הרגולטורים הראשיים, ותחומי האסדרה הקיימים במאגר האסדרה הלאומי עם כמות החוקים והתקנות בכל תחום.',
    {},
    async () => {
      try {
        const stats = await getRegulationStats();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total_regulations_in_database: stats.totalCount,
                  direct_regulation_percentage: stats.isRegulationBreakdown.isRegulation,
                  government_ministries: stats.ministries,
                  legislation_types: stats.legislationTypes,
                  top_regulatory_tags: stats.topTags,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `שגיאה בשליפת רשימת משרדים: ${err.message}` }],
        };
      }
    }
  );

  // TOOL 5: check_business_compliance
  server.tool(
    'check_business_compliance',
    'בדיקת חובות רגולציה, רישיונות נדרשים, משרדים ממונים, וחוקים רלוונטיים עבור מגזר עסקי, תחום פעילות או סטארטאפ בישראל.',
    {
      sector: z
        .string()
        .describe(
          'מגזר הפעילות או סוג העסק (למשל: "restaurant", "fintech", "ai_cyber", "solar_energy", "import_export" או תיאור חופשי)'
        ),
      business_description: z
        .string()
        .optional()
        .describe('תיאור קצר נוסף של הפעילות העסקית המתוכננת, מוצרים או קהל יעד'),
    },
    async ({ sector, business_description }) => {
      try {
        const normalized = sector.toLowerCase().trim();
        const matchedGuide =
          BUSINESS_SECTORS[normalized] ||
          Object.values(BUSINESS_SECTORS).find(
            (b) =>
              b.name.includes(sector) ||
              b.description.includes(sector) ||
              b.sector === normalized
          );

        if (matchedGuide) {
          // Also fetch sample live regulations for this sector
          const searchTag = matchedGuide.mcpQuerySuggestions[0] || sector;
          const liveSample = await fetchRegulationsFromGov({ query: searchTag, limit: 3 });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    sector: matchedGuide.name,
                    overview: matchedGuide.description,
                    primary_regulator: matchedGuide.primaryMinistry,
                    secondary_regulators: matchedGuide.secondaryMinistries,
                    required_licenses_and_permits: matchedGuide.requiredLicenses,
                    governing_legislation: matchedGuide.keyLegislation,
                    mandatory_compliance_requirements: matchedGuide.complianceRequirements,
                    key_regulatory_risks: matchedGuide.keyRisks,
                    suggested_queries_in_national_registry: matchedGuide.mcpQuerySuggestions,
                    live_regulations_sample: liveSample.records.map((r) => ({
                      name: r.legislation_name,
                      type: r.legislation_type,
                      ministry: r.office_name,
                      link: r.knesset_clean_url || r.wiki_clean_url,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Generic search fallback for custom sectors
        const liveResults = await fetchRegulationsFromGov({ query: sector, limit: 5 });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  sector_searched: sector,
                  business_description: business_description || '',
                  guidance:
                    'לפי סעיף 37 לחוק עקרונות האסדרה, התשפ"ב-2021, כל פעילות עסקית כפופה לחוק רישוי עסקים והוראות המשרד המקצועי הרלוונטי.',
                  matched_national_regulations: liveResults.records.map((r) => ({
                    id: r._id,
                    name: r.legislation_name,
                    ministry: r.office_name,
                    type: r.legislation_type,
                    tags: r.tags_list,
                    knesset_url: r.knesset_clean_url,
                  })),
                  next_steps: [
                    'בדוק את צו רישוי עסקים (עסקים טעוני רישוי) של משרד הפנים לקביעת הצורך ברישיון עסק.',
                    'התייעץ עם הרגולטור הענפי הממונה.',
                    'ודא עמידה בחוק הגנת הפרטיות ותקנות אבטחת מידע במקרה של איסוף מידע אישי.',
                  ],
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [{ type: 'text', text: `שגיאה בבדיקת ציות רגולטורי: ${err.message}` }],
        };
      }
    }
  );

  // TOOL 6: analyze_regulatory_impact
  server.tool(
    'analyze_regulatory_impact',
    'ניתוח השפעת רגולציה (RIA - Regulatory Impact Assessment) לפי עקרונות רשות האסדרה במשרד ראש הממשלה וחוק עקרונות האסדרה.',
    {
      proposed_rule_title: z.string().describe('כותרת החוק, התקנה או הכלל הרגולטורי המוצע'),
      sector_affected: z.string().describe('המגזר המושפע (עסקים קטנים, יבואנים, פינטק, צרכנים וכו\')'),
      regulatory_objective: z.string().describe('מטרת ההסדרה (בטיחות, הגנת הצרכן, שמירה על הסביבה וכו\')'),
    },
    async ({ proposed_rule_title, sector_affected, regulatory_objective }) => {
      const riaFramework = {
        framework: 'דוח הערכת השפעת רגולציה (RIA) - רשות האסדרה',
        legal_basis: 'סעיף 21 לחוק עקרונות האסדרה, התשפ"ב-2021',
        title: proposed_rule_title,
        affected_sector: sector_affected,
        objective: regulatory_objective,
        evaluation_dimensions: [
          {
            step: '1. הגדרת הבעיה והצורך בהתערבות ממשלתית',
            key_questions: 'האם קיים כשל שוק? מהי חומרת הסיכון לציבור אם לא תונהג רגולציה?',
          },
          {
            step: '2. בחינת חלופות רגולטוריות',
            key_questions: 'האם נבחנו חלופות רכות כגון תקינה וולונטרית, גילוי נאות, או אימוץ תקינה בינלאומית?',
          },
          {
            step: '3. אומדן עלויות ונטל בירוקרטי',
            key_questions: 'מהי העלות השנתית המוערכת לעסק ממוצע? מהו הנטל על עסקים קטנים ובינוניים (SMEs)?',
          },
          {
            step: '4. בחינת התאמה בינלאומית (אירופה/OECD)',
            key_questions: 'האם ההסדרה מחמירה מעבר למקובל במדינות מפותחות? עיקרון "מה שטוב לאירופה טוב לישראל".',
          },
          {
            step: '5. שיתוף הציבור ומנגנון בקרה',
            key_questions: 'פרסום להערות הציבור למשך 21 יום באתר החקיקה הממשלתי (tazkirim / regulation.gov.il).',
          },
        ],
        regulatory_principles_checklist: [
          'פרופורציונליות: האמצעי הנבחר הוא בעל הפגיעה הפחותה ביותר בחופש העיסוק',
          'אחידות ובהירות: הוראות ברורות ללא כפילות בין משרדי ממשלה',
          'דיגיטציה: הגשת בקשות ודיווחים באופן מקוון מלא ללא צורך בהתייצבות פיזית',
        ],
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(riaFramework, null, 2),
          },
        ],
      };
    }
  );

  // RESOURCE 1: Overview
  server.resource(
    'national_registry_overview',
    'regulation://national-registry/overview',
    async (uri) => {
      const stats = await getRegulationStats();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                title: 'מאגר האסדרה הלאומי של מדינת ישראל (regulation.gov.il)',
                managing_authority: 'רשות האסדרה, משרד ראש הממשלה ומערך הדיגיטל הלאומי',
                statutory_basis: 'סעיף 37 לחוק עקרונות האסדרה, התשפ"ב-2021',
                total_regulations_cataloged: stats.totalCount,
                key_regulators: stats.ministries.slice(0, 10),
                open_data_api: 'https://data.gov.il/api/3/action/datastore_search',
                resource_id: '929b4c60-ce43-4f5b-9960-f6146ba33eed',
                description:
                  'מאגר האסדרה המאוחד מרכז את כל החקיקה הראשית והמשנית המסדירה פעילות עסקית וכלכלית בישראל, ומאפשר שקיפות, הפחתת נטל עודף והנגשה לציבור ולמפתחי בינה מלאכותית.',
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // RESOURCE 2: Ministries directory
  server.resource(
    'ministries_directory',
    'regulation://ministries/directory',
    async (uri) => {
      const stats = await getRegulationStats();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(stats.ministries, null, 2),
          },
        ],
      };
    }
  );

  // RESOURCE 3: Reliefs summary
  server.resource(
    'regulatory_reliefs_summary',
    'regulation://reliefs/summary',
    async (uri) => {
      const { records, total } = await fetchReliefs('', '', 20);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                title: 'הקלות והתאמות ברגולציה - הקלת הנטל הממשלתי',
                total_recorded: total,
                sample_reliefs: records,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // PROMPT 1: Compliance Audit Prompt
  server.prompt(
    'compliance_audit',
    'תבנית הנחיה לסוכן בינה מלאכותית לביצוע בדיקת ציות ומיפוי רגולטורי מקיף לעסק או מוצר בישראל',
    {
      sector: z.string().describe('המגזר העסקי (למשל: מסעדות, פינטק, אנרגיה ירוקה, ייבוא, רחפנים)'),
      business_model: z.string().optional().describe('מודל הפעילות של העסק'),
    },
    async ({ sector, business_model }) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `אנא בצע מיפוי רגולטורי מלא עבור עסק בישראל בתחום: "${sector}".
${business_model ? `מודל פעילות: ${business_model}\n` : ''}
השתמש בכלים הבאים של שרת ה-MCP של מאגר האסדרה (regulation.gov.il):
1. 'check_business_compliance' עבור התחום "${sector}".
2. 'search_regulations' כדי לאתר חוקים ותקנות ספציפיים הרלוונטיים לפעילות זו.
3. 'get_regulatory_reliefs' כדי לבדוק האם קיימות הקלות או פטורים עדכניים.

ספק תשובה מובנית הכוללת:
- משרדים ורגולטורים ממונים
- רישיונות והיתרים נדרשים לפני תחילת פעילות
- חקיקה ראשית ותקנות מחייבות
- דגשי בטיחות, איכות סביבה והגנת הפרטיות
- סיכונים מנהליים ופליליים בעת אי-ציות`,
            },
          },
        ],
      };
    }
  );

  // PROMPT 2: Regulatory Impact Assessment Prompt
  server.prompt(
    'regulatory_impact_assessment',
    'תבנית הנחיה לניתוח השפעת רגולציה חדשה (RIA) לפי מתודולוגיית רשות האסדרה בישראל',
    {
      regulation_name: z.string().describe('שם החוק או הרגולציה הנבחנת'),
      target_population: z.string().describe('אוכלוסיית היעד או המגזר העסקי המושפע'),
    },
    async ({ regulation_name, target_population }) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `אנא נתח את הצעת הרגולציה: "${regulation_name}" המיועדת להשפיע על: "${target_population}".
השתמש בכלי 'analyze_regulatory_impact' של שרת ה-MCP ובחן את ההיבטים הבאים:
1. כשל השוק המצדיק התערבות רגולטורית.
2. חלופות להסדרה מחייבת (כגון קוד אתי, גילוי או תקינה בינלאומית).
3. הערכת הנטל הבירוקרטי והעלויות המוערכות לעסקים קטנים ובינוניים.
4. השוואה למדינות ה-OECD והאיחוד האירופי.
5. המלצות לשיפור ופישוט ההסדרה.`,
            },
          },
        ],
      };
    }
  );

  return server;
}
