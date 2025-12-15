// Feedback Service
import api from '../lib/api-client';

export interface Feedback {
    id: string;
    rating: number;
    comment: string;
    date: string;
    customerName: string;
    status: 'PENDING' | 'RESOLVED';
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    response?: string;
    phone?: string;
    conversationId?: string;
    aiThinking?: string;
    currentState?: string;
    extractedData?: any;
}

export interface DebugLogEntry {
    id: string;
    clientMessage: string;
    aiResponse: string;
    aiThinking?: string;
    currentState?: string;
    createdAt: string;
}

export interface FeedbackResponse {
    id: string;
    feedbackId: string;
    message: string;
    userId: string;
    userName: string;
    createdAt: string;
}

export interface ResponseTemplate {
    id: string;
    name: string;
    category: string;
    content: string;
    variables: string[];
    isDefault: boolean;
}

export interface FeedbackMetrics {
    averageRating: number;
    totalFeedbacks: number;
    pendingCount: number;
    resolvedCount: number;
}

export async function getFeedbacks(organizationId?: string): Promise<Feedback[]> {
    try {
        const feedbacks = await api.feedback.list(organizationId);

        // Transform database format to UI format
        return feedbacks.map((fb: any) => ({
            id: fb.id,
            rating: fb.rating || 3,
            comment: fb.message || fb.comment || '',
            date: new Date(fb.createdAt).toLocaleDateString('pt-BR'),
            customerName: fb.customer || fb.customerName || 'Cliente',
            status: fb.status,
            severity: fb.severity || 'MEDIUM',
            response: fb.response || undefined,
            phone: fb.phone,
            conversationId: fb.conversationId,
            aiThinking: fb.aiThinking,
            currentState: fb.currentState,
            extractedData: fb.extractedData,
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
        const pendingCount = feedbacks.filter(fb => fb.status === 'PENDING').length;
        const resolvedCount = feedbacks.filter(fb => fb.status === 'RESOLVED').length;
        const averageRating = totalFeedbacks > 0
            ? feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / totalFeedbacks
            : 0;

        return {
            averageRating: Number(averageRating.toFixed(1)),
            totalFeedbacks,
            pendingCount,
            resolvedCount,
        };
    } catch (error) {
        console.error('Error calculating metrics:', error);
        return {
            averageRating: 0,
            totalFeedbacks: 0,
            pendingCount: 0,
            resolvedCount: 0,
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

        return await api.feedback.respond(id, formData);
    } catch (error) {
        console.error('Error responding to feedback:', error);
        throw error;
    }
}

export async function markAsResolved(id: string): Promise<Feedback> {
    try {
        return await api.feedback.resolve(id);
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
    rating?: number;
}): Promise<Feedback> {
    try {
        return await api.feedback.create(data);
    } catch (error) {
        console.error('Error creating feedback:', error);
        throw error;
    }
}

export async function getFeedbacksByStatus(
    organizationId: string | undefined,
    status: 'PENDING' | 'RESOLVED'
): Promise<Feedback[]> {
    try {
        const feedbacks = await api.feedback.list(organizationId);
        const filtered = feedbacks.filter((fb: any) => fb.status === status);

        return filtered.map((fb: any) => ({
            id: fb.id,
            rating: fb.rating || 3,
            comment: fb.message || '',
            date: new Date(fb.createdAt).toLocaleDateString('pt-BR'),
            customerName: fb.customer || 'Cliente',
            status: fb.status,
            severity: fb.severity || 'MEDIUM',
            response: fb.response,
            phone: fb.phone,
            conversationId: fb.conversationId,
            aiThinking: fb.aiThinking,
            currentState: fb.currentState,
            extractedData: fb.extractedData,
        }));
    } catch (error) {
        console.error('Error fetching feedbacks by status:', error);
        return [];
    }
}

export async function getFeedbackDebugLogs(feedbackId: string): Promise<DebugLogEntry[]> {
    try {
        return await api.feedback.debugLogs(feedbackId);
    } catch (error) {
        console.error('Error fetching debug logs:', error);
        return [];
    }
}

export async function getResponseTemplates(organizationId?: string): Promise<ResponseTemplate[]> {
    try {
        return await api.responseTemplates.list(organizationId);
    } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
    }
}

export async function createResponseTemplate(data: {
    name: string;
    category: string;
    content: string;
    variables: string[];
}): Promise<ResponseTemplate> {
    try {
        return await api.responseTemplates.create(data);
    } catch (error) {
        console.error('Error creating template:', error);
        throw error;
    }
}

export async function updateResponseTemplate(id: string, data: Partial<ResponseTemplate>): Promise<ResponseTemplate> {
    try {
        return await api.responseTemplates.update(id, data);
    } catch (error) {
        console.error('Error updating template:', error);
        throw error;
    }
}

export async function deleteResponseTemplate(id: string): Promise<void> {
    try {
        await api.responseTemplates.delete(id);
    } catch (error) {
        console.error('Error deleting template:', error);
        throw error;
    }
}

export async function reopenFeedback(id: string): Promise<Feedback> {
    try {
        return await api.feedback.reopen(id);
    } catch (error) {
        console.error('Error reopening feedback:', error);
        throw error;
    }
}

export async function deleteFeedback(id: string): Promise<void> {
    try {
        await api.feedback.delete(id);
    } catch (error) {
        console.error('Error deleting feedback:', error);
        throw error;
    }
}

export async function getFeedbackResponses(feedbackId: string): Promise<FeedbackResponse[]> {
    try {
        return await api.feedback.responses(feedbackId);
    } catch (error) {
        console.error('Error fetching feedback responses:', error);
        throw error;
    }
}
