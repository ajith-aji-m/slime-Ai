"use client";

import { Component, type ReactNode } from "react";
import { EmptyState, Button } from "@/components/ui";

interface Props {
  children: ReactNode;
  /** shown in the fallback title — defaults to a generic message */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Last-resort crash guard for a section of the tree. A render error in one
 * message part, canvas artifact, or panel shouldn't blank the whole
 * workspace — this catches it, logs it, and offers a reset instead. Reset
 * just clears the caught error and re-renders children; if the underlying
 * data is what's broken (e.g. a malformed stored message) navigating away
 * is the real fix, which the fallback's own link is there for.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // dev-only noise; a production error-tracking hook would go here instead.
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center p-6">
          <EmptyState
            icon="construction"
            title={this.props.label ?? "Something went wrong"}
            description={this.state.error.message || "This section hit an unexpected error."}
            action={
              <Button
                variant="outline"
                onClick={() => this.setState({ error: null })}
              >
                Try again
              </Button>
            }
          />
        </div>
      );
    }
    return this.props.children;
  }
}
