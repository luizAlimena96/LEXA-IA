"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, ChevronDown, LogOut, Sun, Moon, Coins } from "lucide-react";
import { useOrganization } from "@/app/contexts/OrganizationContext";
import { useAuth } from "@/app/contexts/AuthContext";
import OrganizationSelector from "./OrganizationSelector";
import { usePreserveOrgParam } from "../hooks/usePreserveOrgParam";
import { useTheme } from "../contexts/ThemeContext";
import NotificationCenter from './NotificationCenter';
import api from "../lib/api-client";

export default function Topbar() {
  const { selectedOrgId } = useOrganization();
  const { user, logout } = useAuth();
  const { buildUrl } = usePreserveOrgParam();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  // LexaCoins State
  const [lexaCoins, setLexaCoins] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!selectedOrgId) return;
      try {
        const response = await api.lexaCoins.getBalance(selectedOrgId);
        if (response.success) {
          setLexaCoins(response.data.balance);
        }
      } catch (error) {
        console.error("Failed to fetch LexaCoins balance:", error);
      }
    };

    fetchBalance();
    // Poll every minute to keep balance updated
    const interval = setInterval(fetchBalance, 60000);
    return () => clearInterval(interval);
  }, [selectedOrgId]);

  const handleLogout = () => {
    localStorage.removeItem('selectedOrgId');
    logout();
  };

  return (
    <header className="w-full h-16 bg-white dark:bg-[#0f0f18] shadow-sm border-b border-gray-200 dark:border-gray-800/50 flex items-center justify-between px-6 transition-colors duration-300">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Bem-vindo, {user?.name || 'Usuário'}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        {/* LEXA-COINS Indicator */}
        {lexaCoins !== null && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-100 dark:border-indigo-800 transition-colors">
            <Coins className="w-4 h-4" />
            <span className="font-bold text-sm">{lexaCoins.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
            <span className="text-xs opacity-70">LEXA</span>
          </div>
        )}

        <NotificationCenter />

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

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors"
          >
            {user?.image ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')}${user.image}?t=${new Date().getTime()}`}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="font-bold text-white text-xs">
                  {user?.name?.substring(0, 2).toUpperCase() || "US"}
                </span>
              </div>
            )}
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#12121d] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.email || 'email@exemplo.com'}
                  </p>
                </div>
                <div className="py-2">
                  <Link
                    href={buildUrl("/perfil")}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Meu Perfil
                  </Link>
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
