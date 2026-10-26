import { useWorkspaceStore } from "./workspace.store";

/**
 * Generates a clean snake_case filename for a Flutter screen based on frame name.
 * Example: "iPhone 18 Pro" -> "iphone_18_pro_screen.dart"
 */
export function getFlutterFileName(name: string, existingNames: string[] = []): string {
  const clean = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const base = `${clean}_screen`;
  const ext = ".dart";

  if (!existingNames.includes(`${base}${ext}`)) {
    return `${base}${ext}`;
  }

  let counter = 2;
  while (existingNames.includes(`${base}_${counter}${ext}`)) {
    counter++;
  }
  return `${base}_${counter}${ext}`;
}

/**
 * Converts a filename like "iphone_18_pro_screen.dart" to PascalCase "IPhone18ProScreen"
 */
export function getFlutterClassName(fileName: string): string {
  const withoutExt = fileName.replace(/\.dart$/, "");
  return withoutExt
    .split("_")
    .map((part) => {
      if (part.toLowerCase() === "iphone") return "IPhone";
      if (part.toLowerCase() === "ios") return "IOS";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

export type ScreenLayoutType = "scaffold" | "scrollable" | "stack";

/**
 * Generates the basic Flutter StatelessWidget code for the frame.
 */
export function generateFlutterScreenCode(
  className: string,
  screenTitle: string,
  layoutType: ScreenLayoutType = "scaffold"
): string {
  if (layoutType === "scrollable") {
    return `import 'package:flutter/material.dart';

class ${className} extends StatelessWidget {
  const ${className}({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 180.0,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text('${screenTitle}'),
              centerTitle: true,
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Contenido con Scroll (Slivers)',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  ...List.generate(
                    8,
                    (index) => Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(child: Text('\${index + 1}')),
                        title: Text('Elemento \${index + 1}'),
                        subtitle: const Text('Desplaza para ver el efecto de la barra superior'),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
`;
  }

  if (layoutType === "stack") {
    return `import 'package:flutter/material.dart';

class ${className} extends StatelessWidget {
  const ${className}({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Capa de fondo inmersiva
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF1E1E2E), Color(0xFF11111B)],
              ),
            ),
          ),
          // Capa de contenido interactivo
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '${screenTitle}',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Pantalla inmersiva construida con Stack y capas superpuestas.',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () {},
                      child: const Text('Comenzar'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
`;
  }

  // Default Scaffold
  return `import 'package:flutter/material.dart';

class ${className} extends StatelessWidget {
  const ${className}({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('${screenTitle}'),
        centerTitle: true,
        elevation: 0,
      ),
      body: const SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.smartphone,
                size: 64,
                color: Colors.blue,
              ),
              SizedBox(height: 16),
              Text(
                '${screenTitle}',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'Diseña tus widgets aquí',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`;
}

/**
 * Resolves any relative or absolute file path against the projectPath to guarantee an absolute path on disk.
 */
export function resolveAbsoluteFilePath(
  filePath: string,
  projectPath: string | null
): string {
  if (!projectPath) return filePath;
  const cleanProject = projectPath.replace(/\/+$/, "");
  if (filePath.startsWith(cleanProject)) {
    return filePath;
  }
  const cleanRelative = filePath.replace(/^\/+/, "");
  return `${cleanProject}/${cleanRelative}`;
}

/**
 * Updates the screen template code when the user changes the root layout (Scaffold, Scrollable, Stack).
 */
export async function updateFlutterFileScreenLayout(
  filePath: string,
  fileName: string,
  screenTitle: string,
  layoutType: ScreenLayoutType
): Promise<void> {
  const className = getFlutterClassName(fileName);
  const content = generateFlutterScreenCode(className, screenTitle, layoutType);

  const { projectPath, tabs, updateTabContent, setFileTree } = useWorkspaceStore.getState();
  const resolvedPath = resolveAbsoluteFilePath(filePath, projectPath);

  // 1. Update on disk using Tauri IPC
  try {
    const { workspaceApi } = await import("../api/workspace.api");
    await workspaceApi.saveFile(resolvedPath, content);

    // Refresh directory tree so changes appear in explorer
    if (projectPath) {
      const tree = await workspaceApi.getDirectoryTree(projectPath);
      setFileTree(tree);
    }
  } catch (err) {
    console.warn("Could not update Flutter file on disk:", err);
  }

  // 2. Update matching open tab content
  const matchingTab = tabs.find(
    (t) =>
      t.path === resolvedPath ||
      t.path === filePath ||
      t.id === resolvedPath ||
      t.id === filePath ||
      t.name === fileName
  );

  if (matchingTab) {
    updateTabContent(matchingTab.id, content);
  }
}

/**
 * Deletes the Flutter file from disk, closes its tab, and refreshes the directory tree.
 */
export async function deleteFlutterFileForFrame(
  filePath?: string,
  fileName?: string
): Promise<void> {
  if (!filePath && !fileName) return;
  const { projectPath, tabs, closeTab, setFileTree } = useWorkspaceStore.getState();
  const targetPath = filePath || (fileName ? `lib/screens/${fileName}` : "");
  if (!targetPath) return;

  const resolvedPath = resolveAbsoluteFilePath(targetPath, projectPath);

  // 1. Delete from disk using Tauri IPC
  try {
    const { workspaceApi } = await import("../api/workspace.api");
    await workspaceApi.deleteFile(resolvedPath);

    // Refresh directory tree so file disappears from explorer
    if (projectPath) {
      const tree = await workspaceApi.getDirectoryTree(projectPath);
      setFileTree(tree);
    }
  } catch (err) {
    console.warn("Could not delete file from disk:", err);
  }

  // 2. Close matching editor tab if open
  const matchingTabs = tabs.filter(
    (t) =>
      t.path === resolvedPath ||
      t.path === targetPath ||
      t.id === resolvedPath ||
      t.id === targetPath ||
      (fileName && t.name === fileName)
  );

  matchingTabs.forEach((t) => closeTab(t.id));
}

/**
 * Creates the Flutter file on disk (via Tauri IPC if active) and registers it in workspace tabs.
 */
export async function createFlutterFileForFrame(
  frameName: string,
  existingFileNames: string[] = []
): Promise<{ fileName: string; filePath: string; className: string; content: string }> {
  const fileName = getFlutterFileName(frameName, existingFileNames);
  const className = getFlutterClassName(fileName);
  const content = generateFlutterScreenCode(className, frameName);

  const { projectPath, addTab, setFileTree } = useWorkspaceStore.getState();
  const relativePath = `lib/screens/${fileName}`;
  const resolvedPath = resolveAbsoluteFilePath(relativePath, projectPath);

  // 1. Save to disk if running in Tauri workspace
  try {
    const { workspaceApi } = await import("../api/workspace.api");
    await workspaceApi.saveFile(resolvedPath, content);

    // Refresh directory tree so it appears in explorer
    if (projectPath) {
      const tree = await workspaceApi.getDirectoryTree(projectPath);
      setFileTree(tree);
    }
  } catch (err) {
    console.warn("Could not save Flutter file to disk:", err);
  }

  // 2. Register file tab in workspace tabs
  const store = useWorkspaceStore.getState();
  const tabExists = store.tabs.some(
    (t) => t.path === resolvedPath || t.id === resolvedPath || t.name === fileName
  );
  if (!tabExists) {
    addTab({
      id: resolvedPath,
      name: fileName,
      path: resolvedPath,
      isActive: false,
      isModified: false,
      content,
    });
  }

  return {
    fileName,
    filePath: resolvedPath,
    className,
    content,
  };
}
