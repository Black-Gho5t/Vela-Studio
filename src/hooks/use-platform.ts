import * as React from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * Synchronous client-side check to determine if the platform is macOS.
 */
export function isPlatformMac(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform || nav.platform || "";
  const ua = nav.userAgent || "";
  return /Mac/i.test(platform) || /Macintosh|Mac OS X/i.test(ua);
}

/**
 * Hook to detect macOS platform and fullscreen state for the custom titlebar.
 * - On macOS windowed mode, reserves space for the native traffic light controls.
 * - On other OSes (or in native fullscreen), uses standard layout spacing.
 */
export function usePlatform() {
  const [isMac, setIsMac] = React.useState<boolean>(isPlatformMac);
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);

  React.useEffect(() => {
    // 1. Authoritative check via Tauri backend
    invoke<boolean>("is_macos")
      .then((mac) => setIsMac(mac))
      .catch(() => {
        // Fall back to browser detection if invoke fails
        setIsMac(isPlatformMac());
      });

    // 2. Track window fullscreen state to hide traffic-light inset when in full screen
    try {
      const appWindow = getCurrentWindow();
      appWindow.isFullscreen().then(setIsFullscreen).catch(() => {});

      const unlistenPromise = appWindow.onResized(() => {
        appWindow.isFullscreen().then(setIsFullscreen).catch(() => {});
      });

      return () => {
        unlistenPromise.then((unlisten) => unlisten()).catch(() => {});
      };
    } catch {
      // Running outside Tauri or window API unavailable
    }
  }, []);

  return {
    isMac,
    isFullscreen,
    /** True if we need left padding for the macOS window controls */
    hasMacTitleBarOffset: isMac && !isFullscreen,
  };
}
