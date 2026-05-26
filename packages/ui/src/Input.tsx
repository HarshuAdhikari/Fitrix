import * as React from "react";
import { cn } from "./cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, label, error, id, ...rest }, ref) {
    const inputId = id ?? React.useId();
    return (
      <div className="flex flex-col gap-1">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400",
            "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
            error ? "border-red-500 focus:ring-red-500/30" : "",
            className,
          )}
          {...rest}
        />
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </div>
    );
  },
);
