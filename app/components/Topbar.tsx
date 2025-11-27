"use client";

import { useState } from "react";

export default function Topbar() {
  const [notifications] = useState(3);

  return (
    <header className="w-full h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-6">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Bem-vindo, Luiz</h2>
        <p className="text-sm text-gray-500">Aqui está o resumo do seu dia</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            🔍
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <span className="text-lg">🔔</span>
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="font-bold text-white text-xs">LA</span>
          </div>
        </div>
      </div>
    </header>
  );
}
