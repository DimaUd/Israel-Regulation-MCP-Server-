# 🇮🇱 Israel Regulation MCP Server & National Explorer
### שרת Model Context Protocol (MCP) וממשק חקר למאגר האסדרה והחקיקה הלאומי (`regulation.gov.il`)

[![MCP Spec](https://img.shields.io/badge/MCP-2024--11--05-blue?style=flat-square)](https://modelcontextprotocol.io/)
[![IGDS 2.0](https://img.shields.io/badge/Design-IGDS%202.0-0068f5?style=flat-square)](https://gov.il)
[![Regulations](https://img.shields.io/badge/Indexed%20Regulations-6%2C576+-green?style=flat-square)](https://data.gov.il)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](LICENSE)

שרת **Model Context Protocol (MCP)** תקני וממשק חקר מתקדם המעניק לסוכני בינה מלאכותית (**OpenCode, Claude Desktop, Cursor, Windsurf, Cline / Roo Code, Claude Code, Continue.dev, Zed**) חיבור ישיר ומאובטח לכלל החקיקה הראשית, תקנות המשנה, דרישות הרישוי וההקלות הרגולטוריות של מדינת ישראל.

---

## ⚡ התחלה מהירה תוך 60 שניות (Quickstart)

כתובת ה-SSE הראשית לחיבור מרוחק בענן (ללא התקנה):
```text
https://ais-dev-s4gnwdsamdhgmjwkei6eub-108733651766.europe-west3.run.app/api/mcp/sse
```

---

## 🔌 מדריך התחברות לכל סביבות העבודה (OpenCode, Claude, Cursor ועוד)

### 1. 🚀 חיבור ל-OpenCode (מומלץ לקוד פתוח & CLI)
[OpenCode](https://opencode.ai) תומך ב-MCP באופן טבעי. ניתן לחבר את מאגר החקיקה בשתי שניות:

#### אפשרות א': פקודת CLI בשורה אחת
```bash
opencode mcp add israel-regulation --url https://ais-dev-s4gnwdsamdhgmjwkei6eub-108733651766.europe-west3.run.app/api/mcp/sse
```

#### אפשרות ב': קובץ הגדרות פרויקט `opencode.json` (או `~/.config/opencode/config.json`)
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "israel-regulation": {
      "type": "remote",
      "url": "https://ais-dev-s4gnwdsamdhgmjwkei6eub-108733651766.europe-west3.run.app/api/mcp/sse"
    }
  }
}
```

---

### 2. 🌟 חיבור ל-Claude Desktop (Anthropic)
קובץ ההגדרות:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "israel-regulation": {
      "url": "https://ais-dev-s4gnwdsamdhgmjwkei6eub-108733651766.europe-west3.run.app/api/mcp/sse"
    }
  }
}
```

*להפעלה מקומית (Stdio Node.js):*
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

---

### 3. ⚡ חיבור ל-Cursor IDE
הוסף לקובץ `.cursor/mcp.json` בפרויקט שלך (או דרך ממשק `Cursor Settings` > `Features` > `MCP` > `Add New MCP Server`):
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

### 4. 🌊 חיבור ל-Windsurf (Codeium)
הוסף לקובץ `~/.codeium/windsurf/mcp_config.json`:
```json
{
  "mcpServers": {
    "israel-regulation": {
      "serverUrl": "https://ais-dev-s4gnwdsamdhgmjwkei6eub-108733651766.europe-west3.run.app/api/mcp/sse"
    }
  }
}
```

---

### 5. 🧩 חיבור ל-VS Code (Cline / Roo Code)
הוסף לקובץ `cline_mcp_settings.json` (או דרך סרגל הכלים של התוסף):
- **Windows:** `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- **macOS:** `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "israel-regulation": {
      "url": "https://ais-dev-s4gnwdsamdhgmjwkei6eub-108733651766.europe-west3.run.app/api/mcp/sse",
      "autoApprove": ["search_regulations", "get_regulation_by_id", "get_regulatory_reliefs"]
    }
  }
}
```

---

### 6. 💻 חיבור ל-Claude Code CLI (Anthropic Terminal)
פקודת חיבור ישירה בטרמינל בשורה אחת:
```bash
claude mcp add --transport sse israel-regulation https://ais-dev-s4gnwdsamdhgmjwkei6eub-108733651766.europe-west3.run.app/api/mcp/sse
```

---

### 7. 🔄 חיבור ל-Continue.dev (VS Code & JetBrains)
הוסף לקובץ `~/.continue/config.json`:
```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "sse",
          "url": "https://ais-dev-s4gnwdsamdhgmjwkei6eub-108733651766.europe-west3.run.app/api/mcp/sse"
        }
      }
    ]
  }
}
```

---

### 8. ⚡ חיבור ל-Zed Editor
הוסף לקובץ `~/.config/zed/settings.json`:
```json
{
  "context_servers": {
    "israel-regulation": {
      "url": "https://ais-dev-s4gnwdsamdhgmjwkei6eub-108733651766.europe-west3.run.app/api/mcp/sse"
    }
  }
}
```

---

### 9. 🌐 חיבור ל-LibreChat / Open WebUI
הוסף לקובץ `librechat.yaml`:
```yaml
mcpServers:
  israel-regulation:
    type: sse
    url: "https://ais-dev-s4gnwdsamdhgmjwkei6eub-108733651766.europe-west3.run.app/api/mcp/sse"
```

---

### 10. 🛠️ חיבור ישיר למפתחים (cURL & Python API)
בדיקת שליפה ישירה ללא לקוח MCP בפרוטוקול JSON-RPC 2.0:

#### cURL
```bash
curl -X POST https://ais-dev-s4gnwdsamdhgmjwkei6eub-108733651766.europe-west3.run.app/api/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_regulations",
      "arguments": { "query": "חוק רישוי שירותי התעופה", "limit": 5 }
    }
  }'
```

#### Python
```python
import requests

url = "https://ais-dev-s4gnwdsamdhgmjwkei6eub-108733651766.europe-west3.run.app/api/mcp/rpc"
payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "search_regulations",
        "arguments": {"query": "חוק רישוי שירותי התעופה", "limit": 5}
    }
}
res = requests.post(url, json=payload).json()
print("נמצאו תוצאות:", res["result"])
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

| שם הכלי | סוג הפעולה | תיאור | פרמטרים |
|---|---|---|---|
| `search_regulations` | **אחזור ישיר (Pure Retrieval)** | חיפוש טקסטואלי חופשי, סינון מדויק ודפדוף עמוק (כל 6,576 הרשומות) | `query`, `office_name`, `legislation_type`, `is_regulation`, `authorizing_law`, `knesset_id`, `tag`, `sort`, `limit`, `offset` |
| `get_regulation_by_id` | **אחזור ישיר (Pure Retrieval)** | שליפת רשומת חוק/תקנה מלאה לפי מזהה ID עם קישורים ישירים לכנסת ולויקיטקסט | `id` (מספר רשומה) |
| `inspect_registry_schema` | **בדיקת מוכנות (100% Readiness)** | מפרט כל 12 שדות הסכמה הרשמיים של data.gov.il עם סוגי נתונים וערכי דוגמה | ללא פרמטרים |
| `get_regulation_raw` | **שליפה גולמית (Raw Datastore)** | שליפת רשומת JSON מקורית וגולמית ישירות מ-data.gov.il ללא שום טרנספורמציה | `id` (מספר רשומה) |
| `get_regulatory_reliefs` | **אחזור ישיר (Pure Retrieval)** | שליפת הקלות, פטורים והתאמות רגולציה מכל משרדי הממשלה (192 הקלות) | `query`, `ministry`, `limit` |
| `list_ministries_and_categories` | **אחזור ישיר (Pure Retrieval)** | רשימת כל משרדי הממשלה וכמויות החוקים והתקנות באחריותם | ללא פרמטרים |
| `check_business_compliance` | **מיפוי וניתוח (Compliance)** | מיפוי רגולטורי, רגולטורים ורישיונות לפי ענף עסקי | `sector`, `business_description` |
| `analyze_regulatory_impact` | **מתודולוגיה (RIA)** | הערכת השפעת רגולציה ובחינת חלופות לפי חוק עקרונות האסדרה | `proposed_rule_title`, `sector_affected`, `regulatory_objective` |

---

## 🔍 מה וכיצד ניתן לחפש באמצעות MCP? (מדריך אחזור מקיף)

> ### ❓ האם קיימת אפשרות לא למענה על שאלות או עיבוד מידע – אלא פשוט חיפוש לפי מילים ואחזור?
> 
> **כן, בהחלט! זוהי בדיוק ליבת הארכיטקטורה של שרת ה-MCP:**
> 
> שרת ה-MCP **אינו מייצר מידע ואינו מסכם אותו** אלא אם התבקש מפורשות לכך. 
> הכלים המרכזיים (`search_regulations`, `get_regulation_by_id`, `get_regulatory_reliefs`, `list_ministries_and_categories`) פועלים כ-**Data Retrieval Gateway (שער אחזור נתונים ישיר ודטרמיניסטי)** מול המאגר הרשמי של רשות האסדרה (`regulation.gov.il` ו-`data.gov.il`).
> 
> כאשר שולחים שאילתה, מקבלים את **הרשומות המקוריות והמדויקות כפי שהן רשומות במאגר הממשלתי**, כולל:
> - שם החקיקה הרשמי המלא
> - המשרד הממשלתי / הרשות המוסמכת
> - סיווג החקיקה (חקיקה ראשית מול חקיקת משנה)
> - החוק המסמיך (עבור תקנות וצווים)
> - האם החקיקה מטילה הוראות אסדרה מחייבות על עסקים
> - תאריכי פרסום רשמי ברשומות ותאריך עדכון אחרון במאגר
> - תגיות נושא וסיווגים
> - **קישורים ישירים לרשומות המקוריות:** קישור ישיר למאגר החקיקה הלאומי באתר הכנסת (`knesset_url`) וקישור לנוסח המלא והעדכני בוויקיטקסט (`wikisource_url`).

---

### 📋 סקירת כל אפשרויות החיפוש והאחזור הקיימות:

#### 1. חיפוש טקסטואלי חופשי לפי מילות מפתח (Raw Keyword Search)
חיפוש ישיר במאגר של 6,576+ חוקים ותקנות לפי כל מילה או צירוף מילים (ללא צורך בניסוח שאלה):
* **שם הכלי:** `search_regulations`
* **פרמטר:** `query` (מחרוזת טקסט חופשית)
* **דוגמאות לשאילתות:**
  * `"חוק רישוי שירותי התעופה"`
  * `"בריאות הציבור מזון"`
  * `"בטיחות אש"`
  * `"שירותי תשלום"`
  * `"הגנת הפרטיות"`
  * `"אנרגיה סולארית"`
  * `"ייבוא תמרוקים"`

**דוגמת קריאת JSON-RPC 2.0:**
```json
{
  "jsonrpc": "2.0",
  "id": 101,
  "method": "tools/call",
  "params": {
    "name": "search_regulations",
    "arguments": {
      "query": "שירותי תעופה",
      "limit": 5
    }
  }
}
```

---

#### 2. אחזור ישיר ודטרמיניסטי לפי מזהה רשומה (Direct ID Retrieval)
אם ידוע מספר הרשומה במאגר הלאומי (למשל מתוך חיפוש קודם או קישור), ניתן לשלוף את הרשומה המלאה ישירות:
* **שם הכלי:** `get_regulation_by_id`
* **פרמטר:** `id` (מספר שלם או מחרוזת, למשל `6212`, `1`, `740`)
* **יתרון:** שליפה מיידית ללא תלות באלגוריתם חיפוש, עם קישורים ישירים לרשומות הרשמיות.

**דוגמת קריאת JSON-RPC 2.0:**
```json
{
  "jsonrpc": "2.0",
  "id": 102,
  "method": "tools/call",
  "params": {
    "name": "get_regulation_by_id",
    "arguments": {
      "id": 6212
    }
  }
}
```

---

#### 3. חיפוש מובנה ומסונן לפי חתכים רגולטוריים (Multi-Field Filtered Search)
ניתן לשלב מספר מסננים מדויקים יחד, עם או בלי מילת חיפוש:
* **`office_name` (סינון לפי משרד ממשלתי):**
  * `"משרד הכלכלה והתעשייה"`
  * `"משרד הבריאות"`
  * `"משרד התחבורה והבטיחות בדרכים"`
  * `"רשות התעופה האזרחית"`
  * `"המשרד להגנת הסביבה"`
  * `"משרד האוצר"`
  * `"משרד המשפטים"`
  * ועוד עשרות משרדים ורשויות.
* **`legislation_type` (סינון לפי רובד חקיקה):**
  * `"חקיקה ראשית"` – חוקים שנחקקו בכנסת.
  * `"חקיקת משנה"` – תקנות, צווים, כללים והוראות מנהל שהותקנו על ידי שרים ומנהלים כלליים.
* **`tag` (סינון לפי תגית נושאית):**
  * `"רישוי עסקים"`, `"בטיחות"`, `"בריאות הציבור"`, `"איכות הסביבה"`, `"ייבוא"`, `"בנקאות וכספים"`, `"צרכנות"`, `"פרטיות"`.
* **`limit` (הגבלת כמות תוצאות):** בין 1 ל-50 תוצאות (ברירת מחדל: 10).
* **`offset` (דפדוף):** מאפשר מעבר בין דפי תוצאות (`offset: 10`, `offset: 20` וכו').

**דוגמה לחיפוש משולב (רק חקיקת משנה בנושא בטיחות של משרד התחבורה):**
```json
{
  "jsonrpc": "2.0",
  "id": 103,
  "method": "tools/call",
  "params": {
    "name": "search_regulations",
    "arguments": {
      "office_name": "משרד התחבורה והבטיחות בדרכים",
      "legislation_type": "חקיקת משנה",
      "tag": "בטיחות",
      "limit": 10
    }
  }
}
```

---

#### 4. חיפוש ואחזור הקלות ופטורים רגולטוריים (Regulatory Reliefs Search)
שליפת 192+ הקלות ממשלתיות פעילות, הפחתות נטל בירוקרטי והסדרי פטור:
* **שם הכלי:** `get_regulatory_reliefs`
* **פרמטרים:**
  * `query`: מילת חיפוש חופשית בתיאור ההקלה (למשל `"יבוא"`, `"מזון"`, `"בדיקות תקן"`, `"הצהרה"`).
  * `ministry`: סינון לפי המשרד הממשלתי שהעניק את ההקלה.
  * `limit`: כמות הרשומות להחזרה.

**דוגמת קריאת JSON-RPC 2.0:**
```json
{
  "jsonrpc": "2.0",
  "id": 104,
  "method": "tools/call",
  "params": {
    "name": "get_regulatory_reliefs",
    "arguments": {
      "query": "יבוא",
      "limit": 5
    }
  }
}
```

---

#### 5. אחזור קטלוג משרדי הממשלה והיקף האסדרה (Ministries Catalog)
קבלת תמונת מצב סטטיסטית של כלל הרגולטורים במדינה וכמות החוקים שבאחריותם:
* **שם הכלי:** `list_ministries_and_categories`
* **פרמטרים:** ללא.
* **תוצאה:** רשימת כל המשרדים, הרשויות, אגפי הפיקוח ומספר החוקים והתקנות המנוהלים על ידם.

---

#### 6. משאבי MCP מובנים (MCP Resources Protocol)
סוכני MCP יכולים לקרוא משאבי מידע ישירות באמצעות ה-URI הייעודי שלהם דרך מתודת `resources/read`:
* `regulation://national-registry/overview` – תעודת זהות, מטא-דאטה ובסיס חוקי (סעיף 37 לחוק עקרונות האסדרה).
* `regulation://ministries/directory` – ספריית כלל משרדי הממשלה וכמויות הרגולציה.
* `regulation://reliefs/summary` – תקציר הקלות ופטורים רגולטוריים.

---

### 🛡️ הגעה לכל פיפס במאגר – 100% כיסוי וסריקה מלאה

המאגר מכיל **6,576 רשומות רשמיות** וכל אחת מהן ניתנת לאחזור מלא עד רמת השדה הבודד. שום נתון אינו מצונזר או חסום:

#### 1. בדיקת סכמה רשמית ב-12 שדות מלאים (`inspect_registry_schema`):
ניתן לתשאל את השרת ולקבל את מפרט כל 12 השדות של רשומת החקיקה ב-data.gov.il:
1. `_id` (מספר מזהה חד-ערכי של הרשומה)
2. `is_regulation` (האם החקיקה מטילה הוראות אסדרה מחייבות - "כן" / "לא")
3. `office_name` (שם המשרד הממשלתי או הרגולטור הממונה)
4. `legislation_type` (רובד החקיקה - "חקיקה ראשית" מול "חקיקת משנה")
5. `legislation_name` (השם המלא של החוק, הצו או התקנה)
6. `primary_authorizing_legislation` (שם החוק המסמיך להתקנת התקנה)
7. `publication_date` (תאריך פרסום רשמי ברשומות)
8. `last_update` (תאריך עדכון אחרון במאגר האסדרה)
9. `primary_law_knesset_id` (מזהה רשמי של החוק במערכת החקיקה של הכנסת)
10. `wikiurl / wiki_clean_url` (קישור ישיר לנוסח המלא והמעודכן בוויקיטקסט)
11. `knesseturl / knesset_clean_url` (קישור ישיר למאגר החקיקה הלאומי באתר הכנסת)
12. `tags / tags_list` (תגיות נושא וסיווגים מקצועיים)

#### 2. שליפת רשומת JSON גולמית מקורית (`get_regulation_raw`):
לקבלת אובייקט ה-JSON המקורי ישירות מ-data.gov.il ללא שום עיבוד מוקדם:
```json
{
  "jsonrpc": "2.0",
  "id": 105,
  "method": "tools/call",
  "params": {
    "name": "get_regulation_raw",
    "arguments": { "id": 6212 }
  }
}
```

#### 3. דפדוף עמוק עד אחרון החוקים (Deep Offset Pagination):
באמצעות פרמטרי `limit` (עד 100) ו-`offset` ניתן לבצע סריקה מלאה (Crawl) של כל 6,576 הרשומות:
```json
{
  "jsonrpc": "2.0",
  "id": 106,
  "method": "tools/call",
  "params": {
    "name": "search_regulations",
    "arguments": {
      "offset": 6500,
      "limit": 100,
      "sort": "_id asc"
    }
  }
}
```

---

### 📊 מבנה הנתונים המוחזר בכל רשומה (Raw Data Schema)

כאשר מפעילים כלי אחזור, השרת מחזיר אובייקט JSON תקני עם השדות הבאים:

```typescript
{
  "id": 6212,                                      // מזהה חד-ערכי במאגר הלאומי
  "name": "חוק רישוי שירותי התעופה, התשכ\"ג-1963",    // שם החקיקה הרשמי המלא
  "type": "חקיקה ראשית",                           // "חקיקה ראשית" או "חקיקת משנה"
  "ministry": "רשות התעופה האזרחית",                 // משרד ממשלתי או רשות ממונה
  "is_regulation": true,                           // האם מטיל הוראות אסדרה מחייבות (boolean)
  "authorizing_law": "אין (חקיקה ראשית)",           // שם החוק המסמיך (עבור תקנות)
  "publication_date": "1963-05-07",                // תאריך פרסום רשמי בקובץ התקנות/ספר החוקים
  "last_update": "2012-05-29",                     // תאריך עדכון אחרון במאגר
  "tags": ["תעופה", "רישוי", "בטיחות"],             // תגיות סיווג נושאי
  "knesset_url": "https://main.knesset.gov.il/...", // קישור למאגר החקיקה הלאומי באתר הכנסת
  "wikisource_url": "https://he.wikisource.org/..." // קישור לנוסח המלא והעדכני בוויקיטקסט
}
```

---

### ⚖️ מתי להשתמש באחזור ישיר מול כלי ניתוח וייעוץ?

| סוג הצורך של המשתמש | הכלי המומלץ לשימוש | האם מעורב עיבוד AI? |
|---|---|:---:|
| **"חפש לי את חוק רישוי שירותי התעופה ותן קישורים"** | `search_regulations` | ❌ לא (אחזור ישיר 100%) |
| **"תן לי את כל התקנות של משרד הבריאות בנושא מזון"** | `search_regulations` (עם מסננים) | ❌ לא (אחזור ישיר 100%) |
| **"שלוף רשומה מס' 6212 במאגר"** | `get_regulation_by_id` | ❌ לא (אחזור ישיר 100%) |
| **"אילו הקלות קיימות ביבוא מוצרי צריכה?"** | `get_regulatory_reliefs` | ❌ לא (אחזור ישיר 100%) |
| **"אילו משרדים מפקחים על הכי הרבה תקנות בישראל?"** | `list_ministries_and_categories` | ❌ לא (אחזור ישיר 100%) |
| **"אני פותח מסעדה, אילו רישיונות אני צריך ומול מי?"** | `check_business_compliance` | 💡 מיפוי ענפי מובנה |
| **"איך להכין דוח השפעת רגולציה (RIA) לתקנה חדשה?"** | `analyze_regulatory_impact` | 💡 מתודולוגיה רגולטורית |

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
