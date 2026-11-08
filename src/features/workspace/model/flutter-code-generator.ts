import type { CanvasDeviceFrame, CanvasWidgetElement } from "../ui/designer-canvas";

/**
 * Convierte un color hexadecimal (#RRGGBB o #AARRGGBB) a su representación en Dart Color(0xFF...)
 */
export function hexToDartColor(hex?: string): string {
  if (!hex) return "Colors.blue";
  if (hex.startsWith("#")) {
    const clean = hex.replace("#", "");
    if (clean.length === 6) {
      return `const Color(0xFF${clean.toUpperCase()})`;
    } else if (clean.length === 8) {
      return `const Color(0x${clean.toUpperCase()})`;
    }
  }
  if (hex.startsWith("Colors.")) {
    return hex;
  }
  return `const Color(0xFF0284C7)`;
}

/**
 * Convierte un elemento individual del canvas en un widget de Flutter.
 */
export function elementToFlutterWidget(el: CanvasWidgetElement, isStackMode: boolean = false, indent: number = 8): string {
  const pad = " ".repeat(indent);
  let widgetCode = "";

  switch (el.type) {
    case "text": {
      const fontSize = el.fontSize || 16;
      const textColor = hexToDartColor(el.textColor || "#000000");
      widgetCode = `Text(
${pad}  '${el.label || "Texto"}',
${pad}  style: TextStyle(
${pad}    fontSize: ${fontSize}.0,
${pad}    color: ${textColor},
${pad}  ),
${pad})`;
      break;
    }

    case "button": {
      const bg = hexToDartColor(el.color || "#0ea5e9");
      const radius = el.borderRadius || 8;
      const text = el.label || "Botón";
      widgetCode = `ElevatedButton(
${pad}  style: ElevatedButton.styleFrom(
${pad}    backgroundColor: ${bg},
${pad}    shape: RoundedRectangleBorder(
${pad}      borderRadius: BorderRadius.circular(${radius}.0),
${pad}    ),
${pad}  ),
${pad}  onPressed: () {},
${pad}  child: Text('${text}'),
${pad})`;
      break;
    }

    case "input": {
      const radius = el.borderRadius || 8;
      const label = el.label || "Campo de texto";
      widgetCode = `TextField(
${pad}  decoration: InputDecoration(
${pad}    labelText: '${label}',
${pad}    border: OutlineInputBorder(
${pad}      borderRadius: BorderRadius.circular(${radius}.0),
${pad}    ),
${pad}  ),
${pad})`;
      break;
    }

    case "card": {
      const radius = el.borderRadius || 12;
      const label = el.label || "Tarjeta";
      widgetCode = `Card(
${pad}  elevation: 2.0,
${pad}  shape: RoundedRectangleBorder(
${pad}    borderRadius: BorderRadius.circular(${radius}.0),
${pad}  ),
${pad}  child: Padding(
${pad}    padding: const EdgeInsets.all(16.0),
${pad}    child: Text('${label}'),
${pad}  ),
${pad})`;
      break;
    }

    case "icon": {
      widgetCode = `Icon(
${pad}  Icons.star,
${pad}  size: ${el.fontSize || 32}.0,
${pad}  color: ${hexToDartColor(el.color || "#eab308")},
${pad})`;
      break;
    }

    case "container":
    default: {
      const bg = hexToDartColor(el.color || "#f1f5f9");
      const radius = el.borderRadius || 8;
      const w = el.width ? `${el.width}.0` : "double.infinity";
      const h = el.height ? `${el.height}.0` : "80.0";
      widgetCode = `Container(
${pad}  width: ${w},
${pad}  height: ${h},
${pad}  decoration: BoxDecoration(
${pad}    color: ${bg},
${pad}    borderRadius: BorderRadius.circular(${radius}.0),
${pad}  ),
${pad})`;
      break;
    }
  }

  if (isStackMode && (el.x !== undefined || el.y !== undefined)) {
    const positioned = `Positioned(
${pad}  left: ${el.x || 0}.0,
${pad}  top: ${el.y || 0}.0,
${pad}  child: ${widgetCode},
${pad})`;
    return wrapWidgetDecorators(positioned, el, pad);
  }

  return wrapWidgetDecorators(widgetCode, el, pad);
}

function wrapWidgetDecorators(widgetCode: string, el: CanvasWidgetElement, pad: string): string {
  let result = widgetCode;

  // 1. Padding wrapper
  if (el.padding && (el.padding.top || el.padding.right || el.padding.bottom || el.padding.left)) {
    const { top, right, bottom, left } = el.padding;
    const paddingCode =
      top === right && right === bottom && bottom === left
        ? `const EdgeInsets.all(${top}.0)`
        : `const EdgeInsets.fromLTRB(${left}.0, ${top}.0, ${right}.0, ${bottom}.0)`;
    result = `Padding(
${pad}  padding: ${paddingCode},
${pad}  child: ${result},
${pad})`;
  }

  // 2. Alignment wrapper
  if (el.alignment) {
    result = `Align(
${pad}  alignment: Alignment.${el.alignment},
${pad}  child: ${result},
${pad})`;
  }

  // 3. Sizing wrappers (Fill container)
  if (el.widthMode === "fill") {
    result = `SizedBox(
${pad}  width: double.infinity,
${pad}  child: ${result},
${pad})`;
  }

  // 4. Visibility wrapper
  if (el.isVisible === false) {
    result = `Visibility(
${pad}  visible: false,
${pad}  child: ${result},
${pad})`;
  }

  return result;
}

/**
 * Genera el cuerpo (body) completo de un marco en Flutter basado en su layout y elementos.
 */
export function generateFrameBodyCode(frame: CanvasDeviceFrame): string {
  const rawElements = frame.elements || [];
  const elements = frame.reverseOrder ? [...rawElements].reverse() : rawElements;
  const isStack = frame.screenLayout === "stack" || frame.layoutFlow === "none";

  if (elements.length === 0) {
    return `const SafeArea(
        child: SizedBox.shrink(),
      )`;
  }

  // 1. Stack libre
  if (isStack) {
    const children = elements.map((el) => elementToFlutterWidget(el, true, 10)).join(",\n          ");
    let stackCode = `Stack(
          children: [
          ${children}
          ],
        )`;
    if (frame.clipContent) {
      stackCode = `ClipRect(
          clipBehavior: Clip.hardEdge,
          child: ${stackCode},
        )`;
    }
    return `SafeArea(
        child: ${stackCode},
      )`;
  }

  // Padding
  const pad = frame.padding || { top: 0, right: 0, bottom: 0, left: 0 };
  let paddingCode = "";
  if (pad.top > 0 || pad.right > 0 || pad.bottom > 0 || pad.left > 0) {
    if (pad.top === pad.bottom && pad.left === pad.right) {
      paddingCode = `padding: const EdgeInsets.symmetric(horizontal: ${pad.left}.0, vertical: ${pad.top}.0),`;
    } else {
      paddingCode = `padding: const EdgeInsets.fromLTRB(${pad.left}.0, ${pad.top}.0, ${pad.right}.0, ${pad.bottom}.0),`;
    }
  }

  const isHorizontal = frame.layoutFlow === "horizontal";
  const isWrap = frame.layoutFlow === "wrap";
  const spacing = frame.spacing ?? 0;
  const align = frame.alignment || "topLeft";
  const isSpaceBetween = frame.spacingMode === "spaceBetween";

  // 2. Wrap layout
  if (isWrap) {
    const children = elements.map((el) => elementToFlutterWidget(el, false, 12)).join(",\n            ");
    let wrapCode = `Wrap(
            spacing: ${spacing}.0,
            runSpacing: ${spacing}.0,
            children: [
            ${children}
            ],
          )`;
    if (paddingCode) {
      wrapCode = `Padding(
            ${paddingCode}
            child: ${wrapCode},
          )`;
    }
    if (frame.clipContent) {
      wrapCode = `ClipRect(
          clipBehavior: Clip.hardEdge,
          child: ${wrapCode},
        )`;
    }
    return `SafeArea(
        child: SingleChildScrollView(
          child: ${wrapCode},
        ),
      )`;
  }

  // 3. Flex layout (Column o Row)
  const layoutWidget = isHorizontal ? "Row" : "Column";
  let mainAxis = "MainAxisAlignment.start";
  let crossAxis = "CrossAxisAlignment.start";

  if (isSpaceBetween) {
    mainAxis = "MainAxisAlignment.spaceBetween";
    if (isHorizontal) {
      crossAxis = align.startsWith("top") ? "CrossAxisAlignment.start" : align.startsWith("bottom") ? "CrossAxisAlignment.end" : "CrossAxisAlignment.center";
    } else {
      crossAxis = align.endsWith("Left") ? "CrossAxisAlignment.start" : align.endsWith("Right") ? "CrossAxisAlignment.end" : "CrossAxisAlignment.center";
    }
  } else {
    const isLeft = align.endsWith("Left") || align === "topLeft" || align === "bottomLeft" || align === "centerLeft";
    const isRight = align.endsWith("Right") || align === "topRight" || align === "bottomRight" || align === "centerRight";
    const horizMain = isLeft ? "MainAxisAlignment.start" : isRight ? "MainAxisAlignment.end" : "MainAxisAlignment.center";
    const horizCross = isLeft ? "CrossAxisAlignment.start" : isRight ? "CrossAxisAlignment.end" : "CrossAxisAlignment.center";

    const isTop = align.startsWith("top");
    const isBottom = align.startsWith("bottom");
    const vertMain = isTop ? "MainAxisAlignment.start" : isBottom ? "MainAxisAlignment.end" : "MainAxisAlignment.center";
    const vertCross = isTop ? "CrossAxisAlignment.start" : isBottom ? "CrossAxisAlignment.end" : "CrossAxisAlignment.center";

    if (isHorizontal) {
      mainAxis = horizMain;
      crossAxis = vertCross;
    } else {
      mainAxis = vertMain;
      crossAxis = horizCross;
    }
  }

  // Separadores entre hijos
  let childrenWidgets = "";
  if (spacing > 0 && !isSpaceBetween) {
    childrenWidgets = elements
      .map((el) => elementToFlutterWidget(el, false, 12))
      .join(`,\n            SizedBox(${isHorizontal ? "width" : "height"}: ${spacing}.0),\n            `);
  } else {
    childrenWidgets = elements.map((el) => elementToFlutterWidget(el, false, 12)).join(",\n            ");
  }

  let flexCode = `${layoutWidget}(
            mainAxisAlignment: ${mainAxis},
            crossAxisAlignment: ${crossAxis},
            children: [
            ${childrenWidgets}
            ],
          )`;

  if (paddingCode) {
    flexCode = `Padding(
            ${paddingCode}
            child: ${flexCode},
          )`;
  }

  if (frame.clipContent) {
    flexCode = `ClipRect(
          clipBehavior: Clip.hardEdge,
          child: ${flexCode},
        )`;
  }

  return `SafeArea(
        child: SingleChildScrollView(
          child: ${flexCode},
        ),
      )`;
}

/**
 * Genera el código completo de la clase StatelessWidget para el marco con los elementos especificados.
 */
export function generateFullFlutterScreen(
  className: string,
  screenTitle: string,
  frame: CanvasDeviceFrame
): string {
  let bodyContent = generateFrameBodyCode(frame);

  // 1. Trazos y Efectos (Sombras)
  const hasStroke = frame.stroke && frame.stroke.visible;
  const activeEffects = frame.effects?.filter((e) => e.visible) || [];

  if (hasStroke || activeEffects.length > 0) {
    const strokeCode = hasStroke
      ? `border: Border.all(color: ${hexToDartColor(frame.stroke!.color)}, width: ${frame.stroke!.width}.0),`
      : "";
    const shadowCode =
      activeEffects.length > 0
        ? `boxShadow: [\n          ${activeEffects
            .map(
              (e) =>
                `BoxShadow(color: const Color(0x33000000), blurRadius: ${e.blur}.0, offset: const Offset(${e.x ?? 0}.0, ${e.y ?? 4}.0))`
            )
            .join(",\n          ")}\n        ],`
        : "";

    bodyContent = `Container(
        decoration: BoxDecoration(
          ${strokeCode}
          ${shadowCode}
        ),
        child: ${bodyContent},
      )`;
  }

  // 2. Radio de esquina (Aplica al margen del frame)
  if (frame.cornerRadius && frame.cornerRadius > 0) {
    bodyContent = `ClipRRect(
        borderRadius: BorderRadius.circular(${frame.cornerRadius}.0),
        child: ${bodyContent},
      )`;
  }

  // 3. Opacidad general del frame
  if (frame.opacity !== undefined && frame.opacity < 100 && frame.opacity >= 0) {
    const opacityValue = (frame.opacity / 100).toFixed(2);
    bodyContent = `Opacity(
        opacity: ${opacityValue},
        child: ${bodyContent},
      )`;
  }

  const defaultBg = frame.themeMode === "dark" ? "const Color(0xFF121212)" : "Colors.white";
  let bgColor = defaultBg;
  if (frame.fillToken) {
    const t = frame.fillToken.toLowerCase();
    if (t.includes("primary")) bgColor = "Theme.of(context).colorScheme.primary";
    else if (t.includes("secondary")) bgColor = "Theme.of(context).colorScheme.secondary";
    else if (t.includes("surface")) bgColor = "Theme.of(context).colorScheme.surface";
    else if (t.includes("background")) bgColor = "Theme.of(context).colorScheme.surface";
    else if (t.includes("error")) bgColor = "Theme.of(context).colorScheme.error";
    else bgColor = frame.fill ? hexToDartColor(frame.fill) : defaultBg;
  } else if (frame.hasFill !== false && frame.fill) {
    bgColor = hexToDartColor(frame.fill);
  }

  let scaffoldCode = `Scaffold(
      backgroundColor: ${bgColor},
      appBar: AppBar(
        title: const Text('${screenTitle}'),
        centerTitle: true,
        elevation: 0,
      ),
      body: ${bodyContent},
    )`;

  // 4. Selector de tema
  if (frame.themeMode === "dark") {
    scaffoldCode = `Theme(
      data: ThemeData.dark(),
      child: ${scaffoldCode},
    )`;
  } else if (frame.themeMode === "light") {
    scaffoldCode = `Theme(
      data: ThemeData.light(),
      child: ${scaffoldCode},
    )`;
  }

  return `import 'package:flutter/material.dart';

class ${className} extends StatelessWidget {
  const ${className}({super.key});

  @override
  Widget build(BuildContext context) {
    return ${scaffoldCode};
  }
}
`;
}
