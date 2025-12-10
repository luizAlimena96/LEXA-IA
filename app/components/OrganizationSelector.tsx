'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface Organization {
    id: string;
    name: string;
    slug: string;
}

export default function OrganizationSelector() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const fetchOrganizations = async () => {
        // Guard: only fetch if SUPER_ADMIN
        if (session?.user?.role !== 'SUPER_ADMIN') {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/organizations', {
                method: 'GET',
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setOrganizations(data);
            } else {
                console.error('Failed to fetch organizations:', res.status);
            }
        } catch (error) {
            console.error('Error fetching organizations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch if user is logged in AND is SUPER_ADMIN
        if (session?.user?.role === 'SUPER_ADMIN') {
            fetchOrganizations();
        }
    }, [session?.user?.role]); // Only re-run when role changes

    // Listen for organization changes via custom event
    useEffect(() => {
        const handleOrganizationChange = () => {
            fetchOrganizations();
        };

        window.addEventListener('organizationChanged', handleOrganizationChange);
        return () => window.removeEventListener('organizationChanged', handleOrganizationChange);
    }, [session?.user?.role]); // Re-run when role changes

    useEffect(() => {
        const orgId = searchParams.get('organizationId');
        if (orgId) {
            setSelectedOrg(orgId);
        } else {
            setSelectedOrg('');
        }
    }, [searchParams]);

    const handleChange = async (orgId: string) => {
        setSelectedOrg(orgId);
        setLoading(true);

        try {
            // Atualizar a organização do Super Admin no banco
            const response = await fetch('/api/admin/assume-organization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: orgId || null }),
            });

            if (!response.ok) {
                throw new Error('Falha ao assumir organização');
            }

            const data = await response.json();

            // Atualizar URL
            const params = new URLSearchParams(searchParams.toString());
            if (orgId) {
                params.set('organizationId', orgId);
            } else {
                params.delete('organizationId');
            }

            // Mostrar feedback
            if (data.organizationName) {
                console.log(`✅ Agora trabalhando como: ${data.organizationName}`);
            } else {
                console.log('✅ Visualizando todas as organizações');
            }

            // Recarregar a página para atualizar a sessão
            window.location.href = `${pathname}?${params.toString()}`;
        } catch (error) {
            console.error('Erro ao trocar organização:', error);
            alert('Erro ao trocar de organização. Por favor, tente novamente.');
            setLoading(false);
        }
    };

    // Early returns AFTER all hooks
    if (session?.user?.role !== 'SUPER_ADMIN') {
        return null;
    }

    if (pathname?.startsWith('/admin/data') || pathname?.startsWith('/test-ai')) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-purple-200 dark:border-purple-800/50 transition-colors duration-300">
            <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <label className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                    Organização:
                </label>
            </div>

            <select
                value={selectedOrg}
                onChange={(e) => handleChange(e.target.value)}
                disabled={loading}
                className="px-3 py-1 text-sm border-2 border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-[#12121d] text-gray-700 dark:text-gray-200 font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-purple-400 dark:hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <option value="">Todas as Organizações</option>
                {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                        {org.name}
                    </option>
                ))}
            </select>

            <div className="ml-auto flex items-center gap-1.5 text-xs">
                <span className="px-2 py-0.5 bg-purple-600 text-white rounded-full font-semibold text-[10px]">
                    SUPER ADMIN
                </span>
                <span className="text-gray-600 dark:text-gray-400 text-xs">
                    {session?.user?.name}
                </span>
            </div>
        </div>
    );
}
