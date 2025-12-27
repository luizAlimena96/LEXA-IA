"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useOrganization } from "@/app/contexts/OrganizationContext";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreserveOrgParam } from "../hooks/usePreserveOrgParam";
import {
  LayoutDashboard,
  MessagesSquare,
  Users,
  Calendar,
  Bot,
  Star,
  BarChart3,
  User,
  Building2,
  Brain,
  Link2,
  Settings,
  Facebook,
  Kanban
} from "lucide-react";

const menu = [
  { id: "dashboard", name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { id: "crm", name: "CRM", path: "/crm", icon: Kanban },
  { id: "whatsapp", name: "Conversas", path: "/whatsapp", icon: MessagesSquare },
  { id: "contatos", name: "Contatos", path: "/contatos", icon: Users },
  { id: "calendario", name: "Calendário", path: "/calendario", icon: Calendar },
  { id: "agentes", name: "Agentes", path: "/agentes", icon: Bot },
  { id: "feedback", name: "Feedback", path: "/feedback", icon: Star },
  { id: "relatorios", name: "Relatórios", path: "/relatorios", icon: BarChart3 },
  { id: "perfil", name: "Perfil", path: "/perfil", icon: User },
];

const adminMenu = [
  { id: "crm-integration", name: "Integração CRM", path: "/admin/crm-integration", icon: Link2 },
  { id: "meta-leads", name: "Meta Lead Ads", path: "/admin/meta", icon: Facebook },
];

const superAdminMenu = [
  { id: "clientes", name: "Clientes", path: "/clientes", icon: Building2 },
  { id: "test-ai", name: "Teste de IA", path: "/test-ai", icon: Brain },
  { id: "super-admin", name: "Super Admin", path: "/admin/data", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const { selectedOrgId } = useOrganization();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN";
  const allowedTabs = user?.allowedTabs;

  let visibleMenu = menu;
  if (!isSuperAdmin && !isAdmin && Array.isArray(allowedTabs)) {
    visibleMenu = menu.filter(item => allowedTabs.includes(item.id) || item.id === "perfil");
  }

  let allMenuItems = visibleMenu;
  if (isSuperAdmin) {
    allMenuItems = [...visibleMenu, ...adminMenu, ...superAdminMenu];
  } else if (isAdmin) {
    allMenuItems = [...visibleMenu, ...adminMenu];
  }

  return (
    <aside
      className={`
        h-screen
        bg-white dark:bg-gray-900
        text-gray-800 dark:text-white flex flex-col p-3
        transition-all duration-300
        shadow-xl dark:shadow-2xl shadow-gray-200/50 dark:shadow-black/30
        border-r border-gray-200 dark:border-white/5
        sticky top-0 overflow-x-hidden z-50 shrink-0
        ${isCollapsed ? "w-20" : "w-64"}
      `}
    >
      <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} mb-5`}>
        {!isCollapsed && (
          <div className="flex items-center justify-center flex-1">
            <img
              className="h-10 w-auto object-contain"
              src="/Lexa logo roxo.png"
              alt="LEXA IA"
            />
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className={`
            p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700
            transition-all duration-300 shadow-md
            hover:scale-110 active:scale-95
            text-gray-700 dark:text-white
          `}
        >
          <span
            className={`block transition-transform duration-300 ${isCollapsed ? "rotate-180" : "rotate-0"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </span>
        </button>
      </div>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {allMenuItems.map(item => {
          const href = selectedOrgId ? `${item.path}?organizationId=${selectedOrgId}` : item.path;
          const Icon = item.icon;
          const active = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={href}
              className={`
                flex items-center p-2 rounded-lg 
                relative group
                transition-all duration-200 text-sm font-medium

                ${active
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/40"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/40 hover:text-gray-900 dark:hover:text-white"
                }

                ${isCollapsed
                  ? "h-12 justify-center p-0"
                  : "p-2 pl-3"
                }
              `}
              title={isCollapsed ? item.name : ""}
            >
              <div className={`
                flex items-center justify-center
                rounded-lg
                transition-all duration-200
                w-9 h-9 flex-shrink-0
              `}>
                <Icon
                  className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
                  strokeWidth={active ? 2 : 1.5}
                />
              </div>

              <span
                className={`
                  transition-all duration-200 ml-2
                  ${isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}
                `}
              >
                {item.name}
              </span>

              {isCollapsed && (
                <div className="
                  absolute left-full ml-3 px-2 py-1
                  bg-gray-900 dark:bg-gray-900/95 text-white text-xs rounded-lg shadow-lg
                  opacity-0 group-hover:opacity-100 
                  transition-opacity duration-200 
                  pointer-events-none whitespace-nowrap z-50
                ">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 dark:border-white/10 pt-3">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          {user?.image ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')}${user.image}?t=${new Date().getTime()}`}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover shadow-lg border border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="font-semibold text-white text-xs">
                {user?.name?.substring(0, 2).toUpperCase() || "US"}
              </span>
            </div>
          )}

          <div
            className={`
              transition-all duration-200 
              ${isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}
            `}
          >
            <p className="text-xs font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {user?.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}