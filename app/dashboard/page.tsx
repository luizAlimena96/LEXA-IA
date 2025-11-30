"use client";

import { useState, useEffect } from "react";
import CardResumo from "../components/CardResumo";
import Loading, { LoadingCard } from "../components/Loading";
import Error from "../components/Error";
import { getDashboardMetrics, getPerformanceMetrics, getRecentActivities } from "../services/dashboardService";
import type { DashboardMetrics, PerformanceMetrics, Activity } from "../services/dashboardService";

export default function DashboardPage() {
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
        getDashboardMetrics(),
        getPerformanceMetrics(),
        getRecentActivities(),
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
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Visão geral do seu desempenho</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do seu desempenho</p>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <CardResumo
            title="Total de Leads"
            value={metrics.totalLeads}
            icon="👥"
          />
          <CardResumo
            title="Conversas Ativas"
            value={metrics.activeConversations}
            icon="💬"
          />
          <CardResumo
            title="Taxa de Conversão"
            value={`${metrics.conversionRate}%`}
            icon="🎯"
          />
          <CardResumo
            title="Leads Novos"
            value={metrics.leadsByStatus.NEW}
            icon="⭐"
          />
        </div>

        {/* Gráficos e Métricas Adicionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">
              Leads por Status
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Novos</span>
                  <span>{metrics.leadsByStatus.NEW}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.leadsByStatus.NEW / metrics.totalLeads) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Qualificados</span>
                  <span>{metrics.leadsByStatus.QUALIFIED}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.leadsByStatus.QUALIFIED / metrics.totalLeads) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Convertidos</span>
                  <span>{metrics.leadsByStatus.WON}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.leadsByStatus.WON / metrics.totalLeads) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">
              Atividade Recente
            </h3>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700 flex-1">{activity.description}</span>
                  <span className="text-gray-400 text-xs">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
