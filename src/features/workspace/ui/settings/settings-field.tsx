

export function SettingsField({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border/40 bg-background/50 p-6 transition-all hover:bg-muted/30">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none tracking-tight">{label}</h4>
        <p className="text-[12px] text-muted-foreground/70">{description}</p>
      </div>
      <div className="pt-2">
        {children}
      </div>
    </section>
  );
}
