import React from 'react';
import { AlertCircle, AlertTriangle, Lightbulb, Info } from 'lucide-react';

interface CalloutProps {
  type?: 'important' | 'warning' | 'tip' | 'info';
  title?: string;
  body: string;
}

export const Callout: React.FC<CalloutProps> = ({
  type = 'important',
  title,
  body,
}) => {
  const styles = {
    warning: {
      container: 'bg-rose-50 border-rose-500/50 text-rose-950 dark:bg-rose-950/20 dark:border-rose-500/30 dark:text-rose-200',
      icon: <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />,
      defaultTitle: 'Common Pitfall & Warning',
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    },
    important: {
      container: 'bg-blue-50 border-blue-500/50 text-blue-950 dark:bg-blue-950/20 dark:border-blue-500/30 dark:text-blue-200',
      icon: <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />,
      defaultTitle: 'Core Concept',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    },
    tip: {
      container: 'bg-emerald-50 border-emerald-500/50 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-500/30 dark:text-emerald-200',
      icon: <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
      defaultTitle: 'Best Practice & Tip',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    },
    info: {
      container: 'bg-slate-50 border-slate-400/50 text-slate-950 dark:bg-slate-900/40 dark:border-slate-700 dark:text-slate-200',
      icon: <Info className="w-5 h-5 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />,
      defaultTitle: 'Definition & Context',
      badge: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
  }[type];

  return (
    <div
      className={`my-4 p-4 rounded-xl border-l-4 border transition-all ${styles.container}`}
    >
      <div className="flex items-start space-x-3">
        {styles.icon}
        <div className="space-y-1">
          <div className="font-semibold text-sm tracking-tight flex items-center space-x-2">
            <span>{title || styles.defaultTitle}</span>
          </div>
          <div className="text-sm leading-relaxed opacity-90">{body}</div>
        </div>
      </div>
    </div>
  );
};
