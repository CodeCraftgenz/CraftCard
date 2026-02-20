import { APP_NAME } from '@/lib/constants';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-extrabold text-2xl tracking-tight ${className}`}>
      <span className="gradient-text">{APP_NAME}</span>
    </span>
  );
}
