import * as React from "react";
import { cn } from "./cn";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
}

const SIZE: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

function initialsOf(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({
  className,
  src,
  name,
  size = "md",
  ...rest
}: AvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full bg-brand-500 font-semibold text-white",
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? "avatar"} className="h-full w-full object-cover" />
      ) : (
        <span>{initialsOf(name)}</span>
      )}
    </div>
  );
}
