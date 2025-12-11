'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
    const [isInitialized, setIsInitialized] = useState(false);
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    const router = useRouter();
    const pathname = usePathname();

    // Single initialization effect - runs only once on mount
    useEffect(() => {
        if (isInitialized) return;

        const orgIdFromUrl = searchParams.get('organizationId');
        const savedOrgId = localStorage.getItem('selectedOrgId');

        if (orgIdFromUrl) {
            // URL takes precedence
            setSelectedOrgIdState(orgIdFromUrl);
            if (orgIdFromUrl !== savedOrgId) {
                localStorage.setItem('selectedOrgId', orgIdFromUrl);
            }
        } else if (savedOrgId) {
            // Restore from localStorage
            setSelectedOrgIdState(savedOrgId);
            const params = new URLSearchParams(searchParams.toString());
            params.set('organizationId', savedOrgId);
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }

        setIsInitialized(true);
    }, []); // Run only once on mount

    // Sync URL changes after initialization
    useEffect(() => {
        if (!isInitialized) return;

        const orgIdFromUrl = searchParams.get('organizationId');
        if (orgIdFromUrl && orgIdFromUrl !== selectedOrgId) {
            setSelectedOrgIdState(orgIdFromUrl);
            localStorage.setItem('selectedOrgId', orgIdFromUrl);
        }
    }, [searchParams, isInitialized, selectedOrgId]);

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
        // Check authentication before making API call
        if (status !== 'authenticated') {
            console.log('[OrganizationContext] Skipping load - user not authenticated');
            return;
        }

        try {
            const res = await fetch('/api/organizations');

            // Handle 401 gracefully
            if (res.status === 401) {
                console.log('[OrganizationContext] Unauthorized - clearing organizations');
                setOrganizations([]);
                return;
            }

            if (!res.ok) {
                throw new Error('Failed to load organizations');
            }

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
            setOrganizations([]); // Clear on error
        }
    };

    const triggerRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    useEffect(() => {
        // Only load when authenticated
        if (status === 'authenticated') {
            loadOrganizations();
        }
    }, [refreshTrigger, status]);

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
