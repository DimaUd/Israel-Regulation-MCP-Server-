import React, { useState } from 'react';

interface GovAiLogoProps {
  variant?: 'header' | 'hero' | 'badge';
  className?: string;
  onClick?: () => void;
}

export const GovAiLogo: React.FC<GovAiLogoProps> = ({
  variant = 'header',
  className = '',
  onClick,
}) => {
  const [imgSrc, setImgSrc] = useState<string>('/logo-full.png');
  const [hasError, setHasError] = useState<boolean>(false);

  const handleImageError = () => {
    if (imgSrc === '/logo-full.png') {
      // Try SVG fallback
      setImgSrc('/logo-full.svg');
    } else {
      setHasError(true);
    }
  };

  if (variant === 'badge') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-gradient-to-r from-[#061325] to-[#0d2e5c] border border-[#00d2ff]/40 text-white shadow-xs select-none ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse"></span>
        <span className="text-[11px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#7dd3fc] to-[#38bdf8]">
          GovAI • דאטה ובינה מלאכותית
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[#0068f5]/40 text-[#7dd3fc] border border-[#00d2ff]/30 font-medium">
          מערך הדיגיטל הלאומי
        </span>
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div
        onClick={onClick}
        className={`relative flex items-center group cursor-pointer transition-transform hover:scale-[1.01] ${className}`}
        title="בשיתוף פעולה עם צוות דאטה ובינה מלאכותית - מערך הדיגיטל הלאומי"
      >
        {!hasError ? (
          <img
            src={imgSrc}
            alt="GovAI - בשיתוף פעולה עם צוות דאטה ובינה מלאכותית מערך הדיגיטל הלאומי"
            onError={handleImageError}
            referrerPolicy="no-referrer"
            className="h-10 sm:h-12 w-auto max-w-[260px] sm:max-w-[340px] object-contain rounded-[6px] shadow-[0_2px_8px_rgba(0,104,245,0.25)] border border-[#00d2ff]/40 bg-[#061325]"
          />
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#061325] border border-[#00d2ff]/40 text-white">
            <div className="w-7 h-7 rounded-[4px] bg-gradient-to-tr from-[#0068f5] to-[#00f0ff] flex items-center justify-center font-bold text-[10px] text-white">
              GovAI
            </div>
            <div className="text-right leading-tight">
              <span className="text-[10px] text-[#7dd3fc] block font-medium">בשיתוף פעולה עם צוות</span>
              <span className="text-xs font-bold text-white block">דאטה ובינה מלאכותית</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Hero variant (full width presentation banner)
  return (
    <div
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-[12px] bg-gradient-to-r from-[#061325] via-[#0a2244] to-[#0d2e5c] border-2 border-[#00d2ff]/50 shadow-[0_4px_20px_rgba(0,104,245,0.25)] group ${className}`}
    >
      {!hasError ? (
        <img
          src={imgSrc}
          alt="GovAI - בשיתוף פעולה עם צוות דאטה ובינה מלאכותית מערך הדיגיטל הלאומי"
          onError={handleImageError}
          referrerPolicy="no-referrer"
          className="w-full h-auto max-h-[220px] sm:max-h-[260px] object-contain mx-auto"
        />
      ) : (
        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white text-right">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-[100px] bg-[#0068f5]/30 text-[#00f0ff] border border-[#00d2ff]/40 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse"></span>
              &gt;&gt; בשיתוף פעולה עם צוות &lt;&lt;
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-l from-white via-[#7dd3fc] to-[#38bdf8]">
              דאטה ובינה מלאכותית
            </h3>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[100px] bg-[#082142] border border-[#00d2ff]/40 text-xs text-white">
              <span>✡</span>
              <span>מערך הדיגיטל הלאומי</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
