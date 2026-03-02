type PageShellProps = {
  title: string;
  description: string;
};

export function PageShell({ title, description }: PageShellProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-3xl text-base opacity-80">{description}</p>
    </section>
  );
}
