"use client";

import { useState } from "react";
import { User, ChevronDown, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { usePreserveOrgParam } from "../hooks/usePreserveOrgParam";

export default function Topbar() {
  const { data: session } = useSession();
  const { buildUrl } = usePreserveOrgParam();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    signOut({ callbackUrl: `${origin}/login` });
  };

  return (
    <header className="w-full h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-6 transition-colors">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          Bem-vindo, {session?.user?.name || 'Usuário'}
        </h2>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="font-bold text-white text-xs">LA</span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-600 hidden md:block" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="p-4 border-b border-gray-200">
                  <p className="font-semibold text-gray-900">
                    {session?.user?.name || 'Usuário'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {session?.user?.email || 'email@exemplo.com'}
                  </p>
                </div>
                <div className="py-2">
                  <a
                    href={buildUrl("/perfil")}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Meu Perfil
                  </a>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors text-left mt-2 border-t border-gray-200"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
