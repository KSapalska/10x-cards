import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  email?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Avatar({ email, className, children }: AvatarProps) {
  const initials = useMemo(() => {
    if (!email) return "U";
    const parts = email.split("@")[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  }, [email]);

  // Generuj kolor na podstawie emaila
  const backgroundColor = useMemo(() => {
    if (!email) return `oklch(0.7 0.15 180)`; // default color
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `oklch(0.7 0.15 ${hue})`;
  }, [email]);

  return (
    <div
      className={cn("flex items-center justify-center size-8 rounded-full text-xs font-semibold text-white", className)}
      style={{ backgroundColor }}
      aria-label={email ? `Avatar użytkownika ${email}` : "Avatar użytkownika"}
    >
      {children || initials}
    </div>
  );
}
