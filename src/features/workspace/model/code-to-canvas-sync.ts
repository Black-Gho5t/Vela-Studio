import { invoke } from "@tauri-apps/api/core";
import type { CanvasWidgetElement, LayoutFlow, ScreenLayoutType } from "../ui/designer-canvas";

export interface AstWidgetNode {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: AstWidgetNode[];
}

/**
 * Convierte un árbol de nodos AST de Dart a elementos de lienzo CanvasWidgetElement.
 */
export function astNodesToCanvasElements(nodes: AstWidgetNode[]): CanvasWidgetElement[] {
  const elements: CanvasWidgetElement[] = [];

  function walk(node: AstWidgetNode, depth = 0) {
    let elType: CanvasWidgetElement["type"] | null = null;
    let label = node.props.data || node.props.label || node.props.labelText || node.props.childText;

    switch (node.type) {
      case "Text":
        if (label === "Diseña tus widgets aquí" || label === "No real AST found yet") return;
        elType = "text";
        break;
      case "ElevatedButton":
      case "FilledButton":
      case "OutlinedButton":
      case "TextButton":
      case "IconButton":
        elType = "button";
        break;
      case "TextField":
      case "TextFormField":
        elType = "input";
        break;
      case "Card":
        elType = "card";
        break;
      case "Icon":
        elType = "icon";
        break;
      case "Container":
        elType = "container";
        break;
      case "Image":
        elType = "container";
        break;
      case "SizedBox":
        // Skip spacing SizedBox without children
        if (!node.children || node.children.length === 0) {
          return;
        }
        elType = "container";
        break;
      default:
        // Layout containers (Column, Row, Stack, Padding, Center, ListView, CustomScrollView) recurse into children
        break;
    }

    if (elType) {
      elements.push({
        id: `elem-${node.id || Math.random().toString(36).substring(2, 7)}`,
        type: elType,
        name: node.type,
        label,
        x: 24,
        y: 24 + elements.length * 60,
      });
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        walk(child, depth + 1);
      }
    }
  }

  for (const root of nodes) {
    walk(root);
  }

  return elements;
}

/**
 * Parsea un código fuente Dart y devuelve las propiedades del marco y sus elementos
 * utilizando el motor AST nativo de Rust (Tree-sitter).
 */
export async function parseDartCodeToFrameElements(sourceCode: string): Promise<{
  elements: CanvasWidgetElement[];
  layoutFlow: LayoutFlow;
  screenLayout: ScreenLayoutType;
}> {
  try {
    const { workspaceApi } = await import("../api/workspace.api");
    const res = await workspaceApi.parseDartFileToCanvas(sourceCode);
    return {
      elements: (res.elements || []) as CanvasWidgetElement[],
      layoutFlow: (res.layout_flow as LayoutFlow) || "vertical",
      screenLayout: (res.screen_layout as ScreenLayoutType) || "scaffold",
    };
  } catch (err) {
    console.warn("Rust AST canvas parser error, using local fallback:", err);
    try {
      const rawJson = await invoke<string>("parse_dart_file", { sourceCode });
      const rootNode: AstWidgetNode = JSON.parse(rawJson);

      let layoutFlow: LayoutFlow = "vertical";
      let screenLayout: ScreenLayoutType = "scaffold";

      if (sourceCode.includes("CustomScrollView") || sourceCode.includes("SliverAppBar")) {
        screenLayout = "scrollable";
      } else if (sourceCode.includes("Stack(")) {
        screenLayout = "stack";
        layoutFlow = "none";
      } else if (sourceCode.includes("Row(")) {
        layoutFlow = "horizontal";
      }

      const elements = astNodesToCanvasElements([rootNode]);

      return {
        elements,
        layoutFlow,
        screenLayout,
      };
    } catch {
      return {
        elements: [],
        layoutFlow: "vertical",
        screenLayout: "scaffold",
      };
    }
  }
}
