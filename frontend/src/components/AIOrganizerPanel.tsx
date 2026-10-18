import React, { useState } from 'react';
import { Sparkles, Shield, Loader2, ArrowRight } from 'lucide-react';

interface AIOrganizerPanelProps {
  onOrganize: (rawContent: string, preserveSource: boolean) => Promise<void>;
  isExistingDocument: boolean;
  documentTitle?: string;
}

export const AIOrganizerPanel: React.FC<AIOrganizerPanelProps> = ({
  onOrganize,
  isExistingDocument,
  documentTitle,
}) => {
  const [rawText, setRawText] = useState('');
  const [preserveSource, setPreserveSource] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() || rawText.trim().length < 10) {
      setError('Please paste at least 10 characters of educational content.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onOrganize(rawText, preserveSource);
      setRawText('');
    } catch (err: any) {
      setError(err.message || 'Failed to organize content.');
    } finally {
      setLoading(false);
    }
  };

  const sampleLessons = [
    {
      title: 'HTML Headings & Paragraphs',
      text: `# HTML Basics: Headings and Paragraphs\nHTML headings are defined with <h1> to <h6> tags.\n\n<h1>Heading 1</h1>\n<p>This is a paragraph of educational content.</p>\n\nNote: Use headings to show document structure, not just to make text big!`,
    },
    {
      title: 'Python Functions & Scope',
      text: `# Python Functions\nFunctions in Python are defined using the def keyword.\n\n\`\`\`python\ndef calculate_total(prices, tax_rate=0.08):\n    \"\"\"Calculate total price with tax.\"\"\"\n    subtotal = sum(prices)\n    return round(subtotal * (1 + tax_rate), 2)\n\nprint(calculate_total([19.99, 5.49, 12.00]))\n\`\`\`\n\nImportant: Variables defined inside a function exist only within its local scope!`,
    },
  ];

  return (
    <aside className="w-80 lg:w-96 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {isExistingDocument ? 'Add Next Lesson' : 'AI Content Organizer'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isExistingDocument
              ? `Append new lesson to "${documentTitle || 'Document'}"`
              : 'Transform raw pasted text into structured notes'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 space-y-4">
        {error && (
          <div className="p-2.5 rounded-xl text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Raw Educational Material
          </label>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder="Paste raw lessons, freeCodeCamp challenges, documentation, code snippets, or notes here..."
            className="flex-1 min-h-[180px] w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none font-mono"
          />
        </div>

        {/* Source Preservation Option */}
        <label className="flex items-start space-x-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
          <input
            type="checkbox"
            checked={preserveSource}
            onChange={e => setPreserveSource(e.target.checked)}
            className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
          />
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Preserve verbatim source</span>
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Keep original wording and code intact while structuring
            </p>
          </div>
        </label>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading || !rawText.trim()}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing & Structuring...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{isExistingDocument ? 'Merge Next Lesson' : 'Organize Content'}</span>
            </>
          )}
        </button>

        {/* Sample Quick Pastes */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Quick Test Examples
          </span>
          <div className="space-y-1.5">
            {sampleLessons.map((sample, sIdx) => (
              <button
                type="button"
                key={sIdx}
                onClick={() => setRawText(sample.text)}
                className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-brand-50/60 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between"
              >
                <span className="truncate">{sample.title}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </form>
    </aside>
  );
};
