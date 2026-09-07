"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 px-6">
            <p className="text-sm text-text-tertiary">Something went wrong in this tab.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="text-sm text-accent hover:text-accent"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
