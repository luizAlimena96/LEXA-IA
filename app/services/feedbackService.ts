// Feedback Service

export interface Feedback {
    id: string;
    rating: number;
    comment: string;
    date: string;
    customerName: string;
    status: 'pending' | 'resolved' | 'positive' | 'negative';
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    response?: string;
}

export interface FeedbackMetrics {
    averageRating: number;
    totalFeedbacks: number;
    positivePercentage: number;
    responseRate: number;
}

export async function getFeedbacks(organizationId?: string): Promise<Feedback[]> {
    try {
        const url = organizationId
            ? `/api/feedback?organizationId=${organizationId}`
            : '/api/feedback';

        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch feedbacks');
        }

        const feedbacks = await response.json();

        // Transform database format to UI format
        return feedbacks.map((fb: any) => ({
            id: fb.id,
            rating: fb.rating || 0,
            comment: fb.message || fb.comment || '',
            date: new Date(fb.createdAt).toLocaleDateString('pt-BR'),
            customerName: fb.customer || fb.customerName || 'Cliente',
            status: fb.status?.toLowerCase() || 'pending',
            severity: fb.severity || 'MEDIUM',
            response: fb.response || undefined,
        }));
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
        return [];
    }
}

export async function getFeedbackMetrics(organizationId?: string): Promise<FeedbackMetrics> {
    try {
        const feedbacks = await getFeedbacks(organizationId);

        const totalFeedbacks = feedbacks.length;
        const averageRating = totalFeedbacks > 0
            ? feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / totalFeedbacks
            : 0;

        const positiveCount = feedbacks.filter(fb =>
            fb.status === 'positive' || fb.rating >= 4
        ).length;
        const positivePercentage = totalFeedbacks > 0
            ? (positiveCount / totalFeedbacks) * 100
            : 0;

        const respondedCount = feedbacks.filter(fb => fb.response).length;
        const responseRate = totalFeedbacks > 0
            ? (respondedCount / totalFeedbacks) * 100
            : 0;

        return {
            averageRating,
            totalFeedbacks,
            positivePercentage,
            responseRate,
        };
    } catch (error) {
        console.error('Error calculating metrics:', error);
        return {
            averageRating: 0,
            totalFeedbacks: 0,
            positivePercentage: 0,
            responseRate: 0,
        };
    }
}

export async function respondToFeedback(id: string, response: string, images?: File[]): Promise<Feedback> {
    try {
        const formData = new FormData();
        formData.append('response', response);

        if (images && images.length > 0) {
            images.forEach((image, index) => {
                formData.append(`image${index}`, image);
            });
        }

        const res = await fetch(`/api/feedback/${id}/respond`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        if (!res.ok) {
            throw new Error('Failed to respond to feedback');
        }

        return await res.json();
    } catch (error) {
        console.error('Error responding to feedback:', error);
        throw error;
    }
}

export async function markAsResolved(id: string): Promise<Feedback> {
    try {
        const res = await fetch(`/api/feedback/${id}/resolve`, {
            method: 'PATCH',
            credentials: 'include',
        });

        if (!res.ok) {
            throw new Error('Failed to mark feedback as resolved');
        }

        return await res.json();
    } catch (error) {
        console.error('Error marking feedback as resolved:', error);
        throw error;
    }
}

export async function createFeedback(data: {
    comment: string;
    customerName: string;
    phone: string;
    conversationId?: string;
    organizationId?: string;
}): Promise<Feedback> {
    try {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create feedback');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating feedback:', error);
        throw error;
    }
}
