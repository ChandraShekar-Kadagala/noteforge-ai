import React, { useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Table as TableIcon,
  Image as ImageIcon,
  Link2,
  Undo,
  Redo,
  Terminal,
  Minus,
  Loader2,
  Globe,
} from 'lucide-react';
import { uploadImage } from '../services/documents';

interface TipTapToolbarProps {
  editor: Editor | null;
}

export const TipTapToolbar: React.FC<TipTapToolbarProps> = ({ editor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);

  if (!editor) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadImage(file);
      const altText = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      editor.chain().focus().setImage({ src: res.url, alt: altText, title: altText }).run();
    } catch (err: any) {
      alert(`Image upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInsertImageUrl = () => {
    const url = window.prompt('Enter public image URL (https://...):');
    if (url) {
      editor.chain().focus().setImage({ src: url, alt: 'Document Image' }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter link URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-0.5 px-3 py-1.5 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 select-none shadow-xs">
      {/* History */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 dark:text-slate-300"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 dark:text-slate-300"
        title="Redo (Ctrl+Y)"
      >
        <Redo className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

      {/* Paragraph / Heading Style Selector */}
      <select
        value={
          editor.isActive('heading', { level: 1 })
            ? 'h1'
            : editor.isActive('heading', { level: 2 })
            ? 'h2'
            : editor.isActive('heading', { level: 3 })
            ? 'h3'
            : 'p'
        }
        onChange={e => {
          const val = e.target.value;
          if (val === 'p') editor.chain().focus().setParagraph().run();
          else if (val === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
          else if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
          else if (val === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
        }}
        className="text-xs font-semibold px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 focus:outline-none"
      >
        <option value="p">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

      {/* Formatting Marks */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('bold')
            ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('italic')
            ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('underline')
            ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('strike')
            ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('code')
            ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

      {/* Alignment */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive({ textAlign: 'left' })
            ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive({ textAlign: 'center' })
            ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive({ textAlign: 'right' })
            ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

      {/* Lists */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('bulletList')
            ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Bulleted List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('orderedList')
            ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('taskList')
            ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Task Checklist"
      >
        <CheckSquare className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

      {/* Block Elements */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('blockquote')
            ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Quote / Callout"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('codeBlock')
            ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Code Block"
      >
        <Terminal className="w-4 h-4" />
      </button>

      {/* Table Dropdown Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowTableMenu(!showTableMenu)}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('table')
              ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
              : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
          title="Table Operations"
        >
          <TableIcon className="w-4 h-4" />
        </button>
        {showTableMenu && (
          <div className="absolute top-full left-0 mt-1 py-1 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 text-xs text-slate-700 dark:text-slate-200">
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                setShowTableMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Insert 3x3 Table
            </button>
            {editor.isActive('table') && (
              <>
                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().addRowAfter().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Add Row Below
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().addColumnAfter().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Add Column Right
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().deleteRow().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600"
                >
                  Delete Row
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().deleteColumn().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600"
                >
                  Delete Column
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().deleteTable().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600 font-bold"
                >
                  Delete Table
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

      {/* Image Insertion */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center space-x-1 px-2 py-1 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
        title="Upload Image (PNG, JPEG, WebP, GIF)"
      >
        {uploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
        ) : (
          <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
        )}
        <span>{uploading ? 'Uploading...' : 'Image'}</span>
      </button>

      <button
        type="button"
        onClick={handleInsertImageUrl}
        className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
        title="Insert Image from URL"
      >
        <Globe className="w-3.5 h-3.5" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        onChange={handleFileUpload}
        className="hidden"
      />

      <button
        type="button"
        onClick={setLink}
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('link')
            ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Add Link"
      >
        <Link2 className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
        title="Divider Line"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
};
