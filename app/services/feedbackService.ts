// Feedback Service

export interface Feedback {
    id: string;
    rating: number;
    comment: string;
    date: string;
    customerName: string;
    status: 'pending' | 'resolved' | 'positive' | 'negative';
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

export async function respondToFeedback(id: string, response: string): Promise<Feedback> {
    // TODO: Implement API endpoint for responding
    console.log('Respond to feedback not yet implemented');
    throw new Error('Feedback response feature not yet implemented');
}

export async function markAsResolved(id: string): Promise<Feedback> {
    // TODO: Implement API endpoint for marking as resolved
    console.log('Mark as resolved not yet implemented');
    throw new Error('Mark as resolved feature not yet implemented');
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
