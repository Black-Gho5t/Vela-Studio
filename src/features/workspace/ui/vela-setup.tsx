import * as React from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export function VelaSetupScreen({ onComplete }: { onComplete: () => void }) {
  const [checking, setChecking] = React.useState(true);
  const [installing, setInstalling] = React.useState(false);
  const [progressMsg, setProgressMsg] = React.useState("");

  React.useEffect(() => {
    invoke<boolean>("check_flutter_installation")
      .then((installed) => {
        if (installed) {
          onComplete();
        } else {
          setChecking(false);
        }
      })
      .catch((err) => {
        console.error("Failed to check Flutter installation:", err);
        setChecking(false);
      });
  }, [onComplete]);

  const handleInstall = async () => {
    setInstalling(true);
    setProgressMsg("Starting download...");
    
    const unlisten = await listen<string>("flutter-install-progress", (event) => {
      setProgressMsg(event.payload);
    });

    try {
      await invoke("install_flutter_sdk");
      onComplete();
    } catch (err) {
      console.error("Installation failed:", err);
      setProgressMsg("Error: " + err);
      setInstalling(false);
    } finally {
      unlisten();
    }
  };

  if (checking) {
    return (
      <div data-tauri-drag-region className="flex h-screen w-screen items-center justify-center bg-background text-foreground select-none">
        <div className="flex flex-col items-center animate-pulse gap-3">
          <Zap className="size-10 text-primary" />
          <h2 className="text-base font-medium text-muted-foreground">Starting Vela Engine...</h2>
        </div>
      </div>
    );
  }

  return (
    <div data-tauri-drag-region className="flex h-screen w-screen items-center justify-center bg-background text-foreground p-4 select-none">
      <div className="flex max-w-md w-full flex-col items-center text-center p-8 border border-border rounded-xl bg-card text-card-foreground shadow-xl">
        <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
          <Zap className="size-7 fill-current" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Vela Engine Required</h1>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Vela IDE requires the Flutter SDK to function. We couldn&apos;t find an existing installation. We can download and configure it for you automatically.
        </p>

        {installing ? (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden relative">
              <div className="absolute inset-0 bg-primary/70 animate-pulse" />
            </div>
            <p className="text-xs font-medium text-primary">{progressMsg}</p>
          </div>
        ) : (
          <Button onClick={handleInstall} variant="default" className="w-full font-medium">
            Install Flutter SDK
          </Button>
        )}
      </div>
    </div>
  );
}

