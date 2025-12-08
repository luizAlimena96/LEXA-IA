'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface ThemeContextType {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    isDarkMode: false,
    toggleTheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Carregar preferência do localStorage na montagem
    useEffect(() => {
        const savedTheme = localStorage.getItem('lexa-theme');

        if (savedTheme === 'dark') {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else if (savedTheme === 'light') {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        } else {
            // Verificar preferência do sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(prefersDark);
            if (prefersDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setIsDarkMode(prev => {
            const newValue = !prev;

            // Aplicar classe no DOM imediatamente
            if (newValue) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('lexa-theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('lexa-theme', 'light');
            }

            console.log('Theme toggled to:', newValue ? 'dark' : 'light');
            return newValue;
        });
    }, []);

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    return context;
}

