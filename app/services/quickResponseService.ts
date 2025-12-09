// Quick Response Service - Frontend API integration

export interface QuickResponse {
    id: string;
    name: string;
    type: 'TEXT' | 'AUDIO' | 'IMAGE';
    content: string;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateQuickResponseData {
    name: string;
    type: 'TEXT' | 'AUDIO' | 'IMAGE';
    content: string;
    organizationId?: string;
}

export interface UpdateQuickResponseData {
    name?: string;
    type?: 'TEXT' | 'AUDIO' | 'IMAGE';
    content?: string;
}

// Get all quick responses for an organization
export async function getQuickResponses(organizationId?: string): Promise<QuickResponse[]> {
    try {
        const url = organizationId
            ? `/api/quick-responses?organizationId=${organizationId}`
            : '/api/quick-responses';

        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch quick responses');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching quick responses:', error);
        return [];
    }
}

// Create a new quick response
export async function createQuickResponse(data: CreateQuickResponseData): Promise<QuickResponse | null> {
    try {
        const response = await fetch('/api/quick-responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create quick response');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating quick response:', error);
        throw error;
    }
}

// Update a quick response
export async function updateQuickResponse(id: string, data: UpdateQuickResponseData): Promise<QuickResponse | null> {
    try {
        const response = await fetch(`/api/quick-responses/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to update quick response');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating quick response:', error);
        throw error;
    }
}

// Delete a quick response
export async function deleteQuickResponse(id: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/quick-responses/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to delete quick response');
        }

        return true;
    } catch (error) {
        console.error('Error deleting quick response:', error);
        throw error;
    }
}

// Helper to convert file to base64 URL (for uploading)
export function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
