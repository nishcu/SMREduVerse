'use client';

import React from 'react';

type ErrorBoundaryProps = {
  fallback?: React.ReactNode;
  onReset?: () => void;
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Optionally log to a service
    // console.error('Games ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex h-full items-center justify-center p-6 text-center">
          <div className="space-y-3">
            <p className="text-lg font-semibold">Something went wrong while loading the game.</p>
            <p className="text-muted-foreground text-sm">Try closing and reopening, or pick a different game.</p>
            <button onClick={this.handleReset} className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:opacity-90">
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


