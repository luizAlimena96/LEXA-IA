// Dashboard Service - Real database integration

export interface DashboardMetrics {
    totalLeads: number;
    activeConversations: number;
    conversionRate: number;
    avgResponseTime: string;
    leadsToday: number;
    leadsThisWeek: number;
    leadsThisMonth: number;
    leadsByStatus: {
        NEW: number;
        CONTACTED: number;
        QUALIFIED: number;
        PROPOSAL_SENT: number;
        WON: number;
        LOST: number;
    };
}

export interface PerformanceMetrics {
    messagesPerDay: number[];
    conversionsPerWeek: number[];
    responseTimeAvg: number;
}

export interface Activity {
    id: string;
    type: 'lead' | 'conversation' | 'message';
    title: string;
    description: string;
    time: string;
}

// Get dashboard metrics for an organization
export async function getDashboardMetrics(organizationId?: string): Promise<DashboardMetrics> {
    try {
        const url = organizationId
            ? `/api/dashboard/metrics?organizationId=${organizationId}`
            : '/api/dashboard/metrics';

        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard metrics');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        // Return empty metrics on error
        return {
            totalLeads: 0,
            activeConversations: 0,
            conversionRate: 0,
            avgResponseTime: '0min',
            leadsToday: 0,
            leadsThisWeek: 0,
            leadsThisMonth: 0,
            leadsByStatus: {
                NEW: 0,
                CONTACTED: 0,
                QUALIFIED: 0,
                PROPOSAL_SENT: 0,
                WON: 0,
                LOST: 0,
            },
        };
    }
}

// Get performance metrics
export async function getPerformanceMetrics(organizationId?: string): Promise<PerformanceMetrics> {
    try {
        const url = organizationId
            ? `/api/dashboard/performance?organizationId=${organizationId}`
            : '/api/dashboard/performance';

        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch performance metrics');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching performance metrics:', error);
        return {
            messagesPerDay: [0, 0, 0, 0, 0, 0, 0],
            conversionsPerWeek: [0, 0, 0, 0],
            responseTimeAvg: 0,
        };
    }
}

// Get recent activities
export async function getRecentActivities(organizationId?: string): Promise<Activity[]> {
    try {
        const url = organizationId
            ? `/api/dashboard/activities?organizationId=${organizationId}`
            : '/api/dashboard/activities';

        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Activities API error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            throw new Error(`Failed to fetch activities: ${errorData.error || response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching activities:', error);
        return [];
    }
}
