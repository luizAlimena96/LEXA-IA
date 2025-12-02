'use client';

import { useSearchParams } from 'next/navigation';

/**
 * Hook customizado para preservar o parâmetro organizationId na navegação
 * Útil para Super Admins que precisam manter o contexto da organização selecionada
 */
export function usePreserveOrgParam() {
    const searchParams = useSearchParams();
    const orgId = searchParams.get('organizationId');

    /**
     * Constrói uma URL preservando o parâmetro organizationId se existir
     * @param path - Caminho da URL (ex: '/dashboard')
     * @returns URL com organizationId preservado se existir
     */
    const buildUrl = (path: string): string => {
        if (!orgId) return path;

        const separator = path.includes('?') ? '&' : '?';
        return `${path}${separator}organizationId=${orgId}`;
    };

    return { buildUrl, orgId };
}
