import React, { useState } from 'react';
import { DocumentVersion } from '../types/document';
import { History, X, RotateCcw, Clock } from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: DocumentVersion[];
  currentVersion: number;
  onRestoreVersion: (versionNumber: number) => Promise<void>;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  versions,
  currentVersion,
  onRestoreVersion,
}) => {
  if (!isOpen) return null;

  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

  const handleRestore = async (versionNumber: number) => {
    if (
      !window.confirm(
        `Are you sure you want to rollback to Version ${versionNumber}? A new version will be created recording this restoration.`
      )
    ) {
      return;
    }
    setRestoringVersion(versionNumber);
    try {
      await onRestoreVersion(versionNumber);
      onClose();
    } finally {
      setRestoringVersion(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Document Version History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Browse snapshots or roll back to earlier lessons safely
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

        {/* Versions List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {versions.length === 0 ? (
            <div className="text-xs text-slate-400 italic text-center py-8">
              No version history records found.
            </div>
          ) : (
            versions.map(v => {
              const isCurrent = v.version_number === currentVersion;
              return (
                <div
                  key={v.id || v.version_number}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-brand-500/60 bg-brand-50/20 dark:bg-brand-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isCurrent
                            ? 'bg-brand-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        v{v.version_number}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {v.title}
                      </h4>
                      {isCurrent && (
                        <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
                          (Current)
                        </span>
                      )}
                    </div>

                    {!isCurrent && (
                      <button
                        disabled={restoringVersion !== null}
                        onClick={() => handleRestore(v.version_number)}
                        className="flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-brand-50 dark:bg-slate-800 dark:hover:bg-brand-950/40 text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-colors disabled:opacity-50"
                        title="Rollback document to this version"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>
                          {restoringVersion === v.version_number
                            ? 'Restoring...'
                            : 'Restore'}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(v.created_at).toLocaleString()}</span>
                    </span>
                    {v.change_summary && (
                      <span>&bull; {v.change_summary}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/80">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
