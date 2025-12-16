// Report Service - Backend API integration via api-client
import api from '../lib/api-client';

export interface Report {
    id: string;
    title: string;
    type: string;
    period: string;
    generatedAt: string;
    status: 'completed' | 'processing';
    downloads?: number;
}

export interface ReportMetrics {
    relatoriosGerados: number;
    totalDownloads: number;
    tempoMedioGeracao: string;
    trends: {
        gerados: number;
        downloads: number;
        tempo: number;
    };
}

export async function getReports(organizationId?: string): Promise<Report[]> {
    return await api.reports.list(organizationId);
}

export async function getReportMetrics(organizationId?: string): Promise<ReportMetrics> {
    return await api.reports.metrics(organizationId);
}

export async function generateReport(type: string, period: string, data?: any): Promise<any> {
    return await api.reports.generate({ type, period, ...data });
}

export async function downloadReport(id: string): Promise<void> {
    try {
        const response = await api.reports.download(id);

        // Convert response to Blob if it isn't already (api-client usually parses JSON)
        // If api-client returns raw data for this endpoint, handle it.
        // Assuming api.reports.download returns the text content or blob

        const blob = new Blob([response], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${id}.txt`; // Default name
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
}
