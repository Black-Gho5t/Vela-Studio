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
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center animate-pulse">
          <Zap className="size-12 mb-4 text-sky-400" />
          <h2 className="text-lg font-medium">Starting Vela Engine...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div className="flex max-w-md flex-col items-center text-center p-8 border border-border/50 rounded-xl bg-muted/20 shadow-2xl">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-400 mb-6">
          <Zap className="size-8 fill-current" />
        </div>
        <h1 className="text-2xl font-semibold mb-3">Vela Engine Required</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Vela IDE requires the Flutter SDK to function. We couldn't find an existing installation. We can download and configure it for you automatically.
        </p>

        {installing ? (
          <div className="w-full flex flex-col items-center space-y-4">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden relative">
              <div className="absolute inset-0 bg-sky-400/50 animate-pulse" />
            </div>
            <p className="text-xs font-medium text-sky-400">{progressMsg}</p>
          </div>
        ) : (
          <Button onClick={handleInstall} className="w-full bg-sky-500 hover:bg-sky-600 text-white">
            Install Flutter SDK
          </Button>
        )}
      </div>
    </div>
  );
}
