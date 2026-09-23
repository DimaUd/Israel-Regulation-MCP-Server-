import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const htmlContent = useMemo(() => {
    try {
      // Configure marked for clean, GitHub-flavored markdown with tables & breaks
      return marked.parse(content, {
        gfm: true,
        breaks: true,
      }) as string;
    } catch (e) {
      return `<pre>${content}</pre>`;
    }
  }, [content]);

  return (
    <div
      dir="rtl"
      className="prose prose-sm max-w-none text-[#0c3058] leading-relaxed
        [&_h1]:text-xl [&_h1]:font-extrabold [&_h1]:text-[#0c3058] [&_h1]:border-b [&_h1]:border-[#c2d4ec] [&_h1]:pb-2 [&_h1]:mb-3
        [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#0c3058] [&_h2]:mt-4 [&_h2]:mb-2
        [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-[#0068f5] [&_h3]:mt-3 [&_h3]:mb-1.5
        [&_h4]:text-sm [&_h4]:font-bold [&_h4]:text-[#0c3058] [&_h4]:mt-2 [&_h4]:mb-1
        [&_p]:mb-2.5 [&_p]:text-xs [&_p]:leading-relaxed
        [&_ul]:list-disc [&_ul]:pr-5 [&_ul]:mb-3 [&_ul]:space-y-1 [&_ul]:text-xs
        [&_ol]:list-decimal [&_ol]:pr-5 [&_ol]:mb-3 [&_ol]:space-y-1 [&_ol]:text-xs
        [&_blockquote]:border-r-4 [&_blockquote]:border-[#0068f5] [&_blockquote]:bg-[#ebf3ff] [&_blockquote]:p-3 [&_blockquote]:rounded-l-[6px] [&_blockquote]:text-xs [&_blockquote]:text-[#0c3058] [&_blockquote]:my-3
        [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:text-xs
        [&_th]:bg-[#f1f5fb] [&_th]:border [&_th]:border-[#c2d4ec] [&_th]:p-2.5 [&_th]:text-right [&_th]:font-bold [&_th]:text-[#0c3058]
        [&_td]:border [&_td]:border-[#c2d4ec] [&_td]:p-2 [&_td]:text-right [&_td]:text-[#0c3058]
        [&_tr:nth-child(even)]:bg-[#fafcff]
        [&_tr:hover]:bg-[#ebf3ff]/50
        [&_a]:text-[#0068f5] [&_a]:underline [&_a]:font-semibold hover:[&_a]:text-[#0057cc]
        [&_code]:font-mono [&_code]:bg-[#ebf3ff] [&_code]:text-[#0068f5] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-[4px] [&_code]:text-[11px]
        [&_pre]:bg-slate-900 [&_pre]:text-emerald-400 [&_pre]:p-3 [&_pre]:rounded-[6px] [&_pre]:overflow-x-auto [&_pre]:text-xs [&_pre]:my-2
        [&_hr]:border-[#c2d4ec] [&_hr]:my-4"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
