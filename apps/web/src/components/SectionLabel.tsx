import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="h-0.5 w-4 shrink-0 bg-hairline" />
      <h2 className="eyebrow shrink-0 text-[0.8rem] text-muted-foreground">{children}</h2>
      <span className="h-0.5 flex-1 bg-hairline" />
    </div>
  );
}
