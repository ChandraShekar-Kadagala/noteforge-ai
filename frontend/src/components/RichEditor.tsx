import React, { useState, useRef } from 'react';
import { DocumentSection, StructuredBlock } from '../types/document';
import { CodeBlock } from './CodeBlock';
import { Callout } from './Callout';
import { ComparisonTable } from './ComparisonTable';
import { MarkdownViewer } from './MarkdownViewer';
import { EditorToolbar } from './EditorToolbar';
import { uploadImage } from '../services/documents';
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
  ChevronUp,
  ChevronDown,
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

interface SectionRowProps {
  section: DocumentSection;
  idx: number;
  isEditing: boolean;
  onToggleEdit: () => void;
  onTitleChange: (newTitle: string) => void;
  onContentChange: (newContent: string) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const SectionRow: React.FC<SectionRowProps> = ({
  section,
  idx,
  isEditing,
  onToggleEdit,
  onTitleChange,
  onContentChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const res = await uploadImage(file);
        const alt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const imgMd = `\n\n![${alt}](${res.url})\n\n`;
        onContentChange(section.content_markdown + imgMd);
      } catch (err: any) {
        alert(`Failed to upload dropped image: ${err.message || 'Error'}`);
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imgItem = items.find(item => item.type.startsWith('image/'));
    if (imgItem) {
      const file = imgItem.getAsFile();
      if (file) {
        e.preventDefault();
        try {
          const res = await uploadImage(file);
          const imgMd = `\n\n![Pasted Image](${res.url})\n\n`;
          onContentChange(section.content_markdown + imgMd);
        } catch (err: any) {
          alert(`Failed to upload pasted image: ${err.message || 'Error'}`);
        }
      }
    }
  };

  return (
    <section
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
              onChange={e => onTitleChange(e.target.value)}
              className="px-2 py-1 text-base font-bold rounded bg-slate-50 dark:bg-slate-800 border border-brand-500 focus:outline-none"
            />
          ) : (
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {section.title}
            </h2>
          )}
        </div>

        {/* Section Action Controls */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Move section up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Move section down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onToggleEdit}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isEditing ? 'View formatted preview' : 'Edit markdown and insert elements'}
          >
            {isEditing ? (
              <span className="flex items-center space-x-1 text-xs font-semibold text-emerald-600">
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Preview</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-xs font-semibold">
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Delete section"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section Content */}
      {isEditing ? (
        <div className="space-y-2">
          <EditorToolbar
            textareaRef={textareaRef}
            content={section.content_markdown}
            onChange={onContentChange}
          />
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={section.content_markdown}
              onChange={e => onContentChange(e.target.value)}
              onPaste={handlePaste}
              onDragOver={e => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              rows={9}
              placeholder="Write section markdown here... Paste or drag images directly into this area."
              className={`w-full p-3.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                dragActive
                  ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {dragActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-brand-500/10 backdrop-blur-xs rounded-xl pointer-events-none text-xs font-bold text-brand-600">
                Drop image to upload into section
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Supports GFM Markdown, Tables, Images, and HTML tags</span>
            <span>Paste or drag-and-drop images directly</span>
          </div>
        </div>
      ) : (
        <MarkdownViewer markdown={section.content_markdown} />
      )}

      {/* Structured Blocks (Code, Callouts, Tables, Images) */}
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
            if (block.type === 'image' && block.data.url) {
              return (
                <div key={bIdx} className="my-3 text-center">
                  <img
                    src={block.data.url}
                    alt={block.data.caption || 'Illustration'}
                    className="max-w-full md:max-w-lg mx-auto rounded-xl shadow-md border border-slate-200 dark:border-slate-800"
                  />
                  {block.data.caption && (
                    <p className="mt-1 text-xs text-slate-500 italic">{block.data.caption}</p>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </section>
  );
};

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
      if (editingSectionIdx === idx) {
        setEditingSectionIdx(null);
      }
    }
  };

  const handleMoveSection = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= sections.length) return;
    const updated = [...sections];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    onUpdateSections(updated.map((s, i) => ({ ...s, order_index: i })));
    if (editingSectionIdx === fromIdx) {
      setEditingSectionIdx(toIdx);
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
          sections.map((section, idx) => (
            <SectionRow
              key={section.stable_key || idx}
              section={section}
              idx={idx}
              isEditing={editingSectionIdx === idx}
              onToggleEdit={() => setEditingSectionIdx(editingSectionIdx === idx ? null : idx)}
              onTitleChange={newTitle => handleSectionTitleChange(idx, newTitle)}
              onContentChange={newContent => handleSectionContentChange(idx, newContent)}
              onDelete={() => handleDeleteSection(idx)}
              onMoveUp={idx > 0 ? () => handleMoveSection(idx, idx - 1) : undefined}
              onMoveDown={idx < sections.length - 1 ? () => handleMoveSection(idx, idx + 1) : undefined}
            />
          ))
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
