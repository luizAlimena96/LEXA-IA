"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Rotas onde NÃO deve aparecer a sidebar
  const hideSidebar = pathname === "/login";

  return (
    <div className="min-h-screen flex">
      {!hideSidebar && <Sidebar />}
      <main className={`${hideSidebar ? "w-full" : "flex-1 overflow-auto"}`}>
        {children}
      </main>
    </div>
  );
}
