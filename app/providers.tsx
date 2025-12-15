'use client';

import { OrganizationProvider } from './contexts/OrganizationContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <OrganizationProvider>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </OrganizationProvider>
        </AuthProvider>
    );
}
