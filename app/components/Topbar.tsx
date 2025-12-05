"use client";

import { useState } from "react";
import { Search, Bell, User, ChevronDown, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { usePreserveOrgParam } from "../hooks/usePreserveOrgParam";

export default function Topbar() {
  const { data: session } = useSession();
  const { buildUrl } = usePreserveOrgParam();
  const [notifications] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notificationsList = [
    { id: 1, text: "Nova mensagem de João Silva", time: "2 min atrás" },
    { id: 2, text: "Reunião agendada para 14:00", time: "1 hora atrás" },
    { id: 3, text: "Relatório mensal disponível", time: "2 horas atrás" },
  ];

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
        <p className="text-sm text-gray-500">
          {session?.user?.organizationName || 'LEXA IA'} • {session?.user?.role === 'SUPER_ADMIN' ? 'Super Admin' : session?.user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-colors"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                {notifications}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowNotifications(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    Notificações
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificationsList.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <p className="text-sm text-gray-900 mb-1">
                        {notification.text}
                      </p>
                      <p className="text-xs text-gray-500">
                        {notification.time}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-200">
                  <button className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    Ver todas
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

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
