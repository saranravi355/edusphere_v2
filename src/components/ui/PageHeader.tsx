export default function PageHeader({ 
  title, 
  description,
  action
}: { 
  title: string, 
  description?: string,
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-border pb-5">
      <div>
        <h1 className="text-3xl font-semibold font-heading text-foreground tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {action && (
        <div className="shrink-0">{action}</div>
      )}
    </div>
  );
}
