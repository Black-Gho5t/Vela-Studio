
import { ChevronDown, Globe, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SettingsSectionId, settingsGroups, flatItems } from "../../config/workspace.constants";

interface SettingsSidebarProps {
  section: SettingsSectionId;
  setSection: (section: SettingsSectionId) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

function SidebarAction({ icon: Icon, className }: { icon: any; className?: string }) {
  return (
    <div className={cn("ml-auto size-4 flex items-center justify-center text-muted-foreground/40", className)}>
      <Icon className="size-3" />
    </div>
  );
}

export function SettingsSidebar({
  section,
  setSection,
  searchQuery,
  setSearchQuery,
}: SettingsSidebarProps) {
  return (
    <Sidebar collapsible="none" className="hidden border-r border-border/40 md:flex w-[360px] bg-background overflow-x-hidden">
      <SidebarContent className="p-3 overflow-x-hidden no-scrollbar">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative group">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-foreground transition-colors">
               <Search className="size-3.5" />
             </div>
             <Input 
               placeholder="Search settings..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="h-8 pl-9 bg-muted/40 border-border/40 text-[12px] tracking-[0.24px] focus-visible:ring-1 focus-visible:ring-foreground rounded-full"
             />
          </div>
        </div>
        
        <SidebarMenu className="gap-1">
          {settingsGroups.map((group) => (
            <Collapsible
              key={group.id}
              defaultOpen={false}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="h-8 text-[13px] font-semibold tracking-[0.24px] text-foreground/90 hover:text-foreground hover:bg-muted/50 transition-all px-3 rounded-full">
                    <ChevronDown className="size-3.5 transition-transform group-data-[state=open]/collapsible:rotate-0 -rotate-90 opacity-60 shrink-0" />
                    <span className="truncate">{group.title}</span>
                    {group.id === "version-control" && <SidebarAction icon={Globe} />}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu className="mt-1 pl-4 gap-0.5">
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={item.id === section}
                          onClick={() => setSection(item.id)}
                          className={cn(
                            "h-7 text-[12px] px-4 tracking-[0.24px] transition-colors rounded-full",
                            item.id === section 
                              ? "bg-foreground text-background font-semibold" 
                              : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/40"
                          )}
                        >
                          <span className="truncate">{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}

          {/* Flat Items (Keymap, Plugins, etc.) */}
          <div className="mt-2 pt-2 border-t border-border/40 space-y-0.5">
            {flatItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                 <SidebarMenuButton
                   isActive={item.id === section}
                   onClick={() => setSection(item.id as SettingsSectionId)}
                   className={cn(
                     "h-8 text-[13px] font-semibold tracking-[0.24px] px-4 transition-all w-full rounded-full",
                     item.id === section 
                       ? "bg-foreground text-background" 
                       : "text-foreground/90 hover:text-foreground hover:bg-muted/50"
                   )}
                 >
                   <span className="truncate">{item.title}</span>
                   {["backup", "advanced", "experimental"].includes(item.id) && <SidebarAction icon={Globe} className="ml-auto" />}
                 </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </div>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
