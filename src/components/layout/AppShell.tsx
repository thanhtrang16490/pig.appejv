"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  // On login page: render children only, full-screen centered
  if (isLoginPage) {
    return <>{children}</>;
  }

  // On authenticated pages: render full layout with Header and BottomNav
  return (
    <>
      <Header />
      <div className="mx-auto max-w-lg lg:max-w-4xl xl:max-w-6xl min-h-full bg-white shadow-lg">
        <main className="pt-14 pb-20 px-4 py-4">{children}</main>
        <BottomNav />
      </div>
    </>
  );
}
