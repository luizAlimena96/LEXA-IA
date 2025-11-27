"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Conversas", path: "/conversas" },
  { name: "Whatsapp", path: "/whatsapp" },
  { name: "Calendário", path: "/calendario" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col p-4">
      <h1 className="text-xl font-bold mb-6">CRM System</h1>

      <nav className="flex flex-col gap-2">
        {menu.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`p-3 rounded-lg transition ${
              pathname === item.path ? "bg-gray-700" : "hover:bg-gray-800"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
