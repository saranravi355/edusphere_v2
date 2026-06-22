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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold font-heading text-navy-900 dark:text-slate-100">{title}</h1>
        {description && <p className="text-slate-500 mt-1">{description}</p>}
      </div>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}
