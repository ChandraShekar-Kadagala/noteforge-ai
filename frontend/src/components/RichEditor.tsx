import React, { useState } from 'react';
import { DocumentSection, StructuredBlock } from '../types/document';
import { CodeBlock } from './CodeBlock';
import { Callout } from './Callout';
import { ComparisonTable } from './ComparisonTable';
import {
  Download,
  FileDown,
  History,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  Edit2,
  Check,
  Tag,
  Save,
} from 'lucide-react';

interface RichEditorProps {
  documentTitle: string;
  documentSubject?: string;
  documentSummary?: string;
  documentVersion: number;
  sections: DocumentSection[];
  onUpdateTitle: (title: string) => void;
  onUpdateSections: (sections: DocumentSection[]) => void;
  onManualSave: () => void;
  onOpenVersions: () => void;
  onExportDocx: () => void;
  onExportPdf: () => void;
}

export const RichEditor: React.FC<RichEditorProps> = ({
  documentTitle,
  documentSubject,
  documentSummary,
  documentVersion,
  sections,
  onUpdateTitle,
  onUpdateSections,
  onManualSave,
  onOpenVersions,
  onExportDocx,
  onExportPdf,
}) => {
  const [distractionFree, setDistractionFree] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(documentTitle);
  const [editingSectionIdx, setEditingSectionIdx] = useState<number | null>(null);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    }
    setEditingTitle(false);
  };

  const handleSectionContentChange = (idx: number, newMarkdown: string) => {
    const updated = [...sections];
    updated[idx] = {
      ...updated[idx],
      content_markdown: newMarkdown,
    };
    onUpdateSections(updated);
  };

  const handleSectionTitleChange = (idx: number, newTitle: string) => {
    const updated = [...sections];
    updated[idx] = {
      ...updated[idx],
      title: newTitle,
    };
    onUpdateSections(updated);
  };

  const handleDeleteSection = (idx: number) => {
    if (window.confirm('Are you sure you want to remove this section?')) {
      const updated = sections.filter((_, i) => i !== idx);
      onUpdateSections(updated);
    }
  };

  const handleAddBlankSection = () => {
    const newSec: DocumentSection = {
      stable_key: `sec_${Date.now()}`,
      title: `New Section ${sections.length + 1}`,
      section_type: 'concept',
      order_index: sections.length,
      content_markdown: 'Enter detailed notes or explanations here...',
      structured_blocks: [],
      ai_enriched: false,
    };
    onUpdateSections([...sections, newSec]);
    setEditingSectionIdx(sections.length);
  };

  return (
    <main
      className={`flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto bg-white dark:bg-slate-900 transition-all ${
        distractionFree ? 'max-w-4xl mx-auto px-6 py-8' : 'px-8 py-6'
      }`}
    >
      {/* Document Workspace Action Bar */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          {editingTitle ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="px-3 py-1 rounded-lg text-lg font-bold bg-slate-50 dark:bg-slate-800 border border-brand-500 focus:outline-none"
              />
              <button
                onClick={handleTitleSubmit}
                className="p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-500"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 group">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {documentTitle}
              </h1>
              <button
                onClick={() => {
                  setTitleInput(documentTitle);
                  setEditingTitle(true);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity"
                title="Rename document"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            v{documentVersion}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Manual Save */}
          <button
            onClick={onManualSave}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Save current state"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Version History */}
          <button
            onClick={onOpenVersions}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Browse version history"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Export Word (.docx) */}
          <button
            onClick={onExportDocx}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 transition-colors"
            title="Download formatted Microsoft Word document (.docx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Word (.docx)</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={onExportPdf}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/40 transition-colors"
            title="Download high-resolution PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          {/* Distraction-Free Toggle */}
          <button
            onClick={() => setDistractionFree(!distractionFree)}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={distractionFree ? 'Exit focus mode' : 'Enter focus reading mode'}
          >
            {distractionFree ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Document Subtitle / Metadata */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center space-x-1">
            <Tag className="w-3.5 h-3.5 text-brand-500" />
            <span className="font-semibold">{documentSubject || 'General'}</span>
          </span>
          <span>&bull;</span>
          <span>{sections.length} Organized Sections</span>
          <span>&bull;</span>
          <span>Version {documentVersion}</span>
        </div>

        {documentSummary && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs leading-relaxed text-slate-600 dark:text-slate-300 italic">
            {documentSummary}
          </div>
        )}
      </div>

      {/* Render Document Sections */}
      <div className="space-y-8 flex-1">
        {sections.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              No sections created yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Paste raw educational notes into the right panel to automatically organize them into study sections, or add a manual section.
            </p>
            <button
              onClick={handleAddBlankSection}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-colors"
            >
              Add Section Manually
            </button>
          </div>
        ) : (
          sections.map((section, idx) => {
            const isEditing = editingSectionIdx === idx;

            return (
              <section
                key={section.stable_key || idx}
                id={`sec-${section.stable_key}`}
                className="group relative p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                      {idx + 1}
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={section.title}
                        onChange={e => handleSectionTitleChange(idx, e.target.value)}
                        className="px-2 py-1 text-base font-bold rounded bg-slate-50 dark:bg-slate-800 border border-brand-500 focus:outline-none"
                      />
                    ) : (
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {section.title}
                      </h2>
                    )}
                  </div>

                  {/* Section Controls */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingSectionIdx(isEditing ? null : idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={isEditing ? 'Done editing' : 'Edit markdown directly'}
                    >
                      {isEditing ? <Check className="w-4 h-4 text-emerald-500" /> : <Edit2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteSection(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Section Body */}
                {isEditing ? (
                  <textarea
                    value={section.content_markdown}
                    onChange={e => handleSectionContentChange(idx, e.target.value)}
                    rows={8}
                    className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                ) : (
                  <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {section.content_markdown}
                  </div>
                )}

                {/* Structured Blocks: Code, Callouts, Tables */}
                {section.structured_blocks && section.structured_blocks.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    {section.structured_blocks.map((block: StructuredBlock, bIdx: number) => {
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
                      if (block.type === 'table') {
                        return (
                          <ComparisonTable
                            key={bIdx}
                            headers={block.data.headers}
                            rows={block.data.rows}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </section>
            );
          })
        )}

        {/* Add Section Button */}
        {sections.length > 0 && (
          <div className="pt-2 text-center">
            <button
              onClick={handleAddBlankSection}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Section</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
};
