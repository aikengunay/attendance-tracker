import Link from "next/link";

import { cn } from "@/lib/utils";

const sizeStyles = {
  default: {
    mark: "size-7",
    markPx: 28,
    text: "text-base",
  },
  lg: {
    mark: "size-8",
    markPx: 32,
    text: "text-xl",
  },
} as const;

export function BrandLockup({
  href = "/",
  className,
  size = "default",
}: {
  href?: string;
  className?: string;
  size?: keyof typeof sizeStyles;
}) {
  const styles = sizeStyles[size];

  return (
    <Link
      href={href}
      className={cn("flex items-center gap-1.5 font-brand", className)}
    >
      <img
        src="/brand/brand.png"
        alt=""
        width={styles.markPx}
        height={styles.markPx}
        className={styles.mark}
      />
      <span
        className={cn(
          "font-semibold tracking-tight text-foreground",
          styles.text,
        )}
      >
        PresentPo
      </span>
    </Link>
  );
}
