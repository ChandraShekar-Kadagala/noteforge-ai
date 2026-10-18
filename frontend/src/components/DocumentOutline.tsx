import React from 'react';
import { DocumentSection } from '../types/document';
import { Code, FileText, ListOrdered, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';

interface DocumentOutlineProps {
  sections: DocumentSection[];
  activeSectionKey?: string;
  onSelectSection: (stableKey: string) => void;
  onMoveSection?: (index: number, direction: 'up' | 'down') => void;
}

export const DocumentOutline: React.FC<DocumentOutlineProps> = ({
  sections,
  activeSectionKey,
  onSelectSection,
  onMoveSection,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'code_example':
        return <Code className="w-3.5 h-3.5 text-brand-500" />;
      case 'procedure':
        return <ListOrdered className="w-3.5 h-3.5 text-amber-500" />;
      case 'callout':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Document Outline
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
          {sections.length}
        </span>
      </div>

      {sections.length === 0 ? (
        <div className="text-xs text-slate-400 italic py-6 text-center">
          No sections organized yet. Paste notes in the right panel to begin.
        </div>
      ) : (
        <nav className="space-y-1">
          {sections.map((sec, idx) => {
            const isActive = activeSectionKey === sec.stable_key;
            return (
              <div
                key={sec.stable_key || idx}
                className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <button
                  onClick={() => onSelectSection(sec.stable_key)}
                  className="flex items-center space-x-2 text-left truncate flex-1 min-w-0 mr-1"
                >
                  <span className="shrink-0">{getIcon(sec.section_type)}</span>
                  <span className="truncate">
                    {idx + 1}. {sec.title}
                  </span>
                </button>

                {onMoveSection && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 shrink-0 transition-opacity">
                    <button
                      disabled={idx === 0}
                      onClick={() => onMoveSection(idx, 'up')}
                      className="p-0.5 hover:text-brand-600 disabled:opacity-20 rounded"
                      title="Move section up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === sections.length - 1}
                      onClick={() => onMoveSection(idx, 'down')}
                      className="p-0.5 hover:text-brand-600 disabled:opacity-20 rounded"
                      title="Move section down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      )}
    </aside>
  );
};
