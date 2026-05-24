'use client';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string; // どのコンポーネントかを示すラベル
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', this.props.label ?? '', error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-red-700 font-semibold text-sm">
                {this.props.label ? `「${this.props.label}」の` : ''}表示中にエラーが発生しました
              </p>
              <p className="text-red-500 text-xs mt-1 break-words">
                {this.state.error?.message || '不明なエラー'}
              </p>
              {this.state.showDetails && this.state.error?.stack && (
                <pre className="text-xs text-red-400 mt-2 overflow-auto max-h-32 bg-red-50 p-2 rounded">
                  {this.state.error.stack}
                </pre>
              )}
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => this.setState({ hasError: false, error: null, showDetails: false })}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg font-medium transition"
                >
                  🔄 再試行
                </button>
                <button
                  onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                  className="text-xs text-red-400 hover:text-red-600 underline transition"
                >
                  {this.state.showDetails ? '詳細を隠す' : '詳細を見る'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
