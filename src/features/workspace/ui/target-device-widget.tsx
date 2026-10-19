import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspaceStore } from "../model/workspace.store";
import { cn } from "@/lib/utils";

export interface TargetDeviceWidgetProps {
  className?: string;
}

export function TargetDeviceWidget({ className }: TargetDeviceWidgetProps) {
  const devices = useWorkspaceStore((state) => state.devices);
  const selectedDeviceId = useWorkspaceStore((state) => state.selectedDeviceId);
  const setSelectedDeviceId = useWorkspaceStore((state) => state.setSelectedDeviceId);

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/20 p-2 shadow-2xs",
        className
      )}
    >
      <div className="flex items-center justify-between px-1">
        <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground h-4 flex items-center">
          Target Device
        </div>
      </div>
      <Select
        value={selectedDeviceId || ""}
        onValueChange={(val) => {
          if (val && val !== "none") setSelectedDeviceId(val);
        }}
      >
        <SelectTrigger size="sm" className="w-full text-xs bg-muted/40 border-border/60">
          <SelectValue placeholder="No devices found" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {devices.length === 0 ? (
              <SelectItem value="none" disabled>
                No devices found
              </SelectItem>
            ) : (
              devices.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name} {d.platform ? `(${d.platform})` : ""}
                </SelectItem>
              ))
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
      {selectedDeviceId && (
        <div className="flex items-center gap-2 px-1">
          <div className="size-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-muted-foreground">Ready to run</span>
        </div>
      )}
    </div>
  );
}
