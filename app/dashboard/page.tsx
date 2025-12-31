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

  /* Dashboard Data State */
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Token Cost State */
  const [costPeriod, setCostPeriod] = useState<"day" | "week" | "month" | "lastMonth" | "custom">("month");
  const [openaiCosts, setOpenaiCosts] = useState<any>(null);
  const [elevenLabsCosts, setElevenLabsCosts] = useState<any>(null);
  const [loadingCosts, setLoadingCosts] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

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

  /* Token Cost Logic */
  const loadCosts = async () => {
    if (!organizationId) return;
    if (costPeriod === 'custom' && (!customStartDate || !customEndDate)) return;

    setLoadingCosts(true);
    try {
      const [openaiData, elevenLabsData] = await Promise.all([
        api.usage.openai(organizationId, costPeriod, customStartDate, customEndDate),
        api.usage.elevenlabs(organizationId, costPeriod, customStartDate, customEndDate),
      ]);
      setOpenaiCosts(openaiData);
      setElevenLabsCosts(elevenLabsData);
    } catch (err) {
      console.error("Error loading costs:", err);
    } finally {
      setLoadingCosts(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId]);

  useEffect(() => {
    loadCosts();
  }, [organizationId, costPeriod, customStartDate, customEndDate]);


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

        {/* Metric Cards - Clean & White */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <CardResumo title="Total de Leads" value={metrics.totalLeads} />
          <CardResumo title="Conversas Ativas" value={metrics.activeConversations} />
          <CardResumo title="Taxa de Conversão" value={`${metrics.conversionRate}%`} />
          <CardResumo title="Leads Novos" value={metrics.leadsByStatus.NEW} />
        </div>

        <div className="mb-8">
          <FunnelChart metrics={metrics} organizationId={organizationId} />
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Custos de IA (Tokens)</h3>
            <div className="flex items-center gap-2">
              <select
                value={costPeriod}
                onChange={(e) => setCostPeriod(e.target.value as any)}
                className="bg-white dark:bg-[#12121d] border border-gray-200 dark:border-gray-800 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="day">Hoje</option>
                <option value="week">Esta Semana</option>
                <option value="month">Este Mês</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* OpenAI Cost */}
            <div className="bg-white dark:bg-[#12121d] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">OpenAI</p>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    ${openaiCosts?.totalCost?.toFixed(2) || '0.00'}
                  </h4>
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {costPeriod === 'month' ? 'Consumo mensal acumulado' : 'Consumo do período'}
              </p>
            </div>

            <div className="bg-white dark:bg-[#12121d] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ElevenLabs (Voz)</p>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    ~${elevenLabsCosts?.usage?.estimatedCostUSD || '0.00'}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {elevenLabsCosts?.usage?.charactersPerOrg?.toLocaleString() || 0} caracteres
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#12121d] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Estimado</p>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    ${((openaiCosts?.totalCost || 0) + (parseFloat(elevenLabsCosts?.usage?.estimatedCostUSD || '0'))).toFixed(2)}
                  </h4>
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Soma dos serviços
              </p>
            </div>
          </div>
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

