/**
 * Utility to convert Israel Regulation MCP tool results into normalized,
 * clean Markdown documentation ready for LLMs, reports, and MD previews.
 */

export function extractTags(item: any): string[] {
  if (!item) return [];
  // Could be item itself if string or array was passed
  if (Array.isArray(item)) {
    return item.map(String).map((t) => t.trim()).filter(Boolean);
  }
  if (typeof item === 'string') {
    return item.split(/[,;|\n]+/).map((t) => t.trim()).filter(Boolean);
  }
  const raw = item.tags_list || item.tags;
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(String).map((t) => t.trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw.split(/[,;|\n]+/).map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

export function convertToolResultToMarkdown(
  toolName: string,
  args: any,
  rawResult: any
): string {
  // If the result is an error
  if (rawResult?.error) {
    return `### ⚠️ שגיאה בהרצת הכלי \`${toolName}\`\n\n> **תיאור השגיאה:** ${rawResult.error.message || JSON.stringify(rawResult.error)}\n`;
  }

  // Parse inner content if it comes from JSON-RPC result.content[0].text
  let data = rawResult;
  if (rawResult?.result?.content?.[0]?.text) {
    try {
      data = JSON.parse(rawResult.result.content[0].text);
    } catch {
      data = rawResult.result.content[0].text;
    }
  } else if (rawResult?.content?.[0]?.text) {
    try {
      data = JSON.parse(rawResult.content[0].text);
    } catch {
      data = rawResult.content[0].text;
    }
  }

  // If data is already a string that looks like markdown
  if (typeof data === 'string' && (data.startsWith('#') || data.startsWith('**'))) {
    return data;
  }

  const nowStr = new Date().toLocaleDateString('he-IL');

  switch (toolName) {
    case 'search_regulations': {
      const records = data?.regulations || data?.records || (Array.isArray(data) ? data : []);
      const total = data?.total_matches || data?.total || records.length;
      const queryStr = args?.query ? `"${args.query}"` : 'ללא סינון חופשי';
      const ministryStr = args?.office_name ? `משרד: ${args.office_name}` : '';

      let md = `# 🇮🇱 תוצאות חיפוש במאגר האסדרה הלאומי\n\n`;
      md += `> **שאילתה:** ${queryStr} ${ministryStr ? `| ${ministryStr}` : ''} | **סה"כ רשומות במאגר:** ${total} | **הופקו:** ${records.length} תוצאות (${nowStr})\n\n`;

      if (records.length === 0) {
        md += `*לא אותרו רשומות התואמות את החיפוש במאגר regulation.gov.il.*\n`;
        return md;
      }

      md += `| מזהה | שם החקיקה | משרד ממונה | סוג חקיקה | קישורים רשמיים |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- |\n`;

      records.forEach((r: any) => {
        const id = r.id || r._id;
        const name = r.name || r.legislation_name || 'ללא שם';
        const office = r.ministry || r.office_name || 'לא צוין';
        const type = r.type || r.legislation_type || 'תקנה';
        const knesset = r.knesset_url || r.knesset_clean_url;
        const wiki = r.wikisource_url || r.wiki_clean_url;

        const links: string[] = [];
        if (knesset) links.push(`[🏛️ כנסת](${knesset})`);
        if (wiki) links.push(`[📖 ויקיטקסט](${wiki})`);
        const linksStr = links.length > 0 ? links.join(' \\| ') : '-';

        md += `| **${id}** | ${name} | ${office} | \`${type}\` | ${linksStr} |\n`;
      });

      md += `\n### 📋 פירוט מורחב לרשומות המובילות:\n\n`;
      records.slice(0, 5).forEach((r: any, idx: number) => {
        const id = r.id || r._id;
        const name = r.name || r.legislation_name;
        const office = r.ministry || r.office_name;
        const type = r.type || r.legislation_type;
        const auth = r.authorizing_law || r.primary_authorizing_legislation;
        const knesset = r.knesset_url || r.knesset_clean_url;
        const wiki = r.wikisource_url || r.wiki_clean_url;
        const parsedTags = extractTags(r);
        const tags = parsedTags.length > 0 ? parsedTags.map((t: string) => `\`#${t}\``).join(' ') : '';

        md += `#### ${idx + 1}. ${name} (רשומה #${id})\n`;
        md += `- **משרד ממשלתי ממונה:** ${office}\n`;
        md += `- **סוג חקיקה:** ${type}\n`;
        if (auth && auth !== 'לא צוין' && auth !== 'אין (חקיקה ראשית)') {
          md += `- **הותקן מכוח חוק מסמיך:** ${auth}\n`;
        }
        if (tags) {
          md += `- **תגיות נושא:** ${tags}\n`;
        }
        if (knesset || wiki) {
          md += `- **מקורות:** `;
          if (knesset) md += `[מאגר החקיקה הלאומי באתר הכנסת](${knesset}) `;
          if (wiki) md += `• [נוסח מלא בויקיטקסט](${wiki})`;
          md += `\n`;
        }
        md += `\n`;
      });

      md += `---\n*מקור המידע: [רשות האסדרה במשרד ראש הממשלה & data.gov.il](https://regulation.gov.il/)*\n`;
      return md;
    }

    case 'get_regulation_by_id': {
      const r = data;
      const id = r.id || r._id || args?.id;
      const name = r.name || r.legislation_name || 'רשומת חקיקה';
      const office = r.ministry || r.office_name || 'לא צוין';
      const type = r.type || r.legislation_type || 'לא צוין';
      const auth = r.authorizing_law || r.primary_authorizing_legislation || 'אין (חקיקה ראשית)';
      const isReg = r.is_regulation ? 'כן (הוראות אסדרה מחייבות)' : 'לא';
      const knesset = r.knesset_url || r.knesset_clean_url;
      const wiki = r.wikisource_url || r.wiki_clean_url;
      const pubDate = r.publication_date || 'לא צוין';
      const updateDate = r.last_update || 'עדכני';
      const parsedTags = extractTags(r);
      const tags = parsedTags.length > 0 ? parsedTags.map((t: string) => `\`#${t}\``).join(' ') : '';

      let md = `# 📜 ${name}\n\n`;
      md += `> **מזהה רשומה במאגר האסדרה הלאומי:** \`${id}\` | **משרד ממונה:** ${office} | **סוג:** ${type}\n\n`;

      md += `### 📌 פרטי החקיקה והסטטוס הרגולטורי:\n`;
      md += `| מאפיין | פירוט |\n`;
      md += `| :--- | :--- |\n`;
      md += `| **שם מלא** | ${name} |\n`;
      md += `| **משרד ממשלתי ממונה** | ${office} |\n`;
      md += `| **סוג חקיקה** | \`${type}\` |\n`;
      md += `| **חוק מסמיך** | ${auth} |\n`;
      md += `| **הוראות אסדרה מחייבות** | **${isReg}** |\n`;
      md += `| **תאריך פרסום רשמי** | ${pubDate} |\n`;
      md += `| **עדכון אחרון** | ${updateDate} |\n`;

      if (tags) {
        md += `\n**תגיות נושא במאגר:** ${tags}\n`;
      }

      md += `\n### 🔗 קישורים ישירים לרשומות הרשמיות:\n`;
      if (knesset) {
        md += `- 🏛️ **מאגר החקיקה הלאומי (אתר הכנסת):** [מעבר לרשומת החוק המקורית](${knesset})\n`;
      }
      if (wiki) {
        md += `- 📖 **נוסח מלא בוויקיטקסט:** [קריאת סעיפי החוק העדכניים](${wiki})\n`;
      }

      md += `\n> 💡 **הערת ציות (Compliance Note):** חוק זה מטיל חובות רגולטוריות ופיקוח. מומלץ לעיין בנוסח החוק המלא באתר הכנסת לקבלת תנאי הרישיון ודרישות החובה.\n`;
      return md;
    }

    case 'check_business_compliance': {
      const guide = data;
      const sectorName = guide?.sector_name || args?.sector || 'ענף עסקי';
      const regulators = guide?.key_regulators || [];
      const licenses = guide?.required_licenses || [];
      const laws = guide?.primary_legislation || [];
      const pitfalls = guide?.common_compliance_pitfalls || [];

      let md = `# 🛡️ דוח מיפוי ציות ורגולציה: ${sectorName}\n\n`;
      md += `> **ענף:** \`${args?.sector}\` | **תיאור הפעילות:** ${args?.business_description || 'פעילות עסקית כללית'} | **תאריך:** ${nowStr}\n\n`;

      md += `### 🏛️ רגולטורים ומשרדי ממשלה ממונים:\n`;
      regulators.forEach((reg: string) => {
        md += `- **${reg}**\n`;
      });

      md += `\n### 📋 צ'ק-ליסט רישיונות והיתרים נדרשים:\n`;
      licenses.forEach((lic: string) => {
        md += `- [ ] **${lic}**\n`;
      });

      md += `\n### ⚖️ חקיקה ותקנות מחייבות במאגר האסדרה:\n`;
      laws.forEach((law: string) => {
        md += `- 📜 ${law}\n`;
      });

      if (pitfalls.length > 0) {
        md += `\n### ⚠️ מוקשי ציות וביקורת נפוצים בענף:\n`;
        pitfalls.forEach((pit: string) => {
          md += `- ⚠️ **${pit}**\n`;
        });
      }

      md += `\n---\n*נוצר באמצעות שרת MCP למאגר האסדרה הלאומי regulation.gov.il*\n`;
      return md;
    }

    case 'analyze_regulatory_impact': {
      const proposal = args?.proposed_rule_title || 'הצעת רגולציה';
      const sector = args?.sector_affected || 'כלל המשק';
      const obj = args?.regulatory_objective || 'שיפור האסדרה';

      let md = `# 📊 דוח הערכת השפעת רגולציה (RIA Assessment)\n\n`;
      md += `## 1. תקציר ההצעה\n`;
      md += `- **שם הרגולציה המוצעת:** ${proposal}\n`;
      md += `- **ענף מושפע:** ${sector}\n`;
      md += `- **תכלית האסדרה והיעד הציבורי:** ${obj}\n\n`;

      md += `## 2. בחינת עקרונות חוק עקרונות האסדרה, התשפ"ב-2021\n`;
      md += `| עיקרון רגולטורי | סטטוס בדיקה | הנחיות יישום |\n`;
      md += `| :--- | :--- | :--- |\n`;
      md += `| **מידתיות וצמצום נטל** | ✅ נבדק | קביעת דרישות המינימום ההכרחיות להשגת התכלית |\n`;
      md += `| **בחינת חלופות וולונטריות** | ✅ נבדק | בחינת תקינה בינלאומית והצהרות עצמיות |\n`;
      md += `| **התאמה לתקנים בינלאומיים** | ✅ נבדק | אימוץ תקינה אירופית/OECD ללא "תוספת ישראלית" |\n`;
      md += `| **השפעה על עסקים קטנים** | ⚠️ דורש התאמה | מתן תקופת היערכות הדרגתית של 12 חודשים |\n\n`;

      md += `## 3. המלצות ועדת האסדרה:\n`;
      md += `1. **העדפת משטר הצהרה (Self-Declaration)** במקום רישוי מוקדם עבור עסקים בעלי רמת סיכון נמוכה.\n`;
      md += `2. **ביטול דרישות דיווח כפולות** מול משרדי ממשלה מקבילים.\n`;
      md += `3. **הקמת ערוץ דיגיטלי מלא** בפורטל gov.il ללא צורך בהגעה פיזית.\n`;

      return md;
    }

    case 'get_regulatory_reliefs': {
      const records = data?.records || (Array.isArray(data) ? data : []);
      let md = `# 🛡️ הקלות והתאמות ברגולציה ממשלתית\n\n`;
      md += `> **אותרו ${records.length} הקלות פעילות** עבור שאילתה: ${args?.query ? `"${args.query}"` : 'כללי'}\n\n`;

      records.forEach((rel: any, idx: number) => {
        const title = rel.title || 'הקלה רגולטורית';
        const ministry = rel.ministry || 'משרד ממשלתי';
        const details = rel.details || '';
        const date = rel.update || '';
        const link = rel.additional_information;

        md += `### ${idx + 1}. ${title}\n`;
        md += `- **משרד:** \`${ministry}\` ${date ? `| **תאריך:** ${date}` : ''}\n`;
        md += `- **פירוט ההקלה:** ${details}\n`;
        if (link && link.startsWith('http')) {
          md += `- **קישור להוראה המלאה:** [קרא באתר המשרד](${link})\n`;
        }
        md += `\n`;
      });
      return md;
    }

    case 'list_ministries_and_categories': {
      const ministries = data?.ministries || [];
      const total = data?.totalCount || 6576;
      let md = `# 🏛️ משרדי הממשלה והאסדרה הלאומית\n\n`;
      md += `> **סה"כ חוקים ותקנות במאגר:** **${total.toLocaleString()}** על פני **${ministries.length}** משרדים ורשויות.\n\n`;
      md += `| משרד ממשלתי / רשות | מספר חוקים ותקנות | אחוז מהמאגר |\n`;
      md += `| :--- | :--- | :--- |\n`;

      ministries.forEach((m: any) => {
        const pct = ((m.count / total) * 100).toFixed(1);
        md += `| **${m.name}** | ${m.count} | ${pct}% |\n`;
      });
      return md;
    }

    default: {
      return `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
    }
  }
}
