"use client";

import { useState } from "react";
import { User, ChevronDown, LogOut, Sun, Moon } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { usePreserveOrgParam } from "../hooks/usePreserveOrgParam";
import { useTheme } from "../contexts/ThemeContext";

export default function Topbar() {
  const { data: session } = useSession();
  const { buildUrl } = usePreserveOrgParam();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    signOut({ callbackUrl: `${origin}/login` });
  };

  return (
    <header className="w-full h-16 bg-white dark:bg-[#0f0f18] shadow-sm border-b border-gray-200 dark:border-gray-800/50 flex items-center justify-between px-6 transition-colors duration-300">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Bem-vindo, {session?.user?.name || 'Usuário'}
        </h2>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 active:scale-95"
          title={isDarkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="font-bold text-white text-xs">LA</span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400 hidden md:block" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#12121d] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {session?.user?.name || 'Usuário'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {session?.user?.email || 'email@exemplo.com'}
                  </p>
                </div>
                <div className="py-2">
                  <a
                    href={buildUrl("/perfil")}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Meu Perfil
                  </a>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left mt-2 border-t border-gray-200 dark:border-gray-700"
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
