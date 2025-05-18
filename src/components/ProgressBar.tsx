import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, max, className, showLabel = true }: ProgressBarProps) {
  const percentage = Math.min(100, (value / max) * 100);
  const isOvertime = value > max;

  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-2 w-full rounded-full bg-muted overflow-hidden", className)}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isOvertime ? "bg-red-500" : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn(
          "text-sm font-medium",
          isOvertime ? "text-red-500" : "text-muted-foreground"
        )}>
          {value.toFixed(1)}h
        </span>
      )}
    </div>
  );
} 