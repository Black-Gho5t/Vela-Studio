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
        if (label === "Diseña tus widgets aquí") return;
        elType = "text";
        label = label || "Texto";
        break;
      case "ElevatedButton":
      case "FilledButton":
      case "OutlinedButton":
        elType = "button";
        label = label || "Botón";
        break;
      case "TextField":
        elType = "input";
        label = label || "Campo de texto";
        break;
      case "Card":
        elType = "card";
        label = label || "";
        break;
      case "Icon":
        elType = "icon";
        label = label || "Icono";
        break;
      case "Container":
        elType = "container";
        label = label || "";
        break;
      case "SizedBox":
        // Skip empty SizedBox or SizedBox.shrink()
        if (!node.props.width && !node.props.height && (!node.children || node.children.length === 0)) {
          return;
        }
        elType = "container";
        label = label || "";
        break;
      default:
        // Layout containers (Column, Row, Stack, Padding, Center) recurse into children
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
