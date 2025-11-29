"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Carrega o tema inicial
  useEffect(() => {
    const loadTheme = () => {
      try {
        const savedTheme = localStorage.getItem("theme") as Theme | null;

        if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
          setTheme(savedTheme);
          applyTheme(savedTheme);
        } else {
          // Verifica preferência do sistema
          const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches;
          const systemTheme = prefersDark ? "dark" : "light";
          setTheme(systemTheme);
          applyTheme(systemTheme);
        }
      } catch (error) {
        console.error("Erro ao carregar tema:", error);
        // Fallback para light mode
        setTheme("light");
        applyTheme("light");
      }
    };

    loadTheme();
    setMounted(true);
  }, []);

  // Função auxiliar para aplicar o tema
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;

    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  // Função de toggle
  const toggleTheme = () => {
    try {
      const newTheme = theme === "light" ? "dark" : "light";
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      applyTheme(newTheme);
    } catch (error) {
      console.error("Erro ao alternar tema:", error);
    }
  };

  // Evita flash de conteúdo não estilizado
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook personalizado
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  }

  return context;
}
