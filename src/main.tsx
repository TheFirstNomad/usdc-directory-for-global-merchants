import { Buffer } from "buffer";
(window as any).Buffer = (window as any).Buffer || Buffer;
(window as any).global = (window as any).global || window;

import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
