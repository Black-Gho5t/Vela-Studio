import App from "@/app/App";
import { ThemeProvider } from "@/shared/providers/theme";
import React from "react";
import ReactDOM from "react-dom/client";
import { TooltipProvider } from "./components/ui/tooltip";
import "@fontsource-variable/geist";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
