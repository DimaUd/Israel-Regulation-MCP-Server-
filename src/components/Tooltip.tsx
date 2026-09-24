import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: React.ReactNode;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  title,
  position = 'top',
  children,
  className = '',
  delay = 200,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<any>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Position classes
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  // Arrow classes
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[#0c3058] border-r-transparent border-b-transparent border-l-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#0c3058] border-r-transparent border-t-transparent border-l-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[#0c3058] border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[#0c3058] border-t-transparent border-b-transparent border-l-transparent',
  }[position];

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          dir="rtl"
          className={`absolute ${positionClasses} z-50 pointer-events-none w-max max-w-xs sm:max-w-sm rounded-[6px] bg-[#0c3058] text-white p-2.5 text-xs shadow-xl border border-[#3b5998] animate-in fade-in zoom-in-95 duration-150 text-right`}
        >
          {title && <div className="font-bold text-amber-300 mb-1 flex items-center gap-1">{title}</div>}
          <div className="leading-relaxed text-slate-100 font-normal">{content}</div>
          <span className={`absolute border-4 ${arrowClasses}`} />
        </div>
      )}
    </div>
  );
};

interface InfoTooltipProps {
  title?: string;
  content: React.ReactNode;
  className?: string;
  iconClassName?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  content,
  className = '',
  iconClassName = 'w-3.5 h-3.5 text-[#5878a4] hover:text-[#0068f5]',
  position = 'top',
}) => {
  return (
    <Tooltip title={title} content={content} position={position} className={className}>
      <button
        type="button"
        className="inline-flex items-center justify-center p-0.5 rounded-full hover:bg-[#ebf3ff] transition-colors cursor-help"
        aria-label="מידע נוסף"
        tabIndex={0}
      >
        <Info className={iconClassName} />
      </button>
    </Tooltip>
  );
};
