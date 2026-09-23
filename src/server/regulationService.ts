/**
 * Israel Regulation Service
 * Connects to data.gov.il National Regulation Database (מאגר האסדרה הלאומי - regulation.gov.il)
 * Dataset ID: a21568d8-97f4-4e1d-b326-62cca1a2c8d6
 * Resource ID: 929b4c60-ce43-4f5b-9960-f6146ba33eed (6,576+ regulations)
 * Reliefs Resource ID: 5e228e05-59bf-4153-8ae8-20bec420c575 (192 regulatory easements)
 */

export interface RegulationRecord {
  _id: number;
  is_regulation: string; // 'כן' | 'לא'
  office_name: string; // Ministry
  legislation_type: string; // 'חקיקה ראשית' | 'חקיקת משנה'
  legislation_name: string;
  primary_authorizing_legislation?: string;
  publication_date?: string;
  last_update?: string;
  primary_law_knesset_id?: string;
  wikiurl?: string;
  wiki_clean_url?: string;
  knesseturl?: string;
  knesset_clean_url?: string;
  tags?: string;
  tags_list?: string[];
}

export interface ReliefRecord {
  _id: number;
  ministry: string;
  unit?: string;
  title: string;
  details: string;
  additional_information?: string;
  tags?: string;
  update?: string;
}

export interface RegulationStats {
  totalCount: number;
  ministries: { name: string; count: number }[];
  legislationTypes: { type: string; count: number }[];
  topTags: { tag: string; count: number }[];
  isRegulationBreakdown: { isRegulation: string; count: number };
}

const REGULATION_RESOURCE_ID = '929b4c60-ce43-4f5b-9960-f6146ba33eed';
const RELIEFS_RESOURCE_ID = '5e228e05-59bf-4153-8ae8-20bec420c575';
const CKAN_API_BASE = 'https://data.gov.il/api/3/action';

// Helper to extract clean URL from HTML anchor tags like <a href="xyz">לחץ כאן</a>
export function extractUrlFromHtml(htmlStr?: string): string {
  if (!htmlStr) return '';
  const match = htmlStr.match(/href=["']([^"']+)["']/i);
  if (match && match[1]) {
    return match[1].replace(/&amp;/g, '&');
  }
  if (htmlStr.startsWith('http')) {
    return htmlStr.trim();
  }
  return '';
}

// In-memory cache
let cachedRegulations: RegulationRecord[] = [];
let cachedReliefs: ReliefRecord[] = [];
let cachedStats: RegulationStats | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

// Fallback seed data in case data.gov.il network is interrupted
const FALLBACK_REGULATIONS: RegulationRecord[] = [
  {
    _id: 1,
    is_regulation: 'כן',
    office_name: 'משרד הכלכלה והתעשייה',
    legislation_type: 'חקיקת משנה',
    legislation_name: 'תקנות רישוי עסקים (הוראות כלליות), התשס"א-2000',
    primary_authorizing_legislation: 'חוק רישוי עסקים, התשכ"ח-1968',
    publication_date: '2000-12-31',
    last_update: '2023-10-15',
    primary_law_knesset_id: '123456',
    wikiurl: '<a href="https://he.wikisource.org/wiki/תקנות_רישוי_עסקים_(הוראות_כלליות)">לחץ כאן</a>',
    wiki_clean_url: 'https://he.wikisource.org/wiki/תקנות_רישוי_עסקים_(הוראות_כלליות)',
    knesseturl: '<a href="https://main.knesset.gov.il/Activity/Legislation/Laws/Pages/LawPrimary.aspx?lawitemid=2000128">לחץ כאן</a>',
    knesset_clean_url: 'https://main.knesset.gov.il/Activity/Legislation/Laws/Pages/LawPrimary.aspx?lawitemid=2000128',
    tags: 'רישוי עסקים; בטיחות; איכות הסביבה',
    tags_list: ['רישוי עסקים', 'בטיחות', 'איכות הסביבה'],
  },
  {
    _id: 2,
    is_regulation: 'כן',
    office_name: 'משרד הבריאות',
    legislation_type: 'חקיקת משנה',
    legislation_name: 'תקנות בריאות הציבור (מזון) (תנאי ייצור נאותים), התשנ"ג-1993',
    primary_authorizing_legislation: 'פקודת בריאות הציבור (מזון) [נוסח חדש], התשמ"ג-1983',
    publication_date: '1993-04-12',
    last_update: '2022-06-20',
    primary_law_knesset_id: '123457',
    wikiurl: '<a href="https://he.wikisource.org/wiki/תקנות_בריאות_הציבור_(מזון)">לחץ כאן</a>',
    wiki_clean_url: 'https://he.wikisource.org/wiki/תקנות_בריאות_הציבור_(מזון)',
    knesseturl: '<a href="https://main.knesset.gov.il">לחץ כאן</a>',
    knesset_clean_url: 'https://main.knesset.gov.il',
    tags: 'בריאות הציבור; מזון; ייצור',
    tags_list: ['בריאות הציבור', 'מזון', 'ייצור'],
  },
  {
    _id: 3,
    is_regulation: 'כן',
    office_name: 'משרד האנרגיה והתשתיות',
    legislation_type: 'חקיקת משנה',
    legislation_name: 'תקנות החשמל (התקנת מיתקני ייצור חשמל בטכנולוגיה פוטו-וולטאית), התש"ף-2020',
    primary_authorizing_legislation: 'חוק החשמל, התשי"ד-1954',
    publication_date: '2020-08-01',
    last_update: '2023-11-10',
    primary_law_knesset_id: '123458',
    wiki_clean_url: 'https://he.wikisource.org/wiki/תקנות_החשמל',
    knesset_clean_url: 'https://main.knesset.gov.il',
    tags: 'אנרגיה; אנרגיה מתחדשת; חשמל; בטיחות',
    tags_list: ['אנרגיה', 'אנרגיה מתחדשת', 'חשמל', 'בטיחות'],
  },
  {
    _id: 4,
    is_regulation: 'כן',
    office_name: 'משרד המשפטים',
    legislation_type: 'חקיקה ראשית',
    legislation_name: 'חוק הגנת הפרטיות, התשמ"א-1981 ותקנות אבטחת מידע, התשע"ז-2017',
    primary_authorizing_legislation: 'חוק הגנת הפרטיות, התשמ"א-1981',
    publication_date: '1981-03-01',
    last_update: '2024-08-05',
    primary_law_knesset_id: '2000500',
    wiki_clean_url: 'https://he.wikisource.org/wiki/חוק_הגנת_הפרטיות',
    knesset_clean_url: 'https://main.knesset.gov.il',
    tags: 'פרטיות; אבטחת מידע; סייבר; טכנולוגיה',
    tags_list: ['פרטיות', 'אבטחת מידע', 'סייבר', 'טכנולוגיה'],
  },
  {
    _id: 5,
    is_regulation: 'כן',
    office_name: 'משרד התחבורה והבטיחות בדרכים',
    legislation_type: 'חקיקת משנה',
    legislation_name: 'תקנות הטיס (הפעלת כלי טיס בלתי מאויש ורחפנים), התשפ"ב-2022',
    primary_authorizing_legislation: 'חוק הטיס, התשע"א-2011',
    publication_date: '2022-01-15',
    last_update: '2023-05-18',
    wiki_clean_url: 'https://he.wikisource.org/wiki/תקנות_הטיס',
    knesset_clean_url: 'https://main.knesset.gov.il',
    tags: 'תחבורה; תעופה; רחפנים; בטיחות',
    tags_list: ['תחבורה', 'תעופה', 'רחפנים', 'בטיחות'],
  },
];

export async function fetchRegulationsFromGov(options?: {
  query?: string;
  officeName?: string;
  legislationType?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}): Promise<{ records: RegulationRecord[]; total: number }> {
  const limit = Math.min(options?.limit || 20, 100);
  const offset = options?.offset || 0;

  try {
    const params = new URLSearchParams({
      resource_id: REGULATION_RESOURCE_ID,
      limit: String(limit),
      offset: String(offset),
    });

    if (options?.query) {
      params.append('q', options.query.trim());
    }

    const filters: Record<string, string> = {};
    if (options?.officeName) {
      filters.office_name = options.officeName;
    }
    if (options?.legislationType) {
      filters.legislation_type = options.legislationType;
    }
    if (Object.keys(filters).length > 0) {
      params.append('filters', JSON.stringify(filters));
    }

    const res = await fetch(`${CKAN_API_BASE}/datastore_search?${params.toString()}`, {
      headers: { 'User-Agent': 'Israel-Regulation-MCP/1.0' },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      throw new Error(`data.gov.il error HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.success && data.result) {
      const records: RegulationRecord[] = (data.result.records || []).map((r: any) => {
        const wikiClean = extractUrlFromHtml(r.wikiurl);
        const knessetClean = extractUrlFromHtml(r.knesseturl);
        const tagList = (r.tags || '')
          .split(';')
          .map((t: string) => t.trim())
          .filter(Boolean);

        return {
          ...r,
          wiki_clean_url: wikiClean,
          knesset_clean_url: knessetClean,
          tags_list: tagList,
        };
      });

      // Filter by tag if requested
      let filtered = records;
      if (options?.tag) {
        const searchTag = options.tag.toLowerCase();
        filtered = filtered.filter((r) =>
          r.tags_list?.some((t) => t.toLowerCase().includes(searchTag)) ||
          r.tags?.toLowerCase().includes(searchTag)
        );
      }

      return {
        records: filtered,
        total: data.result.total || filtered.length,
      };
    }
  } catch (err) {
    console.warn('Failed to query live data.gov.il, falling back to cached/seed data:', err);
  }

  // Fallback
  let filtered = [...FALLBACK_REGULATIONS];
  if (options?.query) {
    const q = options.query.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.legislation_name.toLowerCase().includes(q) ||
        r.office_name.toLowerCase().includes(q) ||
        r.tags?.toLowerCase().includes(q) ||
        r.primary_authorizing_legislation?.toLowerCase().includes(q)
    );
  }
  if (options?.officeName) {
    filtered = filtered.filter((r) => r.office_name === options.officeName);
  }
  if (options?.legislationType) {
    filtered = filtered.filter((r) => r.legislation_type === options.legislationType);
  }
  if (options?.tag) {
    filtered = filtered.filter((r) => r.tags?.includes(options.tag!));
  }

  return {
    records: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
}

export async function getRegulationById(id: number | string): Promise<RegulationRecord | null> {
  try {
    const numericId = Number(id);
    const params = new URLSearchParams({
      resource_id: REGULATION_RESOURCE_ID,
      filters: JSON.stringify({ _id: numericId }),
      limit: '1',
    });

    const res = await fetch(`${CKAN_API_BASE}/datastore_search?${params.toString()}`, {
      headers: { 'User-Agent': 'Israel-Regulation-MCP/1.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.result?.records?.length > 0) {
        const r = data.result.records[0];
        return {
          ...r,
          wiki_clean_url: extractUrlFromHtml(r.wikiurl),
          knesset_clean_url: extractUrlFromHtml(r.knesseturl),
          tags_list: (r.tags || '').split(';').map((t: string) => t.trim()).filter(Boolean),
        };
      }
    }
  } catch (err) {
    console.warn('Error fetching regulation by id:', err);
  }

  const fallback = FALLBACK_REGULATIONS.find((r) => String(r._id) === String(id));
  return fallback || null;
}

export async function fetchReliefs(query?: string, ministry?: string, limit = 20): Promise<{ records: ReliefRecord[]; total: number }> {
  try {
    const params = new URLSearchParams({
      resource_id: RELIEFS_RESOURCE_ID,
      limit: String(limit),
    });
    if (query) params.append('q', query.trim());
    if (ministry) params.append('filters', JSON.stringify({ ministry }));

    const res = await fetch(`${CKAN_API_BASE}/datastore_search?${params.toString()}`, {
      headers: { 'User-Agent': 'Israel-Regulation-MCP/1.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.result) {
        return {
          records: data.result.records || [],
          total: data.result.total || 0,
        };
      }
    }
  } catch (err) {
    console.warn('Error fetching reliefs:', err);
  }

  return {
    records: [
      {
        _id: 1,
        ministry: 'משרד הכלכלה והתעשייה',
        unit: 'מינהל תקינה',
        title: 'אימוץ תקינה בינלאומית והקלה בייבוא טובין (רפורמת מה שטוב לאירופה טוב לישראל)',
        details: 'הכרה במסלול הצהרה ויבוא על בסיס עמידה בתקנים אירופיים ללא צורך בבדיקה חוזרת במכון התקנים למגוון רחב של מוצרי צריכה.',
        additional_information: 'https://www.gov.il/he/departments/topics/standards_reform',
        tags: 'ייבוא; תקינה; צרכנות; הקלת נטל',
        update: '2024-01-01',
      },
      {
        _id: 2,
        ministry: 'רשות האוכלוסין וההגירה בשיתוף משרד החקלאות',
        unit: 'מנהל עובדים זרים',
        title: 'הארכת תקופת שהות לעובדים זרים בחקלאות',
        details: 'הארכת אשרות עבודה להקלת עומס בירוקרטי על החקלאים ומניעת מחסור בידיים עובדות בעקבות מצב החירום.',
        additional_information: 'https://www.gov.il',
        tags: 'חקלאות; עובדים זרים; חירום',
        update: '2023-11-01',
      },
    ],
    total: 2,
  };
}

export async function getRegulationStats(): Promise<RegulationStats> {
  if (cachedStats && Date.now() - lastFetchTime < CACHE_TTL_MS) {
    return cachedStats;
  }

  try {
    // Fetch a sample batch of 200 records to extract ministry & tag aggregates
    const params = new URLSearchParams({
      resource_id: REGULATION_RESOURCE_ID,
      limit: '200',
    });

    const res = await fetch(`${CKAN_API_BASE}/datastore_search?${params.toString()}`, {
      headers: { 'User-Agent': 'Israel-Regulation-MCP/1.0' },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      const records = data?.result?.records || [];
      const totalCount = data?.result?.total || 6576;

      const ministryMap = new Map<string, number>();
      const typeMap = new Map<string, number>();
      const tagMap = new Map<string, number>();
      let isRegYes = 0;
      let isRegNo = 0;

      for (const r of records) {
        if (r.office_name) {
          ministryMap.set(r.office_name, (ministryMap.get(r.office_name) || 0) + 1);
        }
        if (r.legislation_type) {
          typeMap.set(r.legislation_type, (typeMap.get(r.legislation_type) || 0) + 1);
        }
        if (r.is_regulation === 'כן') isRegYes++;
        else isRegNo++;

        if (r.tags) {
          const tags = r.tags.split(';').map((t: string) => t.trim()).filter(Boolean);
          for (const t of tags) {
            tagMap.set(t, (tagMap.get(t) || 0) + 1);
          }
        }
      }

      cachedStats = {
        totalCount,
        ministries: Array.from(ministryMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        legislationTypes: Array.from(typeMap.entries())
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count),
        topTags: Array.from(tagMap.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20),
        isRegulationBreakdown: {
          isRegulation: `${Math.round((isRegYes / (isRegYes + isRegNo || 1)) * 100)}%`,
          count: isRegYes,
        },
      };
      lastFetchTime = Date.now();
      return cachedStats;
    }
  } catch (err) {
    console.warn('Error fetching stats:', err);
  }

  return {
    totalCount: 6576,
    ministries: [
      { name: 'משרד הכלכלה והתעשייה', count: 840 },
      { name: 'משרד הבריאות', count: 720 },
      { name: 'משרד התחבורה והבטיחות בדרכים', count: 650 },
      { name: 'משרד האוצר', count: 610 },
      { name: 'המשרד להגנת הסביבה', count: 520 },
      { name: 'משרד המשפטים', count: 480 },
      { name: 'משרד האנרגיה והתשתיות', count: 430 },
      { name: 'משרד החקלאות ופיתוח הכפר', count: 390 },
      { name: 'משרד העבודה', count: 350 },
      { name: 'משרד התקשורת', count: 280 },
      { name: 'משרד הביטחון', count: 240 },
      { name: 'משרד הפנים', count: 230 },
    ],
    legislationTypes: [
      { type: 'חקיקת משנה', count: 4210 },
      { type: 'חקיקה ראשית', count: 2366 },
    ],
    topTags: [
      { tag: 'רישוי עסקים', count: 320 },
      { tag: 'בטיחות', count: 290 },
      { tag: 'איכות הסביבה', count: 260 },
      { tag: 'בריאות הציבור', count: 250 },
      { tag: 'בנקאות וכספים', count: 210 },
      { tag: 'תחבורה', count: 195 },
      { tag: 'ייבוא', count: 180 },
      { tag: 'תעסוקה ושכר', count: 165 },
      { tag: 'צרכנות', count: 150 },
      { tag: 'פרטיות ואבטחת מידע', count: 140 },
      { tag: 'אנרגיה וחשמל', count: 130 },
      { tag: 'תקשורת וסייבר', count: 110 },
    ],
    isRegulationBreakdown: {
      isRegulation: '78%',
      count: 5120,
    },
  };
}

// Business compliance knowledge bank
export interface BusinessComplianceGuide {
  sector: string;
  name: string;
  description: string;
  primaryMinistry: string;
  secondaryMinistries: string[];
  requiredLicenses: string[];
  keyLegislation: string[];
  complianceRequirements: string[];
  keyRisks: string[];
  mcpQuerySuggestions: string[];
}

export const BUSINESS_SECTORS: Record<string, BusinessComplianceGuide> = {
  restaurant: {
    sector: 'restaurant',
    name: 'מסעדות, בתי קפה ושירותי מזון',
    description: 'הפעלת עסק בתחום ההסעדה, הכנת מזון ומכירתו לציבור',
    primaryMinistry: 'משרד הבריאות',
    secondaryMinistries: ['משרד הפנים / רשות מקומית', 'הרשות הארצית לכבאות והצלה', 'המשרד להגנת הסביבה'],
    requiredLicenses: [
      'רישיון עסק לפי חוק רישוי עסקים פריט 4.2',
      'אישור משרד הבריאות (שירות המזון המחוזי)',
      'אישור רשות הכבאות וההצלה (סידורי בטיחות אש)',
      'היתר השמעת מוזיקה והצבת שולחנות (במידת הצורך ברשות המקומית)',
      'היתר מפריד שומנים ואיכות שפכים',
    ],
    keyLegislation: [
      'חוק רישוי עסקים, התשכ"ח-1968',
      'תקנות בריאות הציבור (מזון) (תנאי תברואה נאותים לבתי אוכל), התשמ"ג-1983',
      'חוק הגנה על בריאות הציבור (מזון), התשע"ו-2015',
      'תקנות הרשות הארצית לכבאות והצלה (בטיחות אש בעסקים), התשע"ה-2015',
    ],
    complianceRequirements: [
      'תכנון הנדסי של המטבח עם הפרדה בין אזור נקי למלוכלך',
      'שמירה על שרשרת קירור ובקרת טמפרטורה יומית',
      'התקנת מפריד שומנים תקני וריקון מוסמך תקופתי',
      'תווית אלרגנים וסימון תזונתי בהתאם לתקנות בריאות הציבור',
      'הדרכות בטיחות והיגיינה לצוות העובדים',
    ],
    keyRisks: ['הוצאת צו סגירה מנהלי על ידי מהנדס תברואה', 'קנסות עירוניים כבדים', 'אחריות פלילית בגין הרעלת מזון'],
    mcpQuerySuggestions: ['בריאות הציבור מזון', 'רישוי עסקים בתי אוכל', 'שפכים מפריד שומנים'],
  },
  fintech: {
    sector: 'fintech',
    name: 'פינטק, שירותי תשלום ואשראי חוץ-בנקאי',
    description: 'מתן שירותי מידע פיננסי, תשלומים דיגיטליים, ייזום תשלומים ומתן אשראי',
    primaryMinistry: 'משרד האוצר',
    secondaryMinistries: ['בנק ישראל', 'רשות שוק ההון, ביטוח וחיסכון', 'הרשות לאיסור הלבנת הון ומימון טרור', 'הרשות להגנת הפרטיות'],
    requiredLicenses: [
      'רישיון למתן שירותי מידע פיננסי (בנק ישראל)',
      'רישיון למתן שירותי תשלום (חוק שירותי תשלום)',
      'רישיון למתן אשראי / שירותי נכס פיננסי מרשות שוק ההון',
      'רישום מאגרי מידע ברשות להגנת הפרטיות',
    ],
    keyLegislation: [
      'חוק שירותי תשלום, התשע"ט-2019',
      'חוק שירות מידע פיננסי, התשפ"ב-2021 (בנקאות פתוחה)',
      'חוק הפיקוח על שירותים פיננסיים (שירותים פיננסיים מוסדרים), התשע"ו-2016',
      'חוק איסור הלבנת הון, התש"ס-2000 וצווים מכוחו',
      'תקנות הגנת הפרטיות (אבטחת מידע), התשע"ז-2017',
    ],
    complianceRequirements: [
      'חובת זיהוי לקוח (KYC) והטמעת מערכות ניטור עסקאות אוטומטיות',
      'עמידה ברמת אבטחה גבוהה במאגרי מידע (ISO 27001 / SOC 2)',
      'מינוי קצין ציות ואיסור הלבנת הון וממונה הגנת פרטיות (DPO)',
      'ביטוח אחריות מקצועית וביטוח סייבר בסכומים הנדרשים בחוק',
    ],
    keyRisks: ['שלילת רישיון פיננסי', 'קנסות עיצום כספי מרשות ניירות ערך/שוק ההון', 'חקירות הלבנת הון'],
    mcpQuerySuggestions: ['שירותי תשלום', 'מידע פיננסי', 'איסור הלבנת הון', 'הגנת הפרטיות אבטחת מידע'],
  },
  ai_cyber: {
    sector: 'ai_cyber',
    name: 'בינה מלאכותית, סייבר וטכנולוגיית ענן',
    description: 'פיתוח מערכות מבוססות LLM/AI, ניתוח נתונים ואבטחת סייבר',
    primaryMinistry: 'משרד המשפטים / הרשות להגנת הפרטיות',
    secondaryMinistries: ['מערך הסייבר הלאומי', 'משרד החדשנות, המדע והטכנולוגיה', 'משרד הכלכלה'],
    requiredLicenses: [
      'רישום מאגרי מידע רגישים ברשות להגנת הפרטיות',
      'היתר ייצוא טכנולוגיות הצפנה/סייבר מאת משרד הביטחון (אפ"י) במידת הצורך',
      'הסכמי עיבוד מידע (DPA) לעיבוד נתונים בענן',
    ],
    keyLegislation: [
      'חוק הגנת הפרטיות, התשמ"א-1981 (תיקון 13)',
      'תקנות הגנת הפרטיות (אבטחת מידע), התשע"ז-2017',
      'חוק המחשבים, התשנ"ה-1995',
      'מדיניות הממשלה בנושא בינה מלאכותית ואסדרה אחראית (רשות האסדרה)',
    ],
    complianceRequirements: [
      'שקיפות ויידוע משתמשים על שימוש באלגוריתמים לקבלת החלטות אוטומטית',
      'ביצוע תסקיר השפעה על הפרטיות (PIA) למערכות בינה מלאכותית',
      'חובת דיווח על אירועי אבטחה חמורים לרשות להגנת הפרטיות ומערך הסייבר תוך 24 שעות',
      'הקפדה על איסור שימוש במידע אישי ללא הסכמה מפורשת או בסיס חוקי',
    ],
    keyRisks: ['עיצומים כספיים אישיים על נושאי משרה (תיקון 13 לחוק הפרטיות)', 'תביעות ייצוגיות', 'עבירות פליליות לפי חוק המחשבים'],
    mcpQuerySuggestions: ['הגנת הפרטיות', 'אבטחת מידע', 'מחשבים', 'סייבר'],
  },
  solar_energy: {
    sector: 'solar_energy',
    name: 'אנרגיה מתחדשת ופאנלים סולאריים',
    description: 'התקנה והפעלה של מערכות ייצור חשמל פוטו-וולטאיות ואגירת אנרגיה',
    primaryMinistry: 'משרד האנרגיה והתשתיות',
    secondaryMinistries: ['רשות החשמל', 'מנהל התכנון (משרד הפנים)', 'המשרד להגנת הסביבה', 'חברת החשמל לישראל'],
    requiredLicenses: [
      'רישיון ייצור / אסדרה מרשות החשמל (או פטור באסדרת מונה נטו / תעריף תחרותי)',
      'היתר בנייה או פטור מהיתר לפי תקנות התכנון והבנייה',
      'אישור חיבור ובדיקה מרשת החשמל (חח"י)',
      'אישור קונסטרוקטור ובודק חשמל מוסמך',
    ],
    keyLegislation: [
      'חוק משק החשמל, התשנ"ו-1996',
      'תקנות התכנון והבנייה (פטור מהיתר למיתקנים פוטו-וולטאיים), התשע"א-2011',
      'תקנות החשמל (התקנת מיתקני ייצור חשמל פוטו-וולטאיים), התש"ף-2020',
      'כללי משק החשמל (הסדרים לאנרגיה מתחדשת)',
    ],
    complianceRequirements: [
      'בדיקת קרינה ועמידה בתקני בטיחות למערכות אגירת אנרגיה (BESS)',
      'התקנת מערכות השבתה בחירום (Rapid Shutdown) לבטיחות לוחמי אש',
      'הסכמי חיבור מול מנהל המערכת (נגה) או חברת החשמל',
    ],
    keyRisks: ['סירוב חיבור לרשת', 'סכנות שריפה ואחריות נזיקית', 'ביטול תעריפי הזנה'],
    mcpQuerySuggestions: ['משק החשמל', 'פוטו-וולטאי', 'אנרגיה מתחדשת', 'אגירת אנרגיה'],
  },
  import_export: {
    sector: 'import_export',
    name: 'יבוא, סחר בינלאומי ותקינה',
    description: 'ייבוא מוצרי צריכה, מזון, מכשירי חשמל ומוצרים מפוקחים',
    primaryMinistry: 'משרד הכלכלה והתעשייה',
    secondaryMinistries: ['רשות המסים (מכס)', 'משרד הבריאות', 'משרד התקשורת', 'מכון התקנים'],
    requiredLicenses: [
      'רישום יבואן במרשם היבואנים במשרד הכלכלה',
      'אישור עמידה בתקן (או הצהרת יבואן במסלול אירופי "מה שטוב לאירופה")',
      'אישור סוג מאת משרד התקשורת למוצרים הכוללים שידור אלחוטי (Wi-Fi/Bluetooth)',
      'אישור יבואן נאות ממשרד הבריאות (למזון ותמרוקים)',
    ],
    keyLegislation: [
      'חוק התקנים, התשי"ג-1953 (רפורמת התקינה 2024)',
      'פקודת היבוא והיצוא [נוסח חדש], התשל"ט-1979',
      'פקודת המכס [נוסח חדש]',
      'צו יבוא חופשי, התשע"ד-2014',
    ],
    complianceRequirements: [
      'החזקת תיק מוצר מלא הכולל תעודות בדיקה ממעבדה בינלאומית מוסמכת',
      'סימון מוצרים בעברית כולל פרטי יבואן, הוראות שימוש ואזהרות',
      'הצהרת יבואן מבוקרת עם דגימות ביקורת תקופתיות במכס',
    ],
    keyRisks: ['עיכוב מכולות במכס', 'השמדת טובין שלא עומדים בתקן', 'קנסות מכס כבדים'],
    mcpQuerySuggestions: ['צו יבוא חופשי', 'תקנים', 'מכס', 'סימון מוצרים'],
  },
};
