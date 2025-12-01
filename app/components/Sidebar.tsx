"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useOrganization } from "../contexts/OrganizationContext";

const menu = [
  { name: "Dashboard", path: "/dashboard", icon: "📊" },
  { name: "Conversas", path: "/whatsapp", icon: "💬" },
  { name: "Calendário", path: "/calendario", icon: "📅" },
  { name: "Agentes", path: "/agentes", icon: "🤖" },
  { name: "Feedback", path: "/feedback", icon: "⭐" },
  { name: "Relatórios", path: "/relatorios", icon: "📈" },
];

const superAdminMenu = [
  { name: "Clientes", path: "/clientes", icon: "🏢" },
  { name: "Integração CRM", path: "/admin/crm-integration", icon: "🔗" },
  { name: "Super Admin", path: "/admin/data", icon: "🔧" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  const { selectedOrgId, setSelectedOrgId, organizations } = useOrganization();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
  const allMenuItems = isSuperAdmin ? [...menu, ...superAdminMenu] : menu;

  return (
    <aside
      className={`h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col p-4 shadow-xl transition-all duration-300 sticky top-0 ${isCollapsed ? "w-20" : "w-64"
        }`}
    >
      {/* Logo e Botão de Toggle */}
      <div
        className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"
          } mb-8 p-4 border-b border-gray-700`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <img
                className="w-8 h-8 rounded-lg"
                src="https://94c6933ae855c71b70260ade5358091d.cdn.bubble.io/cdn-cgi/image/w=48,h=48,f=auto,dpr=1,fit=contain/f1751010354585x726206709064529400/lexa%20foto.png"
                alt="Logo"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                LEXA IA
              </h1>
              <p className="text-xs text-gray-400">Customer Intelligence</p>
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
          title={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {isCollapsed ? "➡️" : "⬅️"}
        </button>
      </div>



      {/* Menu de Navegação */}
      <nav className="flex flex-col gap-1 flex-1">
        {allMenuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center p-3 rounded-xl transition-all duration-200 group relative ${pathname === item.path
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-gray-300 hover:bg-gray-700 hover:text-white"
              } ${isCollapsed ? "justify-center" : ""}`}
            title={isCollapsed ? item.name : ""}
          >
            <span className="text-lg">{item.icon}</span>
            <span
              className={`font-medium transition-all duration-200 ${isCollapsed
                ? "w-0 opacity-0 ml-0 overflow-hidden"
                : "w-auto opacity-100 ml-3"
                }`}
            >
              {item.name}
            </span>

            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                {item.name}
              </div>
            )}
          </Link>
        ))}
      </nav>

      {/* User Info */}
      <div
        className={`p-4 border-t border-gray-700 ${isCollapsed ? "text-center" : ""
          }`}
      >
        <div
          className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"
            }`}
        >
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="font-bold text-white text-sm">
              {session?.user?.name?.substring(0, 2).toUpperCase() || 'LA'}
            </span>
          </div>
          <div
            className={`transition-all duration-200 ${isCollapsed
              ? "w-0 opacity-0 overflow-hidden"
              : "w-auto opacity-100"
              }`}
          >
            <p className="text-sm font-medium">{session?.user?.name || 'Usuário'}</p>
            <p className="text-xs text-gray-400">
              {session?.user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrador'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
