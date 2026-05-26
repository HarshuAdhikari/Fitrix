import * as React from "react";
import { cn } from "./cn";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

export function Spinner({ className, size = 20, ...rest }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-slate-300 border-t-brand-500",
        className,
      )}
      style={{ width: size, height: size }}
      {...rest}
    />
  );
}
