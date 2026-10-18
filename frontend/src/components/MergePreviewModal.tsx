import React, { useState } from 'react';
import { MergePreviewData, DocumentSection } from '../types/document';
import { AlertTriangle, Check, X, Sparkles, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { Callout } from './Callout';

interface MergePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: MergePreviewData | null;
  onCommitMerge: (
    versionTitle: string,
    changeSummary: string,
    finalSections: DocumentSection[]
  ) => Promise<void>;
}

export const MergePreviewModal: React.FC<MergePreviewModalProps> = ({
  isOpen,
  onClose,
  previewData,
  onCommitMerge,
}) => {
  if (!isOpen || !previewData) return null;

  const [versionTitle, setVersionTitle] = useState(previewData.suggested_version_title);
  const [changeSummary, setChangeSummary] = useState(previewData.summary_of_changes);
  const [showArtefacts, setShowArtefacts] = useState(false);
  
  // Track user actions per proposed section key: 'append' | 'replace' | 'discard'
  const [decisions, setDecisions] = useState<{ [key: string]: 'append' | 'replace' | 'discard' }>(() => {
    const initial: { [key: string]: 'append' | 'replace' | 'discard' } = {};
    previewData.proposed_sections.forEach(p => {
      initial[p.stable_key] = 'append';
    });
    return initial;
  });

  const [submitting, setSubmitting] = useState(false);

  const handleDecisionChange = (stableKey: string, action: 'append' | 'replace' | 'discard') => {
    setDecisions(prev => ({ ...prev, [stableKey]: action }));
  };

  const handleCommit = async () => {
    setSubmitting(true);
    try {
      // Build final section list preserving existing sections
      const finalSections: DocumentSection[] = [...previewData.existing_sections];

      previewData.proposed_sections.forEach(proposed => {
        const action = decisions[proposed.stable_key] || 'append';
        if (action === 'discard') return;

        if (action === 'replace' && proposed.duplicate_of_key) {
          // Replace matching existing section
          const replaceIdx = finalSections.findIndex(s => s.stable_key === proposed.duplicate_of_key);
          if (replaceIdx !== -1) {
            finalSections[replaceIdx] = {
              ...proposed,
              order_index: finalSections[replaceIdx].order_index,
            };
            return;
          }
        }

        // Default 'append': Add without destroying existing sections
        finalSections.push({
          ...proposed,
          order_index: finalSections.length,
        });
      });

      // Normalize order indices
      const reindexed = finalSections.map((sec, idx) => ({
        ...sec,
        order_index: idx,
      }));

      await onCommitMerge(versionTitle, changeSummary, reindexed);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Continuous Merge & Duplicate Resolution
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review proposed additions before appending to your persistent document
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metadata Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Version Title
              </label>
              <input
                type="text"
                value={versionTitle}
                onChange={e => setVersionTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Change Summary
              </label>
              <input
                type="text"
                value={changeSummary}
                onChange={e => setChangeSummary(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Overview Stat Banner */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-full font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
              {previewData.existing_sections.length} Existing Sections Preserved
            </span>
            <span className="px-3 py-1 rounded-full font-medium bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800/40">
              {previewData.proposed_sections.length} Proposed Additions
            </span>
            {previewData.potential_duplicates_count > 0 && (
              <span className="px-3 py-1 rounded-full font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>{previewData.potential_duplicates_count} Potential Duplicate Warning(s)</span>
              </span>
            )}
          </div>
          {previewData.detected_artefacts && previewData.detected_artefacts.length > 0 && (
            <div className="border border-emerald-200 dark:border-emerald-900/40 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowArtefacts(!showArtefacts)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/30 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Document Intelligence Filtered {previewData.detected_artefacts.length} UI Artefact(s)</span>
                </div>
                {showArtefacts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showArtefacts && (
                <div className="px-4 pb-3 pt-1 space-y-2 border-t border-emerald-200/50 dark:border-emerald-900/30 text-xs">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    The following interactive UI elements and line number gutters were detected and stripped to keep your technical study notes clean:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {previewData.detected_artefacts.map((art, aIdx) => (
                      <div key={aIdx} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-[11px]">
                        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 uppercase">
                          <span>{art.type.replace('_', ' ')}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{Math.round(art.confidence * 100)}% conf</span>
                        </div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                          "{art.matched_text}"
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">
                          {art.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Proposed Sections List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Proposed Lesson Additions
            </h3>

            {previewData.proposed_sections.map((proposed, idx) => {
              const currentAction = decisions[proposed.stable_key] || 'append';
              const matchedExisting = previewData.existing_sections.find(
                s => s.stable_key === proposed.duplicate_of_key
              );

              return (
                <div
                  key={proposed.stable_key || idx}
                  className={`border rounded-xl p-4 transition-all ${
                    proposed.duplicate_status === 'duplicate'
                      ? 'border-amber-300 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          #{idx + 1}
                        </span>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                          {proposed.title}
                        </h4>
                        {proposed.duplicate_status === 'duplicate' && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span>Likely Duplicate ({Math.round((proposed.similarity_score || 0) * 100)}%)</span>
                          </span>
                        )}
                        {proposed.duplicate_status === 'partial_update' && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            Topical Match ({Math.round((proposed.similarity_score || 0) * 100)}%)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Placement: {proposed.placement_suggestion || 'Append to document'}
                      </p>
                      {proposed.explanation && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 italic">
                          {proposed.explanation}
                        </p>
                      )}
                    </div>

                    {/* Action Selector */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => handleDecisionChange(proposed.stable_key, 'append')}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                          currentAction === 'append'
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        Append as New
                      </button>
                      {matchedExisting && (
                        <button
                          onClick={() => handleDecisionChange(proposed.stable_key, 'replace')}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                            currentAction === 'replace'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          Replace Existing
                        </button>
                      )}
                      <button
                        onClick={() => handleDecisionChange(proposed.stable_key, 'discard')}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                          currentAction === 'discard'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        Skip
                      </button>
                    </div>
                  </div>

                  {/* Section Content Preview */}
                  <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                    <p className="line-clamp-3 whitespace-pre-wrap">{proposed.content_markdown}</p>
                    
                    {proposed.structured_blocks && proposed.structured_blocks.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        {proposed.structured_blocks.map((block, bIdx) => {
                          if (block.type === 'code' && block.data.code) {
                            return (
                              <CodeBlock
                                key={bIdx}
                                language={block.data.language}
                                code={block.data.code}
                                expectedOutput={block.data.expected_output}
                              />
                            );
                          }
                          if (block.type === 'callout' && block.data.body) {
                            return (
                              <Callout
                                key={bIdx}
                                type={block.data.callout_type}
                                title={block.data.title}
                                body={block.data.body}
                              />
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={submitting}
            onClick={handleCommit}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {submitting ? (
              <span>Saving New Version...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm & Commit Merge</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
