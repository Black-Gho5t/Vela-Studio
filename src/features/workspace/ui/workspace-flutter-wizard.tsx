import { Folder, Layers, Package, Plug, Smartphone } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
          projectPath: "~/rocket-projects",
          isCreating: false,
        };
      }
      return { ...state, ...action } as WizardState;
    },
    {
      step: 1,
      template: "app",
      projectName: "",
      projectPath: "~/rocket-projects",
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
      setProjectName(finalName);
      setProjectPathAction(`${projectPath}/${finalName}`);
      onOpenChange(false);
    } catch (e) {
      console.error("Error creating Flutter project:", e);
      alert(`Failed to create project: ${e}`);
    } finally {
      dispatch({ isCreating: false });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px] border-border bg-background p-6 text-foreground shadow-2xl gap-0">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-base font-semibold tracking-tight">
            New Flutter Project
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs mt-1">
            {step === 1
              ? "Select a project template"
              : "Configure project details"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="flex flex-col gap-2 py-1">
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
                  "flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  template === t.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/60 bg-muted/20 hover:bg-muted/50 text-foreground/90",
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-md",
                    template === t.id
                      ? "bg-primary/20 text-primary"
                      : "bg-background border border-border/60 text-muted-foreground",
                  )}
                >
                  <t.icon className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium leading-none mb-1">
                    {t.name}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] leading-none",
                      template === t.id
                        ? "text-muted-foreground"
                        : "text-muted-foreground/70",
                    )}
                  >
                    {t.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="projectName"
                className="text-muted-foreground text-xs font-medium"
              >
                Project Name
              </Label>
              <Input
                id="projectName"
                placeholder="my_awesome_app"
                value={projectName}
                onChange={(e) => dispatch({ projectName: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="projectPath"
                className="text-muted-foreground text-xs font-medium"
              >
                Project Location
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="projectPath"
                  value={projectPath}
                  onChange={(e) => dispatch({ projectPath: e.target.value })}
                  className="h-9 font-mono text-xs"
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
                  className="shrink-0 size-9"
                  title="Browse folder"
                >
                  <Folder className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex w-full items-center justify-between border-t border-border pt-4 mt-4">
          {step === 2 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
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
            >
              Cancel
            </Button>
            {step === 1 ? (
              <Button
                size="sm"
                onClick={handleNext}
              >
                Next
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!projectName.trim() || isCreating}
              >
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
