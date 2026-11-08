import * as React from "react";
import {
  Search,
  Settings2,
  User,
  FolderKanban,
  Code2,
  Palette,
  Smartphone,
  Cloud,
  Check,
  FolderOpen,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "../model/workspace.store";

type SettingsCategory = "account" | "workspace" | "editor" | "appearance" | "flutter";

interface CategoryMeta {
  id: SettingsCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const CATEGORIES: CategoryMeta[] = [
  {
    id: "account",
    label: "Cuenta",
    icon: User,
    description: "Perfil de usuario, sincronización y cuentas vinculadas",
  },
  {
    id: "workspace",
    label: "Workspace",
    icon: FolderKanban,
    description: "Configuración del proyecto, inicio y exclusión de archivos",
  },
  {
    id: "editor",
    label: "Editor",
    icon: Code2,
    description: "Fuente, tabulación, minimapa y formateo automático",
  },
  {
    id: "appearance",
    label: "Apariencia",
    icon: Palette,
    description: "Temas, colores de acento y personalización visual",
  },
  {
    id: "flutter",
    label: "Flutter & Dart",
    icon: Smartphone,
    description: "Ruta del SDK, plataformas y herramientas de desarrollo",
  },
];

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-b-0">
      <div className="space-y-0.5">
        <label
          className="text-xs font-medium text-foreground cursor-pointer"
          onClick={() => onChange(!checked)}
        >
          {label}
        </label>
        {description && (
          <p className="text-[11px] text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          checked ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/40"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block size-4 rounded-full bg-background shadow-xs ring-0 transition duration-150 ease-in-out",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export function WorkspaceSettingsTab() {
  const [activeCategory, setActiveCategory] = React.useState<SettingsCategory>("account");
  const [searchQuery, setSearchQuery] = React.useState("");
  const mainRef = React.useRef<HTMLElement>(null);

  // Scroll to top immediately when switching categories to prevent scroll retention jumps
  React.useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [activeCategory]);

  // Store bindings
  const projectName = useWorkspaceStore((state) => state.projectName);
  const projectPath = useWorkspaceStore((state) => state.projectPath);
  const showWelcomeOnStartup = useWorkspaceStore((state) => state.showWelcomeOnStartup ?? true);
  const setShowWelcomeOnStartup = useWorkspaceStore((state) => state.setShowWelcomeOnStartup);

  // Local settings state
  const [userName, setUserName] = React.useState("Brian Pech");
  const [userEmail] = React.useState("brian@example.com");
  const [cloudSync, setCloudSync] = React.useState(true);
  const [restoreTabs, setRestoreTabs] = React.useState(true);

  // Editor settings state
  const [fontSize, setFontSize] = React.useState("13");
  const [fontFamily, setFontFamily] = React.useState("'JetBrains Mono', monospace");
  const [tabSize, setTabSize] = React.useState("2");
  const [minimap, setMinimap] = React.useState(true);
  const [wordWrap, setWordWrap] = React.useState(false);
  const [formatOnSave, setFormatOnSave] = React.useState(true);

  // Appearance settings state
  const [theme, setTheme] = React.useState<"dark" | "light" | "system">("dark");
  const [accentColor, setAccentColor] = React.useState("emerald");

  // Flutter settings state
  const [flutterSdkPath, setFlutterSdkPath] = React.useState("/Users/brian/development/flutter");
  const [hotReloadOnSave, setHotReloadOnSave] = React.useState(true);

  // Filtered categories when searching
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    const q = searchQuery.toLowerCase();
    return CATEGORIES.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Current active category meta
  const currentCategory = React.useMemo(
    () => CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0],
    [activeCategory]
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-card text-card-foreground select-none">
      {/* ── Settings Header ── */}
      <div className="border-b border-border/60 bg-muted/20 px-6 py-3 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Breadcrumb beside Settings */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveCategory("account")}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Settings2 className="size-3.5 text-primary" />
              <span className="font-medium">Configuración</span>
            </button>
            <ChevronRight className="size-3 text-muted-foreground/50 shrink-0" />
            <span className="font-semibold text-foreground">
              {currentCategory.label}
            </span>
          </nav>

          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            {currentCategory.description}
          </span>
        </div>

        {/* Search bar — full available width */}
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar opciones de configuración (ej: cuenta, tema, workspace, fuente)..."
            className="h-8 w-full pl-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* ── Main Layout: Sidebar Categories + Content ── */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Left Category Nav */}
        <aside className="w-56 shrink-0 border-r border-border/60 bg-muted/10 p-3 space-y-1 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
            Categorías
          </div>
          {filteredCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors text-left",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <Icon className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Settings Details Content */}
        <main
          ref={mainRef}
          className="flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable] px-8 py-6 select-text"
        >
          <div key={activeCategory} className="mx-auto max-w-3xl space-y-8">
            {/* ── 1. ACCOUNT ── */}
            {activeCategory === "account" && (
              <div className="space-y-6">
                {/* Profile card with Blobatar */}
                <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={userName}
                      className="size-16 rounded-2xl ring-2 ring-border shadow-xs"
                      animate="hover"
                    />
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">{userName}</span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          <Sparkles className="size-3" />
                          Pro
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                      <p className="text-[11px] text-muted-foreground/80">
                        Avatar generado automáticamente mediante <span className="font-mono text-primary">Blobatar</span>.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Nombre visible</label>
                      <Input
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Correo electrónico</label>
                      <Input
                        value={userEmail}
                        readOnly
                        disabled
                        className="h-8 text-xs bg-background/50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Cloud Sync */}
                <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Cloud className="size-4 text-primary" />
                    <span>Sincronización en la Nube</span>
                  </div>
                  <SettingToggle
                    label="Respaldar configuración automáticamente"
                    description="Guarda atajos, temas y estado del editor en tu cuenta."
                    checked={cloudSync}
                    onChange={setCloudSync}
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Estado: Sincronizado</span>
                    <Button variant="outline" size="xs" className="h-6 text-[11px]">
                      Sincronizar ahora
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── 2. WORKSPACE ── */}
            {activeCategory === "workspace" && (
              <div className="space-y-6">
                {/* Current Project Info */}
                <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <FolderKanban className="size-4 text-primary" />
                      <span>Proyecto Activo</span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {projectName ? "Abierto" : "Ninguno"}
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground">Nombre del proyecto</span>
                      <Input
                        value={projectName || "Sin proyecto abierto"}
                        readOnly
                        className="h-8 text-xs bg-background/70 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground">Ruta en disco</span>
                      <Input
                        value={projectPath || "No seleccionado"}
                        readOnly
                        className="h-8 text-xs bg-background/70 font-mono text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* Startup & Sessions */}
                <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-1">
                  <div className="text-sm font-medium text-foreground mb-2">Comportamiento de Inicio</div>
                  <SettingToggle
                    label="Mostrar pestaña de bienvenida al iniciar"
                    description="Abre la pantalla de inicio con accesos rápidos y proyectos recientes."
                    checked={showWelcomeOnStartup}
                    onChange={setShowWelcomeOnStartup}
                  />
                  <SettingToggle
                    label="Restaurar pestañas anteriores"
                    description="Vuelve a abrir los archivos que estaban activos en la última sesión."
                    checked={restoreTabs}
                    onChange={setRestoreTabs}
                  />
                </div>

                {/* Exclusions */}
                <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-2">
                  <div className="text-sm font-medium text-foreground">Archivos y Carpetas Excluidos</div>
                  <p className="text-[11px] text-muted-foreground">
                    Oculta directorios generados de la búsqueda y explorador de archivos.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[".dart_tool", "build/", ".git", ".idea", "node_modules", ".gradle"].map((dir) => (
                      <span
                        key={dir}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-mono text-foreground"
                      >
                        {dir}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── 3. EDITOR ── */}
            {activeCategory === "editor" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Familia de fuente</label>
                      <Input
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="h-8 text-xs bg-background font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Tamaño de fuente (px)</label>
                      <Input
                        type="number"
                        value={fontSize}
                        onChange={(e) => setFontSize(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-medium text-foreground">Tamaño de tabulación (espacios)</label>
                    <div className="flex gap-2">
                      {["2", "4"].map((size) => (
                        <Button
                          key={size}
                          type="button"
                          variant={tabSize === size ? "default" : "outline"}
                          size="xs"
                          onClick={() => setTabSize(size)}
                          className="h-7 px-3 text-xs"
                        >
                          {size} espacios {size === "2" ? "(Dart recomendado)" : ""}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40">
                    <SettingToggle
                      label="Minimapa de código"
                      description="Muestra la vista previa del archivo en el lateral derecho."
                      checked={minimap}
                      onChange={setMinimap}
                    />
                    <SettingToggle
                      label="Ajuste automático de línea (Word Wrap)"
                      description="Envuelve las líneas largas de código para evitar desplazamiento horizontal."
                      checked={wordWrap}
                      onChange={setWordWrap}
                    />
                    <SettingToggle
                      label="Formatear al guardar"
                      description="Aplica automáticamente el formato de código Dart al guardar el archivo."
                      checked={formatOnSave}
                      onChange={setFormatOnSave}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── 4. APPEARANCE ── */}
            {activeCategory === "appearance" && (
              <div className="space-y-6">
                {/* Theme Selector */}
                <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-3">
                  <div className="text-sm font-medium text-foreground">Tema de la Interfaz</div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "dark" as const, label: "Oscuro" },
                      { id: "light" as const, label: "Claro" },
                      { id: "system" as const, label: "Sistema" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-all",
                          theme === t.id
                            ? "border-primary bg-primary/10 text-primary shadow-xs"
                            : "border-border/60 bg-background/50 hover:bg-muted text-muted-foreground"
                        )}
                      >
                        <span>{t.label}</span>
                        {theme === t.id && <Check className="size-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-3">
                  <div className="text-sm font-medium text-foreground">Color de Acento</div>
                  <div className="flex items-center gap-3">
                    {[
                      { id: "emerald", label: "Esmeralda", bg: "bg-emerald-500" },
                      { id: "cyan", label: "Cian", bg: "bg-cyan-500" },
                      { id: "violet", label: "Violeta", bg: "bg-violet-500" },
                      { id: "blue", label: "Azul", bg: "bg-blue-500" },
                    ].map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setAccentColor(color.id)}
                        className={cn(
                          "size-7 rounded-full transition-transform flex items-center justify-center",
                          color.bg,
                          accentColor === color.id ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-80 hover:opacity-100"
                        )}
                        title={color.label}
                      >
                        {accentColor === color.id && <Check className="size-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── 5. FLUTTER & DART ── */}
            {activeCategory === "flutter" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Ruta del SDK de Flutter</label>
                    <div className="flex gap-2">
                      <Input
                        value={flutterSdkPath}
                        onChange={(e) => setFlutterSdkPath(e.target.value)}
                        className="h-8 text-xs bg-background font-mono flex-1"
                      />
                      <Button variant="outline" size="xs" className="h-8 gap-1.5 px-3 text-xs">
                        <FolderOpen className="size-3.5" />
                        Examinar
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40">
                    <SettingToggle
                      label="Hot Reload al guardar"
                      description="Envía los cambios de código instantáneamente a la app en ejecución al guardar un archivo."
                      checked={hotReloadOnSave}
                      onChange={setHotReloadOnSave}
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <span className="text-xs font-medium text-foreground">Plataformas soportadas</span>
                    <div className="flex flex-wrap gap-2">
                      {["Android", "iOS", "macOS", "Web", "Windows", "Linux"].map((platform) => (
                        <span
                          key={platform}
                          className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2.5 py-1 text-xs text-foreground"
                        >
                          <Check className="size-3 text-primary" />
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
