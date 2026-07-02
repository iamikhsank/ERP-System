// src/components/ErrorConsole.tsx
import React, { useState } from 'react';
import { Terminal, X, ChevronDown, ChevronUp, Copy, AlertCircle, Info, ShieldAlert } from 'lucide-react';

export interface ErrorLog {
  id: string;
  timestamp: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  technicalDetails?: string;
}

interface ErrorConsoleProps {
  logs: ErrorLog[];
  onClear: () => void;
  userRole?: string;
}

export default function ErrorConsole({ logs, onClear, userRole = 'viewer' }: ErrorConsoleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const errorCount = logs.filter(l => l.severity === 'error').length;
  const isAdmin = userRole === 'admin';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) {
    if (logs.length === 0) return null;
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-full shadow-xl hover:bg-gray-800 transition-all border border-gray-700 animate-bounce"
      >
        <Terminal className="w-4 h-4 text-red-400" />
        <span className="text-xs font-semibold">Console ({logs.length})</span>
        {errorCount > 0 && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-96 bg-gray-900 border-t border-gray-800 text-gray-200 z-50 flex flex-col shadow-2xl font-mono text-xs">
      {/* Header */}
      <div className="bg-gray-950 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-sm">ERP System System Console Logs</span>
          <span className="px-2 py-0.5 bg-gray-800 rounded-full text-[10px] text-gray-400">
            {logs.length} Log entries
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onClear}
            className="text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors"
          >
            Clear logs
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No logs captured.</div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const isError = log.severity === 'error';
            const isWarning = log.severity === 'warning';

            return (
              <div
                key={log.id}
                className={`p-3 rounded border transition-colors ${
                  isError
                    ? 'bg-red-950/20 border-red-900/40 text-red-200'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-900/40 text-amber-200'
                    : 'bg-blue-950/10 border-blue-900/30 text-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    {isError ? (
                      <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <span className="text-gray-500 mr-2 text-[10px]">{log.timestamp}</span>
                      <span className="font-semibold">{log.message}</span>
                    </div>
                  </div>
                  
                  {log.technicalDetails && (
                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800/50 flex-shrink-0"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {isExpanded && log.technicalDetails && (
                  <div className="mt-2.5 pt-2.5 border-t border-gray-800/60 text-[11px] text-gray-400 space-y-2 leading-relaxed">
                    {isAdmin ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-gray-500">Technical Details / Stack Trace:</span>
                          <button
                            onClick={() => copyToClipboard(log.technicalDetails || '', log.id)}
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 bg-gray-800/50 px-2 py-0.5 rounded border border-gray-700/50"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedId === log.id ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="bg-gray-950 p-2.5 rounded overflow-x-auto border border-gray-800 max-h-40 font-mono text-xs select-text">
                          {log.technicalDetails}
                        </pre>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-gray-500 italic">
                        <Info className="w-3.5 h-3.5" />
                        <span>Detail teknis tersembunyi. Silakan hubungi Administrator untuk penyelidikan lebih lanjut.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
