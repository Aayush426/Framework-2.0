
// Ignore ResizeObserver loop errors
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('ResizeObserver loop')) {
    event.stopImmediatePropagation();
    console.warn('ResizeObserver loop error suppressed.');
  }
});




// Suppress ResizeObserver loop limit exceeded error
const originalConsoleError = console.error;
console.error = function (...args) {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('ResizeObserver loop limit exceeded')
  ) {
    return; // Ignore this error
  }
  originalConsoleError.apply(console, args);
};
// In your index.js or App.js (before rendering)
const resizeObserverErrHandler = () => {};
window.addEventListener('error', (event) => {
  if (
    event.message &&
    event.message.includes('ResizeObserver loop completed')
  ) {
    event.stopImmediatePropagation();
  }
});

import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
