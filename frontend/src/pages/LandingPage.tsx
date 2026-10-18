import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <nav className="max-w-7xl mx-auto w-full px-6 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            NoteForge <span className="text-brand-600 dark:text-brand-400">AI</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={onSignIn}
            className="text-xs font-semibold px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 transition-all cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-12 pb-20 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>Continuous AI Study Workspace</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-6">
          Transform Raw Lessons Into{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 via-indigo-500 to-purple-600">
            Structured Living Documents
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
          Copy educational content from freeCodeCamp, documentation, and articles. NoteForge AI structures it into syntax-highlighted notes—and lets you append new lessons day after day without losing previously organized content.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl text-sm font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/30 transition-all cursor-pointer"
          >
            <span>Start Free Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onSignIn}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Open Existing Notes
          </button>
        </div>
      </section>

      {/* 4-Step Continuous Workflow */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-slate-800">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            The Continuous Document Workflow
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Never regenerate and overwrite your notes. Learn progressively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm mb-4">
              01
            </div>
            <h3 className="font-bold text-base mb-2">Paste Raw Material</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Paste unformatted text, code snippets, or tutorials from any educational resource.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm mb-4">
              02
            </div>
            <h3 className="font-bold text-base mb-2">Intelligent Structuring</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              AI classifies concepts, highlights syntax in 10+ languages, and injects visual callouts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm mb-4">
              03
            </div>
            <h3 className="font-bold text-base mb-2">Continuous Merging</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Add new lessons on subsequent days. Duplicate detection preserves existing content.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm mb-4">
              04
            </div>
            <h3 className="font-bold text-base mb-2">Export Word & PDF</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Download cleanly formatted Microsoft Word (.docx) and high-resolution PDF study guides.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-500">
        <p>NoteForge AI &bull; Personal AI-Powered Documentation Workspace</p>
      </footer>
    </div>
  );
};
