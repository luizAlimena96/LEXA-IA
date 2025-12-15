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
    // TODO: Implement proper file download
    const buffer = await api.reports.download(id);
    console.log('Download report:', id, buffer);
}
