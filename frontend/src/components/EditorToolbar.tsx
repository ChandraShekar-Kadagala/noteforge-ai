import React, { useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Table,
  Image as ImageIcon,
  AlertCircle,
  Heading1,
  Heading2,
  Heading3,
  Loader2,
} from 'lucide-react';
import { uploadImage } from '../services/documents';

interface EditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string;
  onChange: (newContent: string) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  textareaRef,
  content,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const insertText = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(content + before + defaultText + after);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;
    const replacement = before + selectedText + after;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    onChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 10);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadImage(file);
      const altText = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const imageMarkdown = `\n\n![${altText}](${res.url})\n\n`;
      insertText(imageMarkdown);
    } catch (err: any) {
      alert(`Image upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const insertTable = () => {
    const tableTemplate = `\n\n| Feature | Description | Status |\n| --- | --- | --- |\n| Item 1 | Details here | Ready |\n| Item 2 | Details here | Pending |\n\n`;
    insertText(tableTemplate);
  };

  const insertCallout = (type: 'note' | 'tip' | 'warning') => {
    const titles = {
      note: 'Note',
      tip: 'Tip',
      warning: 'Warning',
    };
    const template = `\n\n> [!${type.toUpperCase()}]\n> **${titles[type]}:** Enter your message here.\n\n`;
    insertText(template);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-1.5 mb-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
      {/* Headings */}
      <button
        type="button"
        onClick={() => insertText('\n# ', '', 'Heading 1')}
        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
        title="Heading 1 (# )"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => insertText('\n## ', '', 'Heading 2')}
        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
        title="Heading 2 (## )"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => insertText('\n### ', '', 'Heading 3')}
        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
        title="Heading 3 (### )"
      >
        <Heading3 className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

      {/* Inline styles */}
      <button
        type="button"
        onClick={() => insertText('**', '**', 'bold text')}
        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
        title="Bold (**text**)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => insertText('*', '*', 'italic text')}
        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
        title="Italic (*text*)"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => insertText('~~', '~~', 'strikethrough')}
        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
        title="Strikethrough (~~text~~)"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => insertText('`', '`', 'inline_code')}
        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
        title="Inline Code (`code`)"
      >
        <Code className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

      {/* Lists */}
      <button
        type="button"
        onClick={() => insertText('\n- ', '', 'List item')}
        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
        title="Bullet list (- )"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => insertText('\n1. ', '', 'Numbered item')}
        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
        title="Numbered list (1. )"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => insertText('\n- [ ] ', '', 'Task item')}
        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
        title="Checklist (- [ ] )"
      >
        <CheckSquare className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

      {/* Block elements */}
      <button
        type="button"
        onClick={() => insertText('\n> ', '', 'Quote text')}
        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
        title="Blockquote (> )"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={insertTable}
        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
        title="Insert Markdown Table"
      >
        <Table className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => insertText('\n```javascript\n', '\n```\n', '// code here')}
        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 transition-colors font-mono text-xs font-bold"
        title="Code Block (```)"
      >
        &lt;/&gt;
      </button>
      <button
        type="button"
        onClick={() => insertCallout('note')}
        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-brand-600 transition-colors"
        title="Insert Callout Note"
      >
        <AlertCircle className="w-4 h-4" />
      </button>

      <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

      {/* Image Upload */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-colors"
        title="Upload Image (PNG, JPEG, WebP, GIF)"
      >
        {uploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
        ) : (
          <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
        )}
        <span>{uploading ? 'Uploading...' : 'Image'}</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};
