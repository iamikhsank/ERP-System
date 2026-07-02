import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Terminal, ArrowLeft, Clipboard } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = window.location.pathname; // Soft reset
  };

  private handleCopyError = () => {
    if (!this.state.error) return;
    const errorText = `Error: ${this.state.error.message}\n\nStack:\n${this.state.error.stack || ''}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 3000);
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-rose-500 selection:text-white">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>
          
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-fade-in">
            {/* Header Alert */}
            <div className="bg-gradient-to-r from-rose-950/40 via-slate-950 to-slate-950 border-b border-slate-800 p-6 flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400 animate-pulse">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Sistem Mengalami Gangguan</h1>
                <p className="text-xs text-slate-400 mt-1">Aplikasi mendeteksi adanya kegagalan eksekusi JavaScript secara tidak terduga.</p>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold tracking-wide uppercase">
                  <Terminal className="h-4 w-4" />
                  Pesan Kesalahan:
                </div>
                <p className="text-sm font-mono text-rose-300 bg-slate-950/70 p-3 rounded-lg border border-rose-900/20 overflow-x-auto break-words max-h-24">
                  {this.state.error?.toString() || 'Kesalahan Rendering Tidak Diketahui'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  id="error-reload-btn"
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition duration-150 cursor-pointer shadow-lg shadow-indigo-600/10 hover:scale-[1.01]"
                >
                  <RefreshCw className="h-4 w-4 animate-spin-slow" />
                  Muat Ulang Dashboard
                </button>
                <button
                  id="error-reset-btn"
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 font-semibold rounded-xl border border-slate-700 transition duration-150 cursor-pointer hover:scale-[1.01]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Beranda
                </button>
              </div>

              {/* Collapsible details for tech user */}
              <div className="border-t border-slate-800/60 pt-5">
                <details className="group">
                  <summary className="flex items-center justify-between text-xs text-slate-400 cursor-pointer hover:text-slate-300 select-none font-medium">
                    <span>LIHAT DIAGNOSTIK & DETAIL TEKNIS</span>
                    <span className="transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <div className="mt-4 space-y-3 animate-slide-down">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Salin informasi error ini untuk tim pengembang:</span>
                      <button
                        id="error-copy-btn"
                        onClick={this.handleCopyError}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                      >
                        <Clipboard className="h-3 w-3" />
                        {this.state.copied ? 'Berhasil Disalin!' : 'Salin Detail'}
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono leading-relaxed bg-slate-950 text-slate-400 p-4 rounded-xl border border-slate-850 overflow-auto max-h-56">
                      {`Timestamp: ${new Date().toISOString()}\n`}
                      {`URL: ${window.location.href}\n\n`}
                      {`Error:\n${this.state.error?.stack || this.state.error?.message || ''}\n\n`}
                      {`Component Stack:\n${this.state.errorInfo?.componentStack || 'Tidak tersedia'}`}
                    </pre>
                  </div>
                </details>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-950/50 border-t border-slate-800/40 px-6 py-4 flex justify-between items-center text-slate-500 text-[10px] font-mono">
              <span>PLATFORM INTEGRASI SPREADSHEET</span>
              <span>GAS-VITE ENVIRONMENT</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
