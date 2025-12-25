"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
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
  const { user, loading } = useAuth();

  // Rotas onde NÃO deve aparecer a sidebar e topbar
  const hideLayout = pathname === "/login" || pathname === "/landing" || pathname === "/esqueceu-senha" || pathname === "/redefinir-senha" || pathname?.startsWith("/terms");

  // Rotas que não exigem autenticação
  const publicRoutes = ["/login", "/landing", "/esqueceu-senha", "/redefinir-senha", "/terms"];

  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));


  // Redirecionar para landing se não autenticado
  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.push("/landing");
    }
  }, [loading, user, pathname, router, isPublicRoute]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
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

      <div className={`${hideLayout ? "w-full" : "flex-1 flex flex-col"} `}>
        {!hideLayout && <OrganizationSelector />}
        {!hideLayout && <Topbar />}

        <main className={`${hideLayout ? "" : "flex-1 overflow-auto"} `}>
          {children}
        </main>
      </div>
    </div>
  );
}
