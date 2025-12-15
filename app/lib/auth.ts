/**
 * Legacy Auth Helpers - DEPRECATED
 * 
 * Authentication is now handled by the NestJS backend.
 * These functions are kept as stubs to prevent build errors
 * in old API routes that haven't been migrated yet.
 * 
 * TODO: Migrate all API routes to call backend directly
 */

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

// Stub functions - these should not be used
// All authentication should go through the backend
export async function requireAuth() {
    throw new Error('requireAuth is deprecated. Use backend authentication.');
}

export async function requireAdmin() {
    throw new Error('requireAdmin is deprecated. Use backend authentication.');
}

export async function requireSuperAdmin() {
    throw new Error('requireSuperAdmin is deprecated. Use backend authentication.');
}

export function getOrganizationFilter(
    user: { role: string; organizationId: string | null },
    requestedOrgId?: string | null
) {
    return {};
}

export function canAccessOrganization(
    user: { role: string; organizationId: string | null },
    targetOrganizationId: string
): boolean {
    return false;
}

export function getOrganizationIdForCreate(
    user: { role: string; organizationId: string | null },
    requestedOrgId?: string | null
): string {
    throw new Error('getOrganizationIdForCreate is deprecated. Use backend authentication.');
}
