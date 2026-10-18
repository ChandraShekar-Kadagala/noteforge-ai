import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-markup'; // HTML & XML
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  code: string;
  expectedOutput?: string | null;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  language = 'javascript',
  code,
  expectedOutput,
}) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || 'plaintext').toLowerCase();

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 shadow-md">
      {/* Code Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
            {cleanLang}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Syntax Highlighted Pre/Code */}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed m-0 bg-slate-950">
        <code ref={codeRef} className={`language-${cleanLang}`}>
          {code}
        </code>
      </pre>

      {/* Expected Output */}
      {expectedOutput && (
        <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Expected Output
          </div>
          <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">
            {expectedOutput}
          </pre>
        </div>
      )}
    </div>
  );
};
