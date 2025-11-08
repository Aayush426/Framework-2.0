import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ✅ Suppress ResizeObserver loop errors globally (Radix UI known issue)
export const suppressResizeObserverErrors = () => {
  const originalError = window.console.error;

  window.console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("ResizeObserver loop limit exceeded") ||
        args[0].includes("ResizeObserver loop completed") ||
        args[0].includes("ResizeObserver loop"))
    ) {
      // Ignore harmless ResizeObserver warnings from dropdowns/menus
      return;
    }
    originalError.apply(window.console, args);
  };

  window.addEventListener("error", (event) => {
    if (
      event.message &&
      (event.message.includes("ResizeObserver loop") ||
        event.message.includes("ResizeObserver loop limit exceeded") ||
        event.message.includes("ResizeObserver loop completed"))
    ) {
      event.stopImmediatePropagation();
    }
  });

  // Optional: log once for debugging
  if (!window.__resizeObserverPatched) {
    console.info("⚙️ Suppressed harmless ResizeObserver errors (Radix UI bug).");
    window.__resizeObserverPatched = true;
  }
};
