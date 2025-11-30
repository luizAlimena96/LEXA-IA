'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OrganizationContextType {
    selectedOrgId: string | null;
    setSelectedOrgId: (id: string | null) => void;
    organizations: any[];
    loadOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
    const [selectedOrgId, setSelectedOrgIdState] = useState<string | null>(null);
    const [organizations, setOrganizations] = useState<any[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('selectedOrgId');
        if (saved) {
            setSelectedOrgIdState(saved);
        }
    }, []);

    // Save to localStorage when changed
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
            if (!selectedOrgId && data.length > 0) {
                setSelectedOrgId(data[0].id);
            }
        } catch (error) {
            console.error('Error loading organizations:', error);
        }
    };

    useEffect(() => {
        loadOrganizations();
    }, []);

    return (
        <OrganizationContext.Provider
            value={{
                selectedOrgId,
                setSelectedOrgId,
                organizations,
                loadOrganizations,
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
