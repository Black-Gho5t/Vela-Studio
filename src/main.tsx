import App from "@/app/App";
import { ThemeProvider } from "@/shared/providers/theme";
import React from "react";
import ReactDOM from "react-dom/client";
import { TooltipProvider } from "./components/ui/tooltip";
import { ErrorBoundary } from "./components/error-boundary";
import "@fontsource-variable/geist";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
