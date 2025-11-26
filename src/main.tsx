import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from "@/components/theme-provider";

// Initialize the auth store and wait for it to hydrate
const initializeApp = async () => {
  // The store will handle its own hydration and token validation
  // This is now handled in the store's onRehydrateStorage callback
  return true;
};

// Initialize app and render when ready
initializeApp().then(() => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <ThemeProvider attribute="class" defaultTheme="system" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    );
  }
});
