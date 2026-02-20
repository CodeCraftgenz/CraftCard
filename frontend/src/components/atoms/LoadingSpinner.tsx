export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div
      className={`${sizeClasses[size]} border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin`}
    />
  );
}
