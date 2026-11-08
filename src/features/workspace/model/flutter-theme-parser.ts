import { invoke } from "@tauri-apps/api/core";
import { useWorkspaceStore } from "./workspace.store";

export interface ColorVariableItem {
  id: string;
  name: string;
  value: string;
  description: string;
}

export interface FlutterThemeResult {
  variables: ColorVariableItem[];
  sourceFile: string | null;
}

export const FLUTTER_MATERIAL_COLORS: Record<string, string> = {
  deepPurple: "#6750a4",
  purple: "#9c27b0",
  blue: "#2196f3",
  lightBlue: "#03a9f4",
  cyan: "#00bcd4",
  teal: "#009688",
  green: "#4caf50",
  lightGreen: "#8bc34a",
  lime: "#cddc39",
  yellow: "#ffeb3b",
  amber: "#ffc107",
  orange: "#ff9800",
  deepOrange: "#ff5722",
  red: "#f44336",
  pink: "#e91e63",
  indigo: "#3f51b5",
  blueGrey: "#607d8b",
  grey: "#9e9e9e",
  brown: "#795548",
  black: "#000000",
  white: "#ffffff",
  transparent: "transparent",
};

export const DEFAULT_FLUTTER_THEME_VARIABLES: ColorVariableItem[] = [
  { id: "primary", name: "primary", value: "#6750a4", description: "Material 3 seedColor (deepPurple)" },
  { id: "primary-fg", name: "onPrimary", value: "#ffffff", description: "Texto sobre color primario" },
  { id: "secondary", name: "secondary", value: "#625b71", description: "Color secundario Material 3" },
  { id: "accent", name: "tertiary", value: "#7d5260", description: "Color terciario de acento" },
  { id: "background", name: "background", value: "#fef7ff", description: "Fondo de la aplicación" },
  { id: "surface", name: "surface", value: "#fef7ff", description: "Superficie de tarjetas y contenedores" },
  { id: "surface-fg", name: "onSurface", value: "#1d1b20", description: "Texto principal sobre superficie" },
  { id: "error", name: "error", value: "#b3261e", description: "Color de error y alertas" },
  { id: "outline", name: "outline", value: "#79747e", description: "Bordes y divisores Material" },
];

/**
 * Extracts a hex color (#rrggbb or #rrggbbaa) from a Flutter Color(...) expression.
 */
export function parseDartColorExpression(expr: string): string | null {
  if (!expr) return null;
  const trimmed = expr.trim();

  // Color(0xFF123456) or Color(0xff123456)
  const hexMatch = trimmed.match(/Color\(\s*0x([0-9a-fA-F]{6,8})\s*\)/i);
  if (hexMatch) {
    const raw = hexMatch[1];
    if (raw.length === 8) {
      const a = raw.slice(0, 2);
      const rgb = raw.slice(2);
      return a.toLowerCase() === "ff"
        ? `#${rgb.toLowerCase()}`
        : `#${rgb.toLowerCase()}${a.toLowerCase()}`;
    }
    return `#${raw.toLowerCase()}`;
  }

  // Color.fromRGBO(r, g, b, opacity)
  const rgbMatch = trimmed.match(
    /Color\.fromRGBO\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i
  );
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  // Colors.deepPurple or Colors.blue[500]
  const matMatch = trimmed.match(/Colors\.([a-zA-Z]+)/);
  if (matMatch) {
    const colorKey = matMatch[1];
    if (FLUTTER_MATERIAL_COLORS[colorKey]) {
      return FLUTTER_MATERIAL_COLORS[colorKey];
    }
  }

  return null;
}

/**
 * Extracts a balanced argument block enclosed in parentheses starting at or after startIndex.
 */
function extractCallArguments(source: string, startIndex: number): string | null {
  const openParen = source.indexOf("(", startIndex);
  if (openParen === -1) return null;
  let depth = 1;
  let i = openParen + 1;
  while (i < source.length && depth > 0) {
    if (source[i] === "(") depth++;
    else if (source[i] === ")") depth--;
    i++;
  }
  if (depth === 0) {
    return source.slice(openParen + 1, i - 1);
  }
  return null;
}

/**
 * Parses Flutter source code (Dart) using Rust Tree-sitter AST engine with local fallback.
 */
export async function parseColorsFromDartSource(source: string): Promise<ColorVariableItem[]> {
  if (!source || !source.trim()) return [];
  try {
    const vars = await invoke<ColorVariableItem[]>("parse_flutter_theme_variables", { sourceCode: source });
    if (vars && vars.length > 0) return vars;
  } catch (err) {
    console.warn("Rust AST theme parser error, using fallback:", err);
  }
  return fallbackParseColorsFromDartSource(source);
}

/**
 * Fallback regex-based parser when Rust AST engine is unavailable.
 */
function fallbackParseColorsFromDartSource(source: string): ColorVariableItem[] {
  if (!source) return [];
  const items: ColorVariableItem[] = [];
  const seenIds = new Set<string>();

  const addColorItem = (name: string, value: string, description: string) => {
    const cleanId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!seenIds.has(cleanId)) {
      seenIds.add(cleanId);
      items.push({
        id: cleanId,
        name,
        value,
        description,
      });
    }
  };

  // 1. Match const/static Color declarations:
  const constRegex =
    /(?:static\s+)?(?:const|final)\s+(?:Color\s+)?([a-zA-Z0-9_]+)\s*=\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = constRegex.exec(source)) !== null) {
    const varName = match[1];
    const expr = match[2];
    const colorVal = parseDartColorExpression(expr);
    if (colorVal) {
      addColorItem(varName, colorVal, `Variable Flutter: ${varName}`);
    }
  }

  // 2. Match ColorScheme constructors (with balanced parentheses):
  const schemeKeywordRegex = /ColorScheme(?:\.fromSeed|\.light|\.dark)?/g;
  while ((match = schemeKeywordRegex.exec(source)) !== null) {
    const argsBlock = extractCallArguments(source, match.index);
    if (!argsBlock) continue;

    const argRegex =
      /([a-zA-Z0-9_]+)\s*:\s*(?:const\s+)?(Color(?:\.[a-zA-Z0-9_]+)?\([^)]*\)|Colors\.[a-zA-Z0-9_.]+|[^,\n]+)/g;
    let argMatch: RegExpExecArray | null;
    let seedColorVal: string | null = null;

    while ((argMatch = argRegex.exec(argsBlock)) !== null) {
      const propName = argMatch[1];
      const expr = argMatch[2];
      const colorVal = parseDartColorExpression(expr);
      if (colorVal) {
        if (propName === "seedColor") {
          seedColorVal = colorVal;
          addColorItem("seedColor", colorVal, "Material 3 seedColor");
          addColorItem("primary", colorVal, "ColorScheme.primary (de seedColor)");
        } else {
          addColorItem(propName, colorVal, `ColorScheme.${propName}`);
        }
      }
    }

    if (seedColorVal && items.length <= 2) {
      addColorItem("secondary", "#625b71", "Material 3 secondary");
      addColorItem("surface", "#fef7ff", "Material 3 surface");
      addColorItem("background", "#fef7ff", "Material 3 background");
      addColorItem("error", "#b3261e", "Material 3 error");
    }
  }

  // 3. Match ThemeData properties:
  const themeDataKeywordRegex = /ThemeData/g;
  while ((match = themeDataKeywordRegex.exec(source)) !== null) {
    const argsBlock = extractCallArguments(source, match.index);
    if (!argsBlock) continue;

    const argRegex =
      /([a-zA-Z0-9_]+)\s*:\s*(?:const\s+)?(Color(?:\.[a-zA-Z0-9_]+)?\([^)]*\)|Colors\.[a-zA-Z0-9_.]+|[^,\n]+)/g;
    let argMatch: RegExpExecArray | null;
    while ((argMatch = argRegex.exec(argsBlock)) !== null) {
      const propName = argMatch[1];
      const expr = argMatch[2];
      if (propName.toLowerCase().includes("color") && !propName.includes("colorScheme")) {
        const colorVal = parseDartColorExpression(expr);
        if (colorVal) {
          addColorItem(propName, colorVal, `ThemeData.${propName}`);
        }
      }
    }
  }

  return items;
}

/**
 * Searches the Flutter workspace (active tabs or files on disk) to load theme variables.
 * Uses the native Rust AST engine for fast disk scanning with Tree-sitter.
 */
export async function loadFlutterThemeVariables(): Promise<FlutterThemeResult> {
  const store = useWorkspaceStore.getState();
  const { projectPath, tabs } = store;

  // 1. Check open tabs first (memory state in editor)
  const candidateTabNames = [
    "app_colors.dart",
    "colors.dart",
    "app_theme.dart",
    "theme.dart",
    "color_scheme.dart",
    "main.dart",
  ];

  for (const name of candidateTabNames) {
    const tab = tabs.find(
      (t) => t.name.toLowerCase() === name || t.path.toLowerCase().endsWith(name)
    );
    if (tab && tab.content && tab.content.trim().length > 0) {
      const vars = await parseColorsFromDartSource(tab.content);
      if (vars.length > 0) {
        return {
          variables: vars,
          sourceFile: tab.name,
        };
      }
    }
  }

  // 2. High-speed disk scan via Rust Tree-sitter AST engine
  if (projectPath) {
    try {
      const scanResult = await invoke<{
        variables: ColorVariableItem[];
        source_file: string | null;
      }>("scan_flutter_theme_in_project", { projectPath });

      if (scanResult && scanResult.variables && scanResult.variables.length > 0) {
        return {
          variables: scanResult.variables,
          sourceFile: scanResult.source_file,
        };
      }
    } catch (err) {
      console.warn("Rust project theme scan error:", err);
    }
  }

  // 3. Fallback to Flutter Material 3 standard defaults
  return {
    variables: DEFAULT_FLUTTER_THEME_VARIABLES,
    sourceFile: "Material 3 (Flutter por defecto)",
  };
}

/**
 * Fallback code generator if Rust backend is unavailable.
 */
function fallbackGenerateFlutterColorsDartFile(variables: ColorVariableItem[]): string {
  const fields = variables
    .map((v) => {
      const cleanHex = v.value.replace(/^#/, "").toUpperCase();
      let colorArg = "0xFF000000";
      if (cleanHex.length === 6) {
        colorArg = `0xFF${cleanHex}`;
      } else if (cleanHex.length === 8) {
        const rgb = cleanHex.slice(0, 6);
        const a = cleanHex.slice(6);
        colorArg = `0x${a}${rgb}`;
      }
      return `  /// ${v.description || v.name}\n  static const Color ${v.name} = Color(${colorArg});`;
    })
    .join("\n\n");

  return `import 'package:flutter/material.dart';

/// Variables y tokens de color del proyecto Flutter
/// Generado por Vela Studio
class AppColors {
  AppColors._();

${fields}
}
`;
}

/**
 * Generates an idiomatic Flutter Dart file containing an AppColors class.
 * Uses Rust code generator when available.
 */
export async function generateFlutterColorsDartFile(variables: ColorVariableItem[]): Promise<string> {
  try {
    return await invoke<string>("generate_flutter_colors_code", { variables });
  } catch {
    return fallbackGenerateFlutterColorsDartFile(variables);
  }
}

/**
 * Saves color variables back to a Flutter file (e.g. lib/theme/app_colors.dart).
 * Uses Rust code generation.
 */
export async function saveFlutterThemeVariables(
  variables: ColorVariableItem[],
  targetRelativePath = "lib/theme/app_colors.dart"
): Promise<{ success: boolean; filePath: string }> {
  const { projectPath } = useWorkspaceStore.getState();
  const filePath = projectPath
    ? `${projectPath.replace(/\/+$/, "")}/${targetRelativePath}`
    : targetRelativePath;

  const dartCode = await generateFlutterColorsDartFile(variables);

  if (projectPath) {
    try {
      const { workspaceApi } = await import("../api/workspace.api");
      await workspaceApi.saveFile(filePath, dartCode);

      const tree = await workspaceApi.getDirectoryChildren(projectPath);
      useWorkspaceStore.getState().setFileTree(tree);
    } catch (err) {
      console.error("Failed to save Flutter colors file:", err);
      return { success: false, filePath };
    }
  }

  // Quietly update tab content if app_colors.dart is already open, but never force-open or activate it
  const store = useWorkspaceStore.getState();
  const existingTab = store.tabs.find((t) => t.id === filePath || t.path === filePath);
  if (existingTab) {
    store.updateTabContent(existingTab.id, dartCode);
  }

  return { success: true, filePath };
}

/**
 * Updates a single color variable in an existing file using surgical AST replacement in Rust.
 */
export async function updateSingleThemeColor(
  filePath: string,
  variableName: string,
  newHex: string
): Promise<boolean> {
  try {
    await invoke("update_theme_color_in_file", {
      filePath,
      varName: variableName,
      newHex,
    });
    return true;
  } catch (err) {
    console.warn("Failed to update single theme color with Rust AST engine:", err);
    return false;
  }
}
