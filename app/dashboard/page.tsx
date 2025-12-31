"use client";

import { useState, useEffect } from "react";
import { Users, MessageSquare, Target, Star } from "lucide-react";
import CardResumo from "../components/CardResumo";
import Loading, { LoadingCard } from "../components/Loading";
import FunnelChart from "../components/FunnelChart";
import Error from "../components/Error";
import api from "../lib/api-client";
import type { DashboardMetrics, PerformanceMetrics, Activity } from "../types";

const getDashboardMetrics = (organizationId?: string) => api.dashboard.getMetrics(organizationId);
const getPerformanceMetrics = (organizationId?: string) => api.dashboard.getPerformance(organizationId);
const getRecentActivities = (organizationId?: string) => api.dashboard.getActivities(organizationId);

import { useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId");

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsData, performanceData, activitiesData] = await Promise.all([
        getDashboardMetrics(organizationId || undefined),
        getPerformanceMetrics(organizationId || undefined),
        getRecentActivities(organizationId || undefined),
      ]);
      setMetrics(metricsData);
      setPerformance(performanceData);
      setActivities(activitiesData);
    } catch (err) {
      setError("Erro ao carregar dados do dashboard");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Visão geral do seu desempenho</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics || !performance) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 p-6">
          <Error message={error || "Erro ao carregar dados"} onRetry={loadData} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Visão geral do seu desempenho</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <CardResumo
            title="Total de Leads"
            value={metrics.totalLeads}
          />
          <CardResumo
            title="Conversas Ativas"
            value={metrics.activeConversations}
          />
          <CardResumo
            title="Taxa de Conversão"
            value={`${metrics.conversionRate}%`}
          />
          <CardResumo
            title="Leads Novos"
            value={metrics.leadsByStatus.NEW}
          />
        </div>
        <div className="mb-8">
          <FunnelChart metrics={metrics} organizationId={organizationId} />
        </div>
        <div className="mb-8">
          <div className="bg-white dark:bg-[#12121d] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800/50 transition-colors duration-300">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Atividade Recente
            </h3>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-baseline justify-between gap-4 text-sm border-b border-gray-100 dark:border-gray-800/50 pb-3 last:border-0 last:pb-0">
                  <span className="text-gray-600 dark:text-gray-300 truncate">{activity.description}</span>
                  <span className="text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

