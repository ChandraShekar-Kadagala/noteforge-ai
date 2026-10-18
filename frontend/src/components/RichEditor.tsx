import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image as ImageExtension } from '@tiptap/extension-image';
import { Table as TableExtension } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

import { DocumentSection } from '../types/document';
import { TipTapToolbar } from './TipTapToolbar';
import { sectionsToHtml, htmlToSections } from '../utils/documentSerializer';
import { uploadImage } from '../services/documents';
import {
  Download,
  FileDown,
  History,
  Maximize2,
  Minimize2,
  Edit2,
  Check,
  Tag,
  Save,
  CheckCircle2,
  Clock,
  Loader2,
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
  saveStatus?: 'saved' | 'saving' | 'unsaved';
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
  saveStatus = 'saved',
}) => {
  const [distractionFree, setDistractionFree] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(documentTitle);
  const [internalSaving, setInternalSaving] = useState(false);
  const [dragOverPaper, setDragOverPaper] = useState(false);

  // Debounced update timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingFromPropsRef = useRef(false);

  const initialHtml = sectionsToHtml(sections);

  const handleEditorUpdate = useCallback(
    (html: string) => {
      if (isUpdatingFromPropsRef.current) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setInternalSaving(true);
      debounceTimerRef.current = setTimeout(() => {
        const parsedSections = htmlToSections(html, documentTitle);
        onUpdateSections(parsedSections);
        setInternalSaving(false);
      }, 1200);
    },
    [documentTitle, onUpdateSections]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: true,
      }),
      TableExtension.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Type your educational notes, paste lesson excerpts, or drop images here...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[750px] leading-relaxed text-slate-800 dark:text-slate-100',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
          if (files.length > 0) {
            event.preventDefault();
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            const dropPos = coordinates ? coordinates.pos : view.state.selection.from;

            for (const file of files) {
              uploadImage(file).then(res => {
                const alt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                if (editor) {
                  editor
                    .chain()
                    .focus()
                    .insertContentAt(dropPos, {
                      type: 'image',
                      attrs: { src: res.url, alt, title: alt },
                    })
                    .run();
                }
              }).catch(err => alert(`Failed to upload dropped image: ${err.message}`));
            }
            return true;
          }
        }
        return false;
      },
      handlePaste: (_view, event) => {
        if (event.clipboardData && event.clipboardData.items) {
          const items = Array.from(event.clipboardData.items);
          const imgItem = items.find(item => item.type.startsWith('image/'));
          if (imgItem) {
            const file = imgItem.getAsFile();
            if (file) {
              event.preventDefault();
              uploadImage(file).then(res => {
                if (editor) {
                  editor.chain().focus().setImage({ src: res.url, alt: 'Pasted Image', title: 'Pasted Image' }).run();
                }
              }).catch(err => alert(`Failed to upload pasted image: ${err.message}`));
              return true;
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      handleEditorUpdate(ed.getHTML());
    },
  });

  // Sync external sections update (e.g. from AI organize / merge commit) into editor content
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const newHtml = sectionsToHtml(sections);

    // Only update if substantially different
    if (Math.abs(currentHtml.length - newHtml.length) > 10) {
      isUpdatingFromPropsRef.current = true;
      editor.commands.setContent(newHtml);
      setTimeout(() => {
        isUpdatingFromPropsRef.current = false;
      }, 50);
    }
  }, [sections, editor]);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    }
    setEditingTitle(false);
  };

  const effectiveSaveStatus = internalSaving ? 'saving' : saveStatus;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#f0f2f5] dark:bg-slate-950">
      {/* Top Document Header Bar */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-2xs">
        <div className="flex items-center space-x-3">
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
                type="button"
                onClick={handleTitleSubmit}
                className="p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-500"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 group cursor-pointer" onClick={() => setEditingTitle(true)}>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {documentTitle}
              </h1>
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity"
                title="Rename document"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            v{documentVersion}
          </span>

          {/* Autosave Status Pill */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 pl-2">
            {effectiveSaveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                <span className="hidden sm:inline">Saving to cloud...</span>
              </>
            ) : effectiveSaveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">All changes saved</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Unsaved edits</span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Manual Save */}
          <button
            type="button"
            onClick={onManualSave}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Save version snapshot now"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Version History */}
          <button
            type="button"
            onClick={onOpenVersions}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Browse version history"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Export Word */}
          <button
            type="button"
            onClick={onExportDocx}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 transition-colors"
            title="Download formatted Microsoft Word document (.docx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Word</span>
          </button>

          {/* Export PDF */}
          <button
            type="button"
            onClick={onExportPdf}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/40 transition-colors"
            title="Download high-resolution PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          {/* Focus Mode */}
          <button
            type="button"
            onClick={() => setDistractionFree(!distractionFree)}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={distractionFree ? 'Exit focus mode' : 'Enter focus reading mode'}
          >
            {distractionFree ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Google Docs Style Toolbar */}
      <TipTapToolbar editor={editor} />

      {/* Editing Canvas (Light grey workspace) */}
      <div
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 transition-all"
        onDragOver={e => {
          e.preventDefault();
          setDragOverPaper(true);
        }}
        onDragLeave={() => setDragOverPaper(false)}
        onDrop={() => setDragOverPaper(false)}
      >
        {/* Centered A4 White Paper Sheet */}
        <div
          className={`a4-sheet relative ${
            distractionFree ? 'max-w-[850px] shadow-2xl' : 'max-w-[816px]'
          } ${dragOverPaper ? 'ring-2 ring-brand-500 ring-offset-4' : ''}`}
        >
          {/* Document Header Metadata on Paper */}
          <div className="mb-6 space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <span className="flex items-center space-x-1 font-semibold text-brand-600 dark:text-brand-400">
                <Tag className="w-3.5 h-3.5" />
                <span>{documentSubject || 'General'}</span>
              </span>
              <span>&bull;</span>
              <span>Version {documentVersion}</span>
              <span>&bull;</span>
              <span>{sections.length} Sections</span>
            </div>

            {documentSummary && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border-l-4 border-brand-500 text-xs leading-relaxed text-slate-600 dark:text-slate-300 italic">
                {documentSummary}
              </div>
            )}
          </div>

          {/* Actual TipTap WYSIWYG Editable Content */}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
