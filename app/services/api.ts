const API_BASE_URL = typeof window !== 'undefined'
    ? `${window.location.origin}/api`
    : 'http://localhost:3001/api';

export async function apiCall<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Delay helper for simulating API calls
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
