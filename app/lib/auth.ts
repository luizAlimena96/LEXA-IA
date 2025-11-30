import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AuthenticationError, AuthorizationError } from './errors';

/**
 * Authentication & Authorization Helpers
 * 
 * Funções para proteger rotas e verificar permissões
 */

export async function requireAuth() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        throw new AuthenticationError('Não autenticado');
    }

    return session.user;
}

export async function requireAdmin() {
    const user = await requireAuth();

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new AuthorizationError('Acesso negado. Apenas administradores.');
    }

    return user;
}

export async function requireSuperAdmin() {
    const user = await requireAuth();

    if (user.role !== 'SUPER_ADMIN') {
        throw new AuthorizationError('Acesso negado. Apenas Super Admins.');
    }

    return user;
}

/**
 * Retorna filtro de organização baseado no role do usuário
 * 
 * - SUPER_ADMIN: pode acessar qualquer organização (ou todas se não especificar)
 * - ADMIN/USER: só acessa sua própria organização
 */
export function getOrganizationFilter(
    user: { role: string; organizationId: string | null },
    requestedOrgId?: string | null
) {
    // Super Admin pode acessar qualquer organização
    if (user.role === 'SUPER_ADMIN') {
        // Se especificou uma organização, filtra por ela
        if (requestedOrgId) {
            return { organizationId: requestedOrgId };
        }
        // Se não especificou, retorna vazio (acessa todas)
        return {};
    }

    // Outros usuários só acessam sua própria organização
    if (!user.organizationId) {
        throw new AuthorizationError('Usuário sem organização associada');
    }

    return { organizationId: user.organizationId };
}

/**
 * Verifica se o usuário tem permissão para acessar uma organização específica
 */
export function canAccessOrganization(
    user: { role: string; organizationId: string | null },
    targetOrganizationId: string
): boolean {
    // Super Admin pode acessar qualquer organização
    if (user.role === 'SUPER_ADMIN') {
        return true;
    }

    // Outros usuários só podem acessar sua própria organização
    return user.organizationId === targetOrganizationId;
}

/**
 * Verifica se o usuário pode criar recursos para uma organização
 */
export function getOrganizationIdForCreate(
    user: { role: string; organizationId: string | null },
    requestedOrgId?: string | null
): string {
    // Super Admin pode criar para qualquer organização
    if (user.role === 'SUPER_ADMIN' && requestedOrgId) {
        return requestedOrgId;
    }

    // Outros usuários só podem criar para sua própria organização
    if (!user.organizationId) {
        throw new AuthorizationError('Usuário sem organização associada');
    }

    return user.organizationId;
}
