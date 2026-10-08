import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_CLASS_NAMES: Theme[] = ["light", "dark", "system"];

function isTheme(value: string | null): value is Theme {
  return value === "dark" || value === "light" || value === "system";
}

function getPreferredTheme(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(storageKey: string, defaultTheme: Theme): Theme {
  if (typeof window === "undefined") {
    return defaultTheme;
  }

  const storedTheme = window.localStorage.getItem(storageKey);

  return isTheme(storedTheme) ? storedTheme : defaultTheme;
}

function applyTheme(theme: Theme) {
  const resolvedTheme = theme === "system" ? getPreferredTheme() : theme;
  const root = window.document.documentElement;

  root.classList.remove(
    ...THEME_CLASS_NAMES.filter((value) => value !== "system"),
  );
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    getStoredTheme(storageKey, defaultTheme),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateTheme = () => applyTheme(theme);

    updateTheme();

    if (theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", updateTheme);

    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [theme]);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, nextTheme);
      }

      setThemeState(nextTheme);
    },
    [storageKey],
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }

  return context;
}
