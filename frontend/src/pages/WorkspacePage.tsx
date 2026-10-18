import React, { useEffect, useState, useCallback } from 'react';
import { DocumentDetail, DocumentSection, MergePreviewData, DocumentVersion } from '../types/document';
import * as docService from '../services/documents';
import { DocumentOutline } from '../components/DocumentOutline';
import { RichEditor } from '../components/RichEditor';
import { AIOrganizerPanel } from '../components/AIOrganizerPanel';
import { MergePreviewModal } from '../components/MergePreviewModal';
import { VersionHistoryModal } from '../components/VersionHistoryModal';
import { Navbar } from '../components/Navbar';
import { Loader2 } from 'lucide-react';

interface WorkspacePageProps {
  documentId: string;
  onBackToDashboard: () => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  documentId,
  onBackToDashboard,
}) => {
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Mobile active tab: 'outline' | 'editor' | 'ai'
  const [activeTab, setActiveTab] = useState<'outline' | 'editor' | 'ai'>('editor');

  // Modals state
  const [previewData, setPreviewData] = useState<MergePreviewData | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);

  // Active section for outline navigation
  const [activeSectionKey, setActiveSectionKey] = useState<string | undefined>(undefined);

  // Load document details
  const loadDoc = useCallback(async () => {
    try {
      setLoading(true);
      const data = await docService.getDocument(documentId);
      setDoc(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadDoc();
  }, [loadDoc]);

  // Handle section reordering (Move Up / Down)
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (!doc) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= doc.sections.length) return;

    const updated = [...doc.sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    // Reindex order_index
    const reindexed = updated.map((s, i) => ({ ...s, order_index: i }));
    setDoc({ ...doc, sections: reindexed });
    setSaveStatus('unsaved');
  };

  // Section selection from outline
  const handleSelectSection = (key: string) => {
    setActiveSectionKey(key);
    const element = document.getElementById(`sec-${key}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveTab('editor');
  };

  // Triggered when user clicks "Organize / Merge Next Lesson" in right panel
  const handleOrganizeContent = async (rawContent: string, preserveSource: boolean) => {
    if (!doc) return;

    if (doc.sections.length === 0) {
      // First time organizing this document: directly set organized sections
      const organized = await docService.organizeContent({
        raw_content: rawContent,
        subject: doc.subject,
        preserve_source: preserveSource,
      });

      const updated = await docService.commitMerge(doc.id, {
        version_title: `Lesson 1: ${organized.title}`,
        change_summary: `Initial organization: ${organized.sections.length} sections`,
        sections: organized.sections,
      });
      setDoc(updated);
      setSaveStatus('saved');
    } else {
      // Continuous document editing: Generate merge preview with duplicate detection!
      const preview = await docService.previewMerge({
        document_id: doc.id,
        raw_content: rawContent,
        preserve_source: preserveSource,
      });

      setPreviewData(preview);
      setIsMergeModalOpen(true);
    }
  };

  // Commit merged sections from modal
  const handleCommitMerge = async (
    versionTitle: string,
    changeSummary: string,
    finalSections: DocumentSection[]
  ) => {
    if (!doc) return;
    const updated = await docService.commitMerge(doc.id, {
      version_title: versionTitle,
      change_summary: changeSummary,
      sections: finalSections,
    });
    setDoc(updated);
    setSaveStatus('saved');
  };

  // Manual save
  const handleManualSave = async () => {
    if (!doc) return;
    setSaveStatus('saving');
    try {
      const updated = await docService.commitMerge(doc.id, {
        version_title: `Manual Save v${doc.current_version + 1}`,
        change_summary: `Manual document update`,
        sections: doc.sections,
      });
      setDoc(updated);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('unsaved');
      alert('Failed to save document');
    }
  };

  // Open versions modal
  const handleOpenVersions = async () => {
    if (!doc) return;
    try {
      const history = await docService.getDocumentVersions(doc.id);
      setVersions(history);
      setIsVersionModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch version history');
    }
  };

  // Restore version
  const handleRestoreVersion = async (versionNumber: number) => {
    if (!doc) return;
    const restored = await docService.restoreDocumentVersion(doc.id, versionNumber);
    setDoc(restored);
    setSaveStatus('saved');
  };

  // Update title
  const handleUpdateTitle = async (newTitle: string) => {
    if (!doc) return;
    setDoc({ ...doc, title: newTitle });
    await docService.updateDocument(doc.id, { title: newTitle });
  };

  // Exports
  const handleExportDocx = async () => {
    if (!doc) return;
    try {
      await docService.downloadExportFile(
        doc.id,
        'docx',
        `${doc.title.replace(/\s+/g, '_')}_v${doc.current_version}.docx`
      );
    } catch (err: any) {
      alert(err.message || 'DOCX export failed');
    }
  };

  const handleExportPdf = async () => {
    if (!doc) return;
    try {
      await docService.downloadExportFile(
        doc.id,
        'pdf',
        `${doc.title.replace(/\s+/g, '_')}_v${doc.current_version}.pdf`
      );
    } catch (err: any) {
      alert(err.message || 'PDF export failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-brand-500" />
        <span className="text-sm font-semibold">Opening workspace...</span>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
          Unable to load document
        </h2>
        <p className="text-xs text-rose-600 dark:text-rose-400 mb-4">{error}</p>
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden">
      {/* Navigation Header */}
      <Navbar
        currentDocumentTitle={doc.title}
        saveStatus={saveStatus}
        onBackToDashboard={onBackToDashboard}
      />

      {/* Mobile Workspace Tabs Header */}
      <div className="md:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 space-x-2">
        <button
          onClick={() => setActiveTab('outline')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
            activeTab === 'outline'
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Outline ({doc.sections.length})
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
            activeTab === 'editor'
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Notes Editor
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
            activeTab === 'ai'
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Add Lesson
        </button>
      </div>

      {/* Three-Panel Desktop Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Outline */}
        <div className={`md:block ${activeTab === 'outline' ? 'block w-full' : 'hidden'}`}>
          <DocumentOutline
            sections={doc.sections}
            activeSectionKey={activeSectionKey}
            onSelectSection={handleSelectSection}
            onMoveSection={handleMoveSection}
          />
        </div>

        {/* Center: Structured Rich Editor */}
        <div className={`flex-1 flex flex-col min-w-0 ${activeTab === 'editor' ? 'flex' : 'hidden md:flex'}`}>
          <RichEditor
            documentTitle={doc.title}
            documentSubject={doc.subject}
            documentSummary={doc.summary}
            documentVersion={doc.current_version}
            sections={doc.sections}
            onUpdateTitle={handleUpdateTitle}
            onUpdateSections={updatedSections => {
              setDoc({ ...doc, sections: updatedSections });
              setSaveStatus('unsaved');
            }}
            onManualSave={handleManualSave}
            onOpenVersions={handleOpenVersions}
            onExportDocx={handleExportDocx}
            onExportPdf={handleExportPdf}
          />
        </div>

        {/* Right Sidebar: AI Organizer Panel */}
        <div className={`md:block ${activeTab === 'ai' ? 'block w-full' : 'hidden'}`}>
          <AIOrganizerPanel
            onOrganize={handleOrganizeContent}
            isExistingDocument={doc.sections.length > 0}
            documentTitle={doc.title}
          />
        </div>
      </div>

      {/* Modals */}
      <MergePreviewModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        previewData={previewData}
        onCommitMerge={handleCommitMerge}
      />

      <VersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        versions={versions}
        currentVersion={doc.current_version}
        onRestoreVersion={handleRestoreVersion}
      />
    </div>
  );
};
