/**
 * ErrorBoundary — Global error catching
 * 
 * Council recommendation (Sentinel): Add error boundary coverage to 100%.
 * Wraps portal components to catch and display errors gracefully.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  portalName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.portalName ? ` - ${this.props.portalName}` : ''}]`, error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in-up">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-red-400/20" />
            <div className="w-16 h-16 rounded-full bg-red-400/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-white/90">
            {this.props.portalName ? `${this.props.portalName} Error` : 'Something went wrong'}
          </h3>
          
          <p className="text-sm text-white/50 max-w-md text-center">
            {this.state.error?.message || 'An unexpected error occurred. Try refreshing the page.'}
          </p>
          
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/70 hover:text-white transition-all active:scale-[0.97]"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
