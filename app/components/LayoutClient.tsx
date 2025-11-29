"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Rotas onde NÃO deve aparecer a sidebar e topbar
  const hideLayout = pathname === "/login" || pathname === "/esqueceu-senha";

  return (
    <div className="min-h-screen flex">
      {!hideLayout && <Sidebar />}

      <div className={`${hideLayout ? "w-full" : "flex-1 flex flex-col"}`}>
        {!hideLayout && <Topbar />}

        <main className={`${hideLayout ? "" : "flex-1 overflow-auto"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
