// Polyfills MUST be the very first import — they patch globals that other deps
// (Coinbase Wallet SDK, etc.) read at module-evaluation time.
import "./polyfills";

import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
