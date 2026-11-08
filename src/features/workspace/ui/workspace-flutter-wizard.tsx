import { Folder, Layers, Package, Plug, Smartphone, X } from "lucide-react";
import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useWorkspaceStore } from "../model/workspace.store";

const templates = [
  {
    id: "app",
    name: "Application",
    desc: "A standard Flutter app",
    icon: Smartphone,
  },
  {
    id: "empty",
    name: "Empty Application",
    desc: "A barebones Flutter app",
    icon: Smartphone,
  },
  {
    id: "module",
    name: "Module",
    desc: "Embeddable Flutter component",
    icon: Layers,
  },
  {
    id: "package",
    name: "Package",
    desc: "Shareable Dart code",
    icon: Package,
  },
  {
    id: "plugin",
    name: "Plugin",
    desc: "Shareable Dart code with native bridges",
    icon: Plug,
  },
];

interface WizardState {
  step: 1 | 2;
  template: string;
  projectName: string;
  projectPath: string;
  isCreating: boolean;
}

type WizardAction =
  | { type: "reset" }
  | Partial<WizardState>;

export function WorkspaceFlutterWizard({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setProjectName = useWorkspaceStore((s) => s.setProjectName);
  const setProjectPathAction = useWorkspaceStore((s) => s.setProjectPath);

  const [state, dispatch] = React.useReducer(
    (state: WizardState, action: WizardAction): WizardState => {
      if ("type" in action && action.type === "reset") {
        return {
          step: 1,
          template: "app",
          projectName: "",
          projectPath: "~/Developer",
          isCreating: false,
        };
      }
      return { ...state, ...action } as WizardState;
    },
    {
      step: 1,
      template: "app",
      projectName: "",
      projectPath: "~/Developer",
      isCreating: false,
    },
  );

  const { step, template, projectName, projectPath, isCreating } = state;

  // React Doctor: Effect event handler fix
  // Reset state when opening the dialog directly
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      dispatch({ type: "reset" });
    }
    onOpenChange(newOpen);
  };

  const handleNext = () => dispatch({ step: 2 });
  const handleBack = () => dispatch({ step: 1 });

  const handleCreate = async () => {
    let finalName = (projectName.trim() || "untitled_app")
      .toLowerCase()
      .replace(/[\s\-]+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/^_+|_+$/g, "");

    if (!finalName || /^[0-9]/.test(finalName)) {
      finalName = "app_" + finalName;
    }

    dispatch({ isCreating: true });
    try {
      await invoke("create_flutter_project", {
        projectPath,
        projectName: finalName,
        template,
      });

      const cleanDir = projectPath.replace(/[/\\]+$/, "");
      const resolvedTarget = `${cleanDir}/${finalName}`;

      setProjectName(finalName);
      setProjectPathAction(resolvedTarget);

      const store = useWorkspaceStore.getState();
      store.addRecentProject({ name: finalName, path: resolvedTarget });
      store.refreshFileTree();

      // Automatically open lib/main.dart if generated
      const mainDartPath = `${resolvedTarget}/lib/main.dart`;
      try {
        const { workspaceApi } = await import("../api/workspace.api");
        const content = await workspaceApi.readFile(mainDartPath);
        store.addTab({
          id: mainDartPath,
          name: "main.dart",
          path: mainDartPath,
          isActive: true,
          isModified: false,
          content,
        });
      } catch {
        // Fallback: tree will be visible in explorer
      }

      onOpenChange(false);
    } catch (e) {
      console.error("Error creating Flutter project:", e);
      try {
        const { message: messageDialog } = await import("@tauri-apps/plugin-dialog");
        await messageDialog(`Error al crear el proyecto: ${String(e)}`, {
          title: "Error al crear proyecto Flutter",
          kind: "error",
        });
      } catch {
        alert(`Failed to create project: ${e}`);
      }
    } finally {
      dispatch({ isCreating: false });
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal keepMounted>
            <DialogPrimitive.Backdrop
              render={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                />
              }
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
            />

            <DialogPrimitive.Popup
              render={
                <motion.div
                  initial={{
                    x: "-50%",
                    y: -22,
                    scaleX: 0.22,
                    scaleY: 0.06,
                    opacity: 0,
                    filter: "blur(6px)",
                  }}
                  animate={{
                    x: "-50%",
                    y: 0,
                    scaleX: 1,
                    scaleY: 1,
                    opacity: 1,
                    filter: "blur(0px)",
                  }}
                  exit={{
                    x: "-50%",
                    y: -18,
                    scaleX: 0.2,
                    scaleY: 0.05,
                    opacity: 0,
                    filter: "blur(4px)",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                    mass: 0.8,
                  }}
                  style={{ transformOrigin: "50% 0%" }}
                />
              }
              className={cn(
                "fixed top-2.5 left-1/2 z-50 overflow-hidden",
                "w-[500px] max-w-[calc(100vw-2rem)]",
                "rounded-[28px] border border-white/15 bg-zinc-950/95 dark:bg-black/95 text-zinc-100",
                "shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06)_inset]",
                "backdrop-blur-3xl outline-none select-none"
              )}
            >
              {/* Dynamic Island Sensor Notch */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0.5 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.25 }}
                className="flex items-center justify-center pt-2.5 pb-1 pointer-events-none"
              >
                <div className="h-1 w-12 rounded-full bg-white/20" />
              </motion.div>

              <div className="px-6 pb-6 pt-1">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
                      <Smartphone className="size-3.5" />
                    </div>
                    <div>
                      <DialogPrimitive.Title className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                        <span>New Flutter Project</span>
                        <span className="text-[10px] font-normal uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-400">
                          Step {step} of 2
                        </span>
                      </DialogPrimitive.Title>
                      <DialogPrimitive.Description className="text-zinc-400 text-[11px]">
                        {step === 1 ? "Select project template" : "Configure project details"}
                      </DialogPrimitive.Description>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="flex size-6 items-center justify-center rounded-full bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="size-3" />
                  </button>
                </div>

                {/* Steps Content */}
                <AnimatePresence mode="wait" initial={false}>
                  {step === 1 ? (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="flex flex-col gap-2 py-1"
                    >
                      {templates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => dispatch({ template: t.id })}
                          onDoubleClick={() => {
                            dispatch({ template: t.id });
                            handleNext();
                          }}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border p-2.5 text-left transition-all outline-none",
                            template === t.id
                              ? "border-sky-400/50 bg-sky-500/15 text-white ring-1 ring-sky-400/30 shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                              : "border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white"
                          )}
                        >
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-xl",
                              template === t.id
                                ? "bg-sky-400/20 text-sky-400"
                                : "bg-white/5 border border-white/10 text-zinc-400"
                            )}
                          >
                            <t.icon className="size-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium leading-none mb-1 text-white">
                              {t.name}
                            </span>
                            <span className="text-[11px] leading-none text-zinc-400">
                              {t.desc}
                            </span>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="flex flex-col gap-4 py-2"
                    >
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="projectName" className="text-zinc-400 text-xs font-medium">
                          Project Name
                        </Label>
                        <Input
                          id="projectName"
                          placeholder="my_awesome_app"
                          value={projectName}
                          onChange={(e) => dispatch({ projectName: e.target.value })}
                          className="h-9 text-xs bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl focus-visible:ring-sky-400"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="projectPath" className="text-zinc-400 text-xs font-medium">
                          Project Location
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="projectPath"
                            value={projectPath}
                            onChange={(e) => dispatch({ projectPath: e.target.value })}
                            className="h-9 font-mono text-xs bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl focus-visible:ring-sky-400"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={async () => {
                              try {
                                const selected = await openDialog({
                                  directory: true,
                                  multiple: false,
                                  defaultPath: projectPath.replace(/^~/, ""),
                                });
                                if (selected && typeof selected === "string") {
                                  dispatch({ projectPath: selected });
                                }
                              } catch (e) {
                                console.error("Error opening directory dialog:", e);
                              }
                            }}
                            className="shrink-0 size-9 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
                            title="Browse folder"
                          >
                            <Folder className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation buttons */}
                <div className="flex w-full items-center justify-between border-t border-white/10 pt-4 mt-3">
                  {step === 2 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full h-8 px-3 text-xs"
                    >
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenChange(false)}
                      className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full h-8 px-3 text-xs"
                    >
                      Cancel
                    </Button>
                    {step === 1 ? (
                      <Button
                        size="sm"
                        onClick={handleNext}
                        className="bg-white text-zinc-950 hover:bg-zinc-200 font-medium rounded-full h-8 px-4 text-xs shadow-md active:scale-95 transition-all"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleCreate}
                        disabled={!projectName.trim() || isCreating}
                        className="bg-white text-zinc-950 hover:bg-zinc-200 font-medium rounded-full h-8 px-4 text-xs shadow-md disabled:opacity-50 active:scale-95 transition-all"
                      >
                        {isCreating ? "Creating..." : "Create Project"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogPrimitive.Popup>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
