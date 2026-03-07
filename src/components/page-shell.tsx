type PageShellProps = {
  title: string;
  description: string;
};

export function PageShell({ title, description }: PageShellProps) {
  return (
    <section className="mlmb-panel rounded-2xl p-5">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <p className="mlmb-muted mt-2 max-w-3xl text-base">
        {description}
      </p>
    </section>
  );
}
