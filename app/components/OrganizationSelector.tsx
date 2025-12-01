'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Organization {
    id: string;
    name: string;
    slug: string;
}

export default function OrganizationSelector() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (session?.user?.role === 'SUPER_ADMIN') {
            fetchOrganizations();
        }
    }, [session]);

    useEffect(() => {
        const orgId = searchParams.get('organizationId');
        if (orgId) {
            setSelectedOrg(orgId);
        }
    }, [searchParams]);

    const fetchOrganizations = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/organizations', {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setOrganizations(data);
            }
        } catch (error) {
            console.error('Error fetching organizations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (orgId: string) => {
        setSelectedOrg(orgId);
        const params = new URLSearchParams(searchParams.toString());
        if (orgId) {
            params.set('organizationId', orgId);
        } else {
            params.delete('organizationId');
        }
        router.push(`?${params.toString()}`);
    };

    // Só mostra para Super Admin
    if (session?.user?.role !== 'SUPER_ADMIN') {
        return null;
    }

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200">
            <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <label className="text-sm font-semibold text-purple-700">
                    Organização:
                </label>
            </div>

            <select
                value={selectedOrg}
                onChange={(e) => handleChange(e.target.value)}
                disabled={loading}
                className="px-4 py-2 border-2 border-purple-300 rounded-lg bg-white text-gray-700 font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <option value="">Todas as Organizações</option>
                {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                        {org.name}
                    </option>
                ))}
            </select>

            <div className="ml-auto flex items-center gap-2 text-sm">
                <span className="px-3 py-1 bg-purple-600 text-white rounded-full font-semibold text-xs">
                    SUPER ADMIN
                </span>
                <span className="text-gray-600">
                    {session?.user?.name}
                </span>
            </div>
        </div>
    );
}
