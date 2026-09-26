import type { ComponentPropsWithoutRef, HTMLAttributes } from "react";
import styles from "./page-surfaces.module.css";

/** One page landmark. Local classes own page-specific spacing and backgrounds. */
export function PageFrame({ className = "", ...props }: ComponentPropsWithoutRef<"main">) {
  return <main className={`${styles.page} ${className}`.trim()} {...props} />;
}

type SurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "li";
  variant?: "plain" | "framed";
};

/** Keep the existing semantic element; opt into the shared JSG decorative frame. */
export function Surface({ as: Tag = "div", variant = "plain", className = "", ...props }: SurfaceProps) {
  return (
    <Tag
      className={[styles.surface, variant === "framed" ? styles.framed : "", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
