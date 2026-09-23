# 🇮🇱 Israel Regulation MCP Server & National Explorer
### שרת Model Context Protocol (MCP) וממשק חקר למאגר האסדרה והחקיקה הלאומי (`regulation.gov.il`)

[![MCP Spec](https://img.shields.io/badge/MCP-2024--11--05-blue?style=flat-square)](https://modelcontextprotocol.io/)
[![IGDS 2.0](https://img.shields.io/badge/Design-IGDS%202.0-0068f5?style=flat-square)](https://gov.il)
[![Regulations](https://img.shields.io/badge/Indexed%20Regulations-6%2C576+-green?style=flat-square)](https://data.gov.il)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](LICENSE)

שרת **Model Context Protocol (MCP)** תקני וממשק חקר מתקדם המעניק לסוכני בינה מלאכותית (Claude Desktop, Cursor, Windsurf, Claude Code, Cline) חיבור ישיר ומאובטח לכלל החקיקה הראשית, תקנות המשנה, דרישות הרישוי וההקלות הרגולטוריות של מדינת ישראל.

---

## ⚡ התחלה מהירה תוך 60 שניות (Quickstart)

### 1. הפעלה מרוחקת ישירה ב-Claude Desktop (ללא התקנה)
הוסף את ההגדרה הבאה לקובץ ההגדרות שלך:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "israel-regulation": {
      "url": "https://ais-dev-s4gnwdsamdhgmjwkei6eub-108733651766.europe-west3.run.app/api/mcp/sse"
    }
  }
}
```

### 2. הפעלה מקומית (Stdio Mode)
```bash
# הרצת שרת Stdio
npx -y tsx mcp-server/index.ts
```

תצורת Claude Desktop עבור Stdio:
```json
{
  "mcpServers": {
    "israel-regulation": {
      "command": "npx",
      "args": ["-y", "tsx", "mcp-server/index.ts"]
    }
  }
}
```

### 3. הפעלה ב-Cursor או Windsurf
הוסף לקובץ `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "israel-regulation": {
      "url": "https://ais-dev-s4gnwdsamdhgmjwkei6eub-108733651766.europe-west3.run.app/api/mcp/sse"
    }
  }
}
```

---

## 📸 תצלומי מסך והדמיית פעולה (Screenshots)

### 1. Claude Desktop שולף את חוק רישוי שירותי התעופה בלייב
```text
┌────────────────────────────────────────────────────────────────────────┐
│ Claude Desktop 3.7 Sonnet                             [israel-regulation] 🟢 │
├────────────────────────────────────────────────────────────────────────┤
│ 👤 User:                                                               │
│ שלוף לי ממאגר האסדרה את חוק רישוי שירותי התעופה, התשכ"ג-1963.          │
│                                                                        │
│ 🤖 Claude:                                                             │
│ 🛠️ קורא לכלי israel-regulation: search_regulations...                  │
│    arguments: { "query": "חוק רישוי שירותי התעופה" }                   │
│                                                                        │
│ ✅ אותרה רשומה מס' 6212 במאגר האסדרה הלאומי:                           │
│ • שם החוק: חוק רישוי שירותי התעופה, התשכ"ג-1963                        │
│ • רשות ממונה: רשות התעופה האזרחית (רת"א / משרד התחבורה)                │
│ • סוג: חקיקה ראשית (פורסם 07/05/1963, עדכון 29/05/2012)                 │
│ • 🔗 קישור לכנסת: https://main.knesset.gov.il/.../LawPrimary.aspx      │
│ • 📖 נוסח מלא בוויקיטקסט: https://he.wikisource.org/...                │
│                                                                        │
│ בנוסף, אותרו 7 תקנות משנה מרכזיות שהותקנו מכוחו:                       │
│ 1. תקנות רישוי שירותי התעופה (פטור מרישיון הפעלה מסחרית), 2018         │
│ 2. תקנות רישוי שירותי התעופה (פטור מהיתר הפעלה), 2018                  │
│ 3. תקנות רישוי שירותי תעופה (טיסות שכר), 2023                          │
│ 4. תקנות רישוי שירותי תעופה (בתי ספר להוראת טיס), 1971                 │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. ממשק החקר וקונסולת הבדיקה (Web UI - IGDS 2.0)
- **לוח בקרה ממשלתי תקני:** פותח לפי תקן IGDS 2.0 (Rubik, כחול ישראל `#0068f5`, כחול שחר `#0c3058`).
- **קונסולת בדיקה לכלים:** עורך JSON מובנה, מדידת זמן תגובה (Latency במילישניות) ותצוגת תגובות JSON-RPC 2.0.
- **סייר חקיקה מלא:** חיפוש וסינון ב-6,576+ חוקים ותקנות לפי משרד, תגיות נושא וחוק מסמיך.

---

## 🛠️ כלי ה-MCP הנתמכים (Tools API)

| שם הכלי | תיאור | פרמטרים |
|---|---|---|
| `search_regulations` | חיפוש מלא במאגר האסדרה הלאומי | `query`, `office_name`, `legislation_type`, `tag`, `limit` |
| `get_regulation_by_id` | שליפת פרטי חוק לפי מזהה רשומה עם קישורים ישירים | `id` (מספר רשומה) |
| `get_regulatory_reliefs` | שליפת הקלות, פטורים והתאמות רגולציה מכל משרדי הממשלה | `query`, `ministry`, `limit` |
| `check_business_compliance` | מיפוי רגולטורי ורישיונות לפי ענף עסקי | `sector`, `business_description` |
| `analyze_regulatory_impact` | ניתוח השפעת רגולציה (RIA) ובחינת חלופות | `proposed_rule_title`, `sector_affected`, `regulatory_objective` |
| `list_ministries_and_categories` | משרדי הממשלה וכמויות הרגולציה בכל תחום | ללא |

---

## 💡 דוגמאות שימוש מעשיות (Real-World Use Cases)

### דוגמה 1: בדיקת חוק רישוי שירותי התעופה, התשכ"ג-1963
**בקשת JSON-RPC 2.0:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_regulations",
    "arguments": {
      "query": "חוק רישוי שירותי התעופה"
    }
  }
}
```
**תגובה חוזרת (JSON):**
```json
{
  "_id": 6212,
  "legislation_name": "חוק רישוי שירותי התעופה, התשכ\"ג-1963",
  "office_name": "רשות התעופה האזרחית",
  "legislation_type": "חקיקה ראשית",
  "publication_date": "1963-05-07",
  "knesset_clean_url": "https://main.knesset.gov.il/Activity/Legislation/Laws/Pages/LawPrimary.aspx?t=lawlaws&st=lawlaws&lawitemid=2001190",
  "wiki_clean_url": "https://he.wikisource.org/wiki/חוק_רישוי_שירותי_התעופה"
}
```

**פלט Markdown מנורמל ומעוצב (Markdown Preview / Export):**
```markdown
# 📜 חוק רישוי שירותי התעופה, התשכ"ג-1963
> **מזהה רשומה:** `6212` | **משרד ממונה:** רשות התעופה האזרחית | **סוג:** חקיקה ראשית

| מאפיין | פירוט |
| :--- | :--- |
| **שם מלא** | חוק רישוי שירותי התעופה, התשכ"ג-1963 |
| **משרד ממונה** | רשות התעופה האזרחית (משרד התחבורה) |
| **סוג חקיקה** | `חקיקה ראשית` |
| **הוראות אסדרה מחייבות** | **כן** |
| **תאריך פרסום** | 1963-05-07 |

### 🔗 קישורים ישירים לרשומות הרשמיות:
- 🏛️ **מאגר החקיקה הלאומי (אתר הכנסת):** [מעבר לרשומת החוק](https://main.knesset.gov.il/Activity/Legislation/Laws/Pages/LawPrimary.aspx?t=lawlaws&st=lawlaws&lawitemid=2001190)
- 📖 **נוסח מלא בוויקיטקסט:** [קריאת סעיפי החוק המעודכנים](https://he.wikisource.org/wiki/חוק_רישוי_שירותי_התעופה)
```

---

## 📝 תמיכה בפלט Markdown מנורמל ו-MD Preview
המערכת כוללת כעת מנוע נרמול ייעודי הממיר כל תגובת כלי (JSON-RPC) למסמך Markdown עשיר ומוכן לשימוש:
1. **📑 תצוגת MD מעוצבת (Markdown Preview)**: עיצוב ויזואלי מושלם עם טבלאות, הדגשות, צ'ק-ליסטים וקישורים חיים לכנסת ולוויקיטקסט.
2. **📝 קוד MD גולמי (Raw Markdown)**: קוד Markdown נקי להעתקה והדבקה במערכות ניהול ידע (Notion, Obsidian, GitHub).
3. **⚙️ JSON-RPC 2.0 מקורי**: תגובת ה-API הגולמית עבור מפתחים וסוכני אוטומציה.
4. **📥 ייצוא קבצים בלחיצה אחת**: הורדת תוצאות כקובצי `.md` למחשב.

### דוגמה 2: בדיקת חובות רישוי לעסק מזון ומסעדה
**בקשת ה-MCP:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "check_business_compliance",
    "arguments": {
      "sector": "restaurant",
      "business_description": "מסעדה אסייתית עם ישיבה בחוץ והגשת אלכוהול"
    }
  }
}
```
**מיפוי המתקבל מהכלי:**
- חוק רישוי עסקים, התשכ"ח-1968 (פריט 4.2 במפרט האחיד).
- משרדים מאשרים: משרד הבריאות (תברואה ומטבח), שירותי כבאות והצלה (אישור 102), משטרת ישראל (רישיון אלכוהול), רשות מקומית (היתר הצבת שולחנות).

---

## 🏛️ תאימות לתקן IGDS 2.0
המערכת מיושמת באופן מלא על פי **הנחיות מערך הדיגיטל הלאומי**:
- תמיכה מלאה ב-RTL (מימין לשמאל).
- צבעי מותג רשמיים (`--israel-blue-500: #0068f5`, `--dawn-blue-900: #0c3058`).
- גופן **Rubik** הממלכתי.
- נגישות WCAG 2.1 ברמת AA.

---

## 📄 רישיון ומקורות מידע
- מקור המידע: **מאגר האסדרה הלאומי** (`https://regulation.gov.il/`) ופורטל הנתונים הממשלתי (`data.gov.il`).
- מופעל בחסות רשות האסדרה במשרד ראש הממשלה.
