"use client";

/**
 * Client-side providers wrapper.
 * NextAuth's SessionProvider must be a client component,
 * so we wrap it here and import into the server root layout.
 */

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
