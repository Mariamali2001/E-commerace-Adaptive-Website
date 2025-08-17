// components/shared/Button.tsx
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("btn bg-neutral-900 text-white hover:opacity-90", className)} {...props} />;
}
