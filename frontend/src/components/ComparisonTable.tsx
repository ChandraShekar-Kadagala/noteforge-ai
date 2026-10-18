import React from 'react';

interface ComparisonTableProps {
  headers?: string[];
  rows?: string[][];
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  headers = [],
  rows = [],
}) => {
  if (!headers.length && !rows.length) return null;

  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <table className="w-full text-left text-sm">
        {headers.length > 0 && (
          <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 text-xs uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {rows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                rIdx % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-900/40' : ''
              }`}
            >
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
