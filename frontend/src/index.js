import { suppressResizeObserverErrors } from "@/lib/utils";

// Suppress ResizeObserver loop errors (Radix UI known issue)
suppressResizeObserverErrors();

// Extra guard (in case CRA/Vite error overlay runs after ours)
if (process.env.NODE_ENV === "development") {
  window.addEventListener("error", (event) => {
    if (
      event.message &&
      (event.message.includes("ResizeObserver loop") ||
        event.message.includes("ResizeObserver loop limit exceeded") ||
        event.message.includes("ResizeObserver loop completed"))
    ) {
      event.stopImmediatePropagation();
      console.warn("⚠️ ResizeObserver loop error suppressed.");
    }
  });

  const originalConsoleError = console.error;
  console.error = function (...args) {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("ResizeObserver loop limit exceeded") ||
        args[0].includes("ResizeObserver loop completed"))
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // ✅ Suppress React's development error overlay too
  const overlayHook = window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__;
  if (overlayHook && overlayHook.onError) {
    const originalOnError = overlayHook.onError;
    overlayHook.onError = (error) => {
      if (
        error?.message?.includes("ResizeObserver loop") ||
        error?.message?.includes("ResizeObserver loop limit exceeded") ||
        error?.message?.includes("ResizeObserver loop completed")
      ) {
        console.warn("⚙️ Suppressed harmless ResizeObserver overlay warning.");
        return;
      }
      originalOnError(error);
    };
  }
}

// -------------------- React App Bootstrapping --------------------
import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
