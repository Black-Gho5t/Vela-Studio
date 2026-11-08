import { cn } from "@/lib/utils";

export type AlignmentValue =
  | "topLeft"
  | "topCenter"
  | "topRight"
  | "centerLeft"
  | "center"
  | "centerRight"
  | "bottomLeft"
  | "bottomCenter"
  | "bottomRight";

interface DesignerAlignmentMatrixProps {
  value?: AlignmentValue;
  onChange: (value: AlignmentValue) => void;
  className?: string;
}

const ROWS: AlignmentValue[][] = [
  ["topLeft", "topCenter", "topRight"],
  ["centerLeft", "center", "centerRight"],
  ["bottomLeft", "bottomCenter", "bottomRight"],
];

const LABELS: Record<AlignmentValue, string> = {
  topLeft: "Superior Izquierda",
  topCenter: "Superior Centro",
  topRight: "Superior Derecha",
  centerLeft: "Centro Izquierda",
  center: "Centro",
  centerRight: "Centro Derecha",
  bottomLeft: "Inferior Izquierda",
  bottomCenter: "Inferior Centro",
  bottomRight: "Inferior Derecha",
};

export function DesignerAlignmentMatrix({
  value = "topLeft",
  onChange,
  className,
}: DesignerAlignmentMatrixProps) {
  return (
    <div
      className={cn(
        "h-[68px] w-full p-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/30 flex flex-col justify-between select-none",
        className
      )}
    >
      {ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="flex items-center justify-between px-1">
          {row.map((item) => {
            const isSelected = value === item;

            // Pill styling for active dot matching Figma's axis visual
            let activeIndicator = "size-2 rounded-full bg-primary shadow-xs";
            if (item === "centerLeft" || item === "centerRight") {
              activeIndicator = "w-1.5 h-3.5 rounded-full bg-primary shadow-xs";
            } else if (item === "topCenter" || item === "bottomCenter") {
              activeIndicator = "w-3.5 h-1.5 rounded-full bg-primary shadow-xs";
            } else if (item === "center") {
              activeIndicator = "size-2.5 rounded-full bg-primary shadow-xs";
            }

            return (
              <button
                key={item}
                type="button"
                title={LABELS[item]}
                onClick={() => onChange(item)}
                className="size-5 flex items-center justify-center rounded-xs transition-all hover:bg-sidebar-accent/60 group"
              >
                {isSelected ? (
                  <div className={activeIndicator} />
                ) : (
                  <div className="size-1.5 rounded-full bg-muted-foreground/35 group-hover:bg-foreground/60 transition-all" />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
