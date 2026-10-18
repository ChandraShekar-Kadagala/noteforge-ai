import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DocumentSummary } from '../types/document';
import * as docService from '../services/documents';
import {
  Plus,
  Search,
  Clock,
  Copy,
  Trash2,
  Edit2,
  BookOpen,
  Loader2,
} from 'lucide-react';

interface DashboardPageProps {
  onSelectDocument: (docId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectDocument }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Document Dialog State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Web Development');
  const [creating, setCreating] = useState(false);

  // Rename Dialog State
  const [renameDocId, setRenameDocId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  const fetchDocs = async (query?: string) => {
    try {
      setLoading(true);
      const data = await docService.getDocuments(query);
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocs(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const created = await docService.createDocument({
        title: newTitle.trim(),
        subject: newSubject.trim() || 'General',
      });
      setShowCreateModal(false);
      setNewTitle('');
      onSelectDocument(created.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (doc: DocumentSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const dup = await docService.duplicateDocument(doc.id);
      setDocuments(prev => [dup, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate document');
    }
  };

  const handleDelete = async (doc: DocumentSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${doc.title}"? This cannot be undone.`
      )
    ) {
      try {
        await docService.deleteDocument(doc.id);
        setDocuments(prev => prev.filter(d => d.id !== doc.id));
      } catch (err: any) {
        alert(err.message || 'Failed to delete document');
      }
    }
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameDocId || !renameTitle.trim()) return;
    try {
      const updated = await docService.updateDocument(renameDocId, {
        title: renameTitle.trim(),
      });
      setDocuments(prev =>
        prev.map(d => (d.id === renameDocId ? { ...d, title: updated.title } : d))
      );
      setRenameDocId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to rename document');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user?.full_name || user?.email.split('@')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access your personal knowledge base, append new lessons, and export your notes.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Document</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes by title or subject..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          {documents.length} {documents.length === 1 ? 'document' : 'documents'}
        </span>
      </div>

      {/* Documents Grid / Empty State */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-xs font-medium">Loading workspace...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 bg-white/40 dark:bg-slate-900/40">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
            {search ? 'No matching documents found' : 'Your workspace is empty'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            {search
              ? `No notes match "${search}". Try clearing your search.`
              : 'Create your first study document such as "HTML Fundamentals" and start organizing raw educational material.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map(doc => (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc.id)}
              className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-brand-500/60 dark:hover:border-brand-500/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {doc.subject || 'General'}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800/40">
                    v{doc.current_version}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1 mb-1">
                  {doc.title}
                </h3>

                {doc.summary && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {doc.summary}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                </span>

                {/* Card Actions */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setRenameDocId(doc.id);
                      setRenameTitle(doc.title);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Rename document"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={e => handleDuplicate(doc, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Duplicate document"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={e => handleDelete(doc, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Document Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Create New Document
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter a subject title to initialize your continuous study notes.
            </p>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. HTML Fundamentals, Python Concurrency..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Category
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="e.g. Web Development, Algorithms, DevOps..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="px-4 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Document Modal */}
      {renameDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Rename Document
            </h3>
            <form onSubmit={handleSaveRename} className="space-y-4 mt-3">
              <input
                type="text"
                required
                autoFocus
                value={renameTitle}
                onChange={e => setRenameTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRenameDocId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!renameTitle.trim()}
                  className="px-4 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  Save Title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
