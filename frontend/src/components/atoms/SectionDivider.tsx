export function SectionDivider() {
  return (
    <div className="relative h-px w-full max-w-4xl mx-auto my-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
      <div className="absolute inset-0 section-divider-shimmer" />
    </div>
  );
}
