// Profile Service - Real user data from session

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: string | null;
    organizationName: string | null;
}

export async function getUserProfile(): Promise<UserProfile | null> {
    try {
        const response = await fetch('/api/auth/session', {
            credentials: 'include',
        });

        if (!response.ok) return null;

        const session = await response.json();
        if (!session?.user) return null;

        return {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
            organizationId: session.user.organizationId,
            organizationName: session.user.organizationName,
        };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

export async function updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(profile),
        });

        if (!response.ok) throw new Error('Failed to update profile');
        return await response.json();
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}
