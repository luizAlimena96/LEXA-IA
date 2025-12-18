import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class APIClient {
    private client: AxiosInstance;
    private baseURL: string;

    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_API_URL;

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 300000, // 5 minutes for large PDF uploads with RAG processing
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to add auth token
        this.client.interceptors.request.use(
            (config) => {
                const token = this.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Redirect to login only if not already on login page
                    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    private getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('accessToken');
    }

    setToken(token: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', token);
        }
    }

    clearToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
        }
    }

    // Generic methods
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.get<T>(url, config);
        return response.data;
    }

    async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
    }

    async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.put<T>(url, data, config);
        return response.data;
    }

    async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.patch<T>(url, data, config);
        return response.data;
    }

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.delete<T>(url, config);
        return response.data;
    }

    // Admin endpoints
    admin = {
        getData: (orgId: string, type: string) =>
            this.get<any[]>(`/admin/data?orgId=${orgId}&type=${type}`),
        assumeOrganization: (organizationId: string | null) =>
            this.post<any>('/admin/assume-organization', { organizationId }),
    };

    // Auth endpoints
    auth = {
        login: (email: string, password: string) =>
            this.post<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', { email, password }),

        getMe: () => this.get<any>('/auth/me'),

        refresh: (refreshToken: string) =>
            this.post<{ accessToken: string; refreshToken: string; user: any }>('/auth/refresh', { refreshToken }),

        logout: () => this.post<{ message: string }>('/auth/logout', {}),

        getSession: () =>
            this.get<{ user: any }>('/auth/session'),
        forgotPassword: (email: string) =>
            this.post<any>('/auth/forgot-password', { email }),
        resetPassword: (token: string, password: string) =>
            this.post<any>('/auth/reset-password', { token, password }),
    };

    // Agents endpoints
    agents = {
        list: (organizationId?: string) => {
            const params = organizationId ? `?organizationId=${organizationId}` : '';
            return this.get<any[]>(`/agents${params}`);
        },
        get: (id: string) => this.get<any>(`/agents/${id}`),
        create: (data: any) => this.post<any>('/agents', data),
        update: (id: string, data: any) => this.put<any>(`/agents/${id}`, data),
        delete: (id: string) => this.delete<any>(`/agents/${id}`),

        // ZapSign Config
        zapSign: {
            getConfig: (agentId: string) => this.get<any>(`/agents/${agentId}/zapsign-config`),
            saveConfig: (agentId: string, data: any) => this.post<any>(`/agents/${agentId}/zapsign-config`, data),
        },

        // FSM Prompts
        fsmPrompts: {
            get: (agentId: string) => this.get<any>(`/agents/${agentId}/fsm-prompts`),
            update: (agentId: string, data: any) => this.put<any>(`/agents/${agentId}/fsm-prompts`, data),
        },

        // CRM Stages
        crmStages: {
            list: (agentId: string) => this.get<any[]>(`/agents/${agentId}/crm-stages`),
            create: (agentId: string, data: any) => this.post<any>(`/agents/${agentId}/crm-stages`, data),
            update: (agentId: string, stageId: string, data: any) =>
                this.put<any>(`/agents/${agentId}/crm-stages/${stageId}`, data),
            delete: (agentId: string, stageId: string) =>
                this.delete<any>(`/agents/${agentId}/crm-stages/${stageId}`),
            reorder: (agentId: string, data: any) =>
                this.post<any>(`/agents/${agentId}/crm-stages/reorder`, data),
        },

        // Auto Scheduling
        autoScheduling: {
            list: (agentId: string) => this.get<any[]>(`/agents/${agentId}/auto-scheduling`),
            create: (agentId: string, data: any) => this.post<any>(`/agents/${agentId}/auto-scheduling`, data),
            update: (agentId: string, configId: string, data: any) =>
                this.put<any>(`/agents/${agentId}/auto-scheduling/${configId}`, data),
            delete: (agentId: string, configId: string) =>
                this.delete<any>(`/agents/${agentId}/auto-scheduling/${configId}`),
            testSlots: (agentId: string, data: any) =>
                this.post<any>(`/agents/${agentId}/auto-scheduling/test-slots`, data),

            reminders: {
                list: (agentId: string, configId: string) =>
                    this.get<any[]>(`/agents/${agentId}/auto-scheduling/${configId}/reminders`),
                create: (agentId: string, configId: string, data: any) =>
                    this.post<any>(`/agents/${agentId}/auto-scheduling/${configId}/reminders`, data),
                update: (agentId: string, configId: string, reminderId: string, data: any) =>
                    this.put<any>(`/agents/${agentId}/auto-scheduling/${configId}/reminders/${reminderId}`, data),
                delete: (agentId: string, configId: string, reminderId: string) =>
                    this.delete<any>(`/agents/${agentId}/auto-scheduling/${configId}/reminders/${reminderId}`),
            },
        },

        // Scheduling Rules
        schedulingRules: {
            get: (agentId: string) => this.get<any>(`/agents/${agentId}/scheduling-rules`),
            update: (agentId: string, data: any) => this.put<any>(`/agents/${agentId}/scheduling-rules`, data),
        },
    };

    // Conversations endpoints
    conversations = {
        list: (params?: { organizationId?: string }) => {
            const query = params?.organizationId ? `?organizationId=${params.organizationId}` : '';
            return this.get<any[]>(`/conversations${query}`);
        },
        get: (id: string) => this.get<any>(`/conversations/${id}`),
        create: (data: any) => this.post<any>('/conversations', data),
        update: (id: string, data: any) => this.patch<any>(`/conversations/${id}`, data),
        toggleAI: (id: string) => this.patch<any>(`/conversations/${id}/ai-toggle`),
        getMessages: (id: string) => this.get<any[]>(`/conversations/${id}/messages`),
        sendMessage: (id: string, data: { content: string; role: string }) =>
            this.post<any>(`/conversations/${id}/messages`, data),
        addTag: (id: string, tagId: string) =>
            this.post<any>(`/conversations/${id}/tags`, { tagId }),
        removeTag: (id: string, tagId: string) =>
            this.delete<any>(`/conversations/${id}/tags/${tagId}`),
    };

    // Leads endpoints
    leads = {
        list: (params?: { organizationId?: string; agentId?: string; search?: string; tagId?: string }) => {
            const query = new URLSearchParams();
            if (params?.organizationId) query.append('organizationId', params.organizationId);
            if (params?.agentId) query.append('agentId', params.agentId);
            if (params?.search) query.append('search', params.search);
            if (params?.tagId) query.append('tagId', params.tagId);
            const queryString = query.toString();
            return this.get<any[]>(`/leads${queryString ? `?${queryString}` : ''}`);
        },
        get: (id: string) => this.get<any>(`/leads/${id}`),
        create: (data: any) => this.post<any>('/leads', data),
        update: (id: string, data: any) => this.put<any>(`/leads/${id}`, data),
        delete: (id: string) => this.delete<any>(`/leads/${id}`),
    };

    // Contacts endpoints (alias for leads with contact-specific methods)
    contacts = {
        list: (params?: { organizationId?: string; search?: string; tagId?: string }) => {
            const query = new URLSearchParams();
            if (params?.organizationId) query.append('organizationId', params.organizationId);
            if (params?.search) query.append('search', params.search);
            if (params?.tagId) query.append('tagId', params.tagId);
            const queryString = query.toString();
            return this.get<any[]>(`/leads${queryString ? `?${queryString}` : ''}`);
        },
        get: (id: string) => this.get<any>(`/leads/${id}`),
        update: (id: string, data: { notes?: string }) => this.put<any>(`/leads/${id}`, data),
    };

    // Knowledge endpoints
    knowledge = {
        list: () => this.get<any[]>('/knowledge'),
        create: (data: any) => this.post<any>('/knowledge', data),
        upload: (formData: FormData) => {
            // Remove Content-Type header to let axios set it automatically for FormData
            return this.post<any>('/knowledge/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },
        update: (id: string, data: any) => this.put<any>(`/knowledge?id=${id}`, data),
        delete: (id: string) => this.delete<any>(`/knowledge?id=${id}`),
    };



    // Test AI endpoints
    testAI = {
        processMessage: (data: any) => this.post<any>('/test-ai', data),
        getHistory: (organizationId: string) => this.get<any>(`/test-ai?organizationId=${organizationId}`),
        resetConversation: (organizationId: string) => this.delete<any>(`/test-ai?organizationId=${organizationId}`),
        triggerFollowup: (data: { organizationId: string; agentId: string }) =>
            this.post<any>('/test-ai/trigger-followup', data),
    };

    // CRM endpoints
    crm = {
        configs: {
            list: () => this.get<any[]>('/crm/configs'),
            create: (data: any) => this.post<any>('/crm/configs', data),
            update: (id: string, data: any) => this.put<any>(`/crm/configs/${id}`, data),
            delete: (id: string) => this.delete<any>(`/crm/configs/${id}`),
        },
        stages: {
            list: () => this.get<any[]>('/crm/stages'),
            create: (data: any) => this.post<any>('/crm/stages', data),
            update: (id: string, data: any) => this.put<any>(`/crm/stages/${id}`, data),
            delete: (id: string) => this.delete<any>(`/crm/stages/${id}`),
            reorder: (data: any) => this.patch<any>('/crm/stages/reorder', data),
        },
        automations: {
            list: () => this.get<any[]>('/crm/automations'),
            create: (data: any) => this.post<any>('/crm/automations', data),
            update: (id: string, data: any) => this.put<any>(`/crm/automations/${id}`, data),
            delete: (id: string) => this.delete<any>(`/crm/automations/${id}`),
        },
        templates: {
            list: (organizationId: string) =>
                this.get<any[]>(`/crm/templates?organizationId=${organizationId}`),
            get: (crmType: string, event: string) =>
                this.get<any>(`/crm/templates/${crmType}?event=${event}`),
            create: (data: any) => this.post<any>('/crm/templates', data),
            delete: (id: string) => this.delete<any>(`/crm/templates/${id}`),
            instantiate: (id: string, data: any) =>
                this.post<any>(`/crm/templates/${id}/instantiate`, data),
        },
        proxy: (data: { url: string; method: string; headers: any; body?: any }) =>
            this.post<any>('/crm/proxy', data),
    };

    // AI endpoints
    ai = {
        process: (data: { message: string; conversationId: string; organizationId: string }) =>
            this.post<{ response: string }>('/ai/process', data),
    };

    // Appointments endpoints
    appointments = {
        list: () => this.get<any[]>('/appointments'),
        create: (data: any) => this.post<any>('/appointments', data),
        update: (id: string, data: any) => this.put<any>(`/appointments/${id}`, data),
        delete: (id: string) => this.delete<any>(`/appointments/${id}`),
    };





    // Organizations endpoints
    organizations = {
        list: () => this.get<any[]>('/organizations'),
        get: (id: string) => this.get<any>(`/organizations/${id}`),
        create: (data: any) => this.post<any>('/organizations', data),
        update: (id: string, data: any) => this.put<any>(`/organizations/${id}`, data),
        delete: (id: string) => this.delete<any>(`/organizations/${id}`),

        knowledge: {
            list: (orgId: string) => this.get<any[]>(`/organizations/${orgId}/knowledge`),
            upload: (orgId: string, data: FormData) =>
                this.post<any>(`/organizations/${orgId}/knowledge/upload`, data),
            delete: (orgId: string, id: string) =>
                this.delete<any>(`/organizations/${orgId}/knowledge/${id}`),
        },

        followups: {
            list: (orgId: string) => this.get<any[]>(`/organizations/${orgId}/followups`),
            create: (orgId: string, data: any) =>
                this.post<any>(`/organizations/${orgId}/followups`, data),
            delete: (orgId: string, id: string) =>
                this.delete<any>(`/organizations/${orgId}/followups/${id}`),
        },

        crmSync: {
            get: (orgId: string) => this.get<any>(`/organizations/${orgId}/crm-sync`),
            save: (orgId: string, data: any) =>
                this.post<any>(`/organizations/${orgId}/crm-sync`, data),
            test: (orgId: string, data: any) =>
                this.post<any>(`/organizations/${orgId}/crm-sync/test`, data),
            delete: (orgId: string) => this.delete<any>(`/organizations/${orgId}/crm-sync`),
        },

        crmWebhooks: {
            list: (orgId: string) => this.get<any[]>(`/organizations/${orgId}/crm/webhooks`),
            create: (orgId: string, data: any) =>
                this.post<any>(`/organizations/${orgId}/crm/webhooks`, data),
            update: (orgId: string, webhookId: string, data: any) =>
                this.put<any>(`/organizations/${orgId}/crm/webhooks?webhookId=${webhookId}`, data),
            delete: (orgId: string, webhookId: string) =>
                this.delete<any>(`/organizations/${orgId}/crm/webhooks?webhookId=${webhookId}`),
            test: (orgId: string, webhookId: string) =>
                this.post<any>(`/organizations/${orgId}/crm/webhooks/test?webhookId=${webhookId}`, {}),
            logs: (orgId: string, limit: number = 20) =>
                this.get<any[]>(`/organizations/${orgId}/crm/logs?limit=${limit}`),
        },


        zapsign: {
            save: (orgId: string, data: any) => this.put<any>(`/organizations/${orgId}`, data),
            test: (orgId: string, data: any) =>
                this.post<any>(`/organizations/${orgId}/zapsign/test`, data),
        },
    };

    // Google endpoints
    google = {
        auth: (agentId: string) => this.get<any>(`/google/auth?agentId=${agentId}`),
        disconnect: (data: any) => this.post<any>('/google/disconnect', data),
    };

    // Calendar endpoints
    calendar = {
        getGoogleEvents: (agentId: string) => this.get<any[]>(`/calendar/google-events?agentId=${agentId}`),
    };

    // Dashboard endpoints
    dashboard = {
        getMetrics: (organizationId?: string) => {
            const params = organizationId ? `?organizationId=${organizationId}` : '';
            return this.get<any>(`/dashboard/metrics${params}`);
        },
        getPerformance: (organizationId?: string) => {
            const params = organizationId ? `?organizationId=${organizationId}` : '';
            return this.get<any>(`/dashboard/performance${params}`);
        },
        getActivities: (organizationId?: string) => {
            const params = organizationId ? `?organizationId=${organizationId}` : '';
            return this.get<any>(`/dashboard/activities${params}`);
        },
    };

    // Reports endpoints
    reports = {
        list: (organizationId?: string) => {
            const params = organizationId ? `?organizationId=${organizationId}` : '';
            return this.get<any[]>(`/reports${params}`);
        },
        metrics: (organizationId?: string) => {
            const params = organizationId ? `?organizationId=${organizationId}` : '';
            return this.get<any>(`/reports/metrics${params}`);
        },
        aiMetrics: (organizationId: string, period: 'day' | 'week' | 'month' | 'all' = 'month') => {
            return this.get<any>(`/reports/ai-metrics?organizationId=${organizationId}&period=${period}`);
        },
        generate: (data: any) => this.post<any>('/reports/generate', data),
        download: (id: string) => this.get<any>(`/reports/${id}/download`),
    };

    // Usage endpoints
    usage = {
        openai: (organizationId: string, period: 'day' | 'week' | 'month' | 'lastMonth' | 'custom', startDate?: string, endDate?: string) => {
            let url = `/usage/openai?organizationId=${organizationId}&period=${period}`;
            if (period === 'custom' && startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }
            return this.get<any>(url);
        },
        elevenlabs: (organizationId: string, period: 'day' | 'week' | 'month' | 'lastMonth' | 'custom', startDate?: string, endDate?: string) => {
            let url = `/usage/elevenlabs?organizationId=${organizationId}&period=${period}`;
            if (period === 'custom' && startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }
            return this.get<any>(url);
        },
    };

    // Webhooks endpoints
    webhooks = {
        evolution: (data: any) => this.post<any>('/webhooks/evolution', data),
        crm: (data: any) => this.post<any>('/webhooks/crm', data),
        zapsign: (data: any) => this.post<any>('/webhooks/zapsign', data),
    };

    // Users endpoints
    users = {
        list: (organizationId?: string) => {
            const params = organizationId ? `?organizationId=${organizationId}` : '';
            return this.get<any[]>(`/users${params}`);
        },
        get: (id: string) => this.get<any>(`/users/${id}`),
        create: (data: any) => this.post<any>('/users', data),
        update: (id: string, data: any) => this.put<any>(`/users/${id}`, data),
        delete: (id: string) => this.delete<any>(`/users/${id}`),
    };

    // States endpoints
    states = {
        list: (agentId?: string, organizationId?: string) => {
            const query = new URLSearchParams();
            if (agentId) query.append('agentId', agentId);
            if (organizationId) query.append('organizationId', organizationId);
            const params = query.toString();
            return this.get<any[]>(`/states${params ? `?${params}` : ''}`);
        },
        get: (id: string) => this.get<any>(`/states/${id}`),
        create: (data: any) => this.post<any>('/states', data),
        update: (id: string, data: any) => this.patch<any>(`/states/${id}`, data),
        delete: (id: string) => this.delete<any>(`/states/${id}`),
        reorder: (data: any) => this.post<any>('/states/reorder', data),
    };

    // Followups endpoints
    followups = {
        list: (agentId?: string) => {
            const params = agentId ? `?agentId=${agentId}` : '';
            return this.get<any[]>(`/followups${params}`);
        },
        get: (id: string) => this.get<any>(`/followups/${id}`),
        create: (data: any) => this.post<any>('/followups', data),
        update: (id: string, data: any) => this.put<any>(`/followups/${id}`, data),
        delete: (id: string) => this.delete<any>(`/followups/${id}`),
    };

    // Feedback endpoints
    feedback = {
        list: (organizationId?: string) => {
            const params = organizationId ? `?organizationId=${organizationId}` : '';
            return this.get<any[]>(`/feedback${params}`);
        },
        create: (data: any) => this.post<any>('/feedback', data),
        update: (id: string, data: any) => this.patch<any>(`/feedback/${id}`, data),
        resolve: (id: string) => this.patch<any>(`/feedback/${id}/resolve`, {}),
        reopen: (id: string) => this.patch<any>(`/feedback/${id}/reopen`, {}),
        respond: (id: string, formData: FormData) => this.post<any>(`/feedback/${id}/respond`, formData),
        delete: (id: string) => this.delete<any>(`/feedback/${id}`),
        debugLogs: (id: string) => this.get<any[]>(`/feedback/${id}/debug-logs`),
        responses: (id: string) => this.get<any[]>(`/feedback/${id}/responses`),
    };

    // Response Templates endpoints
    responseTemplates = {
        list: (organizationId?: string) => {
            const params = organizationId ? `?organizationId=${organizationId}` : '';
            return this.get<any[]>(`/response-templates${params}`);
        },
        get: (id: string) => this.get<any>(`/response-templates/${id}`),
        create: (data: any) => this.post<any>('/response-templates', data),
        update: (id: string, data: any) => this.patch<any>(`/response-templates/${id}`, data),
        delete: (id: string) => this.delete<any>(`/response-templates/${id}`),
    };

    // Reminders endpoints
    reminders = {
        list: (agentId?: string) => {
            const params = agentId ? `?agentId=${agentId}` : '';
            return this.get<any[]>(`/reminders${params}`);
        },
        get: (id: string) => this.get<any>(`/reminders/${id}`),
        create: (data: any) => this.post<any>('/reminders', data),
        update: (id: string, data: any) => this.put<any>(`/reminders/${id}`, data),
        delete: (id: string) => this.delete<any>(`/reminders/${id}`),
    };

    // Quick Responses endpoints
    quickResponses = {
        list: (organizationId?: string) => {
            const params = organizationId ? `?organizationId=${organizationId}` : '';
            return this.get<any[]>(`/quick-responses${params}`);
        },
        get: (id: string) => this.get<any>(`/quick-responses/${id}`),
        create: (data: any) => this.post<any>('/quick-responses', data),
        update: (id: string, data: any) => this.put<any>(`/quick-responses/${id}`, data),
        delete: (id: string) => this.delete<any>(`/quick-responses/${id}`),
    };

    // Tags endpoints
    tags = {
        list: (organizationId?: string) => {
            const params = organizationId ? `?organizationId=${organizationId}` : '';
            return this.get<any[]>(`/tags${params}`);
        },
        get: (id: string) => this.get<any>(`/tags/${id}`),
        create: (data: any) => this.post<any>('/tags', data),
        update: (id: string, data: any) => this.patch<any>(`/tags/${id}`, data),
        delete: (id: string) => this.delete<any>(`/tags/${id}`),
    };
}

export const api = new APIClient();
export default api;
