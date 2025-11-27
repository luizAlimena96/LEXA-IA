"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { name: "Dashboard", path: "/dashboard", icon: "📊" },
  { name: "Conversas", path: "/conversas", icon: "💬" },
  { name: "WhatsApp", path: "/whatsapp", icon: "📱" },
  { name: "Calendário", path: "/calendario", icon: "📅" },
  { name: "Feedback", path: "/feedback", icon: "⭐" },
  { name: "Relatórios", path: "/relatorios", icon: "📈" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col p-4 shadow-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 p-4 border-b border-gray-700">
        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <img
            className="absolute w-12 h-12"
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

      {/* Menu de Navegação */}
      <nav className="flex flex-col gap-1 flex-1">
        {menu.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
              pathname === item.path
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="font-bold text-white text-sm">LA</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Luiz Alimena</p>
            <p className="text-xs text-gray-400">Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
