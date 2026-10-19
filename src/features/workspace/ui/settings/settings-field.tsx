

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
    <section className="flex flex-col gap-3 rounded-lg border border-border/50 bg-card/40 p-5 transition-colors hover:bg-card/70">
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-medium leading-none tracking-tight text-foreground">{label}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="pt-1">
        {children}
      </div>
    </section>
  );
}
