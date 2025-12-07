'use client';

import { Suspense } from 'react';
import { SessionProvider } from 'next-auth/react';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { ThemeProvider } from './contexts/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider>
                <Suspense fallback={<div>Loading...</div>}>
                    <OrganizationProvider>
                        {children}
                    </OrganizationProvider>
                </Suspense>
            </ThemeProvider>
        </SessionProvider>
    );
}
