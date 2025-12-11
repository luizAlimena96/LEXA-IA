"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import OrganizationSelector from "./OrganizationSelector";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Rotas onde NÃO deve aparecer a sidebar e topbar
  const hideLayout = pathname === "/login" || pathname === "/esqueceu-senha" || pathname === "/redefinir-senha";

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (status === "unauthenticated" && !hideLayout) {
      router.push("/login");
    }
  }, [status, hideLayout, router]);

  // Mostrar loading enquanto verifica autenticação
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {!hideLayout && <Sidebar />}

      <div className={`${hideLayout ? "w-full" : "flex-1 flex flex-col"}`}>
        {!hideLayout && <OrganizationSelector />}
        {!hideLayout && <Topbar />}

        <main className={`${hideLayout ? "" : "flex-1 overflow-auto"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
