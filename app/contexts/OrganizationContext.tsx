'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface OrganizationContextType {
    selectedOrgId: string | null;
    setSelectedOrgId: (id: string | null) => void;
    organizations: any[];
    loadOrganizations: () => Promise<void>;
    triggerRefresh: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
    const [selectedOrgId, setSelectedOrgIdState] = useState<string | null>(null);
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const searchParams = useSearchParams();

    const router = useRouter();
    const pathname = usePathname();

    // Sync with URL param
    useEffect(() => {
        const orgIdFromUrl = searchParams.get('organizationId');
        if (orgIdFromUrl) {
            setSelectedOrgIdState(orgIdFromUrl);
            localStorage.setItem('selectedOrgId', orgIdFromUrl);
        }
    }, [searchParams]);

    // Load from localStorage on mount if no URL param
    useEffect(() => {
        const saved = localStorage.getItem('selectedOrgId');
        const orgIdFromUrl = searchParams.get('organizationId');

        if (!orgIdFromUrl && saved) {
            setSelectedOrgIdState(saved);
            // Update URL to reflect the saved state
            const params = new URLSearchParams(searchParams.toString());
            params.set('organizationId', saved);
            router.replace(`${pathname}?${params.toString()}`);
        }
    }, [pathname, searchParams, router]);

    // Save to localStorage when changed manually
    const setSelectedOrgId = (id: string | null) => {
        setSelectedOrgIdState(id);
        if (id) {
            localStorage.setItem('selectedOrgId', id);
        } else {
            localStorage.removeItem('selectedOrgId');
        }
    };

    const loadOrganizations = async () => {
        try {
            const res = await fetch('/api/organizations');
            const data = await res.json();
            setOrganizations(data);

            // Auto-select first org if none selected
            // Check current URL param and localStorage to avoid overwriting
            const currentOrgId = searchParams.get('organizationId') || localStorage.getItem('selectedOrgId');

            if (!currentOrgId && !selectedOrgId && data.length > 0) {
                setSelectedOrgId(data[0].id);
            }
        } catch (error) {
            console.error('Error loading organizations:', error);
        }
    };

    const triggerRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    useEffect(() => {
        loadOrganizations();
    }, [refreshTrigger]);

    return (
        <OrganizationContext.Provider
            value={{
                selectedOrgId,
                setSelectedOrgId,
                organizations,
                loadOrganizations,
                triggerRefresh,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within OrganizationProvider');
    }
    return context;
}
