'use client';

import { Suspense } from 'react';
import { SessionProvider } from 'next-auth/react';
import { OrganizationProvider } from './contexts/OrganizationContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <Suspense fallback={<div>Loading...</div>}>
                <OrganizationProvider>
                    {children}
                </OrganizationProvider>
            </Suspense>
        </SessionProvider>
    );
}
