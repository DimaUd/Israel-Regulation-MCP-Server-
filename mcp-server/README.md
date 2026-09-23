# Israel Regulation MCP Server (מאגר האסדרה הלאומי - regulation.gov.il)

שרת **Model Context Protocol (MCP)** רשמי עבור מאגר האסדרה, החקיקה וההקלות הרגולטוריות של מדינת ישראל (`https://regulation.gov.il/`), המאפשר לסוכני AI, Claude Desktop, Cursor, ו-Windsurf גישה ישירה, אמינה ומובנית לכל החוקים, התקנות, דרישות הציות, וההקלות העסקיות בישראל.

---

## 🚀 תכונות עיקריות

- **חיפוש מלא ב-6,500+ חוקים ותקנות**: חיפוש ישיר מול מאגר האסדרה הלאומי (רשות האסדרה במשרד ראש הממשלה / data.gov.il).
- **קישורים ישירים לרשומות הרשמיות**: הפניות ישירות למאגר החקיקה הלאומי של הכנסת ולנוסח המלא בוויקיטקסט.
- **הקלות והתאמות ברגולציה**: גישה למאגר הקלות החירום והפחתת הנטל הבירוקרטי.
- **בדיקת ציות ענפית (Business Compliance)**: מיפוי מיידי של חובות רישוי עסקים, משרדים ממונים, דרישות תברואה, פרטיות וסייבר לפי ענף.
- **הערכת השפעת רגולציה (RIA)**: מתודולוגיית רשות האסדרה לפי חוק עקרונות האסדרה, התשפ"ב-2021.
- **תמיכה בשני מצבי ריצה**:
  1. **Stdio** (פרוטוקול מקומי סטנדרטי עבור Claude Desktop, Windsurf ו-Cursor).
  2. **SSE (Server-Sent Events)** עבור חיבור מרוחק ברשת (Remote MCP Endpoint).

---

## 🛠️ כלים זמינים (MCP Tools)

| שם הכלי | תיאור | פרמטרים עיקריים |
|---|---|---|
| `search_regulations` | חיפוש חקיקה ותקנות במאגר האסדרה הלאומי | `query`, `office_name`, `legislation_type`, `tag`, `limit` |
| `get_regulation_by_id` | קבלת פרטים מלאים על חוק/תקנה לפי מזהה רשומה עם קישורים ישירים | `id` |
| `get_regulatory_reliefs` | שליפת הקלות, פטורים והתאמות ברגולציה שפורסמו על ידי משרדי הממשלה | `query`, `ministry`, `limit` |
| `list_ministries_and_categories` | קבלת רשימת כל משרדי הממשלה והרגולטורים עם מספר החוקים תחתם | ללא |
| `check_business_compliance` | מיפוי רגולטורי ורישיונות לפי ענף (מסעדות, פינטק, אנרגיה ירוקה, ייבוא, רחפנים וכו') | `sector`, `business_description` |
| `analyze_regulatory_impact` | ניתוח השפעת רגולציה (RIA) ובחינת חלופות ונטל בירוקרטי | `proposed_rule_title`, `sector_affected`, `regulatory_objective` |

---

## 📦 משאבים (MCP Resources)

- `regulation://national-registry/overview`: סקירה כללית על מאגר האסדרה, הבסיס החוקי וסטטיסטיקות.
- `regulation://ministries/directory`: מדריך משרדי הממשלה והרגולטורים.
- `regulation://reliefs/summary`: סיכום הקלות ופטורים רגולטוריים פעילים.

---

## 💡 תבניות הנחיה (MCP Prompts)

- `compliance_audit`: תבנית מוכנה להנחיית מודל שפה לביצוע סקר סיכונים ורגולציה לעסק חדש.
- `regulatory_impact_assessment`: תבנית להכנת קובץ הערכת השפעת רגולציה מקצועי.

---

## ⚙️ הגדרת Claude Desktop

הוסף את ההגדרה לקובץ `claude_desktop_config.json`:

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

או באמצעות חיבור SSE מרוחק:
```json
{
  "mcpServers": {
    "israel-regulation": {
      "url": "https://<your-applet-url>/api/mcp/sse"
    }
  }
}
```

---

## ⚡ הרצה מקומית

```bash
# הרצת שרת Stdio
npm run mcp:stdio

# או הרצת אפליקציית הווב המלאה עם שרת ה-SSE
npm run dev
```
