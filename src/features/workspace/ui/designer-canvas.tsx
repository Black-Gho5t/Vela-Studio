import * as React from "react";
import { Plus, Minus, Focus, Smartphone, Hand } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CANVAS_SIZE = 4000;
const MIN_SCALE = 0.25;
const MAX_SCALE = 2.0;

interface DesignerCanvasProps {
  children?: React.ReactNode;
  className?: string;
  isRightSidebarOpen?: boolean;
}

export function DesignerCanvas({
  children,
  className,
  isRightSidebarOpen = false,
}: DesignerCanvasProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [isSpacePressed, setIsSpacePressed] = React.useState(false);
  const [isPanning, setIsPanning] = React.useState(false);
  const isPanningRef = React.useRef(false);
  const panStartRef = React.useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Center the artboard within the viewport
  const centerArtboard = React.useCallback((smooth = true) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const targetX = (CANVAS_SIZE - viewport.clientWidth) / 2;
    const targetY = (CANVAS_SIZE - viewport.clientHeight) / 2;
    if (targetX >= 0 && targetY >= 0) {
      viewport.scrollTo({
        left: targetX,
        top: targetY,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);

  // Initial centering on mount
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      centerArtboard(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [centerArtboard]);

  // Handle Space key for pan mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        if (isPanningRef.current) {
          isPanningRef.current = false;
          setIsPanning(false);
        }
      }
    };

    const handleBlur = () => {
      setIsSpacePressed(false);
      isPanningRef.current = false;
      setIsPanning(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Handle Ctrl/Cmd + Wheel for smooth zooming
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale((prev) => {
          const next = Math.round((prev + delta) * 10) / 10;
          return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
        });
      }
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Pointer drag for panning (Middle click or Space + Left click)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const isMiddleClick = e.button === 1;
    const isSpaceLeftClick = isSpacePressed && e.button === 0;

    if (isMiddleClick || isSpaceLeftClick) {
      const viewport = viewportRef.current;
      if (!viewport) return;

      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      isPanningRef.current = true;
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop,
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    e.preventDefault();
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    viewport.scrollLeft = panStartRef.current.scrollLeft - dx;
    viewport.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      setIsPanning(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if capture was already released
      }
    }
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(MAX_SCALE, Math.round((prev + 0.1) * 10) / 10));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(MIN_SCALE, Math.round((prev - 0.1) * 10) / 10));
  };

  const resetZoom = () => {
    setScale(1);
  };

  const cursorClass = isPanning
    ? "cursor-grabbing"
    : isSpacePressed
      ? "cursor-grab"
      : "cursor-default";

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden select-none bg-muted/10", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <ScrollArea
        viewportRef={viewportRef}
        className="h-full w-full"
        viewportClassName={cn("relative outline-none", cursorClass)}
      >
        {/* Infinite 2D Surface with dot grid */}
        <div
          style={{
            width: `${CANVAS_SIZE}px`,
            height: `${CANVAS_SIZE}px`,
            backgroundImage:
              "radial-gradient(var(--color-border) 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
          className="relative min-w-[4000px] min-h-[4000px]"
        >
          {/* Centered Artboard Anchor */}
          <div
            className="absolute left-1/2 top-1/2 flex flex-col items-center transition-transform duration-75"
            style={{
              transform: `translate(-50%, -50%) scale(${scale})`,
              transformOrigin: "center center",
            }}
          >
            {/* Artboard Frame Header */}
            <div className="mb-3 flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 shadow-xs backdrop-blur-md">
              <Smartphone className="size-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">iPhone 16 Pro</span>
              <span className="text-[10px] text-muted-foreground">• 375 × 812</span>
            </div>

            {/* Device Mockup Artboard */}
            <div className="relative h-[812px] w-[375px] shrink-0 overflow-hidden rounded-[2.75rem] border-[10px] border-zinc-900 bg-background shadow-2xl ring-1 ring-border/50 dark:border-zinc-800">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-2 inset-x-0 z-50 mx-auto flex h-6 w-28 items-center justify-center rounded-full bg-black">
                <div className="size-2.5 rounded-full bg-zinc-900" />
              </div>

              {/* Screen Content */}
              <div className="relative flex h-full w-full flex-col overflow-hidden bg-background pt-7">
                {children ? (
                  children
                ) : (
                  <div className="flex h-full w-full flex-col">
                    {/* Default AppBar */}
                    <div className="flex h-14 w-full items-center justify-between border-b border-border/40 bg-card px-4">
                      <span className="text-sm font-semibold tracking-tight text-foreground">
                        Vela Studio
                      </span>
                    </div>

                    {/* Canvas Placeholder Body */}
                    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Smartphone className="size-6" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">Canvas Infinito</h3>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-[220px]">
                        Espacio infinito para diseñar y componer la interfaz de tu aplicación Flutter.
                      </p>
                    </div>

                    {/* Home Indicator */}
                    <div className="pb-2 pt-1 flex justify-center">
                      <div className="h-1 w-32 rounded-full bg-foreground/20" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Floating HUD: Zoom Controls & Center */}
      <div
        className={cn(
          "absolute bottom-4 z-30 flex items-center gap-1 rounded-lg border border-border/60 bg-background/90 p-1 shadow-lg backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isRightSidebarOpen ? "right-[272px]" : "right-4"
        )}
      >
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={zoomOut}
          disabled={scale <= MIN_SCALE}
          title="Zoom Out (Ctrl + Wheel)"
        >
          <Minus className="size-3.5" />
        </Button>
        <button
          type="button"
          onClick={resetZoom}
          className="h-6 min-w-[46px] rounded px-1.5 text-center font-mono text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
          title="Restablecer a 100%"
        >
          {Math.round(scale * 100)}%
        </button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={zoomIn}
          disabled={scale >= MAX_SCALE}
          title="Zoom In (Ctrl + Wheel)"
        >
          <Plus className="size-3.5" />
        </Button>
        <div className="mx-0.5 h-3.5 w-px bg-border/60" />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => centerArtboard(true)}
          title="Centrar Artboard"
        >
          <Focus className="size-3.5" />
        </Button>
      </div>

      {/* Helpful Hint Pill when Space is held */}
      {isSpacePressed && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full border border-border/60 bg-background/90 px-3 py-1 shadow-md backdrop-blur-md">
          <Hand className="size-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">
            {isPanning ? "Arrastrando canvas..." : "Modo mano: haz clic y arrastra"}
          </span>
        </div>
      )}
    </div>
  );
}
