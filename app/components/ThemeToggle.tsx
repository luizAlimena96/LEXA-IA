"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
      aria-label={`Mudar para modo ${theme === "light" ? "escuro" : "claro"}`}
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 flex-shrink-0" />
      ) : (
        <Sun className="w-5 h-5 flex-shrink-0" />
      )}
      <span className="font-medium">
        {theme === "light" ? "Modo Escuro" : "Modo Claro"}
      </span>
    </button>
  );
}
