import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0e1a",
          color: "#e2e8f0",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "24px",
        }}>
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#fff" }}>
              Page failed to load
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 8, color: "#94a3b8" }}>
              Browser protection (Brave Shields, MetaMask, Phantom, or other extensions) may be
              interfering with this page.
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 24, color: "#64748b" }}>
              Try disabling Shields / extensions for this site, or use a different browser.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#2775CA",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px 32px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
