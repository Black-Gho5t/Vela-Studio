import * as React from "react";
import { Atom, Bot, FolderOpen, Plus, Smartphone, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { open } from "@tauri-apps/plugin-dialog";
import { useWorkspaceStore } from "../model/workspace.store";
import { WorkspaceFlutterWizard } from "./workspace-flutter-wizard";

const templates = [
  {
    id: "flutter",
    name: "Flutter App",
    description: "Multi-platform app with Dart",
    icon: Smartphone,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    borderColor: "border-sky-400/20",
    isDefault: true,
  },
  {
    id: "expo",
    name: "Expo Go",
    description: "React Native made easy",
    icon: Zap,
    color: "text-foreground",
    bg: "bg-foreground/5",
    borderColor: "border-border/50",
  },
  {
    id: "react-native",
    name: "React Native CLI",
    description: "Full control native app",
    icon: Atom,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    id: "android",
    name: "Android Native",
    description: "Kotlin / Java",
    icon: Bot,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
];

export function WorkspaceWelcome() {
  const setProjectName = useWorkspaceStore((s) => s.setProjectName);
  const setProjectPath = useWorkspaceStore((s) => s.setProjectPath);
  const [wizardOpen, setWizardOpen] = React.useState(false);

  const handleCreateProject = (templateId: string) => {
    if (templateId === "flutter") {
      setWizardOpen(true);
      return;
    }
    // Mock creating other projects
    setProjectName(`new-${templateId}-app`);
  };

  const handleOpenProject = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === "string") {
        const name = selected.split(/[/\\]/).pop() || "unknown-project";
        setProjectName(name);
        setProjectPath(selected);
      }
    } catch (e) {
      console.error("Failed to open folder:", e);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground overflow-hidden">
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-12 lg:gap-24">
          
          {/* Left: Branding & Recent */}
          <div className="flex flex-col justify-center space-y-10">
            <div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background mb-6">
                <Zap className="size-6 fill-current" />
              </div>
              <h1 className="text-4xl font-medium tracking-tight mb-2">Vela IDE</h1>
              <p className="text-muted-foreground">
                The next-generation workspace for mobile and web development.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
                Recent Projects
              </h2>
              <div className="flex flex-col gap-1 -mx-3">
                {[1, 2, 3].map((i) => (
                  <button
                    key={i}
                    onClick={handleOpenProject}
                    className="flex flex-col text-left px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium text-sm">rocket-ecommerce-app</span>
                    <span className="text-xs text-muted-foreground truncate">
                      ~/Developer/Projects/rocket-ecommerce-app
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col justify-center">
            <h2 className="text-2xl font-medium tracking-tight mb-6">Start Building</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleCreateProject(tpl.id)}
                  className={cn(
                    "group relative flex flex-col items-start p-5 rounded-2xl border text-left transition-all duration-200 outline-none",
                    "hover:bg-muted/40 hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring",
                    tpl.isDefault ? "border-foreground/30 bg-muted/20" : "border-border/50 bg-background"
                  )}
                >
                  {tpl.isDefault && (
                    <div className="absolute top-0 right-4 -translate-y-1/2">
                      <span className="bg-foreground text-background text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                  )}
                  <div className={cn("flex size-10 items-center justify-center rounded-xl border mb-4", tpl.bg, tpl.borderColor, tpl.color)}>
                    <tpl.icon className="size-5" />
                  </div>
                  <span className="font-medium mb-1">{tpl.name}</span>
                  <span className="text-xs text-muted-foreground">{tpl.description}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleOpenProject} variant="outline" className="h-11 px-6 rounded-full font-medium">
                <FolderOpen className="size-4 mr-2" />
                Open Folder
              </Button>
              <Button onClick={() => handleCreateProject('empty')} variant="ghost" className="h-11 px-6 rounded-full font-medium text-muted-foreground hover:text-foreground">
                <Plus className="size-4 mr-2" />
                Empty Canvas
              </Button>
            </div>
          </div>

        </div>
      </div>

      <WorkspaceFlutterWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
