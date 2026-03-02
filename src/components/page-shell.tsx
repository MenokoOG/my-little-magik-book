type PageShellProps = {
  title: string;
  description: string;
};

export function PageShell({ title, description }: PageShellProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <p className="max-w-3xl text-base opacity-80">{description}</p>
    </section>
  );
}
