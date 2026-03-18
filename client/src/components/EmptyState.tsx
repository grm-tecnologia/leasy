import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-14 h-14 border border-white/10 bg-white/[0.03] flex items-center justify-center mb-5">
        <Icon className="h-6 w-6 text-zinc-500" />
      </div>
      <h3 className="text-sm font-light text-white mb-1.5">{title}</h3>
      <p className="text-[10px] font-mono text-zinc-500 max-w-sm leading-relaxed uppercase tracking-widest">{description}</p>
      {(actionLabel || secondaryLabel) && (
        <div className="flex items-center gap-3 mt-6">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="px-5 py-2 text-[10px] uppercase tracking-widest text-white bg-[#FF4500] hover:bg-[#FF4500]/90 transition-colors"
            >
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondary && (
            <button
              onClick={onSecondary}
              className="px-5 py-2 text-[10px] uppercase tracking-widest text-zinc-400 border border-white/10 hover:bg-white/5 transition-colors"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
